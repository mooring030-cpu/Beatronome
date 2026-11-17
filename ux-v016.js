/* Beatronome v0.16.5 - UX behaviors. Core audio/state is owned by app.js.
   This layer intentionally does not intercept ordinary scrolling, wheel or beat timing. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionOK = () => !reduceMotion.matches && !document.body.classList.contains('performance-ui');

  // Consistent stroke icon family for the More entry cards. Existing nav uses SVG.
  const iconShapes={
    search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
    stage:'<path d="m8 5 11 7-11 7z"/>',
    tools:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    sound:'<path d="M8 5v11a3 3 0 1 1-2-2.8V7l10-2v9a3 3 0 1 1-2-2.8V3"/>',
    presets:'<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L7 14.2l-5-4.9 6.9-1z"/>',
    knowledge:'<path d="M9 3 6 21M18 3l-3 18M4 9h17M3 16h17"/>',
    manual:'<path d="M4 4.5a2 2 0 0 1 2-2H20v18H6a2 2 0 0 0-2 2zM4 5v14a2 2 0 0 1 2-2h14"/>',
    settings:'<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="17" r="2"/>',
    diagnosis:'<circle cx="12" cy="12" r="9"/><path d="M12 6v7M12 17h.01"/>'
  };
  const typeFor=(el)=>el.id==='openGlobalSearch'?'search':el.id==='moreStageMode'?'stage':el.id==='morePracticeTools'?'tools':el.id==='moreSettings'?'settings':el.dataset.openTab==='sound'?'sound':el.dataset.openTab==='presets'?'presets':el.dataset.openTab==='knowledge'?'knowledge':el.dataset.openTab==='manual'?'manual':el.textContent.includes('상태 진단')?'diagnosis':null;
  document.querySelectorAll('#tabMore .more-launch').forEach(el=>{
    const key=typeFor(el),target=el.querySelector(':scope > span');
    if(!key||!target)return;
    target.classList.add('bt-menu-icon');
    target.setAttribute('aria-hidden','true');
    target.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${iconShapes[key]}</svg>`;
  });

  // 1. Small immediate button affordance, with no click cancellation.
  document.addEventListener('pointerdown', ev => {
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    const el = ev.target.closest('button');
    if (!el || el.disabled || el.closest('.stage-overlay')) return;
    el.classList.add('bt-pressed');
  }, {passive:true});
  for (const name of ['pointerup','pointercancel','pointerout'])
    document.addEventListener(name, ev => {
      const el = ev.target.closest?.('button');
      if(el) el.classList.remove('bt-pressed');
    }, {passive:true});

  // 2. Lightweight fade-through for bottom tab navigation; subtle directional
  // entrance for More -> deep pages, no forced scroll or history manipulation.
  let activeId = document.querySelector('.tab-page.active')?.id || 'tabMetronome';
  const childPages = new Set(['tabKnowledge','tabManual','tabPresets','tabSound','tabPracticeTools']);
  const pages = document.querySelectorAll('.tab-page');
  const navObserver = new MutationObserver(() => {
    const node = document.querySelector('.tab-page.active');
    if (!node || activeId === node.id) return;
    const from = activeId; activeId = node.id;
    if(!motionOK()) return;
    node.classList.remove('bt-enter','bt-child');
    // Restart only the targeted transform/opacity animation.
    void node.offsetWidth;
    node.classList.add('bt-enter');
    if(childPages.has(node.id) && from !== node.id)node.classList.add('bt-child');
    setTimeout(() => node.classList.remove('bt-enter','bt-child'),240);
  });
  pages.forEach(node => navObserver.observe(node,{attributes:true,attributeFilter:['class']}));

  // 3. Bottom sheet grab handle: pull DOWN to dismiss; allow native one-finger
  // scrolling anywhere else in the sheet. No global preventDefault listeners.
  for (const overlay of document.querySelectorAll('.modal-backdrop')) {
    const handle = overlay.querySelector('.settings-sheet > .sheet-handle');
    const sheet = overlay.querySelector('.settings-sheet');
    if(!handle || !sheet)continue;
    let drag = null;
    handle.setAttribute('aria-label','설정창 닫기: 아래로 당기기');
    handle.setAttribute('role','button');
    handle.setAttribute('tabindex','0');
    handle.addEventListener('keydown',e=>{if(e.key==='Escape'||e.key==='Enter'){overlay.classList.add('hidden');}});
    handle.addEventListener('pointerdown', e => {
      if(e.pointerType==='mouse' && e.button!==0)return;
      drag={id:e.pointerId,y:e.clientY,dy:0};
      try{handle.setPointerCapture(e.pointerId);}catch{}
    });
    handle.addEventListener('pointermove', e => {
      if(!drag || drag.id!==e.pointerId)return;
      drag.dy=Math.max(0,e.clientY-drag.y);
      if(drag.dy>7){sheet.style.animation='none';sheet.style.transform=`translate3d(0,${Math.min(180,drag.dy)}px,0)`;}
    });
    const end = e => {
      if(!drag)return;
      const distance=drag.dy;
      drag=null;
      sheet.style.removeProperty('transform');
      sheet.style.removeProperty('animation');
      if(distance>88){overlay.classList.add('hidden');}
    };
    handle.addEventListener('pointerup',end);
    handle.addEventListener('pointercancel',end);
  }

  // 4. Static music theory / history cards: explicit detail expand action.
  // Avoid collapsing interactive chord/scale calculators and never hijack links.
  const panels = document.querySelectorAll('.knowledge-panel[data-knowledge-content="basics"],.knowledge-panel[data-knowledge-content="harmony"],.knowledge-panel[data-knowledge-content="jazz"]');
  for(const panel of panels){
    panel.querySelectorAll('.reference-card').forEach((card,index)=>{
      const head=card.querySelector(':scope > .ref-head');
      if(!head || head.querySelector('.ref-expand-toggle'))return;
      let actions=head.querySelector(':scope > .ref-head-actions');
      if(!actions){actions=document.createElement('div');actions.className='ref-head-actions';head.appendChild(actions);}
      const toggle=document.createElement('button');
      toggle.type='button';toggle.className='ref-expand-toggle';
      toggle.textContent='−';
      actions.appendChild(toggle);
      // Default: first reference is visible on small screens; others concise.
      if(window.matchMedia('(max-width:700px)').matches && index!==0)card.classList.add('is-collapsed');
      const sync=()=>{
        const open=!card.classList.contains('is-collapsed');
        toggle.textContent=open?'−':'+';
        toggle.setAttribute('aria-expanded',String(open));
        toggle.setAttribute('aria-label',`${head.querySelector('h3')?.textContent||'정보 카드'} ${open?'접기':'펼치기'}`);
        toggle.title=open?'내용 접기':'내용 펼치기';
      };
      toggle.addEventListener('click',e=>{e.stopPropagation();card.classList.toggle('is-collapsed');sync();});
      sync();
    });
  }

  // 5. Accessible contextual preset controls - long press on touch/pen,
  // right click on desktop, while ordinary short tap still LOADS the preset.
  const backdrop=document.createElement('div');
  backdrop.id='presetContextBackdrop';backdrop.className='preset-context-backdrop hidden';
  backdrop.setAttribute('role','dialog');backdrop.setAttribute('aria-modal','true');
  backdrop.setAttribute('aria-label','프리셋 관리');
  backdrop.innerHTML=`<div class="preset-context-panel">
    <h3 id="presetContextTitle">프리셋 관리</h3>
    <p>길게 누르기 · 오른쪽 클릭으로 빠르게 관리할 수 있습니다.</p>
    <input id="presetContextName" type="text" maxlength="90" aria-label="프리셋 이름">
    <div class="preset-context-actions">
      <button type="button" class="bt-gold" id="presetContextApply">적용</button>
      <button type="button" id="presetContextRename">이름 저장</button>
      <button type="button" id="presetContextCopy">복제</button>
      <button type="button" class="bt-danger" id="presetContextDelete">삭제</button>
    </div>
    <button type="button" class="preset-context-close" id="presetContextClose">닫기</button>
  </div>`;
  document.body.appendChild(backdrop);
  let chosen=null,trigger=null,deleteArmed=false;
  let focusBefore=null;
  const close=()=>{backdrop.classList.add('hidden');document.body.classList.remove('bt-preset-open');chosen=null;deleteArmed=false;trigger=null;focusBefore?.focus?.();};
  const open=(id,element)=>{
    const api=window.BeatronomeAPI;
    const item=api?.listPresetSummaries?.().find(p=>String(p.id)===String(id));
    if(!item)return;
    chosen=item.id;trigger=element;focusBefore=document.activeElement;
    deleteArmed=false;
    $('presetContextTitle').textContent=item.name;
    $('presetContextName').value=item.name;
    $('presetContextDelete').textContent='삭제';
    backdrop.classList.remove('hidden');document.body.classList.add('bt-preset-open');
    $('presetContextName').focus({preventScroll:true});
  };
  $('presetContextClose').addEventListener('click',close);
  backdrop.addEventListener('click',e=>{if(e.target===backdrop)close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!backdrop.classList.contains('hidden')){e.preventDefault();close();}});
  $('presetContextApply').addEventListener('click',()=>{if(chosen){window.BeatronomeAPI?.loadPresetById?.(chosen);close();}});
  $('presetContextRename').addEventListener('click',()=>{if(chosen&&window.BeatronomeAPI?.renamePresetById?.(chosen,$('presetContextName').value))close();});
  $('presetContextCopy').addEventListener('click',()=>{if(chosen){window.BeatronomeAPI?.duplicatePresetById?.(chosen);close();}});
  $('presetContextDelete').addEventListener('click',()=>{
    if(!chosen)return;
    if(!deleteArmed){deleteArmed=true;$('presetContextDelete').textContent='삭제 확인';return;}
    window.BeatronomeAPI?.deletePresetById?.(chosen);close();
  });
  const selectable=e=>e.target.closest?.('.preset-card .preset-main,.quick-preset-list button[data-preset-id]');
  let hold=null, suppressUntil=0;
  document.addEventListener('pointerdown',e=>{
    const btn=selectable(e);if(!btn||e.pointerType==='mouse'&&e.button!==0)return;
    const id=btn.closest('[data-preset-id]')?.dataset.presetId;
    if(!id)return;
    hold={id,btn,x:e.clientX,y:e.clientY,pointerId:e.pointerId,triggered:false};
    hold.timer=setTimeout(()=>{
      if(!hold ||hold.pointerId!==e.pointerId)return;
      hold.triggered=true;suppressUntil=performance.now()+900;
      if(navigator.vibrate)try{navigator.vibrate(14);}catch{}
      open(id,btn);
    },530);
  },{passive:true});
  document.addEventListener('pointermove',e=>{
    if(hold&&e.pointerId===hold.pointerId&&Math.hypot(e.clientX-hold.x,e.clientY-hold.y)>14){clearTimeout(hold.timer);hold=null;}
  },{passive:true});
  const endHold=e=>{if(hold&&e.pointerId===hold.pointerId){clearTimeout(hold.timer);hold=null;}};
  document.addEventListener('pointerup',endHold,{passive:true});
  document.addEventListener('pointercancel',endHold,{passive:true});
  document.addEventListener('click',e=>{
    const btn=selectable(e);
    if(btn && performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();suppressUntil=0;}
  },true);
  document.addEventListener('contextmenu',e=>{
    const btn=selectable(e);if(!btn)return;
    const id=btn.closest('[data-preset-id]')?.dataset.presetId;
    if(!id)return;e.preventDefault();open(id,btn);
  });
  // Expose diagnostics-friendly, non-sensitive UI status.
  window.BeatronomeUX={version:'0.16.5',getState:()=>({motionEnabled:motionOK(),selectedTab:activeId,presetMenuOpen:!backdrop.classList.contains('hidden')})};
})();
