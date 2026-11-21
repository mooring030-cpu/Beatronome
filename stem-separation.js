/* Beatronome v0.17.2 — full-song six-stem separation.
 * Runs ONNX in a dedicated worker. The app never sends the user's music to a
 * server; workers download public model/runtime assets only on explicit tap.
 * No YouTube audio interception. No clipping/truncating an original song.
 */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const bridge=window.BeatronomeStemBridge;
  if(!bridge||!$('stemStudio'))return;
  const korean={drums:'드럼',bass:'베이스',other:'기타 악기',vocals:'보컬',guitar:'기타',piano:'피아노'};
  let operation=0,worker=null,busy=false,levels=[];
  const status=(message,error=false)=>{const el=$('stemStatus');el.textContent=message;el.classList.toggle('warning',error);};
  const progress=p=>{const el=$('stemProgress');el.classList.remove('hidden');el.value=Math.max(0,Math.min(100,p));};
  function cancelWorker(){if(worker){worker.terminate();worker=null;}}
  function resetView(message){
    $('stemMixer').replaceChildren();$('stemMixer').classList.add('hidden');
    $('stemMixReset').disabled=true;$('stemMixOff').disabled=true;
    $('stemProgress').classList.add('hidden');
    status(message||'원본 파일을 선택한 후 전체 AI 분리를 실행하세요.');
  }
  document.addEventListener('beatronome:local-file-change',()=>{
    operation++;cancelWorker();busy=false;$('stemGenerate').disabled=false;$('stemCancel').classList.add('hidden');levels=[];
    resetView('새 음원을 선택했습니다. 이 음원의 처음부터 끝까지 AI 분리할 수 있습니다.');
  });
  function setVolume(i,percent){
    const l=levels[i];if(!l)return;
    l.volume=Math.max(0,Math.min(200,Number(percent)||0));
    bridge.setLevel(i,l.muted?0:l.volume);
    const row=$('stemMixer').querySelector(`[data-stem-index="${i}"]`);
    if(row){row.querySelector('output').textContent=`${l.volume}%`;row.querySelector('input').value=l.volume;}
  }
  function createMixer(stems){
    const panel=$('stemMixer');panel.replaceChildren();panel.classList.remove('hidden');
    levels=stems.map(()=>({volume:100,muted:false}));
    stems.forEach((track,i)=>{
      const row=document.createElement('div');row.className='stem-lane';row.dataset.stemIndex=String(i);
      const label=document.createElement('label');label.textContent=korean[track.name]||track.name;
      const slider=document.createElement('input');slider.type='range';slider.min='0';slider.max='200';slider.step='5';slider.value='100';slider.setAttribute('aria-label',`${label.textContent} 볼륨`);
      const output=document.createElement('output');output.textContent='100%';
      const mute=document.createElement('button');mute.type='button';mute.textContent='MUTE';mute.setAttribute('aria-pressed','false');mute.setAttribute('aria-label',`${label.textContent} 음소거`);
      slider.oninput=()=>setVolume(i,slider.value);
      mute.onclick=()=>{levels[i].muted=!levels[i].muted;mute.setAttribute('aria-pressed',String(levels[i].muted));mute.textContent=levels[i].muted?'ON':'MUTE';setVolume(i,levels[i].volume);};
      row.append(label,slider,output,mute);panel.appendChild(row);
    });
    $('stemMixReset').disabled=false;$('stemMixOff').disabled=false;
    $('stemMixReset').onclick=()=>{
      levels.forEach((l,i)=>{l.muted=false;setVolume(i,100);});
      panel.querySelectorAll('button').forEach(b=>{b.setAttribute('aria-pressed','false');b.textContent='MUTE';});
    };
    $('stemMixOff').onclick=()=>{bridge.clear();levels=[];resetView('원본 재생으로 돌아왔습니다. 다시 전체 분리하려면 AI 악기 분리를 누르세요.');};
  }
  async function decodeEntireFile(file,token){
    if(file.size>300*1024*1024)throw new Error('파일이 300MB를 초과합니다. 음원을 더 작은 MP3/M4A로 준비해 주세요. 일부만 분리하지는 않습니다.');
    const AC=window.AudioContext||window.webkitAudioContext;
    const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
    if(!AC||!Offline)throw new Error('이 브라우저는 전체 음원 디코딩을 지원하지 않습니다.');
    progress(2);status('음원 전체 길이와 채널을 확인 중입니다…');
    const ac=new AC();let decoded;
    try{decoded=await ac.decodeAudioData(await file.arrayBuffer());}
    catch(e){throw new Error('파일 디코딩에 실패했습니다. MP3·WAV·M4A 파일을 사용해 주세요.');}
    finally{try{await ac.close();}catch{}}
    if(token!==operation||bridge.getSelectedFile()!==file)throw new Error('음원 변경으로 분리를 취소했습니다.');
    const frameCount=Math.ceil(decoded.duration*44100);
    if(!Number.isFinite(frameCount)||frameCount<=0)throw new Error('곡 길이를 확인할 수 없습니다.');
    if(frameCount>1073740000)throw new Error('파일이 WAV 최대 크기를 초과해 분리할 수 없습니다.');
    progress(4);status(`전체 ${Math.floor(decoded.duration/60)}분 ${Math.floor(decoded.duration%60)}초 음원을 44.1kHz로 준비 중입니다…`);
    // Important: creating an OfflineAudioContext for ALREADY-44.1 kHz audio
    // duplicates the entire song in RAM. Avoid that copy when possible.
    let rendered=decoded;
    if(decoded.sampleRate!==44100){
      try{
        const offline=new Offline(2,frameCount,44100),source=offline.createBufferSource();
        source.buffer=decoded;source.connect(offline.destination);source.start(0);
        rendered=await offline.startRendering();
      }catch(e){throw new Error('기기 메모리가 부족해 전체 음원을 변환하지 못했습니다. 다른 앱을 닫고 PC에서 시도해 주세요.');}
    }
    if(token!==operation||bridge.getSelectedFile()!==file)throw new Error('음원 변경으로 분리를 취소했습니다.');
    const left=new Float32Array(rendered.getChannelData(0));
    const right=rendered.numberOfChannels>1?new Float32Array(rendered.getChannelData(1)):new Float32Array(left);
    return {left,right,duration:frameCount/44100};
  }
  async function performFullSeparation(file,token){
    const {left,right}=await decodeEntireFile(file,token);
    if(!navigator.onLine)throw new Error('처음 AI 모델을 불러오려면 인터넷 연결이 필요합니다.');
    if(typeof Worker==='undefined')throw new Error('이 브라우저에서는 AI 작업 스레드를 실행할 수 없습니다.');
    progress(5);
    return new Promise((resolve,reject)=>{
      let finished=false,watchdog=null;
      const w=new Worker('./stem-worker.js?v=0.17.2',{type:'module'});worker=w;
      const cleanup=()=>{if(finished)return false;finished=true;clearTimeout(watchdog);w.terminate();if(worker===w)worker=null;return true;};
      const arm=()=>{clearTimeout(watchdog);watchdog=setTimeout(()=>{if(cleanup())reject(new Error('AI 엔진의 응답이 중단되었습니다. 브라우저 메모리와 네트워크 상태를 확인해 주세요.'));},600000);};
      arm();
      w.onmessage=e=>{
        if(token!==operation){cleanup();reject(new Error('음원이 변경되었습니다.'));return;}
        const msg=e.data||{};
        if(msg.type==='progress'){arm();progress(msg.percent||5);status(msg.message||'AI 분리 중…');}
        if(msg.type==='done'&&cleanup())resolve({tracks:msg.tracks,duration:msg.duration});
        if(msg.type==='error'&&cleanup()){
          console.warn('Beatronome AI diagnostic',msg.stage,msg.diagnostic);
          reject(new Error(msg.message||'AI 분리 엔진에 오류가 발생했습니다.'));
        }
      };
      w.onerror=e=>{console.error('Stem worker error',e);if(cleanup())reject(new Error('AI 모델 실행이 중단되었습니다. 메모리가 넉넉한 PC Chrome/Edge에서 다시 시도해 주세요.'));};
      w.onmessageerror=e=>{if(cleanup())reject(new Error('분리 결과를 전달받지 못했습니다. 브라우저 메모리를 확인해 주세요.'));};
      w.postMessage({type:'separate',left:left.buffer,right:right.buffer},[left.buffer,right.buffer]);
    });
  }
  $('stemGenerate').onclick=async()=>{
    if(busy)return;
    const file=bridge.getSelectedFile();
    if(!file){status('MY FILE에서 음원 파일을 먼저 선택하세요.',true);return;}
    if((file.type||'').startsWith('video/')){status('AI 분리는 MP3/WAV/M4A 등 로컬 오디오 파일에서 지원됩니다. 동영상은 원본 재생이 가능합니다.',true);return;}
    const token=++operation;busy=true;$('stemGenerate').disabled=true;$('stemCancel').classList.remove('hidden');
    try{
      const result=await performFullSeparation(file,token);
      if(token!==operation||bridge.getSelectedFile()!==file)return;
      status('6개 악기 트랙을 원본 플레이어에 연결 중입니다…');progress(98);
      const installed=await bridge.install({tracks:result.tracks,start:0,end:result.duration,file});
      createMixer(installed);progress(100);
      status(`완료! 전체 음원 ${Math.floor(result.duration/60)}분 ${Math.floor(result.duration%60)}초 · 6개 악기별 볼륨을 조절할 수 있습니다.`);
    }catch(e){
      if(token===operation){console.warn('Beatronome AI separation',e);status(`AI 분리 실패: ${e?.message||e} 원본 재생은 계속 가능합니다.`,true);$('stemProgress').classList.add('hidden');}
    }finally{if(token===operation){busy=false;$('stemGenerate').disabled=false;$('stemCancel').classList.add('hidden');}}
  };
  $('stemCancel').onclick=()=>{if(!busy)return;operation++;cancelWorker();busy=false;$('stemGenerate').disabled=false;$('stemCancel').classList.add('hidden');$('stemProgress').classList.add('hidden');status('AI 분리를 취소했습니다. 원본 음원은 그대로 유지됩니다.');};
  window.BeatronomeStemQA={isBusy:()=>busy,getTracks:()=>bridge.getTracks(),fullTrack:true};
})();
