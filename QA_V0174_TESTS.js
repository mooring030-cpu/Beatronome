/** v0.17.4 maintenance tests: no hidden AI engine, music volume stays enabled. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=__dirname;
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html'),back=read('backing.js'),app=read('app.js'),sw=read('sw.js'),css=read('beatronome.bundle.css');
let passed=0;
function test(name,fn){fn();console.log('PASS',name);passed++;}
test('v0.17.4 version alignment',()=>{
  assert.match(app,/const APP_VERSION='0\.17\.4'/);
  assert.match(sw,/const VERSION = '0\.17\.4'/);
  assert.match(html,/v0\.17\.4/);
  assert.match(html,/beatronome\.bundle\.css\?v=0\.17\.4/);
});
test('AI feature and PC server removed from published source',()=>{
  for(const f of ['stem-separation.js','stem-worker.js','fix-v0173.css','AI_BACKEND/server.py','AI_BACKEND/start_windows.bat'])
    assert.ok(!fs.existsSync(path.join(root,f)),f);
  for(const t of ['stemStudio','stemGenerate','stem-worker','stem-separation','AI_BACKEND','stemEngineStatus','stemMixer']){
    for(const [n,s] of Object.entries({html,back,sw}))assert.ok(!s.includes(t),`${t} in ${n}`);
  }
  assert.ok(!/\.(?:stem-|youtube-stem-|stemStudio)/i.test(css));
});
test('MY FILE master volume and saved settings remain',()=>{
  assert.match(html,/id="backingVolume"/);
  assert.match(html,/id="backingVolumeValue"/);
  assert.match(html,/min="0" max="100" value="90" step="1"/);
  assert.match(back,/volume:90/);
  assert.match(back,/s\.fileProfiles\[localTrackKey\]=\{speed:s\.speed,key:s\.key,volume:s\.volume/);
  assert.match(back,/\$\('backingVolume'\)\.oninput=/);
  assert.match(back,/gain\.gain\.setTargetAtTime\(s\.volume\/100,ctx\.currentTime/);
  assert.match(back,/const STORE_KEY='beatronome-backing-v1'/);
});
test('Original audio source connects directly to pitch and master gain',()=>{
  assert.match(back,/mediaSource\.connect\(pitch\.input\);pitch\.output\.connect\(gain\);gain\.connect\(ctx\.destination\)/);
  assert.ok(!back.includes('originalGain')&&!back.includes('stemTracks'));
  assert.match(back,/const mediaPromise=m\.play\(\)/);
  assert.match(back,/Promise\.resolve\(mediaPromise\)/);
});
test('YouTube and MY FILE transport, loop, metronome controls survive',()=>{
  for(const id of ['youtubeUrl','youtubeLoad','youtubeClear','youtubePlayTogether','youtubeMetroStop','youtubeLoopStartSeconds','youtubeLoopEndSeconds','youtubeLoopApply','youtubeResync','backingFile','backingSpeed','backingKey','backingPlay','backingPlayTogether','backingMetroStop','backingLoopToggle','localResync'])
    assert.ok(html.includes(`id="${id}"`),id);
  assert.match(back,/parseLoopTime/);
  assert.match(back,/function startLocalMedia\(withMetro=false\)/);
});
test('PWA does not precache removed AI artifacts',()=>{
  assert.ok(!sw.includes('stem-separation.js')&&!sw.includes('stem-worker.js'));
  for(const f of ['app.js','backing.js','quality.js','manifest.webmanifest'])assert.ok(sw.includes(`'${f}'`),f);
});
console.log(`v0.17.4 maintenance checks: ${passed}/${passed} PASS`);
