/** v0.16.7 portable/offline regression — no browser or online YouTube required. */
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const read=name=>fs.readFileSync(__dirname+'/'+name,'utf8');
const app=read('app.js'),html=read('index.html'),back=read('backing.js'),sw=read('sw.js');
const css=read('fix-v0167.css'),worklet=read('audio-clock-worklet.js');
let tests=0;
function check(name,fn){fn();tests++;console.log('PASS',name);}
function extract(source,start,end){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);assert(a>=0&&b>a,`Missing ${start}/${end}`);return source.slice(a,b);}
check('full version + new offline assets match',()=>{
 assert.match(app,/const APP_VERSION='0\.16\.7'/);
 assert.match(sw,/const VERSION = '0\.16\.7'/);
 for(const asset of ['clock-worker.js','audio-clock-worklet.js','fix-v0167.css']){
   assert.ok(sw.includes(`'${asset}'`));assert.ok(fs.existsSync(__dirname+'/'+asset));
 }
 for(const js of ['app.js','backing.js','fix-v0167.css'])assert.ok(html.includes(`${js}?v=0.16.7`));
});
check('Meter Chain is visible regardless of advanced mode, before training',()=>{
 const chain=html.indexOf('<section class="meter-chain-panel card"'),training=html.indexOf('<section class="training-panel card advanced-only">');
 assert.ok(chain>0&&training>chain);
 assert.equal((html.match(/id="meterChainToggle"/g)||[]).length,1);
 assert.equal((html.match(/id="meterChainList"/g)||[]).length,1);
 assert.ok(!html.slice(chain,training).includes('meter-chain-block advanced-only'));
});
check('phone/tablet/PC share centered single-column and bottom tabs',()=>{
 for(const rule of ['max-width:760px!important','flex-direction:column!important','grid-template-columns:repeat(5,minmax(0,1fr))!important'])assert.ok(css.includes(rule),rule);
});
check('YouTube combined play is visible, uses synchronous gesture audio unlock',()=>{
 assert.equal((html.match(/id="youtubePlayTogether"/g)||[]).length,1);
 assert.equal((html.match(/id="youtubeMetroTogether"/g)||[]).length,1);
 const start=back.indexOf("$('youtubePlayTogether').onclick=()=>{");
 assert.ok(start>0);
 const body=back.slice(start,back.indexOf("$('youtubeBack5').onclick=",start));
 assert.ok(body.indexOf('startYoutubeMetro()') < body.indexOf('ytPlayer.playVideo()'));
 assert.ok(back.includes('if(ytMetroStarted&&window.BeatronomeAPI?.isPlaying?.())window.BeatronomeAPI.stop()'));
});
check('audio-worklet heartbeat keeps tick separate from window timer',()=>{
 assert.match(worklet,/class BeatronomeAudioClock extends AudioWorkletProcessor/);
 assert.match(worklet,/this\.port\.postMessage\('tick'\)/);
 assert.match(app,/clockWorkletNode\.port\.onmessage=/);
 assert.match(app,/document\.hidden\?\(state\.training\.autoTempoEnabled\?1\.0:3\.0\):\.32/);
});
check('late scheduler resumes existing beat phase, rather than resetting BPM',()=>{
 const src=extract(app,'  function advanceMissedStep(){','  async function startCore(){');
 const ctx={
  playing:true,scheduleBusy:false,audioCtx:{currentTime:4.08,state:'running'},
  document:{hidden:true},state:{bpm:120,subdivision:1,meterChainEnabled:false,training:{autoTempoEnabled:false}},
  nextNoteTime:.07,stepIndex:0,barIndex:0,clockRecoveries:0,clockLast:null,
  playbackChainIndex:0,playbackChainBarCount:0,
  visualQueue:[],drumVisualQueue:[],
  SUBDIVISIONS:{1:{count:1}},
  getPlaybackMeter:()=>({beats:4,denominator:4}),
  scheduled:[],setBpm:()=>{},
 };
 ctx.scheduleStep=time=>{ctx.scheduled.push(time);ctx.stepIndex++;if(ctx.stepIndex===4){ctx.stepIndex=0;ctx.barIndex++;}return{beats:4,denominator:4};};
 vm.createContext(ctx);vm.runInContext(src,ctx);vm.runInContext('scheduleTick()',ctx);
 assert.equal(ctx.clockRecoveries,1);
 assert.ok(ctx.scheduled.length>=4);
 assert.ok(ctx.scheduled[0]>=4.08);
 assert.ok(Math.abs((ctx.scheduled[0]-.07)/.5-Math.round((ctx.scheduled[0]-.07)/.5))<.001,'beat must remain aligned to original audio-clock lattice');
 assert.ok(ctx.nextNoteTime>=7.0,'background must schedule multiple seconds ahead');
});
check('stop can cancel all future drum voices in background lookahead',()=>{
 const src=extract(app,'  function rememberDrumSources(time,sources){','  function scheduleDrumBar(barStart,barDuration){');
 let stops=0;
 const ctx={scheduledDrumSources:[],audioCtx:{currentTime:2},stops};
 vm.createContext(ctx);vm.runInContext(src,ctx);
 vm.runInContext('rememberDrumSources(1.0,[{stop:()=>{stops++}}]);rememberDrumSources(3.0,[{stop:()=>{stops++}},{stop:()=>{stops++}}]);cancelFutureDrumSources()',ctx);
 assert.equal(ctx.stops,2);assert.equal(ctx.scheduledDrumSources.length,1);
});
console.log(`PASS v0.16.7: ${tests} checks`);
