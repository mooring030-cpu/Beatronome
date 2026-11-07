(() => {
  'use strict';
  const BPM_MIN=30,BPM_MAX=300,SETTINGS_KEY='beatronome-settings-v1',PRESETS_KEY='beatronome-presets-v1';
  const SOUND_LABELS={classic:'Classic Click',wood:'Wood Block',digital:'Digital',clave:'Clave',cowbell:'Cowbell',rim:'Rim',beep:'Beep'};
  const defaults={bpm:120,beatsPerBar:4,denominator:4,subdivision:1,sound:'classic',volume:.82,pattern:['accent','normal','normal','normal'],training:{randomMuteEnabled:false,randomMute:25,internalEnabled:false,soundBars:4,muteBars:2,autoTempoEnabled:false,tempoStep:5,everyBars:4,targetBpm:160,tempoMode:'up',timerEnabled:false,timerMinutes:10,gradualEnabled:false,gradualTarget:70,gradualSeconds:120}};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const deepMerge=(base,obj)=>({ ...base, ...obj, training:{...base.training,...(obj?.training||{})}, pattern:Array.isArray(obj?.pattern)?obj.pattern:[...base.pattern] });
  const load=(k,fallback)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fallback}catch{return fallback}};
  let state=deepMerge(defaults,load(SETTINGS_KEY,{}));
  let presets=load(PRESETS_KEY,[]);
  let playing=false,currentBeat=-1,elapsed=0,trainingExpanded=true;
  let audioCtx=null,master=null,scheduler=null,nextNoteTime=0,stepIndex=0,barIndex=0,startTime=0,sessionBaseBpm=state.bpm,tempoDir=1,wakeLock=null;
  let visualQueue=[],rafId=null,tapTimes=[],toastTimer=null,drag=null,dialDragging=false,repeatDelay=null,repeatTimer=null;
  const $=id=>document.getElementById(id), $$=sel=>Array.from(document.querySelectorAll(sel));

  function persist(){localStorage.setItem(SETTINGS_KEY,JSON.stringify(state));}
  function persistPresets(){localStorage.setItem(PRESETS_KEY,JSON.stringify(presets));}
  function fmtTime(sec){sec=Math.max(0,Math.floor(sec));return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`}
  function tempoName(b){return b<60?'LARGO':b<76?'ADAGIO':b<108?'ANDANTE':b<120?'MODERATO':b<168?'ALLEGRO':'PRESTO'}
  function notify(msg){$('toast').textContent=msg;$('toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),1700)}
  function setBpm(v){state.bpm=clamp(Math.round(v),BPM_MIN,BPM_MAX);persist();renderCore();}
  function setTraining(key,value){state.training[key]=value;persist();renderTraining();renderCore();}

  function ensurePattern(){state.pattern=Array.from({length:state.beatsPerBar},(_,i)=>state.pattern[i]||(i===0?'accent':'normal'));}
  function updateSessionStatus(){const remain=Math.max(0,state.training.timerMinutes*60-elapsed);$('sessionStatus').textContent=playing?(state.training.timerEnabled?`남은 ${fmtTime(remain)}`:`연습 ${fmtTime(elapsed)}`):'READY';}
  function updateActiveBeat(){document.querySelectorAll('.beat-dot').forEach((el,i)=>el.classList.toggle('active',playing&&currentBeat===i));}
  function renderCore(){
    $('bpmValue').textContent=state.bpm;$('tempoName').textContent=tempoName(state.bpm);$('meterTop').textContent=`${state.beatsPerBar}/${state.denominator}`;$('meterTitle').textContent=`${state.beatsPerBar}/${state.denominator}`;
    $('beatsPerBar').value=state.beatsPerBar;$('denominator').value=state.denominator;$('subdivision').value=state.subdivision;
    const sub=state.subdivision===1?'Quarter':state.subdivision===2?'8th':state.subdivision===3?'Triplet':'16th';$('soundSummary').textContent=`${SOUND_LABELS[state.sound]} · ${sub}`;
    $('playButton').classList.toggle('playing',playing);$('playIcon').textContent=playing?'Ⅱ':'▶';$('playLabel').textContent=playing?'STOP':'START';
    updateSessionStatus();
    const angle=-135+(state.bpm-BPM_MIN)/(BPM_MAX-BPM_MIN)*270;$('tempoDial').style.setProperty('--angle',`${angle}deg`);
    renderBeats();
  }
  function renderBeats(){ensurePattern();const g=$('beatGrid');g.style.gridTemplateColumns=`repeat(${Math.min(state.beatsPerBar,8)},1fr)`;g.innerHTML='';state.pattern.forEach((s,i)=>{const b=document.createElement('button');b.className=`beat-dot ${s}${playing&&currentBeat===i?' active':''}`;b.innerHTML=`<span>${i+1}</span><i>${s==='accent'?'A':s==='mute'?'×':'•'}</i>`;b.onclick=()=>{state.pattern[i]=s==='accent'?'normal':s==='normal'?'mute':'accent';persist();renderBeats()};g.appendChild(b)});}
  function renderTraining(){
    const t=state.training;$$('[data-toggle]').forEach(btn=>{const k=btn.dataset.toggle;btn.classList.toggle('on',!!t[k]);const body=document.querySelector(`[data-body="${k}"]`);if(body)body.classList.toggle('hidden',!t[k]);btn.closest('.training-row')?.classList.toggle('enabled',!!t[k]);});
    $('randomMute').value=t.randomMute;$('randomMuteOut').textContent=`${t.randomMute}%`;setRangeStyle($('randomMute'),0,90,t.randomMute);
    $('gradualTarget').value=t.gradualTarget;$('gradualTargetOut').textContent=`${t.gradualTarget}% 목표`;setRangeStyle($('gradualTarget'),10,100,t.gradualTarget);
    $$('#tempoMode button').forEach(b=>b.classList.toggle('selected',b.dataset.mode===t.tempoMode));
    $$('#gradualSeconds button').forEach(b=>b.classList.toggle('selected',Number(b.dataset.sec)===t.gradualSeconds));
    $$('#timerMinutes button').forEach(b=>b.classList.toggle('selected',Number(b.dataset.min)===t.timerMinutes));
    const vals={soundBars:t.soundBars,muteBars:t.muteBars,tempoStep:t.tempoStep,everyBars:t.everyBars,targetBpm:t.targetBpm};
    $$('.stepper').forEach(s=>{const k=s.dataset.stepper;s.querySelector('[data-value]').textContent=k==='everyBars'?`${vals[k]}마디`:k==='tempoStep'?`${t.tempoMode==='down'?'-':'+'}${vals[k]}`:vals[k]});
    const count=['randomMuteEnabled','internalEnabled','autoTempoEnabled','timerEnabled','gradualEnabled'].filter(k=>t[k]).length;$('trainingCount').textContent=count;$('trainingCount').classList.toggle('hidden',count===0);
    $('trainingList').classList.toggle('hidden',!trainingExpanded);$('trainingChevron').textContent=trainingExpanded?'⌃':'⌄';
  }
  function setRangeStyle(el,min,max,val){const pct=(val-min)/(max-min)*100;el.style.setProperty('--pct',`${pct}%`)}
  function renderSound(){const g=$('soundGrid');g.innerHTML='';Object.entries(SOUND_LABELS).forEach(([key,label])=>{const b=document.createElement('button');b.className=`sound-card card ${state.sound===key?'selected':''}`;b.innerHTML=`<span class="sound-symbol">♪</span><strong>${label}</strong><span>${state.sound===key?'✓ 사용 중':'미리듣기'}</span>`;b.onclick=async()=>{state.sound=key;persist();renderSound();renderCore();await ensureAudio();synthClick(audioCtx.currentTime+.02,key,true,state.volume)};g.appendChild(b)});$('volume').value=Math.round(state.volume*100);$('volumeOut').textContent=`${Math.round(state.volume*100)}%`;setRangeStyle($('volume'),10,100,Math.round(state.volume*100));}
  function renderPresets(){const list=$('presetList');list.innerHTML='';if(!presets.length){list.innerHTML='<div class="empty-state"><div class="big">☆</div><strong>아직 저장된 프리셋이 없습니다.</strong><span>현재 메트로놈과 Training 조합을 저장하면 한 번에 다시 불러올 수 있습니다.</span></div>';return}presets.forEach(p=>{const a=document.createElement('article');a.className='preset-card card';a.innerHTML=`<button class="preset-main"><div class="preset-bpm">${p.bpm}<small>BPM</small></div><div class="preset-copy"><strong>${escapeHtml(p.name)}</strong><span>${p.beatsPerBar}/${p.denominator} · ${SOUND_LABELS[p.sound]||p.sound}</span></div></button><button class="danger-icon">×</button>`;a.querySelector('.preset-main').onclick=()=>loadPreset(p);a.querySelector('.danger-icon').onclick=()=>{presets=presets.filter(x=>x.id!==p.id);persistPresets();renderPresets()};list.appendChild(a)});}
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function renderAll(){renderCore();renderTraining();renderSound();renderPresets();}

  async function ensureAudio(){if(!audioCtx){const Ctx=window.AudioContext||window.webkitAudioContext;audioCtx=new Ctx({latencyHint:'interactive'});master=audioCtx.createGain();master.gain.value=.94;master.connect(audioCtx.destination)}if(audioCtx.state==='suspended')await audioCtx.resume();}
  function synthClick(when,sound,accent=false,volume=.8){
    if(!audioCtx||!master)return;const out=audioCtx.createGain();out.gain.setValueAtTime(.0001,when);out.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),when+.002);out.gain.exponentialRampToValueAtTime(.0001,when+(sound==='cowbell'?.13:.07));out.connect(master);
    const osc=(type,f0,f1,end,gain=1)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(f0,when);if(f1)o.frequency.exponentialRampToValueAtTime(f1,when+end);g.gain.setValueAtTime(gain,when);g.gain.exponentialRampToValueAtTime(.0001,when+end);o.connect(g).connect(out);o.start(when);o.stop(when+end+.02)};
    const noise=(end,gain=.25,hp=1200)=>{const len=Math.max(1,Math.floor(audioCtx.sampleRate*end)),buf=audioCtx.createBuffer(1,len,audioCtx.sampleRate),data=buf.getChannelData(0);for(let i=0;i<len;i++)data[i]=Math.random()*2-1;const src=audioCtx.createBufferSource(),f=audioCtx.createBiquadFilter(),g=audioCtx.createGain();src.buffer=buf;f.type='highpass';f.frequency.value=hp;g.gain.setValueAtTime(gain,when);g.gain.exponentialRampToValueAtTime(.0001,when+end);src.connect(f).connect(g).connect(out);src.start(when)};
    const hi=accent?1.22:1;switch(sound){case'wood':osc('sine',880*hi,360*hi,.06,.95);osc('sine',1320*hi,550*hi,.045,.35);break;case'digital':osc('square',1700*hi,1000*hi,.035,.45);noise(.025,.14,2800);break;case'clave':osc('sine',2200*hi,1700*hi,.04,.8);osc('sine',3300*hi,2500*hi,.025,.25);break;case'cowbell':osc('square',560*hi,null,.12,.35);osc('square',845*hi,null,.10,.25);break;case'rim':noise(.035,.45,1800);osc('triangle',1250*hi,800*hi,.035,.4);break;case'beep':osc('sine',accent?1320:880,null,.055,.85);break;default:osc('triangle',1900*hi,800*hi,.045,.75);noise(.025,.18,2200)}}
  function scheduleStep(time){const t=state.training,step=stepIndex,beat=Math.floor(step/state.subdivision),sub=step%state.subdivision,isMain=sub===0,pat=state.pattern[beat]||'normal';let audible=pat!=='mute',trainingMuted=false;if(t.internalEnabled){const cycle=Math.max(1,t.soundBars+t.muteBars),phase=barIndex%cycle;if(phase>=t.soundBars)trainingMuted=true}let mutePct=t.randomMuteEnabled?t.randomMute:0;if(t.gradualEnabled){const sec=Math.max(0,audioCtx.currentTime-startTime),ratio=clamp(sec/Math.max(1,t.gradualSeconds),0,1);mutePct=Math.max(mutePct,t.gradualTarget*ratio)}if(!trainingMuted&&mutePct>0&&Math.random()*100<mutePct)trainingMuted=true;audible=audible&&!trainingMuted;if(audible)synthClick(time,state.sound,isMain&&pat==='accent',isMain?state.volume:state.volume*.47);visualQueue.push({time,beat});stepIndex++;const perBar=state.beatsPerBar*state.subdivision;if(stepIndex>=perBar){stepIndex=0;barIndex++;if(t.autoTempoEnabled&&barIndex%Math.max(1,t.everyBars)===0){let next=state.bpm;if(t.tempoMode==='down'){next=Math.max(t.targetBpm,state.bpm-Math.abs(t.tempoStep))}else if(t.tempoMode==='pyramid'){next=state.bpm+t.tempoStep*tempoDir;if(tempoDir>0&&next>=t.targetBpm){next=t.targetBpm;tempoDir=-1}else if(tempoDir<0&&next<=sessionBaseBpm){next=sessionBaseBpm;tempoDir=1}}else next=Math.min(t.targetBpm,state.bpm+Math.abs(t.tempoStep));setBpm(next)}}}
  async function start(){await ensureAudio();stepIndex=0;barIndex=0;sessionBaseBpm=state.bpm;tempoDir=state.training.tempoMode==='down'?-1:1;nextNoteTime=audioCtx.currentTime+.06;startTime=audioCtx.currentTime;visualQueue=[];elapsed=0;playing=true;requestWakeLock();const tick=()=>{const ahead=.11;while(nextNoteTime<audioCtx.currentTime+ahead){scheduleStep(nextNoteTime);nextNoteTime+=(60/state.bpm)/state.subdivision}};tick();scheduler=setInterval(tick,25);renderCore();startVisualLoop()}
  function stop(){playing=false;if(scheduler)clearInterval(scheduler);scheduler=null;cancelAnimationFrame(rafId);stepIndex=0;barIndex=0;visualQueue=[];currentBeat=-1;elapsed=0;releaseWakeLock();renderCore()}
  function startVisualLoop(){let lastUi=0;const draw=()=>{if(!playing||!audioCtx)return;const now=audioCtx.currentTime;elapsed=now-startTime;let beatChanged=false;while(visualQueue.length&&visualQueue[0].time<=now+.012){currentBeat=visualQueue.shift().beat;beatChanged=true}if(beatChanged)updateActiveBeat();visualQueue=visualQueue.filter(e=>e.time>now-.3);if(state.training.timerEnabled&&elapsed>=state.training.timerMinutes*60){notify('연습 시간이 끝났습니다.');stop();return}if(performance.now()-lastUi>100){updateSessionStatus();lastUi=performance.now()}rafId=requestAnimationFrame(draw)};rafId=requestAnimationFrame(draw)}
  async function requestWakeLock(){try{if('wakeLock'in navigator)wakeLock=await navigator.wakeLock.request('screen')}catch{}}
  async function releaseWakeLock(){try{await wakeLock?.release()}catch{}wakeLock=null}

  function savePreset(){const name=$('presetName').value.trim()||`Preset ${presets.length+1}`;presets.unshift({id:(crypto.randomUUID?crypto.randomUUID():Date.now().toString()),name,...JSON.parse(JSON.stringify(state))});persistPresets();$('presetName').value='';renderPresets();notify('프리셋을 저장했습니다.')}
  function loadPreset(p){if(playing)stop();state=deepMerge(defaults,p);ensurePattern();persist();renderAll();switchTab('metronome');notify(`${p.name} 불러오기 완료`)}
  function switchTab(name){$$('.tab-page').forEach(x=>x.classList.remove('active'));$(`tab${name[0].toUpperCase()+name.slice(1)}`).classList.add('active');$$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));if(name==='sound')renderSound();if(name==='presets')renderPresets()}
  function resetSettings(){if(playing)stop();state=deepMerge(defaults,{});persist();renderAll();notify('기본값으로 초기화했습니다.')}

  for(let i=1;i<=16;i++){const o=document.createElement('option');o.value=o.textContent=i;$('beatsPerBar').appendChild(o)}
  $('beatsPerBar').onchange=e=>{state.beatsPerBar=Number(e.target.value);ensurePattern();persist();renderCore()};$('denominator').onchange=e=>{state.denominator=Number(e.target.value);persist();renderCore()};$('subdivision').onchange=e=>{state.subdivision=Number(e.target.value);persist();renderCore()};
  $('playButton').onclick=()=>playing?stop():start();$('tapTempo').onclick=()=>{const now=performance.now();tapTimes=tapTimes.filter(t=>now-t<2500);tapTimes.push(now);tapTimes=tapTimes.slice(-6);if(tapTimes.length>=2){const ints=tapTimes.slice(1).map((t,i)=>t-tapTimes[i]);setBpm(60000/(ints.reduce((a,b)=>a+b,0)/ints.length))}};
  function startRepeat(dir){setBpm(state.bpm+dir);repeatDelay=setTimeout(()=>{repeatTimer=setInterval(()=>setBpm(state.bpm+dir),70)},420)}function stopRepeat(){clearTimeout(repeatDelay);clearInterval(repeatTimer)}
  $('minusBpm').onpointerdown=()=>startRepeat(-1);$('plusBpm').onpointerdown=()=>startRepeat(1);['pointerup','pointercancel','pointerleave'].forEach(ev=>{$('minusBpm').addEventListener(ev,stopRepeat);$('plusBpm').addEventListener(ev,stopRepeat)});
  $('bpmDrag').onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,bpm:state.bpm};$('bpmDrag').setPointerCapture?.(e.pointerId)};$('bpmDrag').onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=drag.y-e.clientY;setBpm(drag.bpm+Math.round((dx+dy*.65)/6))};$('bpmDrag').onpointerup=$('bpmDrag').onpointercancel=()=>drag=null;$('bpmDrag').onwheel=e=>{e.preventDefault();setBpm(state.bpm+(e.deltaY<0?1:-1))};
  function dialToBpm(e){const r=$('tempoDial').getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let deg=Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI+90;if(deg>180)deg-=360;deg=clamp(deg,-135,135);const v=BPM_MIN+(deg+135)/270*(BPM_MAX-BPM_MIN);setBpm(v)}
  $('tempoDial').onpointerdown=e=>{dialDragging=true;$('tempoDial').setPointerCapture?.(e.pointerId);dialToBpm(e)};$('tempoDial').onpointermove=e=>{if(dialDragging)dialToBpm(e)};$('tempoDial').onpointerup=$('tempoDial').onpointercancel=()=>dialDragging=false;
  $('trainingToggle').onclick=()=>{trainingExpanded=!trainingExpanded;renderTraining()};$$('[data-toggle]').forEach(btn=>btn.onclick=()=>setTraining(btn.dataset.toggle,!state.training[btn.dataset.toggle]));
  $('randomMute').oninput=e=>setTraining('randomMute',Number(e.target.value));$('gradualTarget').oninput=e=>setTraining('gradualTarget',Number(e.target.value));$('volume').oninput=e=>{state.volume=Number(e.target.value)/100;persist();renderSound()};
  $$('.stepper').forEach(s=>s.querySelectorAll('[data-step]').forEach(btn=>btn.onclick=()=>{const k=s.dataset.stepper,delta=Number(btn.dataset.step),bounds={soundBars:[1,16],muteBars:[1,16],tempoStep:[1,20],everyBars:[1,16],targetBpm:[30,300]}[k];setTraining(k,clamp(state.training[k]+delta,bounds[0],bounds[1]))}));
  $$('#tempoMode button').forEach(b=>b.onclick=()=>setTraining('tempoMode',b.dataset.mode));$$('#gradualSeconds button').forEach(b=>b.onclick=()=>setTraining('gradualSeconds',Number(b.dataset.sec)));$$('#timerMinutes button').forEach(b=>b.onclick=()=>setTraining('timerMinutes',Number(b.dataset.min)));
  $$('.bottom-nav button').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));$('savePreset').onclick=savePreset;$('openSettings').onclick=()=>$('settingsModal').classList.remove('hidden');$('closeSettings').onclick=()=>$('settingsModal').classList.add('hidden');$('settingsModal').onclick=e=>{if(e.target===$('settingsModal'))$('settingsModal').classList.add('hidden')};$('resetSettings').onclick=resetSettings;
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&playing)requestWakeLock()});window.addEventListener('beforeunload',()=>{if(scheduler)clearInterval(scheduler);if(audioCtx)audioCtx.close()});
  ensurePattern();renderAll();
})();
