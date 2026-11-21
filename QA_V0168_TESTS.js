/** Beatronome v0.16.8: offline YouTube clear and iOS WebAudio recovery regression. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=__dirname;
const read=p=>fs.readFileSync(base+'/'+p,'utf8');
const app=read('app.js'),back=read('backing.js'),html=read('index.html'),sw=read('sw.js');
let passes=0;
function check(name,fn){fn();console.log('PASS',name);passes++;}
function slice(src,start,end){const i=src.indexOf(start),j=src.indexOf(end,i+start.length);assert(i>=0&&j>i,`Missing ${start}`);return src.slice(i,j);}
function fakeElement(){return{value:'',textContent:'',disabled:false,classList:{v:new Set(),add(k){this.v.add(k)},remove(k){this.v.delete(k)},contains(k){return this.v.has(k)},toggle(k,value){if(value)this.v.add(k);else this.v.delete(k)}}};}
check('version, offline cache and new CSS are in lockstep',()=>{
  for(const name of ['app.js','backing.js','sw.js','index.html'])assert.ok(read(name).length>100);
  assert.match(app,/const APP_VERSION='0\.16\.8'/);assert.match(sw,/const VERSION = '0\.16\.8'/);
  for(const asset of ['fix-v0168.css','fix-v0167.css','audio-clock-worklet.js','clock-worker.js']){
    assert.ok(sw.includes(`'${asset}'`),`not cached ${asset}`);
    assert.ok(fs.existsSync(base+'/'+asset));
  }
  for(const asset of ['app.js','backing.js','fix-v0168.css'])assert.ok(html.includes(`${asset}?v=0.16.8`));
});
check('YouTube clear and iOS rescue controls are uniquely addressable',()=>{
  for(const id of ['youtubeClear','audioRecoveryRow','audioRecoveryButton']){
    assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1);
  }
  assert.ok(back.includes("$('youtubeClear').onclick=clearYouTube"));
  assert.ok(app.includes("$('audioRecoveryButton').onclick=recoverAudioPlayback"));
});
check('initial audio category does not force ambient while unlocking',()=>{
  assert.ok(app.includes("configureIOSAudioSession('playback');\n    if(tunerStream)stopTunerMic();"));
  assert.ok(app.includes('function resumePlayingOnReturn()'));
  assert.ok(app.includes("audioCtx?.state==='interrupted'"));
  assert.ok(!app.includes("configureIOSAudioSession('playback',true);\n    if(tunerStream)stopTunerMic();"));
});
check('recovery works without waiting for all 18 samples',()=>{
  assert.ok(app.includes("if(state.sound==='basic')void loadBasicSamples()"));
  assert.ok(app.includes('Promise.all(keys.map(async([bank,role])=>{'));
  assert.ok(app.includes('const attempt=++startAttemptId'));
  assert.ok(app.includes('if(attempt!==startAttemptId)return false'));
});
check('v0.16.7 layout and meter chain still present',()=>{
  const chain=html.indexOf('<section class="meter-chain-panel card"');
  const training=html.indexOf('<section class="training-panel card advanced-only">');
  assert.ok(chain>0&&training>chain);
  const css=read('fix-v0167.css');
  assert.ok(css.includes('max-width:760px!important'));
  assert.ok(css.includes('grid-template-columns:repeat(5,minmax(0,1fr))!important'));
});
check('v0.16.7 combined YouTube gesture and background scheduling preserved',()=>{
  const start=back.indexOf("$('youtubePlayTogether').onclick=()=>{");
  const body=back.slice(start,back.indexOf("$('youtubeBack5').onclick=",start));
  assert.ok(body.indexOf('startYoutubeMetro()')<body.indexOf('ytPlayer.playVideo()'));
  assert.ok(app.includes('document.hidden?(state.training.autoTempoEnabled?1.0:3.0):.32'));
  assert.ok(app.includes('function advanceMissedStep()'));
});
function makeAudioHarness(){
 let total=0,closed=0,started=0;
 const elements={audioRecoveryRow:fakeElement()};
 const ctx={
   navigator:{userAgent:'iPhone; CPU iPhone OS',platform:'iPhone',maxTouchPoints:5,audioSession:{type:'ambient'}},
   window:{}, document:{visibilityState:'visible'},
   $:id=>elements[id]||null, console,
   setTimeout,clearTimeout, notify:()=>{}, scheduleTick:()=>{},
   isIOSDevice:()=>true,
   state:{sound:'wood',outputBoost:1},miniMuted:false,
 };
 function gain(){return{gain:{value:0,setTargetAtTime(){}},connect(){return this},disconnect(){}};}
 function param(){return{value:0};}
 class FakeAudioContext {
   constructor(){total++;this.currentTime=0;this.destination={};this.state='suspended';this.handlers={};}
   createGain(){return gain()}
   createDynamicsCompressor(){return{threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),connect(){return this}}}
   createOscillator(){return{connect(){return this},start(){started++},stop(){}}}
   addEventListener(type,fn){this.handlers[type]=fn;}
   resume(){this.state='running';this.handlers.statechange?.();return Promise.resolve();}
   close(){closed++;this.state='closed';return Promise.resolve();}
 }
 ctx.window.AudioContext=FakeAudioContext;
 vm.createContext(ctx);
 vm.runInContext(`let audioCtx=null,master=null,limiter=null,noiseCache=null,basicLoading=null,clockWorkletNode=null,clockWorkletGain=null,clockWorkletLoading=null,playing=false,audioRecoveryNeeded=false,audioRecoveryCount=0,clockDriver='timeout';`,ctx);
 vm.runInContext(slice(app,"  function configureIOSAudioSession(mode='playback',forceCycle=false){","  function noiseBuffer(){"),ctx);
 return {ctx,elements,getCounts:()=>({total,closed,started}),eval:exp=>vm.runInContext(exp,ctx)};
}
async function audioTests(){
 const h=makeAudioHarness();
 assert.equal(await h.eval('ensureAudio().then(()=>audioCtx.state)'), 'running');
 assert.equal(h.getCounts().total,1);
 assert.ok(h.getCounts().started>=1,'unlock priming starts synchronously');
 assert.equal(h.eval('navigator.audioSession.type'),'playback');
 // Reuse a running context; an interrupted context while STOPPED is rebuilt.
 assert.equal(await h.eval('ensureAudio().then(()=>audioCtx.state)'),'running');
 assert.equal(h.getCounts().total,1);
 h.eval("audioCtx.state='interrupted'");
 assert.equal(await h.eval('ensureAudio().then(()=>audioCtx.state)'),'running');
 assert.equal(h.getCounts().total,2);
 assert.equal(h.getCounts().closed,1);
 // While PLAYING, resume the current context to preserve scheduled timeline.
 h.eval("playing=true; audioCtx.state='interrupted'; audioCtx.handlers.statechange()");
 assert.equal(h.eval('audioRecoveryNeeded'),true);
 assert.ok(!h.elements.audioRecoveryRow.classList.contains('hidden'));
 assert.equal(await h.eval('ensureAudio().then(()=>audioCtx.state)'),'running');
 assert.equal(h.getCounts().total,2,'active context must not be replaced mid-sequence');
 console.log('PASS iOS initial unlock, interrupted creation, mid-play resume, visible recovery (mock)');passes++;
}
function makeYouTubeHarness(options={}){
 const el={youtubePlayerWrap:fakeElement(),youtubeClear:fakeElement(),youtubeUrl:fakeElement(),youtubePlaceholder:fakeElement(),youtubeCurrentTime:fakeElement(),youtubeDuration:fakeElement(),youtubeSeek:fakeElement(),youtubePlay:fakeElement()};
 el.youtubeCurrentTime.textContent='01:55';el.youtubeDuration.textContent='03:00';el.youtubeSeek.value='800';
 let node={remove(){if(el.youtubePlayerWrap.child===this)el.youtubePlayerWrap.child=null;}};
 el.youtubePlayerWrap.child=node;
 el.youtubePlayerWrap.querySelector=selector=>selector==='#youtubePlayer'?el.youtubePlayerWrap.child:null;
 el.youtubePlayerWrap.prepend=elem=>{el.youtubePlayerWrap.child=elem};
 const doc={createElement:tag=>({tagName:tag,id:'',remove(){if(el.youtubePlayerWrap.child===this)el.youtubePlayerWrap.child=null;}})};
 let generation=0,stops=0,saves=0,apiRelease;
 const yt={PlayerState:{PLAYING:1,PAUSED:2,ENDED:0},Player:class {
   constructor(id,opts){generation++;this.opts=opts;this.destroyed=false;el.youtubePlayerWrap.child={tagName:'IFRAME',id,remove(){el.youtubePlayerWrap.child=null}};}
   stopVideo(){stops++;this.opts.events.onStateChange({data:2});}
   destroy(){this.destroyed=true;el.youtubePlayerWrap.child=null;}
   getCurrentTime(){return 0}
   getDuration(){return 180}
   getPlaybackRate(){return 1}
   setPlaybackRate(){}
   seekTo(){}
 }};
 const ctx={
   window:{location:{origin:'https://beatronome.example'}},navigator:{onLine:true},YT:yt,
   document:doc,$:k=>el[k],console,
   s:{youtube:{url:'',videoId:'',rate:1,loopA:null,loopB:null,loopOn:false,metroTogether:false}},
   ytLoadGeneration:0,ytMetroToken:0,ytPlayer:null,ytTimer:null,youtubeRateTimer:null,youtubeRateStatusTimer:null,ytTrackKey:'',
   notify:()=>{},save:()=>{saves++},stopYoutubeMetro:()=>{stops++},renderYoutubeLoop:()=>{},renderMarkers:()=>{},renderYoutubeRate:()=>{},youtubeMetroStatus:()=>{},requestYoutubePlaybackRate:()=>{},startYtTimer:()=>{},
   extractYouTubeId:url=>url.split('/').pop(),
   loadYouTubeApi:options.delay?()=>new Promise(r=>apiRelease=r):()=>Promise.resolve(),
   setTimeout,clearTimeout,setInterval,clearInterval
 };
 vm.createContext(ctx);
 vm.runInContext(slice(back,'  // YT.Player replaces #youtubePlayer','  function startYtTimer(){'),ctx);
 return {ctx,el,eval:exp=>vm.runInContext(exp,ctx),count:()=>generation,getSaves:()=>saves,release:()=>apiRelease()};
}
async function youtubeTests(){
 const h=makeYouTubeHarness();
 h.el.youtubeUrl.value='https://youtu.be/dQw4w9WgXcQ';
 await h.eval('loadYouTube()');
 assert.equal(h.count(),1);assert.equal(h.el.youtubePlayerWrap.child.tagName,'IFRAME');
 h.eval('clearYouTube()');
 assert.equal(h.el.youtubeUrl.value,'');assert.equal(h.el.youtubeCurrentTime.textContent,'00:00');
 assert.equal(h.el.youtubeDuration.textContent,'00:00');assert.equal(h.el.youtubeSeek.value,'0');
 assert.equal(h.eval('s.youtube.videoId'),'');assert.equal(h.eval('ytTrackKey'),'');
 assert.equal(h.eval('s.youtube.loopOn'),false);
 assert.equal(h.el.youtubePlayerWrap.child.tagName,'div');
 assert.ok(!h.el.youtubePlaceholder.classList.contains('hidden'));
 assert.equal(h.el.youtubeClear.disabled,true);
 assert.ok(h.getSaves()>1);
 h.el.youtubeUrl.value='https://youtu.be/dQw4w9WgXcQ';
 await h.eval('loadYouTube()');
 assert.equal(h.count(),2);assert.equal(h.el.youtubePlayerWrap.child.tagName,'IFRAME');
 console.log('PASS load -> clear -> blank player -> load again, local video state deleted (mock)');passes++;
 const late=makeYouTubeHarness({delay:true});
 late.el.youtubeUrl.value='https://youtu.be/dQw4w9WgXcQ';
 const pending=late.eval('loadYouTube()');
 late.eval('clearYouTube()');late.release();await pending;
 assert.equal(late.count(),0,'late SDK ready should not rebuild cleared video');
 assert.equal(late.eval('s.youtube.videoId'),'');
 console.log('PASS clear while iframe SDK is loading does not resurrect the video (mock)');passes++;
}
(async()=>{await audioTests();await youtubeTests();console.log(`PASS v0.16.8: ${passes} checks`);})().catch(e=>{console.error(e);process.exitCode=1});
