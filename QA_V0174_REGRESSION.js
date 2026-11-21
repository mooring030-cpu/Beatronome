/** Current-version tests. Historical v0.16.x tests are preserved separately. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=__dirname,read=f=>fs.readFileSync(path.join(root,f),'utf8');
const app=read('app.js'),back=read('backing.js'),html=read('index.html'),css=read('beatronome.bundle.css'),sw=read('sw.js');
const version=app.match(/const APP_VERSION='([0-9.]+)'/)[1];
let checks=0;
const pending=[];
const run=(name,fn)=>{const result=fn();if(result&&typeof result.then==='function')pending.push(result.then(()=>{checks++;console.log('PASS',name)}));else{checks++;console.log('PASS',name)}};
function slice(t,a,b){const i=t.indexOf(a),j=t.indexOf(b,i+a.length);assert.ok(i>=0&&j>i,`Missing ${a} / ${b}`);return t.slice(i,j);}
const noop=()=>{};
run('runtime version and PWA asset references are aligned',()=>{
  assert.equal(version,'0.17.4');assert.ok(sw.includes(`const VERSION = '${version}'`));
  for(const asset of ['app.js','backing.js','audio-clock-worklet.js','clock-worker.js','ux-v016.js'])assert.ok(app.includes(asset)||back.includes(asset)||html.includes(asset));
  assert.ok(html.includes(`beatronome.bundle.css?v=${version}`));
  assert.ok(sw.includes('beatronome.bundle.css'));assert.ok(html.includes(`app.js?v=${version}`));
  assert.ok(!html.includes('fix-v0169.css?v='));
});
run('no double HTML IDs; critical new panels exist',()=>{
  const ids=Array.from(html.matchAll(/\bid="([\w-]+)"/g),m=>m[1]);
  assert.equal(ids.length,new Set(ids).size);
  for(const id of ['liveChangeApply','meterChainNowNext','chainPatternPreset','chainPatternSave','backupPreview','backupPreviewConfirm','audioStatusValue','audioClockValue','audioDebugExport','youtubeRetry','backingPlayTogether','localSyncOffset','youtubeSyncOffset'])assert.ok(ids.includes(id),id);
});
run('Groove OFF step is preserved; missing slots inherit defaults',()=>{
  const fn=slice(app,'  function normalizeDrumInstrument(v, fallback){','  function deepMerge(base,obj){');
  const c={clamp:(v,low,high)=>Math.max(low,Math.min(high,v))};vm.createContext(c);vm.runInContext(fn,c);
  const pattern=Array(16).fill(0),fallback={pattern:[1,1,...Array(14).fill(0)],volume:.9};
  assert.equal(c.normalizeDrumInstrument({pattern,volume:.1},fallback).pattern[0],0);
  assert.equal(c.normalizeDrumInstrument({pattern:[0],volume:.1},fallback).pattern[1],1);
  assert.equal(c.normalizeDrumInstrument({},fallback).pattern[0],1);
});
run('Undo actually captures entire state and restores after edit',()=>{
  const code=slice(app,'  function showUndo(',"  function escapeHtml(s){");
  const bar={classList:{remove:noop,add:noop}},elements={undoBar:bar,undoText:{textContent:''}};
  const ctx={state:{bpm:100,practice:{trainingExpanded:true},groove:{genre:'Rock'},meterChain:[{beats:4}]},presets:[{id:'a'}],selectedChainIndex:0,undoState:null,undoTimer:null,
    $:id=>elements[id],setTimeout:()=>1,clearTimeout:noop,playing:false,deepMerge:(base,data)=>data,defaults:{},
    stop:noop,ensureNormalPattern:noop,ensureChain:noop,persist:noop,persistPresets:noop,renderAll:noop,notify:noop};
  vm.createContext(ctx);vm.runInContext(code,ctx);
  ctx.captureUndo('test');ctx.state.bpm=180;ctx.presets.push({id:'b'});
  assert.equal(ctx.restoreUndo(),true);assert.equal(ctx.state.bpm,100);assert.equal(ctx.presets.length,1);
  assert.equal(ctx.restoreUndo(),false);
});
run('Undo bar visibility is not globally disabled',()=>{
  assert.match(css,/\.undo-bar:not\(\.hidden\)\{display:flex!important\}/);
  assert.ok(html.includes('id="undoAction"'));
});
run('routine/timer deadlines independent of visual animation frame',()=>{
  const code=slice(app,'  function settleDeadlines(){','  function startVisualLoop(){');
  const ctx={playing:true,deadlineBusy:false,Date:{now:()=>500000},activePractice:null,routineDeadlineWallAt:0,
    practiceTimerEndsAt:499999,stopCalled:0,stop(){this.stopCalled++;this.playing=false;},notify:noop};
  // Make top-level functions reference the context instead of this.
  ctx.stop=()=>{ctx.stopCalled++;ctx.playing=false};
  vm.createContext(ctx);vm.runInContext(code,ctx);ctx.settleDeadlines();assert.equal(ctx.stopCalled,1);
  assert.ok(app.includes("window.addEventListener('pageshow',()=>{settleDeadlines()"));
  assert.ok(app.includes("document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){settleDeadlines()"));
});
run('live settings boundary cancels already queued notes',()=>{
  const code=slice(app,'  function rescheduleLiveRhythm(boundary=liveChangeBoundary()){','  function setBpm(v,');
  let m=0,d=0,schedule=0;
  const ctx={playing:true,audioCtx:{currentTime:14,state:'running'},scheduleBusy:false,
    visualQueue:[{time:14.2,beat:1},{time:14.5,beat:2}],drumVisualQueue:[{time:14.6,step:2}],
    state:{meterChainEnabled:false,subdivision:1,bpm:120,playbackMode:'metro'},
    stepIndex:11,nextNoteTime:16,clockLast:'old',SUBDIVISIONS:{1:{count:1}},
    cancelFutureMetroSources:()=>m++,cancelFutureDrumSources:()=>d++,getPlaybackMeter:()=>({beats:4,denominator:4}),
    scheduleDrumBar:noop,scheduleTick:()=>schedule++,clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),
    liveChangeBoundary:()=>null};
  vm.createContext(ctx);vm.runInContext(code,ctx);
  ctx.rescheduleLiveRhythm({time:14.5,beat:2,chainIndex:-1,chainBar:0});
  assert.equal(ctx.nextNoteTime,14.5);assert.equal(ctx.stepIndex,2);assert.equal(m,1);assert.equal(d,1);assert.equal(schedule,1);
  assert.equal(ctx.visualQueue.length,1);
});
run('YouTube SDK failure clears rejected promise and permits retry',()=>{
  const code=slice(back,'  let ytApiPromise=null;', '  function extractYouTubeId(url){');
  const scripts=[];
  const ctx={window:{},document:{getElementById:()=>null,createElement:()=>({remove(){this.removed=true;}}),head:{appendChild:el=>scripts.push(el)}},
    setInterval:()=>1,clearInterval:noop,setTimeout:()=>2,clearTimeout:noop,Promise};
  vm.createContext(ctx);vm.runInContext(code,ctx);
  const first=ctx.loadYouTubeApi().catch(e=>String(e.message));
  assert.equal(scripts.length,1);scripts[0].onerror();
  return first.then(async text=>{
    assert.match(text,/네트워크/);
    const second=ctx.loadYouTubeApi();assert.equal(scripts.length,2);
    ctx.window.YT={Player:function Player(){}};ctx.window.onYouTubeIframeAPIReady();
    await second;
  });
});
run('full backup schema + selective import and rollback UI',()=>{
  assert.ok(app.includes("schema:2,version:APP_VERSION"));
  assert.ok(app.includes('backing:window.BeatronomeBackingAPI?.getBackupData?.()'));
  assert.ok(app.includes('backupPreviewDescription'));
  assert.ok(app.includes('if(selected.backing)window.BeatronomeBackingAPI?.restoreBackup?.(data.backing)'));
  assert.ok(app.includes('Backup restore rollback'));
  assert.ok(back.includes('window.BeatronomeBackingAPI={'));
  assert.ok(html.includes('로컬 음악/영상 파일 자체와 로그인 토큰은 제외'));
});
run('cross-device conflict snapshot and deleted-preset tombstones retained',()=>{
  assert.ok(app.includes('cloudSafetyBackupRemote(remote'));
  assert.ok(app.includes('remoteChanged&&localDirty'));
  assert.ok(app.includes('mergeCloudPresets(presets,remote?.presets'));
  assert.ok(app.includes('state.cloudDeletedPresetIds[id]=Date.now()'));
});
run('Meter Chain saves, shows current/next, supports numeric editing',()=>{
  for(const tok of ['renderChainPresets','saveChainPreset','loadChainPreset','deleteChainPreset','meterChainNowNext','chainEditDenominator'])assert.ok(app.includes(tok));
  assert.match(html,/id="chainAddBeats"[\s\S]*id="chainAddDenominator"/);
});
run('combined playback uses iOS activation path before awaits',()=>{
  const fn=slice(back,'  function startLocalMedia(withMetro=false){',"  $('backingPlay').onclick=");
  assert.ok(fn.includes('metro?.start?.()')&&!fn.includes('await '));
  assert.ok(fn.indexOf('m.play()')<fn.indexOf('return Promise.all'));
  assert.ok(back.includes('startYoutubeMetro(); // must begin synchronously within the tap gesture'));
});
run('diagnostics exclude credentials and remain informational',()=>{
  const code=slice(app,'  function collectAudioDiagnostics(){','  function renderAudioDiagnostics(){');
  assert.ok(code.includes('scope')===false);
  for(const forbidden of ['cloudMeta.session.access_token','cloudMeta.session.refresh_token','cloudUserEmail'])assert.equal(code.includes(forbidden),false,forbidden);
  assert.ok(code.includes('timing:getTimingStats()'));
});
run('iOS long touch + unsupported vibration has clear feedback',()=>{
  assert.ok(css.includes('-webkit-touch-callout:none!important'));
  assert.ok(app.includes("document.addEventListener('contextmenu'"));
  assert.ok(app.includes("typeof navigator.vibrate==='function'"));
  assert.ok(html.includes('id="vibrateAvailability"'));
});
run('PWA offline assets and 18 Basic samples referenced',()=>{
  const files=[];for(let i=1;i<=6;i++)for(const label of ['strong','weak','normal'])files.push(`audio/basic/bank${i}_${label}.wav`);
  for(const f of files)assert.ok(fs.existsSync(path.join(root,f)),f);
  assert.ok(sw.includes("const BASIC = Array.from({length:6}"));
  assert.ok(fs.existsSync(path.join(root,'beatronome.bundle.css')));
});
run('user-facing meter/audio/video speed settings are present',()=>{
  for(const el of ['youtubeSpeedNumber','youtubeSpeedRange','youtubeSpeedStatus','youtubeResync','youtubeTapSync','localResync','localTapSync','liveChangeApply'])assert.ok(html.includes(`id="${el}"`),el);
  assert.ok(back.includes('actual=youtubePlaybackRate()'));
});
run('single UI version in UX module',()=>{
  assert.ok(read('ux-v016.js').includes("version:window.BeatronomeAPI?.getVersion?.()"));
});
run('YouTube Loop is above player and uses timecodes without Premium UI',()=>{
  for(const id of ['youtubeLoopStartSeconds','youtubeLoopEndSeconds','youtubeLoopApply'])assert.ok(html.includes(`id="${id}"`));
  assert.ok(html.indexOf('id="youtubeLoopApply"')<html.indexOf('id="youtubePlay"'));
  assert.ok(back.includes('parseLoopTime(rawA)'));
  assert.ok(!html.includes('youtube-premium-help')&&!html.includes('youtubeOpenOnYoutube'));
});
run('Music player has master volume, no AI separation or dead bridge',()=>{
  for(const id of ['backingFile','backingVolume','backingVolumeValue','backingPlay','backingPlayTogether','backingMetroStop'])
    assert.ok(html.includes(`id="${id}"`),id);
  assert.ok(back.includes("$('backingVolume').oninput"));
  assert.ok(back.includes('mediaSource.connect(pitch.input)'));
  for(const name of ['stemStudio','stemGenerate','stem-separation.js','stem-worker.js','AI_BACKEND'])
    assert.ok(!html.includes(name)&&!back.includes(name)&&!sw.includes(name),name);
});
Promise.all(pending).then(()=>console.log(`PASS: ${checks} regression checks including async SDK retry`)).catch(err=>{console.error('FAIL async',err);process.exitCode=1});
