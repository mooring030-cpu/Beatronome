(() => {
  'use strict';

  const BPM_MIN = 30;
  const BPM_MAX = 300;
  const SETTINGS_KEY = 'beatronome-settings-v3';
  const OLD_SETTINGS_KEYS = ['beatronome-settings-v2', 'beatronome-settings-v1'];
  const PRESETS_KEY = 'beatronome-presets-v3';
  const OLD_PRESETS_KEYS = ['beatronome-presets-v2', 'beatronome-presets-v1'];

  const SOUND_LABELS = {
    classic: 'Classic Click', wood: 'Wood Block', digital: 'Digital', clave: 'Clave',
    cowbell: 'Cowbell', rim: 'Rim', beep: 'Beep'
  };

  const DRUM_INSTRUMENTS = [
    ['kick','KICK'], ['snare','SNARE'], ['chh','CLOSED HH'], ['ohh','OPEN HH'],
    ['ride','RIDE'], ['rim','RIM'], ['clap','CLAP'], ['cowbell','COWBELL']
  ];

  const DRUM_KITS = {
    studio: 'Studio', vintage: 'Vintage', jazz: 'Jazz', funk: 'Funk',
    electronic: 'Electronic', brush: 'Brush', lofi: 'Lo-Fi'
  };

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
  const empty16 = () => Array(16).fill(0);
  const steps = (...idx) => {
    const a = empty16();
    idx.flat().forEach(i => { if (i >= 0 && i < 16) a[i] = 1; });
    return a;
  };
  const load = (key, fallback) => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch { return fallback; }
  };

  const makePattern = beats => Array.from({length:beats},(_,i)=>i===0?'accent':'normal');
  const makeMeter = (beats=4, denominator=4, pattern, repeatBars=1) => ({
    id: uid(), beats, denominator, repeatBars: clamp(Number(repeatBars)||1,1,32),
    pattern: Array.isArray(pattern) ? pattern.slice(0,beats) : makePattern(beats)
  });
  const makeDrumInstrument = (pattern=empty16(), volume=.82) => ({ pattern: pattern.slice(0,16), muted:false, volume });
  const makeDefaultDrums = () => ({
    kick: makeDrumInstrument(steps(0,8), .9),
    snare: makeDrumInstrument(steps(4,12), .82),
    chh: makeDrumInstrument(steps(0,2,4,6,8,10,12,14), .56),
    ohh: makeDrumInstrument(empty16(), .5),
    ride: makeDrumInstrument(empty16(), .58),
    rim: makeDrumInstrument(empty16(), .62),
    clap: makeDrumInstrument(empty16(), .62),
    cowbell: makeDrumInstrument(empty16(), .58)
  });

  const GROOVE_PRESETS = [
    {genre:'Rock',name:'Basic Rock',bpm:110,kit:'studio',swing:0,p:{kick:[0,8],snare:[4,12],chh:[0,2,4,6,8,10,12,14]}},
    {genre:'Rock',name:'Hard Rock',bpm:128,kit:'studio',swing:0,p:{kick:[0,3,6,8,11,14],snare:[4,12],chh:[0,2,4,6,8,10,12,14],ohh:[14]}},
    {genre:'Rock',name:'Half Time',bpm:92,kit:'vintage',swing:0,p:{kick:[0,6,8,14],snare:[8],chh:[0,2,4,6,8,10,12,14]}},
    {genre:'Rock',name:'Shuffle Rock',bpm:118,kit:'vintage',swing:62,p:{kick:[0,6,8,14],snare:[4,12],chh:[0,3,4,7,8,11,12,15]}},

    {genre:'Jazz',name:'Swing',bpm:150,kit:'jazz',swing:66,p:{ride:[0,3,4,7,8,11,12,15],chh:[4,12],kick:[0,10],snare:[6,14]}},
    {genre:'Jazz',name:'Bebop',bpm:190,kit:'jazz',swing:60,p:{ride:[0,3,4,7,8,11,12,15],chh:[4,12],kick:[0,9],snare:[2,6,11,14]}},
    {genre:'Jazz',name:'Brush',bpm:105,kit:'brush',swing:58,p:{chh:[0,2,4,6,8,10,12,14],snare:[4,12],ride:[0,6,8,14]}},
    {genre:'Jazz',name:'Bossa Jazz',bpm:132,kit:'jazz',swing:0,p:{kick:[0,6,8,14],rim:[4,12],chh:[0,2,4,6,8,10,12,14],ride:[0,8]}},

    {genre:'Funk',name:'Basic Funk',bpm:102,kit:'funk',swing:8,p:{kick:[0,3,7,10],snare:[4,12],chh:[0,2,3,4,6,8,10,11,12,14],ohh:[7,15]}},
    {genre:'Funk',name:'16th Funk',bpm:108,kit:'funk',swing:10,p:{kick:[0,3,7,8,10,14],snare:[4,12],chh:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],ohh:[7,15]}},
    {genre:'Funk',name:'Syncopated',bpm:96,kit:'funk',swing:16,p:{kick:[0,3,6,10,13],snare:[4,11,12],chh:[0,2,4,5,7,8,10,12,14,15],rim:[9]}},

    {genre:'Blues',name:'Shuffle',bpm:88,kit:'vintage',swing:66,p:{kick:[0,8],snare:[4,12],chh:[0,3,4,7,8,11,12,15]}},
    {genre:'Blues',name:'Slow Blues',bpm:68,kit:'vintage',swing:64,p:{kick:[0,7,8],snare:[4,12],ride:[0,3,4,7,8,11,12,15]}},

    {genre:'Latin',name:'Bossa Nova',bpm:126,kit:'jazz',swing:0,p:{kick:[0,6,8,14],rim:[4,12],chh:[0,2,4,6,8,10,12,14],ride:[2,10]}},
    {genre:'Latin',name:'Samba',bpm:108,kit:'studio',swing:0,p:{kick:[0,3,6,8,11,14],snare:[4,7,12,15],chh:[0,2,4,6,8,10,12,14],cowbell:[0,3,6,9,12,15]}},
    {genre:'Latin',name:'Salsa',bpm:168,kit:'studio',swing:0,p:{kick:[0,10],rim:[4,7,12,15],cowbell:[0,3,6,8,11,14],chh:[2,6,10,14]}},

    {genre:'Pop',name:'Basic Pop',bpm:116,kit:'studio',swing:0,p:{kick:[0,8,10],snare:[4,12],chh:[0,2,4,6,8,10,12,14]}},
    {genre:'Pop',name:'Disco',bpm:124,kit:'electronic',swing:0,p:{kick:[0,4,8,12],snare:[4,12],clap:[4,12],chh:[0,2,4,6,8,10,12,14],ohh:[2,6,10,14]}},
    {genre:'Pop',name:'Ballad',bpm:76,kit:'studio',swing:0,p:{kick:[0,8],snare:[4,12],chh:[0,4,8,12]}},
    {genre:'Pop',name:'80s Pop',bpm:118,kit:'electronic',swing:0,p:{kick:[0,8,10],snare:[4,12],clap:[4,12],chh:[0,2,4,6,8,10,12,14]}},

    {genre:'R&B',name:'R&B Pocket',bpm:86,kit:'lofi',swing:14,p:{kick:[0,7,10],snare:[4,12],chh:[0,2,5,7,8,10,13,15],rim:[11]}},
    {genre:'R&B',name:'Neo Soul',bpm:78,kit:'lofi',swing:22,p:{kick:[0,3,7,10,14],snare:[4,12],chh:[0,2,5,7,8,11,13,15],rim:[9]}},
    {genre:'R&B',name:'Gospel',bpm:104,kit:'studio',swing:12,p:{kick:[0,3,6,8,11,14],snare:[4,12,15],chh:[0,2,4,6,8,10,12,14],clap:[4,12]}},
  ];

  const defaults = {
    bpm:120, beatsPerBar:4, denominator:4, subdivision:1, sound:'classic', volume:.82,
    pattern:makePattern(4), meterChainEnabled:false, meterChain:[],
    playbackMode:'both',
    groove:{
      genre:'Rock', selectedName:'Basic Rock', kit:'studio', volume:.82, swing:0, humanize:0, dropout:0,
      instruments: makeDefaultDrums()
    },
    training:{
      randomMuteEnabled:false, randomMute:25, internalEnabled:false, soundBars:4, muteBars:2,
      autoTempoEnabled:false, tempoStep:5, everyBars:4, targetBpm:160, tempoMode:'up',
      timerEnabled:false, timerMinutes:10, gradualEnabled:false, gradualTarget:70, gradualSeconds:120
    }
  };

  function normalizePattern(pattern, beats){
    return Array.from({length:beats},(_,i)=>['accent','normal','mute'].includes(pattern?.[i])?pattern[i]:(i===0?'accent':'normal'));
  }
  function normalizeMeter(m){
    const beats=clamp(Number(m?.beats)||4,1,16);
    const denominator=[2,4,8,16].includes(Number(m?.denominator))?Number(m.denominator):4;
    return {id:m?.id||uid(),beats,denominator,repeatBars:clamp(Number(m?.repeatBars)||1,1,32),pattern:normalizePattern(m?.pattern,beats)};
  }
  function normalizeDrumInstrument(v, fallback){
    return {
      pattern:Array.from({length:16},(_,i)=>v?.pattern?.[i]?1:(fallback?.pattern?.[i]?1:0)),
      muted:!!v?.muted,
      volume:clamp(Number.isFinite(Number(v?.volume))?Number(v.volume):(fallback?.volume??.75),0,1)
    };
  }
  function deepMerge(base,obj){
    const merged={...base,...(obj||{}),training:{...base.training,...(obj?.training||{})},groove:{...base.groove,...(obj?.groove||{})}};
    merged.beatsPerBar=clamp(Number(merged.beatsPerBar)||4,1,16);
    merged.denominator=[2,4,8,16].includes(Number(merged.denominator))?Number(merged.denominator):4;
    merged.pattern=normalizePattern(obj?.pattern||base.pattern,merged.beatsPerBar);
    merged.meterChain=Array.isArray(obj?.meterChain)?obj.meterChain.map(normalizeMeter):[];
    merged.meterChainEnabled=!!obj?.meterChainEnabled;
    if(merged.meterChainEnabled&&!merged.meterChain.length) merged.meterChain=[normalizeMeter({beats:merged.beatsPerBar,denominator:merged.denominator,pattern:merged.pattern})];
    merged.playbackMode=['metro','drum','both'].includes(merged.playbackMode)?merged.playbackMode:'both';
    merged.groove.volume=clamp(Number(merged.groove.volume ?? .82),0,1);
    merged.groove.swing=clamp(Number(merged.groove.swing)||0,0,75);
    merged.groove.humanize=clamp(Number(merged.groove.humanize)||0,0,100);
    merged.groove.dropout=clamp(Number(merged.groove.dropout)||0,0,80);
    merged.groove.kit=DRUM_KITS[merged.groove.kit]?merged.groove.kit:'studio';
    const fallback=makeDefaultDrums();
    const source=merged.groove.instruments||{};
    merged.groove.instruments={};
    DRUM_INSTRUMENTS.forEach(([key])=>merged.groove.instruments[key]=normalizeDrumInstrument(source[key],fallback[key]));
    return merged;
  }

  let saved={};
  if(localStorage.getItem(SETTINGS_KEY)) saved=load(SETTINGS_KEY,{});
  else { for(const k of OLD_SETTINGS_KEYS){ if(localStorage.getItem(k)){saved=load(k,{});break;} } }
  let state=deepMerge(defaults,saved);
  let presets=[];
  if(localStorage.getItem(PRESETS_KEY)) presets=load(PRESETS_KEY,[]);
  else { for(const k of OLD_PRESETS_KEYS){ if(localStorage.getItem(k)){presets=load(k,[]);break;} } }

  let playing=false,currentBeat=-1,currentDrumStep=-1,elapsed=0,trainingExpanded=true,selectedChainIndex=0;
  let playbackChainIndex=0,playbackChainBarCount=0,visualChainIndex=-1,visualChainBarCount=0;
  let audioCtx=null,master=null,noiseCache=null,scheduler=null,nextNoteTime=0,stepIndex=0,barIndex=0,startTime=0,sessionBaseBpm=state.bpm,tempoDir=1;
  let wakeLock=null,visualQueue=[],drumVisualQueue=[],rafId=null,tapTimes=[],toastTimer=null,drag=null,dialDragging=false,repeatDelay=null,repeatTimer=null;
  let selectedGenre=state.groove.genre||'Rock';

  function persist(){localStorage.setItem(SETTINGS_KEY,JSON.stringify(state));}
  function persistPresets(){localStorage.setItem(PRESETS_KEY,JSON.stringify(presets));}
  function fmtTime(sec){sec=Math.max(0,Math.floor(sec));return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}
  function tempoName(b){return b<60?'LARGO':b<76?'ADAGIO':b<108?'ANDANTE':b<120?'MODERATO':b<168?'ALLEGRO':'PRESTO';}
  function notify(msg){$('toast').textContent=msg;$('toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),1800);}
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  function setRangeStyle(el,min,max,val){const pct=(val-min)/(max-min)*100;el.style.setProperty('--pct',`${pct}%`);}

  function ensureNormalPattern(){state.pattern=normalizePattern(state.pattern,state.beatsPerBar);}
  function ensureChain(){
    if(!state.meterChain.length) state.meterChain=[normalizeMeter({beats:state.beatsPerBar,denominator:state.denominator,pattern:state.pattern})];
    state.meterChain=state.meterChain.map(normalizeMeter);selectedChainIndex=clamp(selectedChainIndex,0,state.meterChain.length-1);
  }
  function getSelectedMeter(){if(state.meterChainEnabled){ensureChain();return state.meterChain[selectedChainIndex];}return{beats:state.beatsPerBar,denominator:state.denominator,pattern:state.pattern};}
  function getPlaybackMeter(){if(state.meterChainEnabled){ensureChain();playbackChainIndex=clamp(playbackChainIndex,0,state.meterChain.length-1);return state.meterChain[playbackChainIndex];}return{beats:state.beatsPerBar,denominator:state.denominator,pattern:state.pattern};}
  function setSelectedMeterField(key,value){
    if(state.meterChainEnabled){ensureChain();const m=state.meterChain[selectedChainIndex];if(key==='beats'){m.beats=clamp(Number(value),1,16);m.pattern=normalizePattern(m.pattern,m.beats);}else m.denominator=Number(value);}
    else {if(key==='beats'){state.beatsPerBar=clamp(Number(value),1,16);ensureNormalPattern();}else state.denominator=Number(value);}persist();
  }
  function setBpm(v){state.bpm=clamp(Math.round(v),BPM_MIN,BPM_MAX);persist();renderCore();}
  function setTraining(key,value){state.training[key]=value;persist();renderTraining();renderCore();}

  function updateSessionStatus(){const remain=Math.max(0,state.training.timerMinutes*60-elapsed);$('sessionStatus').textContent=playing?(state.training.timerEnabled?`남은 ${fmtTime(remain)}`:`연습 ${fmtTime(elapsed)}`):'READY';}
  function updateActiveBeat(){document.querySelectorAll('.beat-dot').forEach((el,i)=>el.classList.toggle('active',playing&&currentBeat===i));}
  function syncMeterControls(){const m=getSelectedMeter();$('beatsPerBar').value=m.beats;$('denominator').value=m.denominator;}

  function renderCore(){
    ensureNormalPattern();if(state.meterChainEnabled)ensureChain();
    const meter=getSelectedMeter();const chainPos=state.meterChainEnabled?` · ${selectedChainIndex+1}/${state.meterChain.length}`:'';
    $('bpmValue').textContent=state.bpm;$('tempoName').textContent=tempoName(state.bpm);$('meterTop').textContent=`${meter.beats}/${meter.denominator}${chainPos}`;$('meterTitle').textContent=`${meter.beats}/${meter.denominator}`;
    $('subdivision').value=state.subdivision;syncMeterControls();
    const sub=state.subdivision===1?'Quarter':state.subdivision===2?'8th':state.subdivision===3?'Triplet':'16th';
    const mode=state.playbackMode==='metro'?'Metro':state.playbackMode==='drum'?'Drum':`Metro + ${state.groove.selectedName||'Drum'}`;
    $('soundSummary').textContent=state.meterChainEnabled?`${mode} · ${sub} · Chain ${state.meterChain.length}`:`${mode} · ${sub}`;
    $('playButton').classList.toggle('playing',playing);$('playIcon').textContent=playing?'Ⅱ':'▶';$('playLabel').textContent=playing?'STOP':'START';updateSessionStatus();
    const angle=-135+(state.bpm-BPM_MIN)/(BPM_MAX-BPM_MIN)*270;$('tempoDial').style.setProperty('--angle',`${angle}deg`);
    renderBeats();renderMeterChain();
  }
  function renderBeats(){
    const meter=getSelectedMeter();meter.pattern=normalizePattern(meter.pattern,meter.beats);if(!state.meterChainEnabled)state.pattern=meter.pattern;
    const g=$('beatGrid');g.style.gridTemplateColumns=`repeat(${Math.min(meter.beats,8)},1fr)`;g.innerHTML='';
    meter.pattern.forEach((s,i)=>{const b=document.createElement('button');b.className=`beat-dot ${s}${playing&&currentBeat===i?' active':''}`;b.innerHTML=`<span>${i+1}</span><i>${s==='accent'?'A':s==='mute'?'×':'•'}</i>`;b.onclick=()=>{if(playing)stop();const target=getSelectedMeter();const c=target.pattern[i];target.pattern[i]=c==='accent'?'normal':c==='normal'?'mute':'accent';if(!state.meterChainEnabled)state.pattern=target.pattern;persist();renderBeats();renderMeterChain();};g.appendChild(b);});
  }
  function renderMeterChain(){
    $('meterChainToggle').classList.toggle('on',state.meterChainEnabled);$('meterChainBody').classList.toggle('hidden',!state.meterChainEnabled);if(!state.meterChainEnabled)return;ensureChain();
    const list=$('meterChainList');list.innerHTML='';state.meterChain.forEach((m,i)=>{const b=document.createElement('button');const accents=m.pattern.filter(x=>x==='accent').length,mutes=m.pattern.filter(x=>x==='mute').length;b.className=`meter-chain-chip${i===selectedChainIndex?' selected':''}${playing&&i===visualChainIndex?' playing-meter':''}`;const prog=playing&&i===visualChainIndex&&m.repeatBars>1?` · ${Math.min(visualChainBarCount+1,m.repeatBars)}/${m.repeatBars}`:'';b.innerHTML=`<span class="chain-number">${i+1}</span><strong>${m.beats}/${m.denominator}</strong><em>×${m.repeatBars}마디${prog}</em><small>${accents}A${mutes?` · ${mutes}M`:''}</small>`;b.onclick=()=>{if(playing)stop();selectedChainIndex=i;currentBeat=-1;renderCore();};list.appendChild(b);});
    $('chainMoveLeft').disabled=selectedChainIndex<=0;$('chainMoveRight').disabled=selectedChainIndex>=state.meterChain.length-1;$('chainDelete').disabled=state.meterChain.length<=1;$('chainRepeatValue').textContent=`${state.meterChain[selectedChainIndex].repeatBars}마디`;$('chainRepeatMinus').disabled=state.meterChain[selectedChainIndex].repeatBars<=1;$('chainRepeatPlus').disabled=state.meterChain[selectedChainIndex].repeatBars>=32;
  }
  function addMeter(beats,den){if(playing)stop();ensureChain();state.meterChain.push(makeMeter(beats,den));selectedChainIndex=state.meterChain.length-1;persist();renderCore();notify(`${beats}/${den} 박자를 추가했습니다.`);}
  function duplicateSelectedMeter(){if(playing)stop();ensureChain();const s=state.meterChain[selectedChainIndex],c=makeMeter(s.beats,s.denominator,s.pattern,s.repeatBars);state.meterChain.splice(selectedChainIndex+1,0,c);selectedChainIndex++;persist();renderCore();}
  function moveSelectedMeter(dir){if(playing)stop();ensureChain();const n=selectedChainIndex+dir;if(n<0||n>=state.meterChain.length)return;const[item]=state.meterChain.splice(selectedChainIndex,1);state.meterChain.splice(n,0,item);selectedChainIndex=n;persist();renderCore();}
  function deleteSelectedMeter(){if(playing)stop();ensureChain();if(state.meterChain.length<=1){notify('Meter Chain에는 최소 1개의 박자가 필요합니다.');return;}state.meterChain.splice(selectedChainIndex,1);selectedChainIndex=clamp(selectedChainIndex,0,state.meterChain.length-1);persist();renderCore();}
  function changeSelectedRepeat(delta){if(playing)stop();ensureChain();const m=state.meterChain[selectedChainIndex];m.repeatBars=clamp((Number(m.repeatBars)||1)+delta,1,32);persist();renderCore();}

  function renderTraining(){
    const t=state.training;$$('[data-toggle]').forEach(btn=>{const k=btn.dataset.toggle;btn.classList.toggle('on',!!t[k]);const body=document.querySelector(`[data-body="${k}"]`);if(body)body.classList.toggle('hidden',!t[k]);btn.closest('.training-row')?.classList.toggle('enabled',!!t[k]);});
    $('randomMute').value=t.randomMute;$('randomMuteOut').textContent=`${t.randomMute}%`;setRangeStyle($('randomMute'),0,90,t.randomMute);
    $('gradualTarget').value=t.gradualTarget;$('gradualTargetOut').textContent=`${t.gradualTarget}% 목표`;setRangeStyle($('gradualTarget'),10,100,t.gradualTarget);
    $$('#tempoMode button').forEach(b=>b.classList.toggle('selected',b.dataset.mode===t.tempoMode));$$('#gradualSeconds button').forEach(b=>b.classList.toggle('selected',Number(b.dataset.sec)===t.gradualSeconds));$$('#timerMinutes button').forEach(b=>b.classList.toggle('selected',Number(b.dataset.min)===t.timerMinutes));
    const vals={soundBars:t.soundBars,muteBars:t.muteBars,tempoStep:t.tempoStep,everyBars:t.everyBars,targetBpm:t.targetBpm};$$('.stepper').forEach(s=>{const k=s.dataset.stepper;s.querySelector('[data-value]').textContent=k==='everyBars'?`${vals[k]}마디`:k==='tempoStep'?`${t.tempoMode==='down'?'-':'+'}${vals[k]}`:vals[k];});
    const count=['randomMuteEnabled','internalEnabled','autoTempoEnabled','timerEnabled','gradualEnabled'].filter(k=>t[k]).length;$('trainingCount').textContent=count;$('trainingCount').classList.toggle('hidden',count===0);$('trainingList').classList.toggle('hidden',!trainingExpanded);$('trainingChevron').textContent=trainingExpanded?'⌃':'⌄';
  }
  function renderSound(){
    const g=$('soundGrid');g.innerHTML='';Object.entries(SOUND_LABELS).forEach(([key,label])=>{const b=document.createElement('button');b.className=`sound-card card ${state.sound===key?'selected':''}`;b.innerHTML=`<span class="sound-symbol">♪</span><strong>${label}</strong><span>${state.sound===key?'✓ 사용 중':'미리듣기'}</span>`;b.onclick=async()=>{state.sound=key;persist();renderSound();renderCore();await ensureAudio();synthClick(audioCtx.currentTime+.02,key,true,state.volume);};g.appendChild(b);});$('volume').value=Math.round(state.volume*100);$('volumeOut').textContent=`${Math.round(state.volume*100)}%`;setRangeStyle($('volume'),10,100,Math.round(state.volume*100));
  }

  function applyGroovePreset(preset){
    state.bpm=preset.bpm;state.groove.genre=preset.genre;selectedGenre=preset.genre;state.groove.selectedName=preset.name;state.groove.kit=preset.kit;state.groove.swing=preset.swing;
    const base=makeDefaultDrums();DRUM_INSTRUMENTS.forEach(([key])=>{base[key].pattern=steps(...(preset.p[key]||[]));base[key].muted=false;});state.groove.instruments=base;
    persist();renderAll();notify(`${preset.genre} · ${preset.name} 적용`);
  }
  function renderGroove(){
    const genres=[...new Set(GROOVE_PRESETS.map(p=>p.genre))];const chips=$('genreChips');chips.innerHTML='';genres.forEach(g=>{const b=document.createElement('button');b.textContent=g;b.className=g===selectedGenre?'selected':'';b.onclick=()=>{selectedGenre=g;state.groove.genre=g;persist();renderGroove();};chips.appendChild(b);});
    const grid=$('groovePresetGrid');grid.innerHTML='';GROOVE_PRESETS.filter(p=>p.genre===selectedGenre).forEach(p=>{const b=document.createElement('button');b.className=`groove-preset-card${state.groove.selectedName===p.name&&state.groove.genre===p.genre?' selected':''}`;b.innerHTML=`<strong>${p.name}</strong><span>${p.bpm} BPM · ${DRUM_KITS[p.kit]}${p.swing?` · Swing ${p.swing}`:''}</span>`;b.onclick=()=>applyGroovePreset(p);grid.appendChild(b);});
    $$('#playbackMode button').forEach(b=>b.classList.toggle('selected',b.dataset.playback===state.playbackMode));$('grooveStatusBadge').textContent=state.playbackMode.toUpperCase();$('selectedGrooveName').textContent=`${state.groove.genre} · ${state.groove.selectedName||'Custom'}`;
    const kit=$('drumKit');if(!kit.options.length)Object.entries(DRUM_KITS).forEach(([k,v])=>{const o=document.createElement('option');o.value=k;o.textContent=v;kit.appendChild(o);});kit.value=state.groove.kit;
    const controls=[['drumVolume',0,100,Math.round(state.groove.volume*100),'drumVolumeOut','%'],['swingAmount',0,75,state.groove.swing,'swingAmountOut','%'],['humanizeAmount',0,100,state.groove.humanize,'humanizeAmountOut','%'],['drumDropout',0,80,state.groove.dropout,'drumDropoutOut','%']];controls.forEach(([id,min,max,val,out,sfx])=>{$(id).value=val;$(out).textContent=`${val}${sfx}`;setRangeStyle($(id),min,max,val);});
    renderSequencer();
  }
  function renderSequencer(){
    const wrap=$('sequencer');wrap.innerHTML='';
    const header=document.createElement('div');header.className='seq-header-row';header.innerHTML='<div class="seq-spacer">INSTRUMENT</div><div class="seq-grid seq-numbers">'+Array.from({length:16},(_,i)=>`<span class="${[0,4,8,12].includes(i)?'downbeat':''}">${i+1}</span>`).join('')+'</div>';wrap.appendChild(header);
    DRUM_INSTRUMENTS.forEach(([key,label])=>{const inst=state.groove.instruments[key];const row=document.createElement('div');row.className='seq-row';const controls=document.createElement('div');controls.className='seq-inst-controls';controls.innerHTML=`<strong>${label}</strong><div class="seq-inst-tools"><button class="seq-mute ${inst.muted?'on':''}" title="Mute">M</button><input class="seq-vol" type="range" min="0" max="100" step="5" value="${Math.round(inst.volume*100)}" title="Volume"><span>${Math.round(inst.volume*100)}</span></div>`;controls.querySelector('.seq-mute').onclick=()=>{inst.muted=!inst.muted;persist();renderSequencer();};const vol=controls.querySelector('.seq-vol');vol.oninput=e=>{inst.volume=Number(e.target.value)/100;controls.querySelector('.seq-inst-tools span').textContent=e.target.value;persist();};
      const sg=document.createElement('div');sg.className='seq-grid';inst.pattern.forEach((on,i)=>{const b=document.createElement('button');b.className=`seq-step${on?' on':''}${[0,4,8,12].includes(i)?' downbeat':''}${currentDrumStep===i&&playing?' current':''}`;b.dataset.step=i;b.dataset.instrument=key;b.onclick=()=>{inst.pattern[i]=inst.pattern[i]?0:1;state.groove.selectedName='Custom';persist();b.classList.toggle('on',!!inst.pattern[i]);$('selectedGrooveName').textContent=`${state.groove.genre} · Custom`;};sg.appendChild(b);});row.append(controls,sg);wrap.appendChild(row);});
  }
  function updateDrumStepVisual(){document.querySelectorAll('.seq-step').forEach(el=>el.classList.toggle('current',playing&&Number(el.dataset.step)===currentDrumStep));}

  function renderPresets(){
    const list=$('presetList');list.innerHTML='';if(!presets.length){list.innerHTML='<div class="empty-state"><div class="big">☆</div><strong>아직 저장된 프리셋이 없습니다.</strong><span>Meter Chain · Training · Groove 패턴까지 함께 저장됩니다.</span></div>';return;}
    presets.forEach(p=>{const n=deepMerge(defaults,p),a=document.createElement('article');a.className='preset-card card';const detail=n.meterChainEnabled&&n.meterChain.length?n.meterChain.slice(0,4).map(m=>`${m.beats}/${m.denominator}${m.repeatBars>1?`×${m.repeatBars}`:''}`).join(' → ')+(n.meterChain.length>4?' → …':''):`${n.beatsPerBar}/${n.denominator}`;a.innerHTML=`<button class="preset-main"><div class="preset-bpm">${n.bpm}<small>BPM</small></div><div class="preset-copy"><strong>${escapeHtml(p.name)}</strong><span>${detail} · ${n.groove.genre}/${n.groove.selectedName||'Custom'} · ${n.playbackMode.toUpperCase()}</span></div></button><button class="danger-icon">×</button>`;a.querySelector('.preset-main').onclick=()=>loadPreset(p);a.querySelector('.danger-icon').onclick=()=>{presets=presets.filter(x=>x.id!==p.id);persistPresets();renderPresets();};list.appendChild(a);});
  }
  function renderAll(){renderCore();renderTraining();renderSound();renderGroove();renderPresets();}

  async function ensureAudio(){if(!audioCtx){const Ctx=window.AudioContext||window.webkitAudioContext;audioCtx=new Ctx({latencyHint:'interactive'});master=audioCtx.createGain();master.gain.value=.94;master.connect(audioCtx.destination);}if(audioCtx.state==='suspended')await audioCtx.resume();}
  function noiseBuffer(){if(noiseCache)return noiseCache;const len=Math.max(1,Math.floor(audioCtx.sampleRate*.5)),buf=audioCtx.createBuffer(1,len,audioCtx.sampleRate),data=buf.getChannelData(0);for(let i=0;i<len;i++)data[i]=Math.random()*2-1;noiseCache=buf;return noiseCache;}
  function synthClick(when,sound,accent=false,volume=.8){
    if(!audioCtx||!master)return;const out=audioCtx.createGain();out.gain.setValueAtTime(.0001,when);out.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),when+.002);out.gain.exponentialRampToValueAtTime(.0001,when+(sound==='cowbell'?.13:.07));out.connect(master);
    const osc=(type,f0,f1,end,gain=1)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(f0,when);if(f1)o.frequency.exponentialRampToValueAtTime(f1,when+end);g.gain.setValueAtTime(gain,when);g.gain.exponentialRampToValueAtTime(.0001,when+end);o.connect(g).connect(out);o.start(when);o.stop(when+end+.02);};
    const noise=(end,gain=.25,hp=1200)=>{const src=audioCtx.createBufferSource(),f=audioCtx.createBiquadFilter(),g=audioCtx.createGain();src.buffer=noiseBuffer(end);f.type='highpass';f.frequency.value=hp;g.gain.setValueAtTime(gain,when);g.gain.exponentialRampToValueAtTime(.0001,when+end);src.connect(f).connect(g).connect(out);src.start(when);};
    const hi=accent?1.22:1;switch(sound){case'wood':osc('sine',880*hi,360*hi,.06,.95);osc('sine',1320*hi,550*hi,.045,.35);break;case'digital':osc('square',1700*hi,1000*hi,.035,.45);noise(.025,.14,2800);break;case'clave':osc('sine',2200*hi,1700*hi,.04,.8);osc('sine',3300*hi,2500*hi,.025,.25);break;case'cowbell':osc('square',560*hi,null,.12,.35);osc('square',845*hi,null,.10,.25);break;case'rim':noise(.035,.45,1800);osc('triangle',1250*hi,800*hi,.035,.4);break;case'beep':osc('sine',accent?1320:880,null,.055,.85);break;default:osc('triangle',1900*hi,800*hi,.045,.75);noise(.025,.18,2200);}
  }

  function synthDrum(type,when,velocity=1){
    if(!audioCtx||!master)return;const kit=state.groove.kit,h=state.groove.humanize/100;velocity=clamp(velocity*(1+(Math.random()-.5)*.28*h),.15,1.2);const kg=kit==='lofi'?.76:kit==='electronic'?1.02:kit==='brush'?.62:1;
    const out=audioCtx.createGain();out.gain.setValueAtTime(Math.max(.0001,state.groove.volume*velocity*kg),when);out.connect(master);
    const osc=(wave,f0,f1,dur,gain=1)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=wave;o.frequency.setValueAtTime(f0,when);if(f1)o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),when+dur);g.gain.setValueAtTime(gain,when);g.gain.exponentialRampToValueAtTime(.0001,when+dur);o.connect(g).connect(out);o.start(when);o.stop(when+dur+.03);};
    const noise=(dur,gain=.5,hp=1000,lp=18000)=>{const src=audioCtx.createBufferSource(),hpF=audioCtx.createBiquadFilter(),lpF=audioCtx.createBiquadFilter(),g=audioCtx.createGain();src.buffer=noiseBuffer(dur);hpF.type='highpass';hpF.frequency.value=hp;lpF.type='lowpass';lpF.frequency.value=kit==='lofi'?Math.min(lp,6500):lp;g.gain.setValueAtTime(gain,when);g.gain.exponentialRampToValueAtTime(.0001,when+dur);src.connect(hpF).connect(lpF).connect(g).connect(out);src.start(when);};
    const decayMul=kit==='vintage'?1.18:kit==='electronic'?.82:kit==='brush'?1.35:1;
    if(type==='kick'){const start=kit==='electronic'?165:kit==='jazz'?105:135;const end=kit==='electronic'?52:42;osc('sine',start,end,.16*decayMul,.95);if(kit==='studio'||kit==='funk')noise(.018,.12,1200,6500);}
    else if(type==='snare'){noise((kit==='brush'?.22:.13)*decayMul,kit==='brush'?.55:.72,kit==='brush'?900:1200,kit==='lofi'?5200:12000);osc('triangle',kit==='electronic'?220:185,120,.08,.24);}
    else if(type==='chh'){noise(.045*decayMul,.38,kit==='lofi'?4300:6500,15000);}
    else if(type==='ohh'){noise(.25*decayMul,.34,5200,15000);}
    else if(type==='ride'){noise(.32*decayMul,.22,3800,15000);osc('sine',kit==='jazz'?860:720,null,.27,.12);}
    else if(type==='rim'){noise(.04,.36,1800,11000);osc('triangle',1250,780,.04,.28);}
    else if(type==='clap'){noise(.09,.46,900,11000);}
    else if(type==='cowbell'){osc('square',560,null,.13,.28);osc('square',845,null,.11,.20);}
  }

  function scheduleDrumBar(barStart,barDuration){
    if(!['drum','both'].includes(state.playbackMode))return;const g=state.groove,stepDur=barDuration/16,swingDelay=(g.swing/75)*stepDur*.38,h=g.humanize/100;
    for(let s=0;s<16;s++){
      let t=barStart+s*stepDur+(s%2?swingDelay:0)+(Math.random()-.5)*.012*h;t=Math.max(barStart,t);drumVisualQueue.push({time:t,step:s});
      DRUM_INSTRUMENTS.forEach(([key])=>{const inst=g.instruments[key];if(!inst||inst.muted||!inst.pattern[s])return;if(g.dropout>0&&Math.random()*100<g.dropout)return;synthDrum(key,t,inst.volume);});
    }
  }

  function scheduleStep(time){
    const t=state.training,meter=getPlaybackMeter(),chainIndex=state.meterChainEnabled?playbackChainIndex:-1,chainBar=state.meterChainEnabled?playbackChainBarCount:0,step=stepIndex,beat=Math.floor(step/state.subdivision),sub=step%state.subdivision,isMain=sub===0,pat=meter.pattern[beat]||'normal';
    const beatDuration=(60/state.bpm)*(4/meter.denominator);
    if(step===0)scheduleDrumBar(time,beatDuration*meter.beats);
    let audible=pat!=='mute',trainingMuted=false;if(t.internalEnabled){const cycle=Math.max(1,t.soundBars+t.muteBars),phase=barIndex%cycle;if(phase>=t.soundBars)trainingMuted=true;}
    let mutePct=t.randomMuteEnabled?t.randomMute:0;if(t.gradualEnabled){const sec=Math.max(0,audioCtx.currentTime-startTime),ratio=clamp(sec/Math.max(1,t.gradualSeconds),0,1);mutePct=Math.max(mutePct,t.gradualTarget*ratio);}if(!trainingMuted&&mutePct>0&&Math.random()*100<mutePct)trainingMuted=true;audible=audible&&!trainingMuted;
    if(audible&&['metro','both'].includes(state.playbackMode))synthClick(time,state.sound,isMain&&pat==='accent',isMain?state.volume:state.volume*.47);
    visualQueue.push({time,beat,chainIndex,chainBar});stepIndex++;const perBar=meter.beats*state.subdivision;
    if(stepIndex>=perBar){stepIndex=0;barIndex++;
      if(state.meterChainEnabled&&state.meterChain.length){playbackChainBarCount++;const repeat=Math.max(1,Number(meter.repeatBars)||1);if(playbackChainBarCount>=repeat){playbackChainBarCount=0;playbackChainIndex=(playbackChainIndex+1)%state.meterChain.length;}}
      if(t.autoTempoEnabled&&barIndex%Math.max(1,t.everyBars)===0){let next=state.bpm;if(t.tempoMode==='down')next=Math.max(t.targetBpm,state.bpm-Math.abs(t.tempoStep));else if(t.tempoMode==='pyramid'){next=state.bpm+t.tempoStep*tempoDir;if(tempoDir>0&&next>=t.targetBpm){next=t.targetBpm;tempoDir=-1;}else if(tempoDir<0&&next<=sessionBaseBpm){next=sessionBaseBpm;tempoDir=1;}}else next=Math.min(t.targetBpm,state.bpm+Math.abs(t.tempoStep));setBpm(next);}
    }
    return meter;
  }

  async function start(){
    await ensureAudio();ensureNormalPattern();if(state.meterChainEnabled)ensureChain();stepIndex=0;barIndex=0;playbackChainIndex=0;playbackChainBarCount=0;visualChainIndex=state.meterChainEnabled?0:-1;visualChainBarCount=0;selectedChainIndex=state.meterChainEnabled?0:selectedChainIndex;sessionBaseBpm=state.bpm;tempoDir=state.training.tempoMode==='down'?-1:1;nextNoteTime=audioCtx.currentTime+.06;startTime=audioCtx.currentTime;visualQueue=[];drumVisualQueue=[];elapsed=0;playing=true;currentBeat=-1;currentDrumStep=-1;requestWakeLock();
    const tick=()=>{const ahead=.11;while(nextNoteTime<audioCtx.currentTime+ahead){const m=scheduleStep(nextNoteTime),beatDuration=(60/state.bpm)*(4/m.denominator);nextNoteTime+=beatDuration/state.subdivision;}};tick();scheduler=setInterval(tick,25);renderCore();startVisualLoop();
  }
  function stop(){playing=false;if(scheduler)clearInterval(scheduler);scheduler=null;cancelAnimationFrame(rafId);stepIndex=0;barIndex=0;playbackChainIndex=0;playbackChainBarCount=0;visualChainIndex=-1;visualChainBarCount=0;visualQueue=[];drumVisualQueue=[];currentBeat=-1;currentDrumStep=-1;elapsed=0;releaseWakeLock();renderCore();updateDrumStepVisual();}
  function startVisualLoop(){
    let lastUi=0;const draw=()=>{if(!playing||!audioCtx)return;const now=audioCtx.currentTime;elapsed=now-startTime;let beatChanged=false,chainChanged=false,drumChanged=false;
      while(visualQueue.length&&visualQueue[0].time<=now+.012){const e=visualQueue.shift();currentBeat=e.beat;beatChanged=true;if(state.meterChainEnabled){const mc=e.chainIndex!==visualChainIndex,rc=e.chainBar!==visualChainBarCount;visualChainIndex=e.chainIndex;visualChainBarCount=e.chainBar||0;if(mc){selectedChainIndex=clamp(e.chainIndex,0,state.meterChain.length-1);chainChanged=true;}else if(rc)renderMeterChain();}}
      while(drumVisualQueue.length&&drumVisualQueue[0].time<=now+.012){currentDrumStep=drumVisualQueue.shift().step;drumChanged=true;}
      if(chainChanged)renderCore();else if(beatChanged){updateActiveBeat();renderMeterChain();}if(drumChanged)updateDrumStepVisual();visualQueue=visualQueue.filter(e=>e.time>now-.3);drumVisualQueue=drumVisualQueue.filter(e=>e.time>now-.3);
      if(state.training.timerEnabled&&elapsed>=state.training.timerMinutes*60){notify('연습 시간이 끝났습니다.');stop();return;}if(performance.now()-lastUi>100){updateSessionStatus();lastUi=performance.now();}rafId=requestAnimationFrame(draw);
    };rafId=requestAnimationFrame(draw);
  }
  async function requestWakeLock(){try{if('wakeLock'in navigator)wakeLock=await navigator.wakeLock.request('screen');}catch{}}
  async function releaseWakeLock(){try{await wakeLock?.release();}catch{}wakeLock=null;}

  function savePreset(){const name=$('presetName').value.trim()||`Preset ${presets.length+1}`;presets.unshift({id:uid(),name,...JSON.parse(JSON.stringify(state))});persistPresets();$('presetName').value='';renderPresets();notify('프리셋을 저장했습니다.');}
  function loadPreset(p){if(playing)stop();state=deepMerge(defaults,p);selectedChainIndex=0;selectedGenre=state.groove.genre||'Rock';ensureNormalPattern();if(state.meterChainEnabled)ensureChain();persist();renderAll();switchTab('metronome');notify(`${p.name} 불러오기 완료`);}
  function switchTab(name){$$('.tab-page').forEach(x=>x.classList.remove('active'));$(`tab${name[0].toUpperCase()+name.slice(1)}`).classList.add('active');$$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));if(name==='sound')renderSound();if(name==='groove')renderGroove();if(name==='presets')renderPresets();}
  function resetSettings(){if(playing)stop();state=deepMerge(defaults,{});selectedChainIndex=0;selectedGenre='Rock';persist();renderAll();notify('기본값으로 초기화했습니다.');}

  for(let i=1;i<=16;i++){const o=document.createElement('option');o.value=o.textContent=i;$('beatsPerBar').appendChild(o);}
  $('beatsPerBar').onchange=e=>{if(playing)stop();setSelectedMeterField('beats',Number(e.target.value));renderCore();};
  $('denominator').onchange=e=>{if(playing)stop();setSelectedMeterField('denominator',Number(e.target.value));renderCore();};
  $('subdivision').onchange=e=>{if(playing)stop();state.subdivision=Number(e.target.value);persist();renderCore();};
  $('meterChainToggle').onclick=()=>{if(playing)stop();state.meterChainEnabled=!state.meterChainEnabled;if(state.meterChainEnabled){ensureChain();selectedChainIndex=0;notify('Meter Chain을 켰습니다.');}persist();renderCore();};
  $$('#commonMeterRow [data-meter]').forEach(btn=>btn.onclick=()=>{const[b,d]=btn.dataset.meter.split('/').map(Number);addMeter(b,d);});
  $('chainMoveLeft').onclick=()=>moveSelectedMeter(-1);$('chainMoveRight').onclick=()=>moveSelectedMeter(1);$('chainDuplicate').onclick=duplicateSelectedMeter;$('chainDelete').onclick=deleteSelectedMeter;$('chainRepeatMinus').onclick=()=>changeSelectedRepeat(-1);$('chainRepeatPlus').onclick=()=>changeSelectedRepeat(1);
  $('playButton').onclick=()=>playing?stop():start();
  $('tapTempo').onclick=()=>{const now=performance.now();tapTimes=tapTimes.filter(t=>now-t<2500);tapTimes.push(now);tapTimes=tapTimes.slice(-6);if(tapTimes.length>=2){const ints=tapTimes.slice(1).map((t,i)=>t-tapTimes[i]);setBpm(60000/(ints.reduce((a,b)=>a+b,0)/ints.length));}};
  function startRepeat(dir){setBpm(state.bpm+dir);repeatDelay=setTimeout(()=>{repeatTimer=setInterval(()=>setBpm(state.bpm+dir),70);},420);}function stopRepeat(){clearTimeout(repeatDelay);clearInterval(repeatTimer);}
  $('minusBpm').onpointerdown=()=>startRepeat(-1);$('plusBpm').onpointerdown=()=>startRepeat(1);['pointerup','pointercancel','pointerleave'].forEach(ev=>{$('minusBpm').addEventListener(ev,stopRepeat);$('plusBpm').addEventListener(ev,stopRepeat);});
  $('bpmDrag').onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,bpm:state.bpm};$('bpmDrag').setPointerCapture?.(e.pointerId);};$('bpmDrag').onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=drag.y-e.clientY;setBpm(drag.bpm+Math.round((dx+dy*.65)/6));};$('bpmDrag').onpointerup=$('bpmDrag').onpointercancel=()=>drag=null;$('bpmDrag').onwheel=e=>{e.preventDefault();setBpm(state.bpm+(e.deltaY<0?1:-1));};
  function dialToBpm(e){const r=$('tempoDial').getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let deg=Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI+90;if(deg>180)deg-=360;deg=clamp(deg,-135,135);setBpm(BPM_MIN+(deg+135)/270*(BPM_MAX-BPM_MIN));}
  $('tempoDial').onpointerdown=e=>{dialDragging=true;$('tempoDial').setPointerCapture?.(e.pointerId);dialToBpm(e);};$('tempoDial').onpointermove=e=>{if(dialDragging)dialToBpm(e);};$('tempoDial').onpointerup=$('tempoDial').onpointercancel=()=>dialDragging=false;
  $('trainingToggle').onclick=()=>{trainingExpanded=!trainingExpanded;renderTraining();};$$('[data-toggle]').forEach(btn=>btn.onclick=()=>setTraining(btn.dataset.toggle,!state.training[btn.dataset.toggle]));$('randomMute').oninput=e=>setTraining('randomMute',Number(e.target.value));$('gradualTarget').oninput=e=>setTraining('gradualTarget',Number(e.target.value));$('volume').oninput=e=>{state.volume=Number(e.target.value)/100;persist();renderSound();};
  $$('.stepper').forEach(s=>s.querySelectorAll('[data-step]').forEach(btn=>btn.onclick=()=>{const k=s.dataset.stepper,delta=Number(btn.dataset.step),bounds={soundBars:[1,16],muteBars:[1,16],tempoStep:[1,20],everyBars:[1,16],targetBpm:[30,300]}[k];setTraining(k,clamp(state.training[k]+delta,bounds[0],bounds[1]));}));
  $$('#tempoMode button').forEach(b=>b.onclick=()=>setTraining('tempoMode',b.dataset.mode));$$('#gradualSeconds button').forEach(b=>b.onclick=()=>setTraining('gradualSeconds',Number(b.dataset.sec)));$$('#timerMinutes button').forEach(b=>b.onclick=()=>setTraining('timerMinutes',Number(b.dataset.min)));

  $$('#playbackMode button').forEach(b=>b.onclick=()=>{state.playbackMode=b.dataset.playback;persist();renderGroove();renderCore();});
  $('drumKit').onchange=e=>{state.groove.kit=e.target.value;state.groove.selectedName='Custom';persist();renderGroove();};
  $('drumVolume').oninput=e=>{state.groove.volume=Number(e.target.value)/100;persist();renderGroove();};
  $('swingAmount').oninput=e=>{state.groove.swing=Number(e.target.value);state.groove.selectedName='Custom';persist();renderGroove();};
  $('humanizeAmount').oninput=e=>{state.groove.humanize=Number(e.target.value);persist();renderGroove();};
  $('drumDropout').oninput=e=>{state.groove.dropout=Number(e.target.value);persist();renderGroove();};
  $('clearDrums').onclick=()=>{DRUM_INSTRUMENTS.forEach(([k])=>state.groove.instruments[k].pattern=empty16());state.groove.selectedName='Custom';persist();renderGroove();notify('드럼 패턴을 비웠습니다.');};

  $$('.bottom-nav button').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));$('savePreset').onclick=savePreset;$('openSettings').onclick=()=>$('settingsModal').classList.remove('hidden');$('closeSettings').onclick=()=>$('settingsModal').classList.add('hidden');$('settingsModal').onclick=e=>{if(e.target===$('settingsModal'))$('settingsModal').classList.add('hidden');};$('resetSettings').onclick=resetSettings;
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&playing)requestWakeLock();});window.addEventListener('beforeunload',()=>{if(scheduler)clearInterval(scheduler);if(audioCtx)audioCtx.close();});

  ensureNormalPattern();if(state.meterChainEnabled)ensureChain();renderAll();
})();
