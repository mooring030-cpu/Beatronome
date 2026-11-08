(() => {
  'use strict';

  const BPM_MIN = 30;
  const BPM_MAX = 300;
  const SETTINGS_KEY = 'beatronome-settings-v3';
  const OLD_SETTINGS_KEYS = ['beatronome-settings-v2', 'beatronome-settings-v1'];
  const PRESETS_KEY = 'beatronome-presets-v3';
  const OLD_PRESETS_KEYS = ['beatronome-presets-v2', 'beatronome-presets-v1'];
  const CLOUD_META_KEY = 'beatronome-cloud-v1';

  const SOUND_LABELS = {
    basic: 'Basic · Sample', classic: 'Classic Click', wood: 'Wood Block', digital: 'Digital', clave: 'Clave',
    cowbell: 'Cowbell', rim: 'Rim', beep: 'Beep'
  };

  const SUBDIVISIONS = {
    1:{count:1,mask:[1],bank:1,label:'Quarter'},
    2:{count:2,mask:[1,1],bank:2,label:'8th'},
    3:{count:3,mask:[1,1,1],bank:3,label:'Triplet'},
    5:{count:3,mask:[1,0,1],bank:4,label:'Triplet 1·3'},
    4:{count:4,mask:[1,1,1,1],bank:5,label:'16th'},
    6:{count:4,mask:[1,0,0,1],bank:6,label:'16th 1·4'}
  };

  const TUNER_INSTRUMENTS = {
    electric:'일렉기타 · 6현', acoustic:'어쿠스틱기타 · 6현', bass4:'베이스 · 4현',
    bass5:'베이스 · 5현', bass6:'베이스 · 6현', chromatic:'Chromatic'
  };
  const TUNINGS = {
    electric:[
      ['standard','Standard',[40,45,50,55,59,64]],['half','½ Step Down',[39,44,49,54,58,63]],['whole','Whole Step Down',[38,43,48,53,57,62]],
      ['dropd','Drop D',[38,45,50,55,59,64]],['dropcs','Drop C#',[37,44,49,54,58,63]],['dropc','Drop C',[36,43,48,53,57,62]],['dropb','Drop B',[35,42,47,52,56,61]],
      ['dstd','D Standard',[38,43,48,53,57,62]],['csstd','C# Standard',[37,42,47,52,56,61]],['cstd','C Standard',[36,41,46,51,55,60]],
      ['openg','Open G',[38,43,50,55,59,62]],['opend','Open D',[38,45,50,54,57,62]],['opene','Open E',[40,47,52,56,59,64]],['dadgad','DADGAD',[38,45,50,55,57,62]]
    ],
    acoustic:[
      ['standard','Standard',[40,45,50,55,59,64]],['half','½ Step Down',[39,44,49,54,58,63]],['whole','Whole Step Down',[38,43,48,53,57,62]],
      ['dropd','Drop D',[38,45,50,55,59,64]],['dropc','Drop C',[36,43,48,53,57,62]],['dstd','D Standard',[38,43,48,53,57,62]],
      ['openg','Open G',[38,43,50,55,59,62]],['opend','Open D',[38,45,50,54,57,62]],['opene','Open E',[40,47,52,56,59,64]],['openc','Open C',[36,43,48,55,60,64]],['dadgad','DADGAD',[38,45,50,55,57,62]]
    ],
    bass4:[
      ['standard','Standard',[28,33,38,43]],['half','½ Step Down',[27,32,37,42]],['dstd','D Standard',[26,31,36,41]],['dropd','Drop D',[26,33,38,43]],['dropc','Drop C',[24,31,36,41]],['bead','BEAD',[23,28,33,38]]
    ],
    bass5:[
      ['standard','Standard B-E-A-D-G',[23,28,33,38,43]],['highc','High C E-A-D-G-C',[28,33,38,43,48]],['half','½ Step Down',[22,27,32,37,42]],['dropa','Drop A',[21,28,33,38,43]]
    ],
    bass6:[
      ['standard','Standard B-E-A-D-G-C',[23,28,33,38,43,48]],['half','½ Step Down',[22,27,32,37,42,47]],['dropa','Drop A',[21,28,33,38,43,48]],['lowfs','Low F# F#-B-E-A-D-G',[18,23,28,33,38,43]]
    ]
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
    bpm:120, beatsPerBar:4, denominator:4, subdivision:1, sound:'classic', volume:.82, outputBoost:1,
    pattern:makePattern(4), meterChainEnabled:false, meterChain:[],
    playbackMode:'both',
    groove:{
      genre:'Rock', genreEnabled:true, selectedName:'Basic Rock', kit:'studio', volume:.82, swing:0, humanize:0, dropout:0,
      instruments: makeDefaultDrums()
    },
    tuner:{instrument:'electric',tuning:'standard',referenceA:440,custom:{}},
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
    const merged={...base,...(obj||{}),training:{...base.training,...(obj?.training||{})},groove:{...base.groove,...(obj?.groove||{})},tuner:{...base.tuner,...(obj?.tuner||{}),custom:{...base.tuner.custom,...(obj?.tuner?.custom||{})}}};
    merged.beatsPerBar=clamp(Number(merged.beatsPerBar)||4,1,16);
    merged.denominator=[2,4,8,16].includes(Number(merged.denominator))?Number(merged.denominator):4;
    merged.pattern=normalizePattern(obj?.pattern||base.pattern,merged.beatsPerBar);
    merged.meterChain=Array.isArray(obj?.meterChain)?obj.meterChain.map(normalizeMeter):[];
    merged.meterChainEnabled=!!obj?.meterChainEnabled;
    if(merged.meterChainEnabled&&!merged.meterChain.length) merged.meterChain=[normalizeMeter({beats:merged.beatsPerBar,denominator:merged.denominator,pattern:merged.pattern})];
    merged.playbackMode=['metro','drum','both'].includes(merged.playbackMode)?merged.playbackMode:'both';
    merged.outputBoost=clamp(Number(merged.outputBoost ?? 1),.5,4);
    merged.groove.genreEnabled=merged.groove.genreEnabled!==false;
    if(!merged.groove.genreEnabled) merged.playbackMode='metro';
    merged.groove.volume=clamp(Number(merged.groove.volume ?? .82),0,1);
    merged.groove.swing=clamp(Number(merged.groove.swing)||0,0,75);
    merged.groove.humanize=clamp(Number(merged.groove.humanize)||0,0,100);
    merged.groove.dropout=clamp(Number(merged.groove.dropout)||0,0,80);
    merged.groove.kit=DRUM_KITS[merged.groove.kit]?merged.groove.kit:'studio';
    merged.subdivision=SUBDIVISIONS[Number(merged.subdivision)]?Number(merged.subdivision):1;
    merged.tuner.instrument=TUNER_INSTRUMENTS[merged.tuner.instrument]?merged.tuner.instrument:'electric';
    merged.tuner.referenceA=clamp(Number(merged.tuner.referenceA)||440,430,450);
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

  let cloudMeta=load(CLOUD_META_KEY,{session:null,lastSyncedAt:0,lastRemoteUpdatedAt:0,localChangedAt:0,dirty:false,autoSync:true});
  let cloudSyncTimer=null,cloudBusy=false,cloudApplyingRemote=false,cloudLastError='';

  let playing=false,currentBeat=-1,currentDrumStep=-1,elapsed=0,trainingExpanded=true,selectedChainIndex=0;
  let playbackChainIndex=0,playbackChainBarCount=0,visualChainIndex=-1,visualChainBarCount=0;
  let audioCtx=null,master=null,limiter=null,noiseCache=null,scheduler=null,nextNoteTime=0,stepIndex=0,barIndex=0,startTime=0,sessionBaseBpm=state.bpm,tempoDir=1;
  let wakeLock=null,visualQueue=[],drumVisualQueue=[],rafId=null,tapTimes=[],toastTimer=null,drag=null,dialDragging=false,repeatDelay=null,repeatTimer=null;
  let selectedGenre=state.groove.genre||'Rock';
  let basicBuffers={},basicLoading=null,miniMuted=false;
  let tunerStream=null,tunerSource=null,tunerAnalyser=null,tunerRaf=null,tunerActiveString=-1;

  function persist(){localStorage.setItem(SETTINGS_KEY,JSON.stringify(state));if(!cloudApplyingRemote)cloudMarkLocalChange();}
  function persistPresets(){localStorage.setItem(PRESETS_KEY,JSON.stringify(presets));if(!cloudApplyingRemote)cloudMarkLocalChange();}
  function persistCloudMeta(){localStorage.setItem(CLOUD_META_KEY,JSON.stringify(cloudMeta));}
  function cloudConfig(){const c=window.BEATRONOME_SUPABASE||{};return{url:String(c.url||'').replace(/\/$/,''),key:String(c.anonKey||'')}}
  function cloudConfigured(){const c=cloudConfig();return /^https:\/\//.test(c.url)&&!!c.key;}
  function cloudSessionValid(){return !!cloudMeta.session?.access_token&&!!cloudMeta.session?.user?.id;}
  function cloudMarkLocalChange(){cloudMeta.localChangedAt=Date.now();cloudMeta.dirty=true;persistCloudMeta();renderCloudUi();if(cloudMeta.autoSync)scheduleCloudSync();}
  function scheduleCloudSync(delay=1600){clearTimeout(cloudSyncTimer);if(!cloudSessionValid()||!navigator.onLine||!cloudMeta.autoSync)return;cloudSyncTimer=setTimeout(()=>syncCloud(false).catch(()=>{}),delay);}
  function cloudSetSession(session){if(session?.access_token){const expiresIn=Number(session.expires_in)||3600;cloudMeta.session={access_token:session.access_token,refresh_token:session.refresh_token||cloudMeta.session?.refresh_token||'',expires_at:Date.now()+expiresIn*1000,user:session.user||cloudMeta.session?.user||null};}else cloudMeta.session=null;persistCloudMeta();renderCloudUi();}
  async function cloudRaw(path,{method='GET',body,token,headers={}}={}){const c=cloudConfig();const res=await fetch(c.url+path,{method,headers:{apikey:c.key,'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{}) ,...headers},body:body===undefined?undefined:JSON.stringify(body)});let data=null;const text=await res.text();if(text){try{data=JSON.parse(text)}catch{data=text}}if(!res.ok){const err=new Error(data?.msg||data?.message||data?.error_description||data?.hint||`Cloud error ${res.status}`);err.status=res.status;err.data=data;throw err;}return data;}
  async function refreshCloudSession(){const rt=cloudMeta.session?.refresh_token;if(!rt)return false;try{const data=await cloudRaw('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:rt}});cloudSetSession(data);return true;}catch(e){cloudSetSession(null);cloudLastError='세션이 만료되었습니다. 다시 로그인해주세요.';return false;}}
  async function ensureCloudSession(){if(!cloudSessionValid())return false;if((cloudMeta.session.expires_at||0)>Date.now()+60000)return true;return refreshCloudSession();}
  async function cloudApi(path,opts={}){if(!await ensureCloudSession())throw new Error('로그인이 필요합니다.');try{return await cloudRaw(path,{...opts,token:cloudMeta.session.access_token});}catch(e){if(e.status===401&&await refreshCloudSession())return cloudRaw(path,{...opts,token:cloudMeta.session.access_token});throw e;}}
  function cloudFriendlyError(e){const txt=String(e?.message||'동기화 오류');if(e?.status===404||/relation|schema cache|beatronome_sync|PGRST205/i.test(JSON.stringify(e?.data||{})+txt))return 'SETUP_REQUIRED';if(/Invalid login credentials/i.test(txt))return '이메일 또는 비밀번호를 확인해주세요.';if(/Email not confirmed/i.test(txt))return '이메일 인증 후 로그인해주세요.';if(/already registered/i.test(txt))return '이미 가입된 이메일입니다. 로그인해주세요.';return txt;}
  async function cloudSignIn(){if(!cloudConfigured()){notify('Cloud 설정이 없습니다.');return;}const email=$('cloudEmail').value.trim(),password=$('cloudPassword').value;if(!email||!password){notify('이메일과 비밀번호를 입력해주세요.');return;}cloudBusy=true;renderCloudUi();try{const data=await cloudRaw('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});cloudSetSession(data);cloudMeta.lastSyncedAt=0;cloudMeta.lastRemoteUpdatedAt=0;persistCloudMeta();cloudBusy=false;await syncCloud(true);notify(cloudLastError==='SETUP_REQUIRED'?'로그인됨 · Cloud 테이블 설정이 필요합니다.':'Cloud Sync에 로그인했습니다.');}catch(e){cloudLastError=cloudFriendlyError(e);notify(cloudLastError==='SETUP_REQUIRED'?'Cloud 테이블 설정이 필요합니다.':cloudLastError);}finally{cloudBusy=false;renderCloudUi();}}
  async function cloudSignUp(){if(!cloudConfigured()){notify('Cloud 설정이 없습니다.');return;}const email=$('cloudEmail').value.trim(),password=$('cloudPassword').value;if(!email||password.length<6){notify('이메일과 6자 이상 비밀번호를 입력해주세요.');return;}cloudBusy=true;renderCloudUi();try{const data=await cloudRaw('/auth/v1/signup',{method:'POST',body:{email,password}});if(data?.access_token){cloudSetSession(data);cloudMeta.lastSyncedAt=0;cloudMeta.lastRemoteUpdatedAt=0;persistCloudMeta();cloudBusy=false;await syncCloud(true);notify(cloudLastError==='SETUP_REQUIRED'?'가입됨 · Cloud 테이블 설정이 필요합니다.':'회원가입 및 로그인이 완료되었습니다.');}else notify('가입되었습니다. 이메일 인증 후 로그인해주세요.');}catch(e){cloudLastError=cloudFriendlyError(e);notify(cloudLastError);}finally{cloudBusy=false;renderCloudUi();}}
  async function cloudLogout(){clearTimeout(cloudSyncTimer);try{if(cloudSessionValid()&&navigator.onLine)await cloudApi('/auth/v1/logout',{method:'POST'});}catch{}cloudSetSession(null);cloudMeta.lastSyncedAt=0;cloudMeta.lastRemoteUpdatedAt=0;cloudMeta.dirty=false;persistCloudMeta();cloudLastError='';renderCloudUi();notify('로그아웃했습니다. 로컬 설정은 그대로 유지됩니다.');}
  async function cloudFetchRemote(){const uid=cloudMeta.session.user.id;const q=`/rest/v1/beatronome_sync?user_id=eq.${encodeURIComponent(uid)}&select=user_id,settings,presets,updated_at&limit=1`;const rows=await cloudApi(q);return Array.isArray(rows)&&rows.length?rows[0]:null;}
  async function cloudUploadLocal(){const uid=cloudMeta.session.user.id;const rows=await cloudApi('/rest/v1/beatronome_sync?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:{user_id:uid,settings:state,presets}});return Array.isArray(rows)?rows[0]:rows;}
  function applyCloudRemote(remote){cloudApplyingRemote=true;state=deepMerge(defaults,remote?.settings||{});presets=Array.isArray(remote?.presets)?remote.presets:[];localStorage.setItem(SETTINGS_KEY,JSON.stringify(state));localStorage.setItem(PRESETS_KEY,JSON.stringify(presets));cloudApplyingRemote=false;selectedChainIndex=0;selectedGenre=state.groove.genre||'Rock';ensureNormalPattern();if(state.meterChainEnabled)ensureChain();renderAll();}
  async function syncCloud(initial=false){if(cloudBusy||!cloudSessionValid())return;if(!navigator.onLine){cloudLastError='오프라인 · 변경사항은 기기에 저장됨';renderCloudUi();return;}cloudBusy=true;cloudLastError='';renderCloudUi();try{let remote=await cloudFetchRemote();if(!remote){remote=await cloudUploadLocal();cloudMeta.dirty=false;}else{const remoteTime=Date.parse(remote.updated_at)||0;const firstSync=!cloudMeta.lastSyncedAt;const remoteChanged=remoteTime>(cloudMeta.lastRemoteUpdatedAt||0);if(firstSync){applyCloudRemote(remote);cloudMeta.dirty=false;}else if(cloudMeta.dirty){if(remoteChanged&&cloudMeta.localChangedAt<remoteTime){applyCloudRemote(remote);cloudMeta.dirty=false;notify('다른 기기의 최신 설정을 불러왔습니다.');}else{remote=await cloudUploadLocal();cloudMeta.dirty=false;}}else if(remoteChanged){applyCloudRemote(remote);}}
      const remoteTime=Date.parse(remote?.updated_at)||Date.now();cloudMeta.lastSyncedAt=Date.now();cloudMeta.lastRemoteUpdatedAt=remoteTime;persistCloudMeta();renderPresets();if(!initial)notify('클라우드 동기화 완료');
    }catch(e){const msg=cloudFriendlyError(e);cloudLastError=msg;console.warn('Beatronome cloud sync failed',e);if(msg==='SETUP_REQUIRED'){}else if(!initial)notify(msg);}finally{cloudBusy=false;renderCloudUi();}}
  function renderCloudUi(){if(!$('cloudStatusText'))return;const signed=cloudSessionValid(),out=$('cloudSignedOut'),inn=$('cloudSignedIn'),status=$('cloudStatusText'),last=$('cloudLastSync'),badge=$('cloudStateBadge'),hint=$('cloudSetupHint');out.classList.toggle('hidden',signed);inn.classList.toggle('hidden',!signed);hint.classList.toggle('hidden',cloudLastError!=='SETUP_REQUIRED');if(!cloudConfigured()){status.textContent='Cloud 프로젝트 설정이 필요합니다.';last.textContent='cloud-config.js를 확인하세요.';return;}if(!signed){status.textContent='로그인하면 폰·Mac·태블릿에서 설정과 프리셋을 동기화합니다.';last.textContent='로그인하지 않아도 로컬/오프라인 사용 가능';return;}$('cloudUserEmail').textContent=cloudMeta.session.user?.email||'Beatronome User';$('cloudAutoSync').checked=cloudMeta.autoSync!==false;let text='모든 설정 동기화 완료',cls='';if(cloudBusy){text='동기화 중…';cls='syncing';}else if(!navigator.onLine){text='오프라인';cls='dirty';}else if(cloudMeta.dirty){text='기기 변경사항 저장됨';cls='dirty';}if(cloudLastError&&cloudLastError!=='SETUP_REQUIRED')text=cloudLastError;status.textContent=text;badge.textContent=cloudBusy?'SYNCING':cloudMeta.dirty?'LOCAL':'SYNCED';badge.className=cls;last.textContent=cloudMeta.lastSyncedAt?`마지막 동기화 ${new Date(cloudMeta.lastSyncedAt).toLocaleString('ko-KR')}`:'아직 동기화되지 않음';}

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

  function updateSessionStatus(){const remain=Math.max(0,state.training.timerMinutes*60-elapsed),txt=playing?(state.training.timerEnabled?`남은 ${fmtTime(remain)}`:`연습 ${fmtTime(elapsed)}`):'READY';$('sessionStatus').textContent=txt;if($('miniTimer'))$('miniTimer').textContent=txt;}
  function updateActiveBeat(){document.querySelectorAll('.beat-dot').forEach((el,i)=>el.classList.toggle('active',playing&&currentBeat===i));}
  function syncMeterControls(){const m=getSelectedMeter();$('beatsPerBar').value=m.beats;$('denominator').value=m.denominator;}

  function renderCore(){
    ensureNormalPattern();if(state.meterChainEnabled)ensureChain();
    const meter=getSelectedMeter();const chainPos=state.meterChainEnabled?` · ${selectedChainIndex+1}/${state.meterChain.length}`:'';
    $('bpmValue').textContent=state.bpm;$('tempoName').textContent=tempoName(state.bpm);$('meterTop').textContent=`${meter.beats}/${meter.denominator}${chainPos}`;$('meterTitle').textContent=`${meter.beats}/${meter.denominator}`;
    $('subdivision').value=state.subdivision;syncMeterControls();
    const subInfo=SUBDIVISIONS[state.subdivision]||SUBDIVISIONS[1],sub=subInfo.label;
    const mode=!state.groove.genreEnabled?'Metronome Only':state.playbackMode==='metro'?'Metro':state.playbackMode==='drum'?'Drum':`Metro + ${state.groove.selectedName||'Drum'}`;
    $('soundSummary').textContent=state.meterChainEnabled?`${mode} · ${sub} · Chain ${state.meterChain.length}`:`${mode} · ${sub}`;
    $('playButton').classList.toggle('playing',playing);$('playIcon').textContent=playing?'Ⅱ':'▶';$('playLabel').textContent=playing?'STOP':'START';
    if($('miniBpm')){$('miniBpm').textContent=state.bpm;$('miniMeter').textContent=`${meter.beats}/${meter.denominator}`;$('miniPlay').classList.toggle('playing',playing);$('miniPlayIcon').textContent=playing?'Ⅱ':'▶';$('miniPlayLabel').textContent=playing?'STOP':'START';$('miniModeText').textContent=!state.groove.genreEnabled?'METRONOME ONLY':state.playbackMode==='metro'?'METRO':state.playbackMode==='drum'?'DRUM':`METRO + ${state.groove.selectedName||'DRUM'}`;$('miniMute').classList.toggle('on',miniMuted);}
    updateSessionStatus();
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
    const g=$('soundGrid');g.innerHTML='';Object.entries(SOUND_LABELS).forEach(([key,label])=>{const b=document.createElement('button');b.dataset.sound=key;b.className=`sound-card card ${state.sound===key?'selected':''}`;b.innerHTML=`<span class="sound-symbol">${key==='basic'?'◉':'♪'}</span><strong>${label}</strong><span>${state.sound===key?'✓ 사용 중':key==='basic'?'녹음 샘플 · 강/약/일반':'미리듣기'}</span>`;b.onclick=async()=>{state.sound=key;persist();renderSound();renderCore();await ensureAudio();if(key==='basic')await loadBasicSamples();synthClick(audioCtx.currentTime+.03,key,true,state.volume,'strong',SUBDIVISIONS[state.subdivision]?.bank||1);};g.appendChild(b);});$('volume').value=Math.round(state.volume*100);$('volumeOut').textContent=`${Math.round(state.volume*100)}%`;setRangeStyle($('volume'),10,100,Math.round(state.volume*100));if($('outputBoost')){$('outputBoost').value=Math.round(state.outputBoost*100);$('outputBoostOut').textContent=`${Math.round(state.outputBoost*100)}%`;setRangeStyle($('outputBoost'),50,400,Math.round(state.outputBoost*100));$$('#boostPresets [data-boost]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.boost)===state.outputBoost));}
  }

  function applyGroovePreset(preset){
    state.groove.genreEnabled=true;state.playbackMode='both';state.bpm=preset.bpm;state.groove.genre=preset.genre;selectedGenre=preset.genre;state.groove.selectedName=preset.name;state.groove.kit=preset.kit;state.groove.swing=preset.swing;
    const base=makeDefaultDrums();DRUM_INSTRUMENTS.forEach(([key])=>{base[key].pattern=steps(...(preset.p[key]||[]));base[key].muted=false;});state.groove.instruments=base;
    persist();renderAll();notify(`${preset.genre} · ${preset.name} 적용`);
  }
  function renderGroove(){
    const enabled=state.groove.genreEnabled!==false;
    const genres=[...new Set(GROOVE_PRESETS.map(p=>p.genre))],chips=$('genreChips');chips.innerHTML='';
    const none=document.createElement('button');none.textContent='없음 · 메트로놈만';none.className=!enabled?'selected genre-none':'';none.onclick=()=>{if(playing)stop();state.groove.genreEnabled=false;state.playbackMode='metro';persist();renderGroove();renderCore();notify('장르 없이 메트로놈만 재생합니다.');};chips.appendChild(none);
    genres.forEach(g=>{const b=document.createElement('button');b.textContent=g;b.className=enabled&&g===selectedGenre?'selected':'';b.onclick=()=>{state.groove.genreEnabled=true;selectedGenre=g;state.groove.genre=g;persist();renderGroove();renderCore();};chips.appendChild(b);});
    const grid=$('groovePresetGrid');grid.innerHTML='';
    if(!enabled){grid.innerHTML='<div class="genre-off-card"><strong>PURE METRONOME</strong><span>장르·드럼 패턴을 사용하지 않고 클릭 메트로놈만 재생합니다.<br>기존 Groove 설정은 그대로 보관됩니다.</span></div>';}
    else GROOVE_PRESETS.filter(p=>p.genre===selectedGenre).forEach(p=>{const b=document.createElement('button');b.className=`groove-preset-card${state.groove.selectedName===p.name&&state.groove.genre===p.genre?' selected':''}`;b.innerHTML=`<strong>${p.name}</strong><span>${p.bpm} BPM · ${DRUM_KITS[p.kit]}${p.swing?` · Swing ${p.swing}`:''}</span>`;b.onclick=()=>applyGroovePreset(p);grid.appendChild(b);});
    $$('#playbackMode button').forEach(b=>{const isMetro=b.dataset.playback==='metro';b.disabled=!enabled&&!isMetro;b.classList.toggle('selected',b.dataset.playback===state.playbackMode);});
    $('grooveStatusBadge').textContent=!enabled?'METRO ONLY':state.playbackMode.toUpperCase();$('selectedGrooveName').textContent=!enabled?'장르 없음 · 메트로놈만':`${state.groove.genre} · ${state.groove.selectedName||'Custom'}`;
    $('grooveControlsCard')?.classList.toggle('hidden',!enabled);$('sequencerCard')?.classList.toggle('hidden',!enabled);
    const kit=$('drumKit');if(!kit.options.length)Object.entries(DRUM_KITS).forEach(([k,v])=>{const o=document.createElement('option');o.value=k;o.textContent=v;kit.appendChild(o);});kit.value=state.groove.kit;
    const controls=[['drumVolume',0,100,Math.round(state.groove.volume*100),'drumVolumeOut','%'],['swingAmount',0,75,state.groove.swing,'swingAmountOut','%'],['humanizeAmount',0,100,state.groove.humanize,'humanizeAmountOut','%'],['drumDropout',0,80,state.groove.dropout,'drumDropoutOut','%']];controls.forEach(([id,min,max,val,out,sfx])=>{$(id).value=val;$(out).textContent=`${val}${sfx}`;setRangeStyle($(id),min,max,val);});
    if(enabled)renderSequencer();
  }
  function renderSequencer(){
    const wrap=$('sequencer');wrap.innerHTML='';
    const header=document.createElement('div');header.className='seq-header-row';header.innerHTML='<div class="seq-spacer">INSTRUMENT</div><div class="seq-grid seq-numbers">'+Array.from({length:16},(_,i)=>`<span class="${[0,4,8,12].includes(i)?'downbeat':''}">${i+1}</span>`).join('')+'</div>';wrap.appendChild(header);
    DRUM_INSTRUMENTS.forEach(([key,label])=>{const inst=state.groove.instruments[key];const row=document.createElement('div');row.className='seq-row';const controls=document.createElement('div');controls.className='seq-inst-controls';controls.innerHTML=`<strong>${label}</strong><div class="seq-inst-tools"><button class="seq-mute ${inst.muted?'on':''}" title="Mute">M</button><input class="seq-vol" type="range" min="0" max="100" step="5" value="${Math.round(inst.volume*100)}" title="Volume"><span>${Math.round(inst.volume*100)}</span></div>`;controls.querySelector('.seq-mute').onclick=()=>{inst.muted=!inst.muted;persist();renderSequencer();};const vol=controls.querySelector('.seq-vol');vol.oninput=e=>{inst.volume=Number(e.target.value)/100;controls.querySelector('.seq-inst-tools span').textContent=e.target.value;persist();};
      const sg=document.createElement('div');sg.className='seq-grid';inst.pattern.forEach((on,i)=>{const b=document.createElement('button');b.className=`seq-step${on?' on':''}${[0,4,8,12].includes(i)?' downbeat':''}${currentDrumStep===i&&playing?' current':''}`;b.dataset.step=i;b.dataset.instrument=key;b.onclick=()=>{inst.pattern[i]=inst.pattern[i]?0:1;state.groove.selectedName='Custom';persist();b.classList.toggle('on',!!inst.pattern[i]);$('selectedGrooveName').textContent=`${state.groove.genre} · Custom`;};sg.appendChild(b);});row.append(controls,sg);wrap.appendChild(row);});
  }
  function updateDrumStepVisual(){document.querySelectorAll('.seq-step').forEach(el=>el.classList.toggle('current',playing&&Number(el.dataset.step)===currentDrumStep));}

  const NOTE_NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  function noteName(midi){midi=Math.round(midi);return `${NOTE_NAMES[(midi%12+12)%12]}${Math.floor(midi/12)-1}`;}
  function midiFreq(midi,a4=440){return a4*Math.pow(2,(midi-69)/12);}
  function getInstrumentTunings(inst=state.tuner.instrument){return TUNINGS[inst]||[];}
  function ensureTunerSelection(){
    const inst=state.tuner.instrument;if(inst==='chromatic')return;
    const list=getInstrumentTunings(inst),valid=list.some(x=>x[0]===state.tuner.tuning)||state.tuner.tuning==='custom';
    if(!valid)state.tuner.tuning=list[0]?.[0]||'standard';
    if(!state.tuner.custom[inst])state.tuner.custom[inst]=(list[0]?.[2]||[]).slice();
  }
  function currentTuningNotes(){
    ensureTunerSelection();if(state.tuner.instrument==='chromatic')return[];
    if(state.tuner.tuning==='custom')return state.tuner.custom[state.tuner.instrument]||[];
    return (getInstrumentTunings().find(x=>x[0]===state.tuner.tuning)?.[2]||[]).slice();
  }
  function currentTuningName(){if(state.tuner.instrument==='chromatic')return'Chromatic';if(state.tuner.tuning==='custom')return'Custom';return getInstrumentTunings().find(x=>x[0]===state.tuner.tuning)?.[1]||'Standard';}
  function renderTuner(){
    if(!$('tunerInstrument'))return;ensureTunerSelection();$('tunerInstrument').value=state.tuner.instrument;$('tunerAValue').textContent=`${state.tuner.referenceA} Hz`;
    const wrap=$('tuningSelectWrap'),sel=$('tunerTuning');wrap.classList.toggle('hidden',state.tuner.instrument==='chromatic');sel.innerHTML='';
    if(state.tuner.instrument!=='chromatic'){
      getInstrumentTunings().forEach(([id,name])=>{const o=document.createElement('option');o.value=id;o.textContent=name;sel.appendChild(o);});const c=document.createElement('option');c.value='custom';c.textContent='Custom';sel.appendChild(c);sel.value=state.tuner.tuning;
    }
    $('tuningTitle').textContent=currentTuningName();const notes=currentTuningNotes(),grid=$('tunerStrings');grid.innerHTML='';
    if(state.tuner.instrument==='chromatic'){grid.innerHTML='<div class="empty-state" style="grid-column:1/-1;padding:28px 18px"><strong>Chromatic Mode</strong><span>특정 줄에 제한하지 않고 가장 가까운 반음으로 튜닝합니다.</span></div>';}else{
      const total=notes.length;notes.forEach((m,i)=>{const b=document.createElement('button');b.className=`tuner-string${i===tunerActiveString?' active':''}`;b.innerHTML=`<em>${total-i}현</em><strong>${noteName(m)}</strong><span>${midiFreq(m,state.tuner.referenceA).toFixed(1)} Hz</span>`;b.onclick=()=>playReferenceTone(m,i);grid.appendChild(b);});
    }
    $('customTuningCard').classList.toggle('hidden',state.tuner.instrument==='chromatic'||state.tuner.tuning!=='custom');const custom=$('customTuningList');custom.innerHTML='';
    if(state.tuner.instrument!=='chromatic'&&state.tuner.tuning==='custom')notes.forEach((m,i)=>{const row=document.createElement('div');row.className='custom-tune-row';row.innerHTML=`<span>${notes.length-i}현</span><div class="custom-tune-step"><button data-d="-1">−</button><strong>${noteName(m)}</strong><button data-d="1">＋</button></div>`;row.querySelectorAll('button').forEach(b=>b.onclick=()=>{state.tuner.custom[state.tuner.instrument][i]=clamp(m+Number(b.dataset.d),12,84);persist();renderTuner();});custom.appendChild(row);});
  }
  async function playReferenceTone(midi,index=-1){await ensureAudio();const when=audioCtx.currentTime+.02,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=midiFreq(midi,state.tuner.referenceA);g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(.28,when+.02);g.gain.exponentialRampToValueAtTime(.0001,when+1.25);o.connect(g).connect(master);o.start(when);o.stop(when+1.3);tunerActiveString=index;renderTuner();setTimeout(()=>{if(!tunerStream){tunerActiveString=-1;renderTuner();}},850);}
  function detectPitch(buffer,sampleRate){
    let rms=0;for(let i=0;i<buffer.length;i++)rms+=buffer[i]*buffer[i];rms=Math.sqrt(rms/buffer.length);if(rms<.008)return null;
    const ds=2,n=Math.floor(buffer.length/ds),x=new Float32Array(n);for(let i=0;i<n;i++)x[i]=buffer[i*ds];const sr=sampleRate/ds;
    const minLag=Math.max(2,Math.floor(sr/1200)),maxLag=Math.min(n-2,Math.floor(sr/20)),limit=Math.min(n-maxLag,1800);if(limit<128)return null;
    const diff=new Float32Array(maxLag+1),cmnd=new Float32Array(maxLag+1);let running=0,best=-1;
    for(let tau=1;tau<=maxLag;tau++){let d=0;for(let i=0;i<limit;i++){const v=x[i]-x[i+tau];d+=v*v;}diff[tau]=d;running+=d;cmnd[tau]=running?d*tau/running:1;}
    const threshold=.16;for(let tau=minLag;tau<maxLag-1;tau++){if(cmnd[tau]<threshold){while(tau+1<maxLag&&cmnd[tau+1]<cmnd[tau])tau++;best=tau;break;}}
    if(best<0){let min=1;for(let tau=minLag;tau<=maxLag;tau++)if(cmnd[tau]<min){min=cmnd[tau];best=tau;}if(min>.28)return null;}
    const a=cmnd[Math.max(1,best-1)],b=cmnd[best],c=cmnd[Math.min(maxLag,best+1)],den=(a-2*b+c);const shift=Math.abs(den)>1e-6?.5*(a-c)/den:0;const lag=best+clamp(shift,-1,1),freq=sr/lag;return freq>=20&&freq<=1200?freq:null;
  }
  function nearestTunerTarget(freq){
    const ref=state.tuner.referenceA;if(state.tuner.instrument==='chromatic'){const midi=Math.round(69+12*Math.log2(freq/ref));return{midi,index:-1,freq:midiFreq(midi,ref)};}
    const notes=currentTuningNotes();let best={midi:notes[0],index:0,d:Infinity,freq:midiFreq(notes[0],ref)};notes.forEach((m,i)=>{const f=midiFreq(m,ref),d=Math.abs(1200*Math.log2(freq/f));if(d<best.d)best={midi:m,index:i,d,freq:f};});return best;
  }
  function updateTunerDisplay(freq){
    if(!freq){$('tunerFreq').textContent='0.0';$('tunerTargetText').textContent='소리를 기다리는 중';return;}const target=nearestTunerTarget(freq),cents=clamp(1200*Math.log2(freq/target.freq),-99,99),display=noteName(target.midi);tunerActiveString=target.index;
    $('tunerNote').textContent=display;$('tunerFreq').textContent=freq.toFixed(1);$('tunerCents').textContent=`${cents>=0?'+':''}${cents.toFixed(1)} cents`;$('tunerNeedle').style.left=`${clamp(50+cents,0,100)}%`;$('tunerNeedle').classList.toggle('in-tune',Math.abs(cents)<=5);$('tunerTargetText').textContent=state.tuner.instrument==='chromatic'?`가장 가까운 음 ${display}`:`${TUNER_INSTRUMENTS[state.tuner.instrument]} · ${currentTuningName()}`;renderTunerStringsOnly();
  }
  function renderTunerStringsOnly(){if(state.tuner.instrument==='chromatic')return;$$('#tunerStrings .tuner-string').forEach((b,i)=>b.classList.toggle('active',i===tunerActiveString));}
  async function startTunerMic(){
    if(tunerStream)return;if(playing)stop();if(!navigator.mediaDevices?.getUserMedia){notify('이 브라우저는 마이크 튜너를 지원하지 않습니다.');return;}try{await ensureAudio();configureIOSAudioSession('play-and-record');tunerStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});tunerSource=audioCtx.createMediaStreamSource(tunerStream);tunerAnalyser=audioCtx.createAnalyser();tunerAnalyser.fftSize=8192;tunerAnalyser.smoothingTimeConstant=.1;tunerSource.connect(tunerAnalyser);$('tunerMicState').textContent='MIC ON';$('tunerMicState').classList.add('on');$('toggleTunerMic').textContent='튜너 정지';$('toggleTunerMic').classList.add('on');const buf=new Float32Array(tunerAnalyser.fftSize);let last=0;const loop=ts=>{if(!tunerStream)return;if(ts-last>85){tunerAnalyser.getFloatTimeDomainData(buf);updateTunerDisplay(detectPitch(buf,audioCtx.sampleRate));last=ts;}tunerRaf=requestAnimationFrame(loop);};tunerRaf=requestAnimationFrame(loop);}catch(e){console.warn(e);notify('마이크 권한을 허용해주세요.');stopTunerMic();}
  }
  function stopTunerMic(){configureIOSAudioSession('playback');if(tunerRaf)cancelAnimationFrame(tunerRaf);tunerRaf=null;try{tunerSource?.disconnect();}catch{}tunerSource=null;tunerAnalyser=null;if(tunerStream)tunerStream.getTracks().forEach(t=>t.stop());tunerStream=null;tunerActiveString=-1;if($('tunerMicState')){$('tunerMicState').textContent='MIC OFF';$('tunerMicState').classList.remove('on');$('toggleTunerMic').textContent='마이크로 튜닝 시작';$('toggleTunerMic').classList.remove('on');$('tunerTargetText').textContent='목표음을 선택하거나 마이크를 시작하세요';$('tunerNeedle').style.left='50%';$('tunerNeedle').classList.remove('in-tune');$('tunerCents').textContent='0 cents';renderTunerStringsOnly();}}

  function setMiniMode(on){document.body.classList.toggle('mini-mode',!!on);$('settingsModal')?.classList.add('hidden');renderCore();}
  function toggleMiniMute(){miniMuted=!miniMuted;if(master&&audioCtx)master.gain.setTargetAtTime(miniMuted?0:state.outputBoost,audioCtx.currentTime,.015);renderCore();}

  function renderPresets(){
    const list=$('presetList');list.innerHTML='';if(!presets.length){list.innerHTML='<div class="empty-state"><div class="big">☆</div><strong>아직 저장된 프리셋이 없습니다.</strong><span>Meter Chain · Training · Groove 패턴까지 함께 저장됩니다.</span></div>';return;}
    presets.forEach(p=>{const n=deepMerge(defaults,p),a=document.createElement('article');a.className='preset-card card';const detail=n.meterChainEnabled&&n.meterChain.length?n.meterChain.slice(0,4).map(m=>`${m.beats}/${m.denominator}${m.repeatBars>1?`×${m.repeatBars}`:''}`).join(' → ')+(n.meterChain.length>4?' → …':''):`${n.beatsPerBar}/${n.denominator}`;const grooveText=n.groove.genreEnabled===false?'Metronome Only':`${n.groove.genre}/${n.groove.selectedName||'Custom'} · ${n.playbackMode.toUpperCase()}`;a.innerHTML=`<button class="preset-main"><div class="preset-bpm">${n.bpm}<small>BPM</small></div><div class="preset-copy"><strong>${escapeHtml(p.name)}${cloudSessionValid()?'<i class="preset-cloud">☁</i>':''}</strong><span>${detail} · ${grooveText}</span></div></button><button class="danger-icon">×</button>`;a.querySelector('.preset-main').onclick=()=>loadPreset(p);a.querySelector('.danger-icon').onclick=()=>{presets=presets.filter(x=>x.id!==p.id);persistPresets();renderPresets();};list.appendChild(a);});
  }
  function renderAll(){renderCore();renderTraining();renderSound();renderGroove();renderTuner();renderPresets();}

  function configureIOSAudioSession(mode='playback',forceCycle=false){
    try{
      const session=navigator.audioSession;
      if(!session)return;
      if(forceCycle&&mode==='playback'){
        try{session.type='ambient';}catch{}
        setTimeout(()=>{try{session.type='playback';}catch{}},0);
      }else session.type=mode;
    }catch{}
  }
  function applyOutputBoost(){if(master&&audioCtx)master.gain.setTargetAtTime(miniMuted?0:state.outputBoost,audioCtx.currentTime,.012);}
  async function ensureAudio(){
    configureIOSAudioSession('playback');
    if(!audioCtx){
      const Ctx=window.AudioContext||window.webkitAudioContext;audioCtx=new Ctx({latencyHint:'interactive'});
      master=audioCtx.createGain();master.gain.value=miniMuted?0:state.outputBoost;
      limiter=audioCtx.createDynamicsCompressor();
      limiter.threshold.value=-1;limiter.knee.value=3;limiter.ratio.value=8;limiter.attack.value=.001;limiter.release.value=.08;
      master.connect(limiter).connect(audioCtx.destination);
    }
    if(audioCtx.state==='suspended')await audioCtx.resume();
    applyOutputBoost();
    configureIOSAudioSession('playback');
    if(state.sound==='basic')await loadBasicSamples();
  }
  async function loadBasicSamples(){
    if(Object.keys(basicBuffers).length>=18)return basicBuffers;if(basicLoading)return basicLoading;
    basicLoading=(async()=>{const roles=['strong','weak','normal'];for(let bank=1;bank<=6;bank++){for(const role of roles){const key=`${bank}:${role}`;if(basicBuffers[key])continue;const res=await fetch(`./audio/basic/bank${bank}_${role}.wav`,{cache:'force-cache'});if(!res.ok)throw new Error(`Basic sample ${key} load failed`);basicBuffers[key]=await audioCtx.decodeAudioData(await res.arrayBuffer());}}return basicBuffers;})().catch(err=>{console.warn(err);notify('Basic 샘플을 불러오지 못했습니다.');return basicBuffers;}).finally(()=>{basicLoading=null;});
    return basicLoading;
  }
  function noiseBuffer(){if(noiseCache)return noiseCache;const len=Math.max(1,Math.floor(audioCtx.sampleRate*.5)),buf=audioCtx.createBuffer(1,len,audioCtx.sampleRate),data=buf.getChannelData(0);for(let i=0;i<len;i++)data[i]=Math.random()*2-1;noiseCache=buf;return noiseCache;}
  function synthClick(when,sound,accent=false,volume=.8,role=null,bank=1){
    if(!audioCtx||!master)return;
    if(sound==='basic'){const r=role||(accent?'strong':'normal'),buf=basicBuffers[`${bank}:${r}`]||basicBuffers[`1:${r}`];if(buf){const src=audioCtx.createBufferSource(),g=audioCtx.createGain();src.buffer=buf;g.gain.value=Math.max(.001,volume);src.connect(g).connect(master);src.start(when);return;}}
    const out=audioCtx.createGain();out.gain.setValueAtTime(.0001,when);out.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),when+.002);out.gain.exponentialRampToValueAtTime(.0001,when+(sound==='cowbell'?.13:.07));out.connect(master);
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
    const t=state.training,meter=getPlaybackMeter(),subInfo=SUBDIVISIONS[state.subdivision]||SUBDIVISIONS[1],count=subInfo.count,chainIndex=state.meterChainEnabled?playbackChainIndex:-1,chainBar=state.meterChainEnabled?playbackChainBarCount:0,step=stepIndex,beat=Math.floor(step/count),sub=step%count,isMain=sub===0,pat=meter.pattern[beat]||'normal',subAudible=!!subInfo.mask[sub];
    const beatDuration=(60/state.bpm)*(4/meter.denominator);
    if(step===0)scheduleDrumBar(time,beatDuration*meter.beats);
    let audible=pat!=='mute'&&subAudible,trainingMuted=false;if(t.internalEnabled){const cycle=Math.max(1,t.soundBars+t.muteBars),phase=barIndex%cycle;if(phase>=t.soundBars)trainingMuted=true;}
    let mutePct=t.randomMuteEnabled?t.randomMute:0;if(t.gradualEnabled){const sec=Math.max(0,audioCtx.currentTime-startTime),ratio=clamp(sec/Math.max(1,t.gradualSeconds),0,1);mutePct=Math.max(mutePct,t.gradualTarget*ratio);}if(audible&&!trainingMuted&&mutePct>0&&Math.random()*100<mutePct)trainingMuted=true;audible=audible&&!trainingMuted;
    if(audible&&['metro','both'].includes(state.playbackMode)){const role=isMain?(pat==='accent'?'strong':'normal'):'weak';synthClick(time,state.sound,isMain&&pat==='accent',isMain?state.volume:state.volume*.52,role,subInfo.bank);}
    if(isMain)visualQueue.push({time,beat,chainIndex,chainBar});stepIndex++;const perBar=meter.beats*count;
    if(stepIndex>=perBar){stepIndex=0;barIndex++;
      if(state.meterChainEnabled&&state.meterChain.length){playbackChainBarCount++;const repeat=Math.max(1,Number(meter.repeatBars)||1);if(playbackChainBarCount>=repeat){playbackChainBarCount=0;playbackChainIndex=(playbackChainIndex+1)%state.meterChain.length;}}
      if(t.autoTempoEnabled&&barIndex%Math.max(1,t.everyBars)===0){let next=state.bpm;if(t.tempoMode==='down')next=Math.max(t.targetBpm,state.bpm-Math.abs(t.tempoStep));else if(t.tempoMode==='pyramid'){next=state.bpm+t.tempoStep*tempoDir;if(tempoDir>0&&next>=t.targetBpm){next=t.targetBpm;tempoDir=-1;}else if(tempoDir<0&&next<=sessionBaseBpm){next=sessionBaseBpm;tempoDir=1;}}else next=Math.min(t.targetBpm,state.bpm+Math.abs(t.tempoStep));setBpm(next);}
    }
    return meter;
  }

  async function start(){configureIOSAudioSession('playback',true);
    if(tunerStream)stopTunerMic();await ensureAudio();ensureNormalPattern();if(state.meterChainEnabled)ensureChain();stepIndex=0;barIndex=0;playbackChainIndex=0;playbackChainBarCount=0;visualChainIndex=state.meterChainEnabled?0:-1;visualChainBarCount=0;selectedChainIndex=state.meterChainEnabled?0:selectedChainIndex;sessionBaseBpm=state.bpm;tempoDir=state.training.tempoMode==='down'?-1:1;nextNoteTime=audioCtx.currentTime+.06;startTime=audioCtx.currentTime;visualQueue=[];drumVisualQueue=[];elapsed=0;playing=true;currentBeat=-1;currentDrumStep=-1;requestWakeLock();
    const tick=()=>{const ahead=.11;while(nextNoteTime<audioCtx.currentTime+ahead){const m=scheduleStep(nextNoteTime),beatDuration=(60/state.bpm)*(4/m.denominator),subInfo=SUBDIVISIONS[state.subdivision]||SUBDIVISIONS[1];nextNoteTime+=beatDuration/subInfo.count;}};tick();scheduler=setInterval(tick,25);renderCore();startVisualLoop();
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
  function switchTab(name){if(name!=='tuner'&&tunerStream)stopTunerMic();$$('.tab-page').forEach(x=>x.classList.remove('active'));$(`tab${name[0].toUpperCase()+name.slice(1)}`).classList.add('active');$$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));if(name==='sound')renderSound();if(name==='groove')renderGroove();if(name==='tuner')renderTuner();if(name==='presets')renderPresets();}
  const APP_VERSION='0.8.0';
  let swRegistration=null;
  let offlinePreparing=false;
  function networkLabel(){return navigator.onLine?'인터넷 연결됨 · 저장본 우선 실행':'현재 오프라인 · 저장된 앱으로 실행 중';}
  function setOfflineUi(status){
    const title=$('offlineReadyTitle'),text=$('offlineStatusText'),bar=$('offlineProgressBar'),conn=$('offlineConnectionText'),btn=$('prepareOffline');
    if(!title||!text||!bar||!conn||!btn)return;
    conn.textContent=networkLabel();
    if(!('serviceWorker' in navigator)){
      title.textContent='오프라인 사용 미지원';title.className='offline';text.textContent='이 브라우저에서는 Service Worker를 사용할 수 없습니다.';bar.style.width='0%';btn.disabled=true;return;
    }
    if(!status){title.textContent='오프라인 사용 준비';title.className='partial';text.textContent='오프라인 데이터 상태를 확인하는 중입니다.';bar.style.width='0%';return;}
    const pct=status.total?Math.round(status.cached/status.total*100):0;bar.style.width=`${pct}%`;
    if(status.ready){title.textContent='OFFLINE READY ✓';title.className='ready';text.textContent=`앱·아이콘·Basic 음원 ${status.cached}/${status.total}개 저장 완료 · 비행기 모드 사용 가능`;btn.textContent='다시 확인';btn.disabled=false;}
    else{title.textContent=navigator.onLine?'오프라인 준비 필요':'오프라인 데이터 불완전';title.className=navigator.onLine?'partial':'offline';text.textContent=`${status.cached}/${status.total}개 저장됨 · ${status.total-status.cached}개 남음`;btn.textContent=navigator.onLine?'준비하기':'연결 후 준비';btn.disabled=!navigator.onLine;}
  }
  async function swRequest(type){
    if(!('serviceWorker' in navigator))return null;
    try{
      const reg=swRegistration||await navigator.serviceWorker.ready;const target=navigator.serviceWorker.controller||reg.active||reg.waiting;
      if(!target)return null;
      return await new Promise((resolve,reject)=>{const channel=new MessageChannel();const timer=setTimeout(()=>reject(new Error('service worker timeout')),15000);channel.port1.onmessage=e=>{clearTimeout(timer);resolve(e.data||null);};target.postMessage({type},[channel.port2]);});
    }catch(e){console.warn('Beatronome SW request failed',e);return null;}
  }
  async function refreshOfflineStatus(){setOfflineUi(null);const status=await swRequest('GET_OFFLINE_STATUS');setOfflineUi(status);return status;}
  async function prepareOffline(userTriggered=true){
    if(offlinePreparing)return;if(!navigator.onLine){notify('인터넷 연결 후 오프라인 데이터를 준비해주세요.');setOfflineUi(await swRequest('GET_OFFLINE_STATUS'));return;}
    offlinePreparing=true;const btn=$('prepareOffline');if(btn){btn.disabled=true;btn.textContent='저장 중…';}
    if(userTriggered&&navigator.storage?.persist){try{await navigator.storage.persist();}catch{}}
    const status=await swRequest('PREPARE_OFFLINE');offlinePreparing=false;setOfflineUi(status);
    if(userTriggered)notify(status?.ready?'오프라인 사용 준비가 완료되었습니다.':'일부 파일을 받지 못했습니다. 연결 상태를 확인해주세요.');
  }
  async function registerOfflineWorker(){
    if(!('serviceWorker' in navigator)){setOfflineUi(null);return;}
    try{
      swRegistration=await navigator.serviceWorker.register(`./sw.js?v=${APP_VERSION}`,{updateViaCache:'none'});await swRegistration.update();await navigator.serviceWorker.ready;
      let status=await refreshOfflineStatus();
      if(status&&!status.ready&&navigator.onLine){await prepareOffline(false);status=await refreshOfflineStatus();}
    }catch(e){console.warn('Beatronome service worker registration failed',e);setOfflineUi(null);}
  }
  function resetSettings(){if(playing)stop();if(tunerStream)stopTunerMic();state=deepMerge(defaults,{});selectedChainIndex=0;selectedGenre='Rock';persist();renderAll();notify('기본값으로 초기화했습니다.');}

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
  $('trainingToggle').onclick=()=>{trainingExpanded=!trainingExpanded;renderTraining();};$$('[data-toggle]').forEach(btn=>btn.onclick=()=>setTraining(btn.dataset.toggle,!state.training[btn.dataset.toggle]));$('randomMute').oninput=e=>setTraining('randomMute',Number(e.target.value));$('gradualTarget').oninput=e=>setTraining('gradualTarget',Number(e.target.value));$('volume').oninput=e=>{state.volume=Number(e.target.value)/100;persist();renderSound();};$('outputBoost').oninput=e=>{state.outputBoost=Number(e.target.value)/100;persist();applyOutputBoost();renderSound();};$$('#boostPresets [data-boost]').forEach(btn=>btn.onclick=()=>{state.outputBoost=clamp(Number(btn.dataset.boost),.5,4);persist();applyOutputBoost();renderSound();notify(`전체 출력 ${Math.round(state.outputBoost*100)}%`);});
  $$('.stepper').forEach(s=>s.querySelectorAll('[data-step]').forEach(btn=>btn.onclick=()=>{const k=s.dataset.stepper,delta=Number(btn.dataset.step),bounds={soundBars:[1,16],muteBars:[1,16],tempoStep:[1,20],everyBars:[1,16],targetBpm:[30,300]}[k];setTraining(k,clamp(state.training[k]+delta,bounds[0],bounds[1]));}));
  $$('#tempoMode button').forEach(b=>b.onclick=()=>setTraining('tempoMode',b.dataset.mode));$$('#gradualSeconds button').forEach(b=>b.onclick=()=>setTraining('gradualSeconds',Number(b.dataset.sec)));$$('#timerMinutes button').forEach(b=>b.onclick=()=>setTraining('timerMinutes',Number(b.dataset.min)));

  $$('#playbackMode button').forEach(b=>b.onclick=()=>{if(state.groove.genreEnabled===false&&b.dataset.playback!=='metro')return;state.playbackMode=b.dataset.playback;persist();renderGroove();renderCore();});
  $('drumKit').onchange=e=>{state.groove.kit=e.target.value;state.groove.selectedName='Custom';persist();renderGroove();};
  $('drumVolume').oninput=e=>{state.groove.volume=Number(e.target.value)/100;persist();renderGroove();};
  $('swingAmount').oninput=e=>{state.groove.swing=Number(e.target.value);state.groove.selectedName='Custom';persist();renderGroove();};
  $('humanizeAmount').oninput=e=>{state.groove.humanize=Number(e.target.value);persist();renderGroove();};
  $('drumDropout').oninput=e=>{state.groove.dropout=Number(e.target.value);persist();renderGroove();};
  $('clearDrums').onclick=()=>{DRUM_INSTRUMENTS.forEach(([k])=>state.groove.instruments[k].pattern=empty16());state.groove.selectedName='Custom';persist();renderGroove();notify('드럼 패턴을 비웠습니다.');};

  $('tunerInstrument').onchange=e=>{state.tuner.instrument=e.target.value;state.tuner.tuning=state.tuner.instrument==='chromatic'?'standard':(getInstrumentTunings(state.tuner.instrument)[0]?.[0]||'standard');tunerActiveString=-1;persist();renderTuner();};
  $('tunerTuning').onchange=e=>{state.tuner.tuning=e.target.value;if(state.tuner.tuning==='custom'&&!state.tuner.custom[state.tuner.instrument])state.tuner.custom[state.tuner.instrument]=(getInstrumentTunings()[0]?.[2]||[]).slice();tunerActiveString=-1;persist();renderTuner();};
  $('tunerAminus').onclick=()=>{state.tuner.referenceA=clamp(state.tuner.referenceA-1,430,450);persist();renderTuner();};$('tunerAplus').onclick=()=>{state.tuner.referenceA=clamp(state.tuner.referenceA+1,430,450);persist();renderTuner();};
  $('toggleTunerMic').onclick=()=>tunerStream?stopTunerMic():startTunerMic();

  $('openMiniMode').onclick=()=>setMiniMode(true);$('settingsMiniMode').onclick=()=>setMiniMode(true);$('closeMiniMode').onclick=()=>setMiniMode(false);$('miniPlay').onclick=()=>playing?stop():start();$('miniTap').onclick=()=>$('tapTempo').click();$('miniMinus').onpointerdown=()=>startRepeat(-1);$('miniPlus').onpointerdown=()=>startRepeat(1);['pointerup','pointercancel','pointerleave'].forEach(ev=>{$('miniMinus').addEventListener(ev,stopRepeat);$('miniPlus').addEventListener(ev,stopRepeat);});$('miniMute').onclick=toggleMiniMute;

  $$('.bottom-nav button').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));$('savePreset').onclick=savePreset;$('openSettings').onclick=()=>{$('settingsModal').classList.remove('hidden');refreshOfflineStatus();renderCloudUi();};$('closeSettings').onclick=()=>$('settingsModal').classList.add('hidden');$('settingsModal').onclick=e=>{if(e.target===$('settingsModal'))$('settingsModal').classList.add('hidden');};$('resetSettings').onclick=resetSettings;$('prepareOffline').onclick=()=>{if(offlinePreparing)return;if($('prepareOffline').textContent==='다시 확인')refreshOfflineStatus();else prepareOffline(true);};
  $('cloudLogin').onclick=cloudSignIn;$('cloudSignup').onclick=cloudSignUp;$('cloudSyncNow').onclick=()=>syncCloud(false);$('cloudLogout').onclick=cloudLogout;$('cloudAutoSync').onchange=e=>{cloudMeta.autoSync=!!e.target.checked;persistCloudMeta();renderCloudUi();if(cloudMeta.autoSync)scheduleCloudSync(200);};
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){configureIOSAudioSession('playback',true);if(playing)requestWakeLock();refreshOfflineStatus();if(cloudSessionValid()&&navigator.onLine)scheduleCloudSync(300);}});window.addEventListener('pageshow',()=>{configureIOSAudioSession('playback',true);refreshOfflineStatus();renderCloudUi();if(cloudSessionValid()&&navigator.onLine)scheduleCloudSync(300);});window.addEventListener('online',()=>{refreshOfflineStatus().then(st=>{if(st&&!st.ready)prepareOffline(false);});if(cloudSessionValid())syncCloud(false);});window.addEventListener('offline',()=>refreshOfflineStatus());window.addEventListener('beforeunload',()=>{if(scheduler)clearInterval(scheduler);if(tunerStream)stopTunerMic();if(audioCtx)audioCtx.close();});

  ensureNormalPattern();if(state.meterChainEnabled)ensureChain();renderAll();renderCloudUi();setOfflineUi(null);registerOfflineWorker();if(cloudSessionValid()&&navigator.onLine){ensureCloudSession().then(ok=>{renderCloudUi();if(ok)syncCloud(true);});}
})();
