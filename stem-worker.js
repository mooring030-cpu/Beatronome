/* Beatronome v0.17.2 - dedicated six-stem ONNX inference worker.
 * Model execution is isolated from the metronome UI. Output WAV parts are
 * encoded incrementally, avoiding six full-song Float32 output buffers.
 * User-supplied audio stays local. No external upload or YouTube extraction.
 */
const MODEL_URL='https://huggingface.co/StemSplitio/htdemucs-6s-onnx/resolve/main/htdemucs_6s_fp16weights.onnx';
const ORT_URL='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/';
const STEMS=['drums','bass','other','vocals','guitar','piano'];
const SR=44100, SEG=343980, OVERLAP=Math.floor(SEG/4), STRIDE=SEG-OVERLAP;
const report=(stage,message,percent)=>self.postMessage({type:'progress',stage,message,percent});
const pcm = x=>{const v=Math.max(-1,Math.min(1,x));return v<0?Math.round(v*32768):Math.round(v*32767);};
function encodePart(data,start,end,stem,prev,overlapLength,blend){
  const length=end-start,bytes=new Uint8Array(length*4),view=new DataView(bytes.buffer);
  for(let j=0;j<length;j++){
    const pos=start+j,weight=blend?Math.min(1,(pos+1)/OVERLAP):1;
    const index=stem*2*SEG+pos,right=index+SEG;
    const oldIdx=stem*2*OVERLAP+pos;
    const l=blend?prev[oldIdx]*(1-weight)+data[index]*weight:data[index];
    const r=blend?prev[oldIdx+OVERLAP]*(1-weight)+data[right]*weight:data[right];
    view.setInt16(4*j,pcm(l),true);view.setInt16(4*j+2,pcm(r),true);
  }
  return bytes;
}
function wavHeader(n){
  const bytes=new ArrayBuffer(44),v=new DataView(bytes);
  const ascii=(i,s)=>{for(let j=0;j<s.length;j++)v.setUint8(i+j,s.charCodeAt(j));};
  ascii(0,'RIFF');v.setUint32(4,36+n*4,true);ascii(8,'WAVE');ascii(12,'fmt ');
  v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);
  v.setUint32(24,SR,true);v.setUint32(28,SR*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);
  ascii(36,'data');v.setUint32(40,n*4,true);
  return bytes;
}
async function separate(left,right){
  const n=left.length;if(!n||n!==right.length)throw new Error('채널 길이가 일치하지 않습니다.');
  // WAV/RIFF chunks have a 4 GB limit. Prevent impossible output files.
  if(n>0xFFFFFFFF/4-44)throw new Error('곡이 너무 길어 WAV 한 파일의 최대 길이를 초과합니다.');
  report('engine','AI 실행 엔진을 준비 중입니다…',2);
  let ort;try{const mod=await import(ORT_URL+'ort.min.mjs');ort=mod.default?.InferenceSession?mod.default:mod;}
  catch(e){throw new Error('AI 실행 엔진을 불러오지 못했습니다. 네트워크 또는 콘텐츠 차단 설정을 확인해 주세요.');}
  ort.env.wasm.wasmPaths=ORT_URL;ort.env.wasm.numThreads=1;ort.env.wasm.proxy=false;
  const options={executionProviders:['wasm'],graphOptimizationLevel:'basic',enableCpuMemArena:false};
  report('model','6파트 AI 모델을 준비 중입니다. 첫 실행 시 약 136MB를 다운로드합니다…',5);
  let session=null;
  try{
    session=await ort.InferenceSession.create(MODEL_URL,options);
    report('inference','음원 전체를 분리 중입니다…',12);
    const count=Math.ceil(n/STRIDE),parts=STEMS.map(()=>[wavHeader(n)]);
    const packed=new Float32Array(SEG*2),prev=new Float32Array(6*2*OVERLAP);
    let previousTailLength=0;
    for(let chunk=0;chunk<count;chunk++){
      const offset=chunk*STRIDE,available=Math.min(SEG,n-offset),hasNext=(chunk+1)*STRIDE<n;
      packed.fill(0);
      packed.set(left.subarray(offset,offset+available),0);
      packed.set(right.subarray(offset,offset+available),SEG);
      const result=await session.run({mix:new ort.Tensor('float32',packed,[1,2,SEG])});
      const tensor=result.stems||Object.values(result)[0],data=tensor?.data;
      if(!data||data.length!==6*2*SEG)throw new Error('AI 모델 출력 형식이 예상과 다릅니다.');
      const joinLength=Math.min(previousTailLength,available);
      for(let stem=0;stem<6;stem++){
        if(chunk&&joinLength)parts[stem].push(encodePart(data,0,joinLength,stem,prev,joinLength,true));
        const middleEnd=Math.min(available,STRIDE);
        if(middleEnd>joinLength)parts[stem].push(encodePart(data,joinLength,middleEnd,stem,prev,0,false));
        if(!hasNext&&available>middleEnd)parts[stem].push(encodePart(data,middleEnd,available,stem,prev,0,false));
        if(hasNext){
          const take=Math.max(0,available-STRIDE);
          if(take){
            const outIndex=stem*2*OVERLAP,inIndex=stem*2*SEG+STRIDE;
            prev.set(data.subarray(inIndex,inIndex+take),outIndex);
            prev.set(data.subarray(inIndex+SEG,inIndex+SEG+take),outIndex+OVERLAP);
          }
        }
      }
      previousTailLength=hasNext?Math.max(0,available-STRIDE):0;
      report('inference',`음원 전체 분리 중 · ${chunk+1}/${count} 구간`,12+Math.round((chunk+1)/count*82));
      // Yield so the UI can receive progress; all compute remains in this worker.
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    report('encoding','악기별 오디오를 마무리 중입니다…',96);
    const tracks=parts.map((part,i)=>({name:STEMS[i],blob:new Blob(part,{type:'audio/wav'})}));
    self.postMessage({type:'done',tracks,duration:n/SR});
  }finally{try{await session?.release();}catch{}}
}
self.onmessage=async event=>{
  if(event.data?.type!=='separate')return;
  const {left,right}=event.data;
  try{await separate(new Float32Array(left),new Float32Array(right));}
  catch(err){
    console.error('Stem worker inference failed',err);
    const message=String(err?.message||err||'알 수 없는 오류');
    const memory=/Aborted\(|abort|out of memory|memory|allocation|Cannot enlarge|OOM|RuntimeError/i.test(message);
    self.postMessage({type:'error',stage:memory?'memory':'runtime',message:memory?'AI 실행 중 브라우저 메모리 또는 WebAssembly 제한에 도달했습니다. 다른 탭을 닫고 메모리가 넉넉한 PC의 Chrome/Edge에서 다시 시도해 주세요.':message,diagnostic:message.slice(0,250)});
  }
};
