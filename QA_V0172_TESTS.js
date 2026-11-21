'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const dir=__dirname,read=f=>fs.readFileSync(path.join(dir,f),'utf8');
const html=read('index.html'),back=read('backing.js'),stem=read('stem-separation.js'),worker=read('stem-worker.js'),sw=read('sw.js'),app=read('app.js');
let passed=0;
function test(name,fn){return Promise.resolve().then(fn).then(()=>{console.log('PASS',name);passed++;});}
function extract(input,start,end){const a=input.indexOf(start),b=input.indexOf(end,a+start.length);assert(a>=0&&b>a,`${start} / ${end}`);return input.slice(a,b);}
(async()=>{
  await test('version and worker offline shell',()=>{
    assert(app.includes("const APP_VERSION='0.17.2'"));assert(sw.includes("const VERSION = '0.17.2'"));
    assert(sw.includes("'stem-worker.js'"));assert(html.includes('stem-separation.js?v=0.17.2'));
  });
  await test('full track UI has no clip selectors or importing split files',()=>{
    for(const s of ['stemStartSec','stemEndSec','stemImport'])assert(!html.includes(s),s);
    assert(html.includes('음원 전체 AI 분리'));assert(stem.includes('decodeEntireFile'));
    assert(stem.includes("start:0,end:result.duration"));
  });
  await test('YouTube guide and Premium navigation are removed',()=>{
    for(const s of ['youtubeOpenOnYoutube','youtubeToMyFile','youtube-premium-help','youtube-stem-info','Premium 계정'])assert(!html.includes(s),s);
    assert(!back.includes('youtubeOpenOnYoutube'));assert(!back.includes('youtubeToMyFile'));
  });
  await test('loop inputs use mm:ss and settings preserve second-based storage',()=>{
    assert(html.includes('placeholder="00:00"'));assert(html.includes('placeholder="03:50"'));
    assert(back.includes('parseLoopTime(rawA)'));
    const code=extract(back,'  const formatLoopTime=value=>{','  function renderYoutubeLoop(){');
    const ctx={};vm.createContext(ctx);vm.runInContext(code+';globalThis.testFormat=formatLoopTime;globalThis.testParse=parseLoopTime;',ctx);
    assert.equal(ctx.testParse('00:00'),0);assert.equal(ctx.testParse('03:50'),230);
    assert.equal(ctx.testParse('01:02:30'),3750);assert.equal(ctx.testParse('00:61'),NaN);
    assert.equal(ctx.testFormat(230),'03:50');assert.equal(ctx.testFormat(53.1),'00:53');
    assert.equal(ctx.testFormat(3750),'01:02:30');
  });
  await test('MY FILE master volume always visible and shares existing gain logic',()=>{
    assert.equal([...html.matchAll(/id="backingVolume"/g)].length,1);
    assert(html.indexOf('id="backingVolume"')<html.indexOf('class="backing-advanced"'));
    assert(html.includes('id="backingVolumeValue"'));
    assert(back.includes("$('backingVolumeValue').textContent=`${s.volume}%`"));
    assert(back.includes("gain.gain.setTargetAtTime(s.volume/100"));
    assert(back.includes("$('backingVolume').oninput=e=>{s.volume="));
  });
  await test('dedicated worker cancellation and errors preserve original',()=>{
    assert(stem.includes('new Worker(\'./stem-worker.js?v=0.17.2\''));
    assert(stem.includes('worker.terminate()'));assert(stem.includes('원본 재생은 계속 가능합니다'));
    assert(worker.includes('session?.release()'));assert(worker.includes('await session.run'));
  });
  await test('WAV chunk overlap produces exact full duration with mocked six-stem model',async()=>{
    const SEG=343980,STRIDE=SEG-Math.floor(SEG/4),n=STRIDE+2048;
    const outputs=[];const fake={env:{wasm:{}},Tensor:function(type,data,shape){this.data=data;this.dims=shape;},InferenceSession:{create:async()=>({run:async()=>{
      const data=new Float32Array(6*2*SEG);for(let k=0;k<6;k++){data.fill(.125,k*2*SEG,k*2*SEG+SEG);data.fill(-.125,k*2*SEG+SEG,(k+1)*2*SEG);}
      return {stems:{data}};
    },release:async()=>{}})}};
    const code=worker.replace("import(ORT_URL+'ort.min.mjs')","Promise.resolve(self.__testOrt)");
    const self={__testOrt:fake,postMessage:m=>outputs.push(m)};
    const ctx={self,Blob,Uint8Array,Float32Array,DataView,ArrayBuffer,Math,Promise,console,setTimeout};
    vm.createContext(ctx);vm.runInContext(code,ctx);
    await self.onmessage({data:{type:'separate',left:new Float32Array(n).buffer,right:new Float32Array(n).buffer}});
    assert.equal(outputs.at(-1).type,'done',JSON.stringify(outputs.at(-1)));
    assert.equal(outputs.at(-1).tracks.length,6);
    for(const track of outputs.at(-1).tracks){
      assert.equal(track.blob.size,44+n*4,'full song encoded length');
      const header=new DataView(await track.blob.slice(0,44).arrayBuffer());
      assert.equal(header.getUint32(40,true),n*4);
      assert.equal(header.getUint16(22,true),2);
      const raw=new DataView(await track.blob.arrayBuffer());
      for(const frame of [0,STRIDE-5,STRIDE,STRIDE+500,n-1]){
        assert.equal(raw.getInt16(44+frame*4,true),4096,`left sample ${frame}`);
        assert.equal(raw.getInt16(46+frame*4,true),-4096,`right sample ${frame}`);
      }
    }
  });
  await test('ABORTED WASM is reported as recoverable error, not permanent lock',async()=>{
    const outputs=[];
    const code=worker.replace("import(ORT_URL+'ort.min.mjs')", "Promise.resolve(self.__testOrt)");
    const self={__testOrt:{env:{wasm:{}},InferenceSession:{create:async()=>{throw Error('Aborted() - WebAssembly memory');}}},postMessage:m=>outputs.push(m)};
    const ctx={self,Blob,Uint8Array,Float32Array,DataView,ArrayBuffer,Math,Promise,console,setTimeout};
    vm.createContext(ctx);vm.runInContext(code,ctx);
    await self.onmessage({data:{type:'separate',left:new Float32Array(8).buffer,right:new Float32Array(8).buffer}});
    const err=outputs.at(-1);
    assert.equal(err.type,'error');assert.equal(err.stage,'memory');
    assert.match(err.message,/메모리|WebAssembly/);
    assert(!err.message.includes('Aborted()'));
    assert(stem.includes('worker.terminate()'));
    assert(stem.includes("$('stemGenerate').disabled=false"));
  });
  await test('compact interaction UI: explicit stop, immediate sync, stage columns, swapped core order',()=>{
    for(const id of ['youtubeMetroStop','backingMetroStop','youtubeResync','youtubeSpeedMinus','youtubeSpeedNumber','stemStudio'])assert(html.includes(`id="${id}"`),id);
    assert(html.indexOf('class="meter-chain-panel card"')<html.indexOf('class="core-setting-strip card inline-core-settings"'));
    assert(html.indexOf('class="youtube-stage-grid"')<html.indexOf('id="youtubePlayerWrap"'));
    assert(html.indexOf('id="youtubePlayerWrap"')<html.indexOf('id="youtubeResync"'));
    assert(back.includes('window.BeatronomeAPI.stop()'));
    assert(!html.includes('youtube-premium-help')&&!html.includes('youtube-stem-info'));
    assert(stem.includes('if(decoded.sampleRate!==44100)'));
  });
  console.log(`v0.17.2 unit/simulated tests: ${passed} PASS`);
})().catch(err=>{console.error(err);process.exitCode=1;});
