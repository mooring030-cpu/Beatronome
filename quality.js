/* Beatronome settings navigation, diagnostics and recovery (runtime version via BeatronomeAPI).
   No credential values are collected or included in diagnostics. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const sheet=$('settingsModal')?.querySelector('.settings-sheet');
  if(!sheet)return;
  const currentItems=Array.from(sheet.children).filter(el=>el.matches('.settings-item,.version-note'));
  const categories=[
    {id:'display',label:'화면·디자인',desc:'테마, 화면 크기, 저사양 최적화',tokens:['themeSelect','performanceToggle','interfaceSize']},
    {id:'audio',label:'사운드',desc:'소리·영상 동기화 설정',tokens:['latencyCalibration']},
    {id:'practice',label:'연습·조작',desc:'화면 유지, 한손 조작, 무대 기능',tokens:['settingsMiniMode','oneHandToggle','stageTapToggle','replayOnboarding']},
    {id:'data',label:'저장·동기화',desc:'프리셋, Cloud Sync, 안전한 백업',tokens:['cloudSignedOut']},
    {id:'app',label:'앱 관리',desc:'오프라인, 업데이트, 문제 진단',tokens:['prepareOffline','appUpdateTitle','resetSettings']}
  ];
  const categoryByToken=Object.fromEntries(categories.flatMap(c=>c.tokens.map(t=>[t,c.id])));
  const nav=document.createElement('div');nav.className='settings-category-nav';nav.setAttribute('role','tablist');nav.setAttribute('aria-label','설정 카테고리');
  const panels=new Map();
  for(const cat of categories){
    const button=document.createElement('button');button.type='button';button.dataset.settingCategory=cat.id;button.textContent=cat.label;button.setAttribute('role','tab');nav.appendChild(button);
    const panel=document.createElement('section');panel.className='settings-category-panel';panel.id=`settings-category-${cat.id}`;panel.setAttribute('role','tabpanel');
    const intro=document.createElement('p');intro.className='settings-category-intro';intro.textContent=cat.desc;panel.appendChild(intro);panels.set(cat.id,panel);
  }
  sheet.querySelector('.page-title')?.after(nav);
  let insertAfter=nav;
  for(const cat of categories){const panel=panels.get(cat.id);insertAfter.after(panel);insertAfter=panel;}
  function classify(item){
    if(item.classList.contains('version-note'))return 'app';
    for(const [id,cat] of Object.entries(categoryByToken))if(item.querySelector(`#${id}`))return cat;
    const txt=(item.textContent||'').toLowerCase();
    if(/pwa 홈|화면 자동 꺼짐/.test(txt))return txt.includes('PWA')?'app':'practice';
    if(/오프라인|업데이트|초기화|버전/.test(txt))return 'app';
    if(/클라우드|cloud|backup|백업/.test(txt))return 'data';
    if(/사운드|볼륨|오디오|audio/.test(txt))return 'audio';
    if(/theme|디자인|interface|성능/.test(txt))return 'display';
    return 'practice';
  }
  currentItems.forEach(item=>panels.get(classify(item)).appendChild(item));
  let current='display';
  function select(id){
    current=id;
    nav.querySelectorAll('button').forEach(b=>{const active=b.dataset.settingCategory===id;b.classList.toggle('active',active);b.setAttribute('aria-selected',active?'true':'false');});
    panels.forEach((panel,key)=>panel.classList.toggle('active',key===id));
    sheet.scrollTop=0;
  }
  nav.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>select(b.dataset.settingCategory)));
  select('display');

  // Keep the settings header/navigation visible; restore scroll position and allow
  // scrolling the independent sheet without affecting the fixed bottom navigation.
  const overlay=$('settingsModal');
  const modalWatcher=new MutationObserver(()=>{if(!overlay.classList.contains('hidden'))requestAnimationFrame(()=>{sheet.scrollTop=0;});});
  modalWatcher.observe(overlay,{attributes:true,attributeFilter:['class']});

  const panel=panels.get('app');
  const block=document.createElement('div');block.className='card quality-report';block.id='qualityCenter';
  block.innerHTML=`<div class="section-heading"><div><span class="eyebrow">QUALITY CENTER</span><h3>상태 진단 · 문제 보고</h3></div><span class="quality-chip">v${window.BeatronomeAPI?.getVersion?.()||'0.17.1'}</span></div>
    <p class="quality-note">메트로놈·튜너·연습 중 발생한 문제를 확인합니다. 진단 결과에는 비밀번호, 로그인 토큰, 저장한 곡명 및 프리셋 내용이 포함되지 않습니다.</p>
    <div class="quality-actions"><button type="button" id="qualityRun" class="primary">상태 진단</button><button type="button" id="qualityAudio">클릭 간격 듣기</button><button type="button" id="qualityCopy">결과 복사</button><button type="button" id="qualityDownload">진단 파일 저장</button></div>
    <pre class="quality-result" id="qualityResult" aria-live="polite">[상태 진단]을 눌러 현재 기기와 앱 상태를 확인하세요.</pre>
    <p class="quality-note">오디오 테스트는 120 BPM · 8박을 Web Audio 시계에 예약해 들려줍니다. 예약 간격만 확인하며 실제 스피커/블루투스의 출력 지연을 자동 측정하는 것은 아닙니다.</p>
    <div class="quality-actions"><button type="button" id="qualityRecover">동기화 전 백업 복원</button></div>`;
  panel.appendChild(block);
  let report=null;
  const result=$('qualityResult');
  async function collect(){
    const api=window.BeatronomeAPI;
    const overlayStatus={};
    for(const name of ['coreSettingsModal','settingsModal','globalSearchOverlay','onboardingOverlay']){
      const el=$(name),content=el?.querySelector('.settings-sheet,.core-settings-sheet,.search-palette,.onboarding-card');
      overlayStatus[name]={exists:!!el,hasScrollContainer:!!content};
    }
    let storageWorks=false;try{const key='beatronome-diagnostic-test';localStorage.setItem(key,'ok');storageWorks=localStorage.getItem(key)==='ok';localStorage.removeItem(key);}catch{}
    let offlineReady=null;
    if(navigator.serviceWorker?.controller){
      try{
        offlineReady=await Promise.race([new Promise(resolve=>{const chan=new MessageChannel();chan.port1.onmessage=e=>resolve({version:e.data?.version,ready:e.data?.ready,cached:e.data?.cached,total:e.data?.total});navigator.serviceWorker.controller.postMessage({type:'GET_OFFLINE_STATUS'},[chan.port2]);}),new Promise(resolve=>setTimeout(()=>resolve({error:'timeout'}),2800))]);
      }catch{offlineReady={error:'not-available'};}
    }
    report={
      version:api?.getVersion?.()||'unknown',checkedAt:new Date().toISOString(),
      device:{viewport:[innerWidth,innerHeight],screen:[screen.width,screen.height],pixelRatio:devicePixelRatio,platform:navigator.platform||'unknown',userAgent:navigator.userAgent},
      environment:{online:navigator.onLine,secureContext:isSecureContext,audioContextSupported:!!(window.AudioContext||window.webkitAudioContext),mediaDevicesSupported:!!navigator.mediaDevices?.getUserMedia,wakeLockSupported:!!navigator.wakeLock,storageWorks,serviceWorkerControlled:!!navigator.serviceWorker?.controller,offlineCache:offlineReady},
      app:api?.getDebugSnapshot?.()||{},audioTiming:api?.getTimingStats?.()||null,recoveryBackups:api?.getRecoveryCount?.()||0,
      overlays:overlayStatus,
      menuCount:document.querySelectorAll('.bottom-nav button').length,
      appHorizontalOverflow:document.documentElement.scrollWidth>innerWidth+3
    };
    const lines=[`Beatronome ${report.version} | ${report.checkedAt}`,`크기 ${innerWidth} × ${innerHeight} / 화면 너비 초과: ${report.appHorizontalOverflow?'있음':'없음'}`,
    `오프라인 캐시 ${offlineReady?`${offlineReady.cached||0}/${offlineReady.total||'?'} (${offlineReady.ready?'READY':'확인 필요'})`:'SW 제어 전'}`,
    `저장소 ${storageWorks?'정상':'사용 불가'} / 오디오 ${report.environment.audioContextSupported?'지원':'미지원'} / 마이크 ${report.environment.mediaDevicesSupported?'지원':'미지원'}`,
    `백업 ${report.recoveryBackups}개 / Cloud 연결 ${report.app.cloudConnected?'예':'아니오'}`,
    `오디오 예약 간격 평균오차 ${report.audioTiming?.meanIntervalErrorMs??'—'}ms / 복구 ${report.audioTiming?.recoveries??'—'}회 (실제 스피커 지연은 측정하지 않음)`,
    '------ 상세 정보 (복사/파일 저장 가능) ------',JSON.stringify(report,null,2)];
    result.textContent=lines.join('\n');return report;
  }
  $('qualityRun').onclick=collect;
  $('qualityCopy').onclick=async()=>{if(!report)await collect();try{await navigator.clipboard.writeText(result.textContent);window.BeatronomeAPI?.notify?.('진단 결과가 복사되었습니다.');}catch{window.BeatronomeAPI?.notify?.('복사가 차단되었습니다. 파일 저장을 사용하세요.');}};
  $('qualityDownload').onclick=async()=>{if(!report)await collect();const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Beatronome_diagnostic_${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),300);};
  $('qualityRecover').onclick=()=>{const api=window.BeatronomeAPI;if(!api?.getRecoveryCount?.()){window.BeatronomeAPI?.notify?.('이 기기에 동기화 전 백업이 없습니다.');return;}if(api.restoreCloudSafetyBackup()){window.BeatronomeAPI?.notify?.('기기 백업을 복원했습니다.');collect();}};
  $('qualityAudio').onclick=async()=>{
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx){window.BeatronomeAPI?.notify?.('이 기기는 Web Audio를 지원하지 않습니다.');return;}
    const ctx=new Ctx({latencyHint:'interactive'});
    try{
      await ctx.resume();const start=ctx.currentTime+.07;
      for(let i=0;i<8;i++){
        const at=start+i*.5,osc=ctx.createOscillator(),gain=ctx.createGain();
        osc.type='square';osc.frequency.value=i%4===0?1046:880;
        gain.gain.setValueAtTime(.00001,at);gain.gain.exponentialRampToValueAtTime(.08,at+.002);gain.gain.exponentialRampToValueAtTime(.00001,at+.045);
        osc.connect(gain).connect(ctx.destination);osc.start(at);osc.stop(at+.055);
      }
      window.BeatronomeAPI?.notify?.('120 BPM · 8박 오디오 테스트');
      setTimeout(()=>ctx.close().catch(()=>{}),4500);
    }catch(e){try{await ctx.close();}catch{}window.BeatronomeAPI?.notify?.('오디오 테스트에 실패했습니다.');}
  };
  // Navigation convenience for diagnosis from More menu. No duplicate bottom tab.
  const moreGrid=document.querySelector('#tabMore .more-grid');
  if(moreGrid){const b=document.createElement('button');b.className='more-launch card';b.type='button';b.innerHTML='<span>◉</span><strong>앱 상태 진단</strong><small>스크롤·오디오·오프라인 상태</small>';b.onclick=()=>{overlay.classList.remove('hidden');select('app');setTimeout(()=>block.scrollIntoView({block:'nearest',behavior:'auto'}),80);};moreGrid.appendChild(b);}
})();
