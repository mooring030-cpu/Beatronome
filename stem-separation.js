/* Beatronome 0.17.1 — local-file stem mixer / opt-in Demucs ONNX (6 sources).
 * No YouTube media, cookies, streams, or ads are intercepted.
 * The model is fetched from the model author's public CDN only on explicit click.
 * Large model inference is experimental and can be memory-constrained on iOS.
 */
(()=>{
  'use strict';
  const $ = id=>document.getElementById(id);
  const bridge=window.BeatronomeStemBridge;
  if(!bridge||!$('stemStudio'))return;
  const names=['drums','bass','other','vocals','guitar','piano'];
  const korean={drums:'드럼',bass:'베이스',other:'그 외 악기',vocals:'보컬',guitar:'기타',piano:'피아노'};
  const MODEL_URL='https://huggingface.co/StemSplitio/htdemucs-6s-onnx/resolve/main/htdemucs_6s_fp16weights.onnx';
  const ORT_BASE='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/';
  const SEGMENT=343980,OVERLAP=Math.floor(SEGMENT/4),STRIDE=SEGMENT-OVERLAP,SR=44100;
  let currentFile=null,renderedTracks=[],levels=[],busy=false,operation=0;
  const status=(message,error=false)=>{const el=$('stemStatus');el.textContent=message;el.classList.toggle('warning',error);};
  const progress=p=>{const el=$('stemProgress');el.classList.remove('hidden');el.value=Math.max(0,Math.min(100,p));};
  const checkCurrent=(file,token)=>{
    if(token!==operation||bridge.getSelectedFile()!==file)throw new Error('원본 파일이 변경되어 이전 분리 작업을 취소했습니다.');
  };
  function resetView(message){
    renderedTracks=[];levels=[];
    $('stemMixer').replaceChildren();$('stemMixer').classList.add('hidden');
    $('stemMixReset').disabled=true;$('stemMixOff').disabled=true;
    $('stemProgress').classList.add('hidden');
    status(message||'원본 파일을 선택한 후 AI 분리 또는 이미 분리된 악기 파일을 불러오세요.');
  }
  document.addEventListener('beatronome:local-file-change',e=>{
    currentFile=bridge.getSelectedFile();operation++;
    resetView('새 음원을 선택했습니다. AI 분리는 다시 진행해야 합니다.');
  });
  const translate=name=>korean[name]||name;
  function inferInstrument(file,index){
    const n=file.name.toLowerCase();
    const checks=[['vocals',/vocal|voice|보컬|노래|가창/],['drums',/drum|percussion|kick|snare|드럼/],['bass',/bass|베이스/],['piano',/piano|keys|keyboard|피아노|건반/],['guitar',/guitar|기타/],['other',/other|instrumental|etc|그외|기타악기/]];
    return checks.find(([k,re])=>re.test(n))?.[0]||names[index]||`part${index+1}`;
  }
  function mixVolume(i,level){
    const l=levels[i];if(!l)return;
    l.volume=Math.max(0,Math.min(200,Number(level)||0));
    bridge.setLevel(i,l.muted?0:l.volume);
    const lane=$('stemMixer').querySelector(`[data-stem-index="${i}"]`);
    if(lane){lane.querySelector('output').textContent=`${l.volume}%`;lane.querySelector('input').value=l.volume;}
  }
  function createMixer(stems){
    const panel=$('stemMixer');panel.replaceChildren();panel.classList.remove('hidden');
    levels=stems.map(()=>({volume:100,muted:false}));
    stems.forEach((track,i)=>{
      const row=document.createElement('div');row.className='stem-lane';row.dataset.stemIndex=String(i);
      const name=document.createElement('label');name.textContent=translate(track.name);name.title=track.name;
      const slider=document.createElement('input');slider.type='range';slider.min='0';slider.max='200';slider.step='5';slider.value='100';slider.setAttribute('aria-label',`${translate(track.name)} 볼륨`);
      const value=document.createElement('output');value.textContent='100%';
      const mute=document.createElement('button');mute.type='button';mute.textContent='MUTE';mute.setAttribute('aria-pressed','false');mute.setAttribute('aria-label',`${translate(track.name)} 음소거`);
      slider.addEventListener('input',()=>mixVolume(i,slider.value));
      mute.onclick=()=>{levels[i].muted=!levels[i].muted;mute.setAttribute('aria-pressed',String(levels[i].muted));mute.textContent=levels[i].muted?'ON':'MUTE';bridge.setLevel(i,levels[i].muted?0:levels[i].volume);};
      row.append(name,slider,value,mute);panel.appendChild(row);
    });
    $('stemMixReset').disabled=false;$('stemMixOff').disabled=false;
    $('stemMixReset').onclick=()=>{
      levels.forEach((l,i)=>{l.muted=false;mixVolume(i,100);});
      panel.querySelectorAll('button').forEach(b=>{b.setAttribute('aria-pressed','false');b.textContent='MUTE';});
    };
    $('stemMixOff').onclick=()=>{bridge.clear();resetView('악기 분리를 해제하고 원본 재생으로 돌아왔습니다.');};
  }
  async function installTracks(tracks,file,start,end){
    if(bridge.getSelectedFile()!==file)throw new Error('처리 중 다른 원본을 선택했습니다.');
    const installed=await bridge.install({tracks,start,end});
    renderedTracks=tracks;createMixer(installed);
    progress(100);status(`완료: ${tracks.length}파트 분리 · ${start.toFixed(1)}~${end.toFixed(1)}초 구간에서 믹서를 사용합니다. 범위 밖에서는 원본으로 재생됩니다.`);
  }
  $('stemImport').addEventListener('change',async e=>{
    if(busy){status('AI 분리가 진행 중입니다.',true);return;}
    const f=bridge.getSelectedFile(),items=[...e.currentTarget.files||[]].slice(0,6);
    e.currentTarget.value='';
    if(!f){status('먼저 원본 음원/영상을 MY FILE에서 선택하세요.',true);return;}
    if(items.length<2){status('분리된 악기 파일을 최소 2개 이상 선택하세요.',true);return;}
    const duration=Number(bridge.getMedia().duration)||3600;
    try{
      const tracks=items.map((file,i)=>({name:inferInstrument(file,i),blob:file}));
      await installTracks(tracks,f,0,duration);
      status('악기 파일을 불러왔습니다. 모든 파일이 같은 0초에서 시작하고 원본과 길이가 일치해야 정확히 동기화됩니다.');
    }catch(err){status(`악기 파일 가져오기 실패: ${err.message}`,true);}
  });
  async function loadOrt(){
    const mod=await import(/* webpackIgnore: true */ `${ORT_BASE}ort.min.mjs`);
    const ort=mod.default?.InferenceSession?mod.default:mod;
    if(!ort?.InferenceSession||!ort?.Tensor)throw new Error('ONNX Runtime 모듈 형식 오류');
    ort.env.wasm.wasmPaths=ORT_BASE;
    // Single thread also works when a GitHub Pages host cannot set COOP/COEP.
    ort.env.wasm.numThreads=1;
    return ort;
  }
  async function audioSlice(file,start,end){
    if(file.size>150*1024*1024)throw new Error('150MB 이하의 음악 파일을 선택해 주세요.');
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC||!window.OfflineAudioContext)throw new Error('이 브라우저는 음원 디코딩을 지원하지 않습니다.');
    const ac=new AC();let decoded;
    try{decoded=await ac.decodeAudioData(await file.arrayBuffer());}
    catch(e){throw new Error('음원을 읽을 수 없습니다. MP3/WAV/M4A를 선택하세요. YouTube URL과 일부 영상은 지원하지 않습니다.');}
    finally{try{await ac.close();}catch{}}
    if(start>=decoded.duration)throw new Error(`시작 시각이 곡 길이 ${decoded.duration.toFixed(1)}초보다 큽니다.`);
    const last=Math.min(end,decoded.duration),count=Math.ceil((last-start)*SR);
    if(count<SR)throw new Error('1초 이상 구간을 선택하세요.');
    const offline=new OfflineAudioContext(2,count,SR),source=offline.createBufferSource();
    source.buffer=decoded;source.connect(offline.destination);source.start(0,start,(last-start));
    const audio=await offline.startRendering();
    return {left:new Float32Array(audio.getChannelData(0)),right:new Float32Array(audio.getChannelData(1)),start,end:last};
  }
  function wavBlob(left,right){
    const n=left.length,bytes=44+n*4,buf=new ArrayBuffer(bytes),v=new DataView(buf);
    const str=(offset,value)=>{for(let i=0;i<value.length;i++)v.setUint8(offset+i,value.charCodeAt(i));};
    str(0,'RIFF');v.setUint32(4,bytes-8,true);str(8,'WAVE');str(12,'fmt ');
    v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);
    v.setUint32(24,SR,true);v.setUint32(28,SR*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);
    str(36,'data');v.setUint32(40,n*4,true);
    let p=44;for(let i=0;i<n;i++){
      let l=Math.max(-1,Math.min(1,left[i]));let r=Math.max(-1,Math.min(1,right[i]));
      v.setInt16(p,l<0?l*32768:l*32767,true);v.setInt16(p+2,r<0?r*32768:r*32767,true);p+=4;
    }
    return new Blob([buf],{type:'audio/wav'});
  }
  // Real 6-stem inference: the model produces (1,6,2,343980) floats for 7.8s chunks.
  // Overlap/add with one shared weight buffer to avoid seams at 1/4-segment overlaps.
  async function infer6(file,start,end,token){
    status('오디오를 분석 중입니다…');progress(3);
    const audio=await audioSlice(file,start,end);checkCurrent(file,token);
    progress(8);status('AI 6파트 모델을 불러오는 중입니다. 첫 다운로드 약 136MB가 필요합니다…');
    const ort=await loadOrt();checkCurrent(file,token);
    let session=null;
    try{
      session=await ort.InferenceSession.create(MODEL_URL,{executionProviders:['wasm'],graphOptimizationLevel:'all'});
      checkCurrent(file,token);progress(15);
      const n=audio.left.length,chunks=Math.max(1,Math.ceil(Math.max(1,n-OVERLAP)/STRIDE));
      const outputs=Array.from({length:6},()=>[new Float32Array(n),new Float32Array(n)]);
      const weights=new Float32Array(n),packed=new Float32Array(2*SEGMENT);
      for(let i=0;i<chunks;i++){
        checkCurrent(file,token);
        const startIndex=i*STRIDE,available=Math.min(SEGMENT,n-startIndex);
        packed.fill(0);
        packed.set(audio.left.subarray(startIndex,startIndex+available),0);
        packed.set(audio.right.subarray(startIndex,startIndex+available),SEGMENT);
        status(`AI 악기 분리 중 · ${i+1}/${chunks} 구간 (PC에서 다른 탭으로 이동하지 않는 것을 권장)`);
        const inference=await session.run({mix:new ort.Tensor('float32',packed.slice(),[1,2,SEGMENT])});
        const data=(inference.stems||Object.values(inference)[0])?.data;
        if(!data||data.length!==6*2*SEGMENT)throw new Error('AI 모델 출력 크기가 예상과 다릅니다. 모델 버전을 확인하세요.');
        for(let j=0;j<available;j++){
          const leftOverlap=i===0?1:Math.min(1,(j+1)/OVERLAP);
          const rightOverlap=i===chunks-1?1:Math.min(1,(SEGMENT-j)/OVERLAP);
          const w=Math.min(leftOverlap,rightOverlap),idx=startIndex+j;
          weights[idx]+=w;
          for(let s=0;s<6;s++){
            outputs[s][0][idx]+=data[s*2*SEGMENT+j]*w;
            outputs[s][1][idx]+=data[(s*2+1)*SEGMENT+j]*w;
          }
        }
        progress(15+Math.round((i+1)/chunks*72));
        await new Promise(resolve=>setTimeout(resolve,0));
      }
      status('악기별 믹싱 트랙을 생성하고 있습니다…');
      const tracks=[];
      for(let s=0;s<6;s++){
        const [l,r]=outputs[s];
        for(let j=0;j<n;j++){const w=weights[j]||1;l[j]/=w;r[j]/=w;}
        tracks.push({name:names[s],blob:wavBlob(l,r)});
        progress(87+Math.round((s+1)/6*11));
        await new Promise(resolve=>setTimeout(resolve,0));
      }
      checkCurrent(file,token);
      return {tracks,start:audio.start,end:audio.end};
    }finally{try{await session?.release?.();}catch{}}
  }
  $('stemGenerate').addEventListener('click',async()=>{
    if(busy)return;
    const file=bridge.getSelectedFile();
    if(!file){status('MY FILE에서 음원을 먼저 선택해 주세요.',true);return;}
    if((file.type||'').startsWith('video/')){status('AI 자동 분리는 MP3/WAV/M4A 등 로컬 음악 파일을 지원합니다. 영상은 오디오 추출 없이 원본만 재생합니다.',true);return;}
    const start=Number($('stemStartSec').value),end=Number($('stemEndSec').value);
    const mobile=/iPad|iPhone|iPod|Android/i.test(navigator.userAgent),max=mobile?45:120;
    if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end-start>max){status(`0초 이상에서 시작하는 1~${max}초 구간을 지정하세요.`,true);return;}
    if(!navigator.onLine){status('최초 AI 모델 다운로드에는 인터넷이 필요합니다. 분리 파일 가져오기는 오프라인으로 가능합니다.',true);return;}
    const token=++operation;busy=true;$('stemGenerate').disabled=true;$('stemImport').disabled=true;
    try{
      const result=await infer6(file,start,end,token);
      checkCurrent(file,token);
      await installTracks(result.tracks,file,result.start,result.end);
    }catch(e){
      console.error('Beatronome stem split',e);
      // Do not alter original audio on failure, and do not show a false success state.
      status(`AI 분리 실패: ${e.message||e}. 원본 재생은 그대로 사용할 수 있습니다.`,true);
      $('stemProgress').classList.add('hidden');
    }finally{busy=false;$('stemGenerate').disabled=false;$('stemImport').disabled=false;}
  });
  window.BeatronomeStemQA={isBusy:()=>busy,getTracks:()=>bridge.getTracks(),modelUrl:MODEL_URL};
})();
