/** Beatronome v0.16.9 source-level regression. Real browser QA is documented separately. */
const fs=require('fs');
const assert=require('node:assert/strict');
const path=require('path');
const root=__dirname;
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html'),app=read('app.js'),style=read('fix-v0169.css'),sw=read('sw.js');
let count=0;
const check=(name,fn)=>{fn();count++;console.log('PASS',name)};
check('v0.16.9 assets, worker, HTML all match',()=>{
  assert.match(app,/const APP_VERSION='0\.16\.9'/);
  assert.match(sw,/const VERSION = '0\.16\.9'/);
  for(const file of ['app.js','fix-v0169.css','backing.js'])assert.ok(html.includes(file+'?v=0.16.9'));
  assert.ok(sw.includes('fix-v0169.css'));
  assert.ok(app.includes('audio-clock-worklet.js?v=0.16.9'));
  assert.ok(app.includes('clock-worker.js?v=0.16.9'));
});
check('setup moved to page; obsolete popup removed',()=>{
  assert.ok(!html.includes('id="coreSettingsModal"'));
  assert.ok(!app.includes("$('openCoreSettings').onclick"));
  for(const id of ['beatsPerBar','denominator','subdivision','quickSoundSelect','toggleSimpleMode','focusModeButton','countInBars','flashToggle','vibrateToggle']){
    assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
  }
});
check('numeric meter at left of smaller TAP and subdivision at right',()=>{
  assert.match(html,/rhythm-meter-picker[\s\S]*id="beatsPerBar"[\s\S]*id="denominator"[\s\S]*id="tapTempo"[\s\S]*id="subdivision"/);
  assert.match(style,/grid-template-columns:minmax\(0,1\.28fr\).*minmax\(0,1\.08fr\)/);
  assert.ok(html.includes('id="minusBpm"')&&html.includes('id="plusBpm"'));
});
check('click sound + focus + advanced are inline, not modal',()=>{
  assert.match(html,/inline-core-settings[\s\S]*id="quickSoundSelect"[\s\S]*id="toggleSimpleMode"[\s\S]*id="focusModeButton"/);
});
check('count-in, screen pulse, vibration appear inside advanced panel',()=>{
  const a=html.indexOf('id="trainingList"'),b=html.indexOf('data-row="randomMute"');
  assert.ok(a>0&&b>a);
  for(const id of ['countInBars','flashToggle','vibrateToggle']){
    const pos=html.indexOf('id="'+id+'"'); assert.ok(pos>a&&pos<b,id);
  }
  assert.match(app,/\$\('countInBars'\)\.onchange/);
  assert.match(app,/\$\('flashToggle'\)\.onclick/);
  assert.match(app,/\$\('vibrateToggle'\)\.onclick/);
});
check('meter chain has editable selected numeric meter and custom numeric insert',()=>{
  for(const id of ['chainEditBeats','chainEditDenominator','chainAddBeats','chainAddDenominator','chainAddCustom']){
    assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
  }
  assert.match(app,/\$\('chainEditBeats'\)\.value=String\(state\.meterChain\[selectedChainIndex\]\.beats\)/);
  assert.match(app,/\$\('chainAddCustom'\)\.onclick=\(\)=>addMeter/);
  assert.match(app,/setSelectedMeterField\(field,next\)/);
  assert.match(app,/for\(let i=1;i<=16;i\+\+\)/);
});
check('Safari long-press does not select app controls or block text editors',()=>{
  assert.match(style,/-webkit-touch-callout:none!important/);
  assert.match(style,/-webkit-user-select:none!important/);
  assert.match(app,/const isEditableTarget=/);
  assert.match(app,/document\.addEventListener\('contextmenu'/);
  assert.match(app,/document\.addEventListener\('selectstart'/);
  assert.match(app,/!isEditableTarget\(e\.target\)&&isUiTouchControl\(e\.target\)/);
});
check('old v0.16.8 YouTube and audio fixes retained',()=>{
  assert.ok(read('backing.js').includes('youtubeClear'));
  assert.ok(app.includes('recoverAudioPlayback'));
  assert.ok(html.includes('id="audioRecoveryButton"'));
  assert.ok(html.includes('id="youtubeClear"'));
});
console.log(`PASS v0.16.9: ${count} source invariants`);
