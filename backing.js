(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!$('backingTrackCard')) return;
  const STORE_KEY='beatronome-backing-v1'; // Keep the existing storage key to preserve prior settings.
  const defaults={recentFiles:[],fileProfiles:{},source:'local',speed:100,key:0,volume:90,loopA:null,loopB:null,loopOn:false,trackBpm:120,metroTogether:false,markers:{},youtube:{url:'',videoId:'',rate:1,loopA:null,loopB:null,loopOn:false,metroTogether:false},trainer:{speedOn:false,speedStart:70,speedEnd:100,speedStep:5,speedLoops:2,keyOn:false,keyStart:0,keyStep:1,keyLoops:2}};
  const load=()=>{try{return {...defaults,...JSON.parse(localStorage.getItem(STORE_KEY)||'{}'),youtube:{...defaults.youtube,...(JSON.parse(localStorage.getItem(STORE_KEY)||'{}').youtube||{})},trainer:{...defaults.trainer,...(JSON.parse(localStorage.getItem(STORE_KEY)||'{}').trainer||{})}}}catch{return structuredClone(defaults)}};
  let s=load(), localTrackKey='', ytTrackKey=s.youtube?.videoId?`yt:${s.youtube.videoId}`:'', objectUrl='', mediaSource=null, ctx=null, pitch=null, gain=null, decodedBuffer=null, ytPlayer=null, ytTimer=null, localLoopCount=0, keyLoopCount=0, keyTrainerIndex=0, metroStartedByBacking=false, ytMetroStarted=false, ytMetroStarting=null, ytLoadGeneration=0, ytMetroToken=0;
  function save(){
    if(localTrackKey){
      s.fileProfiles=s.fileProfiles||{};
      s.fileProfiles[localTrackKey]={speed:s.speed,key:s.key,volume:s.volume,loopA:s.loopA,loopB:s.loopB,loopOn:s.loopOn,trackBpm:s.trackBpm};
    }
    try{localStorage.setItem(STORE_KEY,JSON.stringify(s));}catch(e){console.warn('Backing preferences not saved',e);}
  }
  function renderRecentFiles(){
    const box=$('backingRecentList'),wrap=$('backingRecent');if(!box||!wrap)return;
    const list=Array.isArray(s.recentFiles)?s.recentFiles:[];
    wrap.classList.toggle('hidden',!list.length);box.innerHTML='';
    list.slice(0,8).forEach(item=>{
      const b=document.createElement('button');b.type='button';b.textContent=item.name;b.title=`${item.name} · 음원은 기기에서 다시 선택해야 합니다.`;
      b.onclick=()=>{notify(`'${item.name}' 파일을 다시 선택하세요. 마지막 Speed/Key/Loop가 복원됩니다.`);$('backingFile').click();};box.appendChild(b);
    });
  }
  const notify=m=>window.BeatronomeAPI?.notify?.(m);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const fmt=t=>{t=Math.max(0,Number(t)||0);const h=Math.floor(t/3600),m=Math.floor((t%3600)/60),sec=Math.floor(t%60);return h?`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${m}:${String(sec).padStart(2,'0')}`};

  function setSource(source){s.source=source;save();document.querySelectorAll('#backingSourceTabs button').forEach(b=>b.classList.toggle('active',b.dataset.source===source));$('backingLocalPane').classList.toggle('hidden',source!=='local');$('backingYoutubePane').classList.toggle('hidden',source!=='youtube');}
  document.querySelectorAll('#backingSourceTabs button').forEach(b=>b.onclick=()=>setSource(b.dataset.source));

  async function ensureAudioGraph(){
    if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();gain=ctx.createGain();gain.gain.value=s.volume/100;pitch=window.createBeatPitchShift?.(ctx);if(!pitch)throw new Error('Pitch engine unavailable');mediaSource=ctx.createMediaElementSource($('backingMedia'));mediaSource.connect(pitch.input);pitch.output.connect(gain);gain.connect(ctx.destination);}
    if(ctx.state==='suspended')await ctx.resume();
    pitch.setSemitones(s.key); gain.gain.setTargetAtTime(s.volume/100,ctx.currentTime,.01);
  }

  function applyLocalSettings(){
    const media=$('backingMedia'); media.playbackRate=s.speed/100; try{media.preservesPitch=true;media.webkitPreservesPitch=true;}catch{}
    $('backingSpeed').value=s.speed;$('backingSpeedValue').textContent=`${s.speed}%`;$('backingKey').value=s.key;$('backingKeyValue').textContent=`${s.key>0?'+':''}${s.key} st`;$('backingVolume').value=s.volume;$('backingTrackBpm').value=s.trackBpm;$('backingMetroTogether').checked=!!s.metroTogether;
    if(pitch)pitch.setSemitones(s.key);if(gain&&ctx)gain.gain.setTargetAtTime(s.volume/100,ctx.currentTime,.01);renderLocalLoop();renderMarkers('local');renderTrainer();
  }
  function setSpeed(v){s.speed=clamp(Math.round(v),50,150);save();applyLocalSettings();}
  function setKey(v){s.key=clamp(Math.round(v),-12,12);save();applyLocalSettings();}

  function drawWave(buffer){decodedBuffer=buffer;const c=$('backingWaveform'),wrap=$('backingWaveWrap'),rect=wrap.getBoundingClientRect(),dpr=window.devicePixelRatio||1,w=Math.max(300,Math.floor(rect.width||600)),h=110;c.width=w*dpr;c.height=h*dpr;c.style.width='100%';c.style.height=h+'px';const g=c.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);g.strokeStyle='rgba(227,191,115,.75)';g.lineWidth=1;const data=buffer.getChannelData(0),step=Math.max(1,Math.floor(data.length/w)),mid=h/2;g.beginPath();for(let x=0;x<w;x++){let min=1,max=-1,start=x*step,end=Math.min(data.length,start+step);for(let i=start;i<end;i++){const v=data[i];if(v<min)min=v;if(v>max)max=v;}g.moveTo(x,mid+min*mid*.82);g.lineTo(x,mid+max*mid*.82);}g.stroke();$('backingWavePlaceholder').classList.add('hidden');}
  async function decodeWave(file){try{if(file.size>32*1024*1024){$('backingWavePlaceholder').textContent='큰 파일은 메모리 보호를 위해 파형 생성만 생략합니다. 재생·Seek·A–B Loop는 사용 가능합니다.';$('backingWavePlaceholder').classList.remove('hidden');return;}const ac=new (window.AudioContext||window.webkitAudioContext)();const arr=await file.arrayBuffer();const buf=await ac.decodeAudioData(arr.slice(0));drawWave(buf);await ac.close();}catch(e){console.warn('waveform decode',e);$('backingWavePlaceholder').textContent='파형을 만들 수 없는 형식입니다. 재생과 Loop 기능은 그대로 사용할 수 있습니다.';$('backingWavePlaceholder').classList.remove('hidden');}}

  function renderLocalLoop(){const ok=Number.isFinite(s.loopA)&&Number.isFinite(s.loopB)&&s.loopB>s.loopA+.05;$('backingLoopToggle').disabled=!ok;$('backingLoopToggle').textContent=s.loopOn&&ok?'LOOP ON':'LOOP OFF';$('backingLoopToggle').classList.toggle('active',s.loopOn&&ok);$('backingLoopText').textContent=ok?`${fmt(s.loopA)} → ${fmt(s.loopB)}`:'구간 미설정';const shade=$('backingLoopShade'),dur=$('backingMedia').duration;if(ok&&Number.isFinite(dur)&&dur>0){shade.classList.remove('hidden');shade.style.left=`${s.loopA/dur*100}%`;shade.style.width=`${(s.loopB-s.loopA)/dur*100}%`;}else shade.classList.add('hidden');}
  function cycleTrainer(){
    const t=s.trainer; localLoopCount++; keyLoopCount++;
    if(t.speedOn&&localLoopCount>=Math.max(1,t.speedLoops)){localLoopCount=0;const dir=t.speedEnd>=t.speedStart?1:-1;let next=s.speed+dir*Math.abs(t.speedStep);if((dir>0&&next>t.speedEnd)||(dir<0&&next<t.speedEnd)){next=t.speedEnd;t.speedOn=false;notify('Speed Trainer 목표에 도달했습니다.');}setSpeed(next);}
    if(t.keyOn&&keyLoopCount>=Math.max(1,t.keyLoops)){keyLoopCount=0;keyTrainerIndex++;if(keyTrainerIndex>=12){keyTrainerIndex=0;t.keyOn=false;notify('12-Key Trainer 1회전을 완료했습니다.');}let next=t.keyStart+keyTrainerIndex*Math.max(1,t.keyStep);while(next>12)next-=12;while(next<-12)next+=12;setKey(next);}
    save();renderTrainer();
  }
  function renderTrainer(){const t=s.trainer;$('speedTrainerEnabled').checked=!!t.speedOn;$('speedTrainerStart').value=t.speedStart;$('speedTrainerEnd').value=t.speedEnd;$('speedTrainerStep').value=t.speedStep;$('speedTrainerLoops').value=t.speedLoops;$('keyTrainerEnabled').checked=!!t.keyOn;$('keyTrainerStart').value=t.keyStart;$('keyTrainerStep').value=t.keyStep;$('keyTrainerLoops').value=t.keyLoops;}

  function markersFor(key){return key?(s.markers[key]||(s.markers[key]=[])):[]}
  function renderMarkers(mode){const key=mode==='local'?localTrackKey:ytTrackKey,box=$(mode==='local'?'backingMarkerList':'youtubeMarkerList'),arr=markersFor(key);box.innerHTML='';if(!key){box.innerHTML='<span class="backing-empty">트랙을 먼저 불러오세요.</span>';return;}if(!arr.length){box.innerHTML='<span class="backing-empty">저장된 마커가 없습니다.</span>';return;}arr.sort((a,b)=>a.time-b.time).forEach((m,i)=>{const b=document.createElement('button');b.className='backing-marker';b.innerHTML=`<b>${escapeHtml(m.name)}</b><span>${fmt(m.time)}</span><i>×</i>`;b.onclick=e=>{if(e.target.tagName==='I'){arr.splice(i,1);save();renderMarkers(mode);return;}if(mode==='local')$('backingMedia').currentTime=m.time;else ytPlayer?.seekTo?.(m.time,true);};box.appendChild(b);});}
  function escapeHtml(x){return String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  function addMarker(mode){const key=mode==='local'?localTrackKey:ytTrackKey,time=mode==='local'?$('backingMedia').currentTime:(ytPlayer?.getCurrentTime?.()||0);if(!key){notify('트랙을 먼저 불러오세요.');return;}const name=(prompt('마커 이름','Marker')||'').trim();if(!name)return;markersFor(key).push({name,time});save();renderMarkers(mode);}

  $('backingFile').onchange=async e=>{
    const f=e.target.files?.[0];if(!f)return;
    save(); // Save settings for the previous file before selecting another.
    if(objectUrl)URL.revokeObjectURL(objectUrl);
    objectUrl=URL.createObjectURL(f);
    localTrackKey=`file:${f.name}:${f.size}:${f.lastModified}`;
    const profile=(s.fileProfiles||{})[localTrackKey]||{};
    for(const key of ['speed','key','volume','loopA','loopB','loopOn','trackBpm']){
      if(Object.prototype.hasOwnProperty.call(profile,key))s[key]=profile[key];
      else if(['loopA','loopB'].includes(key))s[key]=null;
      else if(key==='loopOn')s[key]=false;
    }
    const media=$('backingMedia');media.pause();media.src=objectUrl;
    media.classList.toggle('hidden',!String(f.type).startsWith('video/'));
    $('backingFileName').textContent=f.name;
    $('backingFileMeta').textContent=`${(f.size/1024/1024).toFixed(1)} MB · ${f.type||'media'}`;
    s.recentFiles=[{key:localTrackKey,name:f.name,at:Date.now()},...(s.recentFiles||[]).filter(x=>x.key!==localTrackKey)].slice(0,8);
    save();applyLocalSettings();renderRecentFiles();renderMarkers('local');
    decodeWave(f);
    $('backingFile').value=''; // Selecting the same file again still fires change.
  };
  $('backingMedia').onloadedmetadata=()=>{$('backingDuration').textContent=fmt($('backingMedia').duration);renderLocalLoop();};
  $('backingMedia').ontimeupdate=()=>{const m=$('backingMedia'),d=m.duration||0;$('backingCurrentTime').textContent=fmt(m.currentTime);$('backingSeek').value=d?Math.round(m.currentTime/d*1000):0;if(s.loopOn&&Number.isFinite(s.loopA)&&Number.isFinite(s.loopB)&&m.currentTime>=s.loopB-.025){m.currentTime=s.loopA;cycleTrainer();}};
  $('backingMedia').onplay=async()=>{await ensureAudioGraph();$('backingPlay').textContent='Ⅱ PAUSE';if(s.metroTogether&&!window.BeatronomeAPI?.isPlaying?.()){await window.BeatronomeAPI?.start?.();metroStartedByBacking=true;}};
  $('backingMedia').onpause=()=>{$('backingPlay').textContent='▶ PLAY';if(metroStartedByBacking&&window.BeatronomeAPI?.isPlaying?.()){window.BeatronomeAPI.stop();metroStartedByBacking=false;}};
  $('backingMedia').onended=()=>{if(s.trainer.speedOn||s.trainer.keyOn){cycleTrainer();$('backingMedia').currentTime=Number.isFinite(s.loopA)?s.loopA:0;$('backingMedia').play();}};
  $('backingPlay').onclick=async()=>{const m=$('backingMedia');if(!m.src){notify('파일을 먼저 선택하세요.');return;}await ensureAudioGraph();if(m.paused)m.play().catch(e=>{console.warn(e);notify('파일을 재생할 수 없습니다. 형식과 오디오 권한을 확인하세요.');});else m.pause();};
  $('backingBack5').onclick=()=>{$('backingMedia').currentTime=Math.max(0,$('backingMedia').currentTime-5)};$('backingForward5').onclick=()=>{$('backingMedia').currentTime=Math.min($('backingMedia').duration||1e9,$('backingMedia').currentTime+5)};
  $('backingSeek').oninput=e=>{const m=$('backingMedia');if(m.duration)m.currentTime=Number(e.target.value)/1000*m.duration;};
  // Tap waveform to seek. Horizontal drag (>12px) selects the A–B range.
  // Vertical finger movements are left to the browser for normal page scrolling.
  const wave=$('backingWaveWrap');let waveGesture=null;
  const waveTime=clientX=>{const m=$('backingMedia'),r=wave.getBoundingClientRect();return clamp((clientX-r.left)/Math.max(1,r.width),0,1)*(m.duration||0);};
  wave.addEventListener('pointerdown',e=>{
    if(!Number.isFinite($('backingMedia').duration)||$('backingMedia').duration<=0)return;
    waveGesture={id:e.pointerId,x:e.clientX,time:waveTime(e.clientX)};
  });
  wave.addEventListener('pointerup',e=>{
    if(!waveGesture||e.pointerId!==waveGesture.id)return;
    const g=waveGesture;waveGesture=null;wave.classList.remove('loop-dragging');
    if(Math.abs(e.clientX-g.x)>12){
      s.loopA=Math.min(g.time,waveTime(e.clientX));s.loopB=Math.max(g.time,waveTime(e.clientX));
      if(s.loopB-s.loopA>.08){s.loopOn=true;save();renderLocalLoop();notify('파형에서 Loop 구간을 설정했습니다.');}
    }else{$('backingMedia').currentTime=g.time;}
  });
  wave.addEventListener('pointermove',e=>{if(waveGesture&&waveGesture.id===e.pointerId)wave.classList.toggle('loop-dragging',Math.abs(e.clientX-waveGesture.x)>12);});
  ['pointercancel','lostpointercapture'].forEach(name=>wave.addEventListener(name,()=>{waveGesture=null;wave.classList.remove('loop-dragging');}));
  $('backingSpeed').oninput=e=>setSpeed(e.target.value);$('backingSpeedMinus').onclick=()=>setSpeed(s.speed-5);$('backingSpeedPlus').onclick=()=>setSpeed(s.speed+5);$('backingKey').oninput=e=>setKey(e.target.value);$('backingKeyMinus').onclick=()=>setKey(s.key-1);$('backingKeyPlus').onclick=()=>setKey(s.key+1);$('backingVolume').oninput=e=>{s.volume=clamp(Number(e.target.value),0,100);save();applyLocalSettings();};
  $('backingSetA').onclick=()=>{s.loopA=$('backingMedia').currentTime;if(Number.isFinite(s.loopB)&&s.loopB<=s.loopA)s.loopB=null;save();renderLocalLoop();};$('backingSetB').onclick=()=>{s.loopB=$('backingMedia').currentTime;if(!Number.isFinite(s.loopA))s.loopA=0;if(s.loopB<=s.loopA+.05){notify('END는 START보다 뒤여야 합니다.');s.loopB=null;}save();renderLocalLoop();};$('backingLoopToggle').onclick=()=>{s.loopOn=!s.loopOn;save();renderLocalLoop();};$('backingLoopClear').onclick=()=>{s.loopA=s.loopB=null;s.loopOn=false;save();renderLocalLoop();};
  $('backingMetroTogether').onchange=e=>{s.metroTogether=e.target.checked;save();};$('backingTrackBpm').onchange=e=>{s.trackBpm=clamp(Number(e.target.value)||120,30,300);save();};$('backingApplyBpm').onclick=()=>{s.trackBpm=clamp(Number($('backingTrackBpm').value)||120,30,300);save();window.BeatronomeAPI?.setBpm?.(s.trackBpm);notify(`Beatronome ${s.trackBpm} BPM`);};$('backingAddMarker').onclick=()=>addMarker('local');

  ['speedTrainerStart','speedTrainerEnd','speedTrainerStep','speedTrainerLoops','keyTrainerStart','keyTrainerStep','keyTrainerLoops'].forEach(id=>{$(id).onchange=e=>{const map={speedTrainerStart:'speedStart',speedTrainerEnd:'speedEnd',speedTrainerStep:'speedStep',speedTrainerLoops:'speedLoops',keyTrainerStart:'keyStart',keyTrainerStep:'keyStep',keyTrainerLoops:'keyLoops'};s.trainer[map[id]]=Number(e.target.value);save();renderTrainer();};});
  $('speedTrainerEnabled').onchange=e=>{s.trainer.speedOn=e.target.checked;localLoopCount=0;if(s.trainer.speedOn)setSpeed(s.trainer.speedStart);save();};$('keyTrainerEnabled').onchange=e=>{s.trainer.keyOn=e.target.checked;keyLoopCount=0;keyTrainerIndex=0;if(s.trainer.keyOn)setKey(s.trainer.keyStart);save();};$('backingTrainerReset').onclick=()=>{localLoopCount=keyLoopCount=keyTrainerIndex=0;s.trainer.speedOn=s.trainer.keyOn=false;setSpeed(100);setKey(0);save();renderTrainer();};

  // YouTube official IFrame API
  let ytApiPromise=null;
  function loadYouTubeApi(){if(window.YT?.Player)return Promise.resolve();if(ytApiPromise)return ytApiPromise;ytApiPromise=new Promise((resolve,reject)=>{const old=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{try{old?.();}catch{}resolve();};const sc=document.createElement('script');sc.src='https://www.youtube.com/iframe_api';sc.onerror=reject;document.head.appendChild(sc);setTimeout(()=>window.YT?.Player&&resolve(),2500);});return ytApiPromise;}
  function extractYouTubeId(url){try{const u=new URL(url.trim());if(u.hostname.includes('youtu.be'))return u.pathname.split('/').filter(Boolean)[0]||'';if(u.hostname.includes('youtube.com')){if(u.pathname.startsWith('/shorts/')||u.pathname.startsWith('/embed/'))return u.pathname.split('/')[2]||'';return u.searchParams.get('v')||'';}}catch{}return /^[\w-]{11}$/.test(url.trim())?url.trim():'';}
  function youtubeMetroStatus(message,warning=false){
    const el=$('youtubeMetroStatus');if(!el)return;
    el.textContent=message;el.classList.toggle('warning',warning);
  }
  function stopYoutubeMetro(){
    // Invalidate a pending asynchronous start so clearing/pausing a video cannot
    // turn its metronome back on after it has already been removed.
    ytMetroToken++;
    // Never stop a metronome the user had started independently.
    if(ytMetroStarted&&window.BeatronomeAPI?.isPlaying?.())window.BeatronomeAPI.stop();
    ytMetroStarted=false;
    ytMetroStarting=null;
    youtubeMetroStatus(s.youtube.metroTogether?'영상 + 메트로놈: 일시 정지':'메트로놈 함께 재생 OFF');
  }
  function startYoutubeMetro(){
    if(!s.youtube.metroTogether)return Promise.resolve(false);
    const metro=window.BeatronomeAPI;
    if(!metro?.start){youtubeMetroStatus('메트로놈 연결을 확인할 수 없습니다.',true);return Promise.resolve(false);}
    if(metro.isPlaying()){
      // It was already running before this video. We must not own/stop it.
      // YouTube can steal audio focus on some browsers; resume while this
      // combined button still has a user-activation token.
      const wasSuspended=metro.getDebugSnapshot?.().audioState==='suspended';
      if(wasSuspended){
        return Promise.resolve(metro.resumeAudio?.()).then(ok=>{
          youtubeMetroStatus(ok?'메트로놈 오디오 복구됨 · 영상과 박자를 확인하세요.':'오디오 포커스가 제한됩니다. 영상 + 메트로놈을 다시 눌러주세요.',!ok);
          return !!ok;
        }).catch(()=>{youtubeMetroStatus('오디오 포커스 복구가 차단되었습니다.',true);return false;});
      }
      youtubeMetroStatus('메트로놈 재생 중 · 영상의 첫 박과 수동으로 맞춰주세요.');
      return Promise.resolve(true);
    }
    if(ytMetroStarting)return ytMetroStarting;
    youtubeMetroStatus('메트로놈 오디오 시작 중…');
    // Call .start() synchronously inside this user gesture. Delaying it until
    // the asynchronous YouTube iframe PLAYING event prevents WebAudio from
    // being unlocked on iOS/Safari and other autoplay-restricted browsers.
    const token=++ytMetroToken;
    const promise=metro.start();
    const tracked=Promise.resolve(promise).then(()=>{
      if(token!==ytMetroToken||!s.youtube.metroTogether||!ytPlayer){
        // This request started with an unloaded/old video and was cancelled.
        if(metro.isPlaying()&&!ytMetroStarted)metro.stop();
        return false;
      }
      ytMetroStarted=metro.isPlaying();
      if(ytMetroStarted)youtubeMetroStatus('영상 + 메트로놈 동시 재생 중 · 자동 박자 정렬은 지원되지 않습니다.');
      else youtubeMetroStatus('오디오 시작이 차단되었습니다. “영상 + 메트로놈”을 다시 누르세요.',true);
      return ytMetroStarted;
    }).catch(err=>{
      console.warn('YouTube metronome start was blocked',err);
      ytMetroStarted=false;
      youtubeMetroStatus('브라우저가 소리를 차단했습니다. “영상 + 메트로놈”을 다시 누르세요.',true);
      return false;
    }).finally(()=>{if(ytMetroStarting===tracked)ytMetroStarting=null;});
    ytMetroStarting=tracked;
    return tracked;
  }
  // YT.Player replaces #youtubePlayer with an iframe. Re-create the target
  // before each load so "clear -> load" works even after destroy().
  function createYouTubeTarget(){
    const wrap=$('youtubePlayerWrap');
    wrap.querySelector('#youtubePlayer')?.remove();
    const target=document.createElement('div');target.id='youtubePlayer';
    wrap.prepend(target);
  }
  function syncYouTubeClearButton(){
    $('youtubeClear').disabled=!ytPlayer&&!s.youtube.videoId&&!$('youtubeUrl').value.trim();
  }
  function clearYouTube(){
    // Prevent late API/iframe events from reviving a cleared video.
    ++ytLoadGeneration;
    stopYoutubeMetro();
    clearInterval(ytTimer);ytTimer=null;
    clearTimeout(youtubeRateTimer);clearTimeout(youtubeRateStatusTimer);
    try{ytPlayer?.stopVideo?.();}catch{}
    try{ytPlayer?.destroy?.();}catch{}
    ytPlayer=null;
    createYouTubeTarget();
    s.youtube.url='';s.youtube.videoId='';
    s.youtube.loopA=null;s.youtube.loopB=null;s.youtube.loopOn=false;
    ytTrackKey='';
    $('youtubeUrl').value='';
    $('youtubePlaceholder').classList.remove('hidden');
    $('youtubeCurrentTime').textContent='00:00';
    $('youtubeDuration').textContent='00:00';
    $('youtubeSeek').value='0';
    $('youtubePlay').textContent='▶ PLAY';
    renderYoutubeLoop();renderMarkers('youtube');renderYoutubeRate();
    youtubeMetroStatus('영상 초기화 완료 · 다른 링크를 입력해 주세요.');
    save();syncYouTubeClearButton();
  }
  async function loadYouTube(){
    if(!navigator.onLine){notify('YouTube는 인터넷 연결이 필요합니다.');return;}
    const id=extractYouTubeId($('youtubeUrl').value);
    if(!id){notify('올바른 YouTube 링크를 입력하세요.');return;}
    const generation=++ytLoadGeneration;
    s.youtube.url=$('youtubeUrl').value.trim();s.youtube.videoId=id;
    ytTrackKey=`yt:${id}`;save();syncYouTubeClearButton();
    try{
      await loadYouTubeApi();
      if(generation!==ytLoadGeneration)return; // cleared during pending API load
      stopYoutubeMetro();
      try{ytPlayer?.destroy?.();}catch{}
      ytPlayer=null;
      clearInterval(ytTimer);ytTimer=null;
      createYouTubeTarget();
      $('youtubePlaceholder').classList.add('hidden');
      ytPlayer=new YT.Player('youtubePlayer',{
        videoId:id,width:'100%',height:'100%',
        playerVars:{playsinline:1,rel:0,enablejsapi:1,origin:window.location.origin},
        events:{
          onReady:()=>{
            if(generation!==ytLoadGeneration)return;
            renderYoutubeLoop();renderMarkers('youtube');requestYoutubePlaybackRate();
            renderYoutubeRate();startYtTimer();
            youtubeMetroStatus('영상 준비됨 · 함께 재생 버튼을 누르면 두 소리를 시작합니다.');
          },
          onPlaybackRateChange:()=>{if(generation===ytLoadGeneration)renderYoutubeRate();},
          onError:e=>{if(generation===ytLoadGeneration)youtubeMetroStatus(`YouTube 영상 오류 (${e.data}). 영상 재생 가능 여부를 확인하세요.`,true);},
          onStateChange:e=>{
            if(generation!==ytLoadGeneration)return;
            if(e.data===YT.PlayerState.PLAYING){
              $('youtubePlay').textContent='Ⅱ PAUSE';
              // Embedded iframe click is outside our user activation. Best
              // effort only; the combined button is the reliable path.
              if(s.youtube.metroTogether&&!window.BeatronomeAPI?.isPlaying?.())startYoutubeMetro();
              else if(s.youtube.metroTogether&&window.BeatronomeAPI?.isPlaying?.())youtubeMetroStatus('영상 + 메트로놈 재생 중 · 첫 박 자동 정렬은 지원되지 않습니다.');
            }else if(e.data===YT.PlayerState.PAUSED||e.data===YT.PlayerState.ENDED){
              $('youtubePlay').textContent='▶ PLAY';
              stopYoutubeMetro();
            }
          }
        }
      });
    }catch(err){
      if(generation!==ytLoadGeneration)return;
      console.warn('YouTube embed failed',err);
      youtubeMetroStatus('YouTube 플레이어를 불러오지 못했습니다. 네트워크나 영상 제한을 확인하세요.',true);
    }
  }
  function startYtTimer(){clearInterval(ytTimer);ytTimer=setInterval(()=>{if(!ytPlayer?.getCurrentTime)return;const cur=ytPlayer.getCurrentTime()||0,dur=ytPlayer.getDuration()||0;$('youtubeCurrentTime').textContent=fmt(cur);$('youtubeDuration').textContent=fmt(dur);$('youtubeSeek').value=dur?Math.round(cur/dur*1000):0;if(s.youtube.loopOn&&Number.isFinite(s.youtube.loopA)&&Number.isFinite(s.youtube.loopB)&&cur>=s.youtube.loopB-.08)ytPlayer.seekTo(s.youtube.loopA,true);},120);}
  // YouTube IFrame API only promises video-specific available playback rates.
  // The 5% input is a *request*, not a guarantee that the iframe can play it.
  let youtubeRateTimer=null, youtubeRateStatusTimer=null;
  function normalizeYoutubePercent(value){
    const n=value===''?NaN:Number(value);
    if(!Number.isFinite(n))return 100;
    return clamp(Math.round(n/5)*5,25,200);
  }
  function youtubePlaybackRate(){
    if(!ytPlayer?.getPlaybackRate)return null;
    try{const rate=Number(ytPlayer.getPlaybackRate());return Number.isFinite(rate)&&rate>0?rate:null;}catch{return null;}
  }
  function renderYoutubeRate(){
    const requested=normalizeYoutubePercent(s.youtube.rate*100);
    $('youtubeSpeedRange').value=String(requested);
    $('youtubeSpeedNumber').value=String(requested);
    const status=$('youtubeSpeedStatus'),actual=youtubePlaybackRate();
    if(actual===null){status.textContent=`요청 ${requested}% · 영상 로드 후 적용`;status.classList.remove('rate-limited');return;}
    const applied=Math.round(actual*100);
    if(Math.abs(actual*100-requested)<.5){
      status.textContent=`실제 재생 ${applied}%`;
      status.classList.remove('rate-limited');
    }else{
      status.textContent=`요청 ${requested}% · 실제 재생 ${applied}% (YouTube 지원 속도 제한)`;
      status.classList.add('rate-limited');
    }
  }
  function requestYoutubePlaybackRate(){
    if(!ytPlayer?.setPlaybackRate)return;
    try{ytPlayer.setPlaybackRate(s.youtube.rate);}catch(e){console.warn('YouTube playback rate request',e);}
    clearTimeout(youtubeRateStatusTimer);
    // setPlaybackRate is asynchronous; read back what the player ACTUALLY used.
    youtubeRateStatusTimer=setTimeout(renderYoutubeRate,450);
  }
  function applyYoutubeRate(percent,delay=0){
    const normalized=normalizeYoutubePercent(percent);
    s.youtube.rate=normalized/100;
    save();renderYoutubeRate();
    clearTimeout(youtubeRateTimer);
    if(ytPlayer?.setPlaybackRate){
      if(delay>0)youtubeRateTimer=setTimeout(requestYoutubePlaybackRate,delay);
      else requestYoutubePlaybackRate();
    }
  }
  // Old saved values (0.5, 1.25, etc.) continue to work after upgrading.
  s.youtube.rate=normalizeYoutubePercent((Number(s.youtube.rate)||1)*100)/100;
  $('youtubeSpeedMinus').addEventListener('click',()=>applyYoutubeRate(s.youtube.rate*100-5));
  $('youtubeSpeedPlus').addEventListener('click',()=>applyYoutubeRate(s.youtube.rate*100+5));
  $('youtubeSpeedRange').addEventListener('input',e=>applyYoutubeRate(e.target.value,140));
  $('youtubeSpeedRange').addEventListener('change',e=>applyYoutubeRate(e.target.value));
  $('youtubeSpeedNumber').addEventListener('change',e=>applyYoutubeRate(e.target.value));
  $('youtubeSpeedNumber').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}});
  renderYoutubeRate();
  function renderYoutubeLoop(){const y=s.youtube,ok=Number.isFinite(y.loopA)&&Number.isFinite(y.loopB)&&y.loopB>y.loopA+.05;$('youtubeLoopToggle').disabled=!ok;$('youtubeLoopToggle').textContent=y.loopOn&&ok?'LOOP ON':'LOOP OFF';$('youtubeLoopToggle').classList.toggle('active',y.loopOn&&ok);$('youtubeLoopText').textContent=ok?`${fmt(y.loopA)} → ${fmt(y.loopB)}`:'구간 미설정';$('youtubeMetroTogether').checked=!!y.metroTogether;}
  $('youtubeLoad').onclick=loadYouTube;
  $('youtubeClear').onclick=clearYouTube;
  $('youtubeUrl').value=s.youtube.url||'';
  $('youtubeUrl').addEventListener('input',syncYouTubeClearButton);
  syncYouTubeClearButton();
  $('youtubePlay').onclick=()=>{
    if(!ytPlayer){notify('YouTube 영상을 먼저 불러오세요.');return;}
    const isPlaying=ytPlayer.getPlayerState()===YT.PlayerState.PLAYING;
    if(isPlaying){ytPlayer.pauseVideo();stopYoutubeMetro();}
    else{
      if(s.youtube.metroTogether)startYoutubeMetro(); // must precede cross-origin playVideo()
      ytPlayer.playVideo();
    }
  };
  $('youtubePlayTogether').onclick=()=>{
    if(!ytPlayer){notify('YouTube 영상을 먼저 불러오세요.');return;}
    s.youtube.metroTogether=true;
    save();renderYoutubeLoop();
    startYoutubeMetro(); // guaranteed user-gesture path for Web Audio unlock
    ytPlayer.playVideo();
  };
  $('youtubeBack5').onclick=()=>ytPlayer?.seekTo?.(Math.max(0,(ytPlayer.getCurrentTime?.()||0)-5),true);$('youtubeForward5').onclick=()=>ytPlayer?.seekTo?.((ytPlayer.getCurrentTime?.()||0)+5,true);$('youtubeSeek').oninput=e=>{const d=ytPlayer?.getDuration?.()||0;if(d)ytPlayer.seekTo(Number(e.target.value)/1000*d,true);};$('youtubeSetA').onclick=()=>{if(!ytPlayer)return;s.youtube.loopA=ytPlayer.getCurrentTime();if(Number.isFinite(s.youtube.loopB)&&s.youtube.loopB<=s.youtube.loopA)s.youtube.loopB=null;save();renderYoutubeLoop();};$('youtubeSetB').onclick=()=>{if(!ytPlayer)return;s.youtube.loopB=ytPlayer.getCurrentTime();if(!Number.isFinite(s.youtube.loopA))s.youtube.loopA=0;if(s.youtube.loopB<=s.youtube.loopA+.05){notify('END는 START보다 뒤여야 합니다.');s.youtube.loopB=null;}save();renderYoutubeLoop();};$('youtubeLoopToggle').onclick=()=>{s.youtube.loopOn=!s.youtube.loopOn;save();renderYoutubeLoop();};$('youtubeLoopClear').onclick=()=>{s.youtube.loopA=s.youtube.loopB=null;s.youtube.loopOn=false;save();renderYoutubeLoop();};$('youtubeMetroTogether').onchange=e=>{
    s.youtube.metroTogether=e.target.checked;save();
    if(!s.youtube.metroTogether)stopYoutubeMetro();
    else if(ytPlayer?.getPlayerState?.()===YT.PlayerState.PLAYING)startYoutubeMetro();
    else youtubeMetroStatus('ON · “영상 + 메트로놈”을 누르면 두 소리를 시작합니다.');
  };$('youtubeAddMarker').onclick=()=>addMarker('youtube');

  // initialize
  setSource(s.source||'local');applyLocalSettings();renderRecentFiles();renderMarkers('local');renderYoutubeLoop();renderMarkers('youtube');syncYouTubeClearButton();
  window.addEventListener('beforeunload',()=>{stopYoutubeMetro();clearInterval(ytTimer);clearTimeout(youtubeRateTimer);clearTimeout(youtubeRateStatusTimer);if(objectUrl)URL.revokeObjectURL(objectUrl);try{ctx?.close();}catch{}});
})();
