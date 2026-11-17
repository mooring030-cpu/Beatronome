/** Beatronome v0.16.6: offline, dependency-free regression tests for saved training state. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/app.js','utf8');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const css=fs.readFileSync(__dirname+'/fix-v0166.css','utf8');
const sw=fs.readFileSync(__dirname+'/sw.js','utf8');
function between(start,end){const a=src.indexOf(start);const b=src.indexOf(end,a+start.length);assert(a!==-1&&b!==-1,`${start} / ${end} source missing`);return src.slice(a,b);}
const mocks={
 clamp:(v,min,max)=>Math.max(min,Math.min(max,v)),uid:()=>String(Math.random()),
 DRUM_KITS:{studio:1}, DRUM_INSTRUMENTS:[['kick'],['snare']],
 TUNER_INSTRUMENTS:{electric:1}, SUBDIVISIONS:{1:1},
 makePattern:n=>Array.from({length:n},(_,i)=>i?'normal':'accent'),
 makeDefaultDrums:()=>({kick:{pattern:Array(16).fill(0),volume:.75,muted:false},snare:{pattern:Array(16).fill(0),volume:.75,muted:false}}),
};
const setup=[
  between('  const defaults = {','  let saved={}'), // includes normalization functions and deepMerge
  `let state=deepMerge(defaults,{});let trainingExpanded=state.practice.trainingExpanded;let savedJson='';let notice='';let UI=0;\n`+
   `function persist(){savedJson=JSON.stringify(state)}\n`+
   `function notify(t){notice=t}\n`+
   `function renderTraining(){UI++}\n`+
   `function renderUiExtras(){UI++}\n`+
   `function renderCore(){UI++}\n`,
  between('  function setTraining(key,value){','  function updateSessionStatus(){')
].join('\n');
vm.createContext(mocks);
vm.runInContext(setup,mocks);
function evaluate(expr){return vm.runInContext(expr,mocks);}
const cases=[];
function check(name,fn){fn();cases.push(name);}
check('old saved hidden Internal Clock is not resurrected',()=>{
 evaluate(`state=deepMerge(defaults,{practice:{simpleMode:true},training:{internalEnabled:true,soundBars:3,muteBars:2}});trainingExpanded=state.practice.trainingExpanded`);
 assert.equal(evaluate('state.training.internalEnabled'),false);
 assert.equal(evaluate('state.training.soundBars'),3);
});
check('old saved collapsed pane is normalized',()=>{
 evaluate(`state=deepMerge(defaults,{practice:{simpleMode:false,trainingExpanded:false},training:{internalEnabled:true}});trainingExpanded=state.practice.trainingExpanded`);
 assert.equal(evaluate('state.training.internalEnabled'),false);
 assert.equal(evaluate('trainingExpanded'),false);
});
check('visible Internal Clock retains enabled state',()=>{
 evaluate(`state=deepMerge(defaults,{practice:{simpleMode:false,trainingExpanded:true},training:{internalEnabled:true}});trainingExpanded=state.practice.trainingExpanded`);
 assert.equal(evaluate('state.training.internalEnabled'),true);
});
check('collapsing pane turns OFF and persists immediately',()=>{
 evaluate('setTrainingPaneOpen(false)');
 assert.equal(evaluate('state.training.internalEnabled'),false);
 assert.equal(evaluate('state.practice.trainingExpanded'),false);
 assert.equal(JSON.parse(evaluate('savedJson')).training.internalEnabled,false);
 assert.equal(JSON.parse(evaluate('savedJson')).practice.trainingExpanded,false);
});
check('reopening does not silently reactivate',()=>{
 evaluate('setTrainingPaneOpen(true)');
 assert.equal(evaluate('state.training.internalEnabled'),false);
 assert.equal(evaluate('state.practice.trainingExpanded'),true);
});
check('explicit ON is immediately rendered and saved',()=>{
 evaluate(`state.practice.simpleMode=true;setTraining('internalEnabled',true)`);
 assert.equal(evaluate('state.training.internalEnabled'),true);
 assert.equal(evaluate('state.practice.simpleMode'),false);
 assert.equal(JSON.parse(evaluate('savedJson')).training.internalEnabled,true);
});
check('hiding advanced disables clock and saves live state',()=>{
 evaluate('setAdvancedFeaturesVisible(false)');
 assert.equal(evaluate('state.training.internalEnabled'),false);
 assert.equal(evaluate('state.practice.simpleMode'),true);
 assert.equal(JSON.parse(evaluate('savedJson')).training.internalEnabled,false);
});
check('reload from serialized state retains OFF',()=>{
 evaluate('state=deepMerge(defaults,JSON.parse(savedJson));trainingExpanded=state.practice.trainingExpanded');
 assert.equal(evaluate('state.training.internalEnabled'),false);
});
check('future preset import hidden clock does not reactivate',()=>{
 evaluate(`state=deepMerge(defaults,{practice:{simpleMode:true,trainingExpanded:false},training:{internalEnabled:true}})`);
 assert.equal(evaluate('state.training.internalEnabled'),false);
});
check('knowledge chip explicit dark surface is last CSS layer',()=>{
 assert.match(css,/\.knowledge-memory-strip \.knowledge-chip-row button\s*\{/);
 assert.match(css,/background:#1a2837!important/);
 assert.match(html,/fix-v0166\.css\?v=0\.16\.6/);
});
check('version and worker pre-cache consistent',()=>{
 assert.match(src,/const APP_VERSION='0\.16\.6'/);
 assert.match(sw,/const VERSION = '0\.16\.6'/);
 assert.match(sw,/fix-v0166\.css/);
 assert.match(html,/v0\.16\.6/);
});
console.log('PASS',cases.length,'tests:\n- '+cases.join('\n- '));
// Verify live audio scheduling reads training state, not a stale snapshot.
const schedulingStub=`
let stepIndex=0,barIndex=0,startTime=0,sessionBaseBpm=120,tempoDir=1;
let visualQueue=[],drumVisualQueue=[],scheduledClicks=[];
let audioCtx={currentTime:0};let playbackChainIndex=0,playbackChainBarCount=0;
function trackScheduledClock(){}function scheduleDrumBar(){}
function getPlaybackMeter(){return {beats:4,denominator:4,pattern:['accent','normal','normal','normal']}}
function synthClick(time,sound,accent,vol,role){scheduledClicks.push({time,role});return []}
function rememberMetroSources(){}function setBpm(){}
`;
const schedMocks={clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),SUBDIVISIONS:{1:{count:1,mask:[true],bank:1}}};
vm.createContext(schedMocks);
vm.runInContext(schedulingStub+between('  function scheduleStep(time){','  async function start(){'),schedMocks);
const schedule=(expr)=>vm.runInContext(expr,schedMocks);
check('live Internal Clock ON/OFF changes upcoming click scheduling without stop',()=>{
 schedule(`let state={bpm:120,subdivision:1,sound:'classic',volume:.8,playbackMode:'metro',meterChainEnabled:false,training:{internalEnabled:true,soundBars:1,muteBars:1,randomMuteEnabled:false,gradualEnabled:false,autoTempoEnabled:false}}`);
 for(let i=0;i<8;i++)schedule(`scheduleStep(${i*.5})`);
 assert.equal(schedule('scheduledClicks.length'),4,'first bar audible / second bar muted');
 schedule('state.training.internalEnabled=false');
 for(let i=8;i<12;i++)schedule(`scheduleStep(${i*.5})`);
 assert.equal(schedule('scheduledClicks.length'),8,'third bar instantly audible without transport stop');
});
console.log('PASS live scheduler regression');
(async()=>{
  let releaseFetch,releaseUpload,chooseLocalResult=null,resyncs=0;
  const fetchGate=new Promise(resolve=>releaseFetch=resolve),uploadGate=new Promise(resolve=>releaseUpload=resolve);
  const c={
    cloudBusy:false,cloudLastError:'',localRevision:0,
    cloudMeta:{dirty:false,lastSyncedAt:0,lastRemoteUpdatedAt:0,localChangedAt:0,autoSync:true},
    cloudSessionValid:()=>true,navigator:{onLine:true},
    renderCloudUi:()=>{},cloudFetchRemote:()=>fetchGate,
    cloudSaveMerged:(_remote,chooseLocal)=>{chooseLocalResult=chooseLocal;return true},
    cloudUploadLocal:()=>uploadGate,persistCloudMeta:()=>{},renderPresets:()=>{},
    notify:()=>{},cloudFriendlyError:e=>String(e),scheduleCloudSync:()=>{resyncs++},
    cloudSafetyBackup:()=>{},console,
  };
  vm.createContext(c);
  vm.runInContext(between('  async function syncCloud(initial=false){','  function renderCloudUi(){'),c);
  const promise=vm.runInContext('syncCloud(true)',c);
  c.localRevision++;c.cloudMeta.dirty=true;c.cloudMeta.localChangedAt=Date.now();
  releaseFetch({updated_at:'2026-11-17T00:00:00Z',settings:{},presets:[]});
  // Drain microtasks until the cloud upload is requested.
  for(let i=0;i<10;i++)await Promise.resolve();
  assert.equal(chooseLocalResult,true,'local edits while fetching remote are retained');
  c.localRevision++; // second edit while POST is still awaiting response
  releaseUpload({updated_at:'2026-11-17T00:00:01Z'});
  await promise;
  assert.equal(c.cloudMeta.dirty,true,'edit made during POST stays dirty');
  assert.equal(resyncs,1,'unuploaded changes get requeued');
  console.log('PASS cloud sync in-flight edit retention (mock network)');
})().catch(e=>{console.error(e);process.exitCode=1});
