(() => {
  'use strict';

  const BPM_MIN = 30;
  const BPM_MAX = 300;
  const SETTINGS_KEY = 'beatronome-settings-v2';
  const OLD_SETTINGS_KEY = 'beatronome-settings-v1';
  const PRESETS_KEY = 'beatronome-presets-v2';
  const OLD_PRESETS_KEY = 'beatronome-presets-v1';

  const SOUND_LABELS = {
    classic: 'Classic Click',
    wood: 'Wood Block',
    digital: 'Digital',
    clave: 'Clave',
    cowbell: 'Cowbell',
    rim: 'Rim',
    beep: 'Beep'
  };

  const makePattern = (beats) => Array.from({ length: beats }, (_, i) => i === 0 ? 'accent' : 'normal');
  const makeMeter = (beats = 4, denominator = 4, pattern) => ({
    id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
    beats,
    denominator,
    pattern: Array.isArray(pattern) ? pattern.slice(0, beats) : makePattern(beats)
  });

  const defaults = {
    bpm: 120,
    beatsPerBar: 4,
    denominator: 4,
    subdivision: 1,
    sound: 'classic',
    volume: .82,
    pattern: makePattern(4),
    meterChainEnabled: false,
    meterChain: [],
    training: {
      randomMuteEnabled: false,
      randomMute: 25,
      internalEnabled: false,
      soundBars: 4,
      muteBars: 2,
      autoTempoEnabled: false,
      tempoStep: 5,
      everyBars: 4,
      targetBpm: 160,
      tempoMode: 'up',
      timerEnabled: false,
      timerMinutes: 10,
      gradualEnabled: false,
      gradualTarget: 70,
      gradualSeconds: 120
    }
  };

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const load = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  function normalizePattern(pattern, beats) {
    return Array.from({ length: beats }, (_, i) => {
      const v = Array.isArray(pattern) ? pattern[i] : null;
      return ['accent', 'normal', 'mute'].includes(v) ? v : (i === 0 ? 'accent' : 'normal');
    });
  }

  function normalizeMeter(m) {
    const beats = clamp(Number(m?.beats) || 4, 1, 16);
    const denominator = [2, 4, 8, 16].includes(Number(m?.denominator)) ? Number(m.denominator) : 4;
    return {
      id: m?.id || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
      beats,
      denominator,
      pattern: normalizePattern(m?.pattern, beats)
    };
  }

  function deepMerge(base, obj) {
    const merged = {
      ...base,
      ...(obj || {}),
      training: { ...base.training, ...(obj?.training || {}) }
    };
    merged.beatsPerBar = clamp(Number(merged.beatsPerBar) || 4, 1, 16);
    merged.denominator = [2, 4, 8, 16].includes(Number(merged.denominator)) ? Number(merged.denominator) : 4;
    merged.pattern = normalizePattern(obj?.pattern || base.pattern, merged.beatsPerBar);
    merged.meterChain = Array.isArray(obj?.meterChain) ? obj.meterChain.map(normalizeMeter) : [];
    merged.meterChainEnabled = !!obj?.meterChainEnabled;
    if (merged.meterChainEnabled && !merged.meterChain.length) {
      merged.meterChain = [normalizeMeter({ beats: merged.beatsPerBar, denominator: merged.denominator, pattern: merged.pattern })];
    }
    return merged;
  }

  const savedSettings = localStorage.getItem(SETTINGS_KEY) ? load(SETTINGS_KEY, {}) : load(OLD_SETTINGS_KEY, {});
  let state = deepMerge(defaults, savedSettings);
  let presets = localStorage.getItem(PRESETS_KEY) ? load(PRESETS_KEY, []) : load(OLD_PRESETS_KEY, []);

  let playing = false;
  let currentBeat = -1;
  let elapsed = 0;
  let trainingExpanded = true;
  let selectedChainIndex = 0;
  let playbackChainIndex = 0;
  let visualChainIndex = -1;

  let audioCtx = null;
  let master = null;
  let scheduler = null;
  let nextNoteTime = 0;
  let stepIndex = 0;
  let barIndex = 0;
  let startTime = 0;
  let sessionBaseBpm = state.bpm;
  let tempoDir = 1;
  let wakeLock = null;
  let visualQueue = [];
  let rafId = null;
  let tapTimes = [];
  let toastTimer = null;
  let drag = null;
  let dialDragging = false;
  let repeatDelay = null;
  let repeatTimer = null;

  function persist() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state));
  }

  function persistPresets() {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  }

  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  }

  function tempoName(b) {
    return b < 60 ? 'LARGO' : b < 76 ? 'ADAGIO' : b < 108 ? 'ANDANTE' : b < 120 ? 'MODERATO' : b < 168 ? 'ALLEGRO' : 'PRESTO';
  }

  function notify(msg) {
    $('toast').textContent = msg;
    $('toast').classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.add('hidden'), 1800);
  }

  function ensureNormalPattern() {
    state.pattern = normalizePattern(state.pattern, state.beatsPerBar);
  }

  function ensureChain() {
    if (!state.meterChain.length) {
      state.meterChain = [normalizeMeter({
        beats: state.beatsPerBar,
        denominator: state.denominator,
        pattern: state.pattern
      })];
    }
    state.meterChain = state.meterChain.map(normalizeMeter);
    selectedChainIndex = clamp(selectedChainIndex, 0, state.meterChain.length - 1);
  }

  function getSelectedMeter() {
    if (state.meterChainEnabled) {
      ensureChain();
      return state.meterChain[selectedChainIndex];
    }
    return {
      beats: state.beatsPerBar,
      denominator: state.denominator,
      pattern: state.pattern
    };
  }

  function getPlaybackMeter() {
    if (state.meterChainEnabled) {
      ensureChain();
      playbackChainIndex = clamp(playbackChainIndex, 0, state.meterChain.length - 1);
      return state.meterChain[playbackChainIndex];
    }
    return {
      beats: state.beatsPerBar,
      denominator: state.denominator,
      pattern: state.pattern
    };
  }

  function setSelectedMeterField(key, value) {
    if (state.meterChainEnabled) {
      ensureChain();
      const meter = state.meterChain[selectedChainIndex];
      if (key === 'beats') {
        meter.beats = clamp(Number(value), 1, 16);
        meter.pattern = normalizePattern(meter.pattern, meter.beats);
      } else if (key === 'denominator') {
        meter.denominator = Number(value);
      }
    } else {
      if (key === 'beats') {
        state.beatsPerBar = clamp(Number(value), 1, 16);
        ensureNormalPattern();
      } else if (key === 'denominator') {
        state.denominator = Number(value);
      }
    }
    persist();
  }

  function setBpm(v) {
    state.bpm = clamp(Math.round(v), BPM_MIN, BPM_MAX);
    persist();
    renderCore();
  }

  function setTraining(key, value) {
    state.training[key] = value;
    persist();
    renderTraining();
    renderCore();
  }

  function updateSessionStatus() {
    const remain = Math.max(0, state.training.timerMinutes * 60 - elapsed);
    $('sessionStatus').textContent = playing
      ? (state.training.timerEnabled ? `남은 ${fmtTime(remain)}` : `연습 ${fmtTime(elapsed)}`)
      : 'READY';
  }

  function updateActiveBeat() {
    document.querySelectorAll('.beat-dot').forEach((el, i) => {
      el.classList.toggle('active', playing && currentBeat === i);
    });
  }

  function syncMeterControls() {
    const meter = getSelectedMeter();
    $('beatsPerBar').value = meter.beats;
    $('denominator').value = meter.denominator;
  }

  function chainSummary() {
    if (!state.meterChainEnabled || !state.meterChain.length) return '';
    const visible = state.meterChain.slice(0, 5).map(m => `${m.beats}/${m.denominator}`).join(' → ');
    return `${visible}${state.meterChain.length > 5 ? ' → …' : ''}`;
  }

  function renderCore() {
    ensureNormalPattern();
    if (state.meterChainEnabled) ensureChain();

    const meter = getSelectedMeter();
    const chainPos = state.meterChainEnabled ? ` · ${selectedChainIndex + 1}/${state.meterChain.length}` : '';

    $('bpmValue').textContent = state.bpm;
    $('tempoName').textContent = tempoName(state.bpm);
    $('meterTop').textContent = `${meter.beats}/${meter.denominator}${chainPos}`;
    $('meterTitle').textContent = `${meter.beats}/${meter.denominator}`;
    $('subdivision').value = state.subdivision;
    syncMeterControls();

    const sub = state.subdivision === 1 ? 'Quarter' : state.subdivision === 2 ? '8th' : state.subdivision === 3 ? 'Triplet' : '16th';
    $('soundSummary').textContent = state.meterChainEnabled
      ? `${SOUND_LABELS[state.sound]} · ${sub} · Chain ${state.meterChain.length}`
      : `${SOUND_LABELS[state.sound]} · ${sub}`;

    $('playButton').classList.toggle('playing', playing);
    $('playIcon').textContent = playing ? 'Ⅱ' : '▶';
    $('playLabel').textContent = playing ? 'STOP' : 'START';
    updateSessionStatus();

    const angle = -135 + (state.bpm - BPM_MIN) / (BPM_MAX - BPM_MIN) * 270;
    $('tempoDial').style.setProperty('--angle', `${angle}deg`);

    renderBeats();
    renderMeterChain();
  }

  function renderBeats() {
    const meter = getSelectedMeter();
    meter.pattern = normalizePattern(meter.pattern, meter.beats);
    if (!state.meterChainEnabled) state.pattern = meter.pattern;

    const g = $('beatGrid');
    g.style.gridTemplateColumns = `repeat(${Math.min(meter.beats, 8)},1fr)`;
    g.innerHTML = '';

    meter.pattern.forEach((s, i) => {
      const b = document.createElement('button');
      b.className = `beat-dot ${s}${playing && currentBeat === i ? ' active' : ''}`;
      b.innerHTML = `<span>${i + 1}</span><i>${s === 'accent' ? 'A' : s === 'mute' ? '×' : '•'}</i>`;
      b.onclick = () => {
        if (playing) stop();
        const target = getSelectedMeter();
        const current = target.pattern[i];
        target.pattern[i] = current === 'accent' ? 'normal' : current === 'normal' ? 'mute' : 'accent';
        if (!state.meterChainEnabled) state.pattern = target.pattern;
        persist();
        renderBeats();
        renderMeterChain();
      };
      g.appendChild(b);
    });
  }

  function renderMeterChain() {
    const toggle = $('meterChainToggle');
    const body = $('meterChainBody');
    toggle.classList.toggle('on', state.meterChainEnabled);
    body.classList.toggle('hidden', !state.meterChainEnabled);

    if (!state.meterChainEnabled) return;
    ensureChain();

    const list = $('meterChainList');
    list.innerHTML = '';
    state.meterChain.forEach((meter, i) => {
      const btn = document.createElement('button');
      const accents = meter.pattern.filter(x => x === 'accent').length;
      const mutes = meter.pattern.filter(x => x === 'mute').length;
      btn.className = `meter-chain-chip${i === selectedChainIndex ? ' selected' : ''}${playing && i === visualChainIndex ? ' playing-meter' : ''}`;
      btn.innerHTML = `<span class="chain-number">${i + 1}</span><strong>${meter.beats}/${meter.denominator}</strong><small>${accents}A${mutes ? ` · ${mutes}M` : ''}</small>`;
      btn.onclick = () => {
        if (playing) stop();
        selectedChainIndex = i;
        currentBeat = -1;
        renderCore();
      };
      list.appendChild(btn);
    });

    $('chainMoveLeft').disabled = selectedChainIndex <= 0;
    $('chainMoveRight').disabled = selectedChainIndex >= state.meterChain.length - 1;
    $('chainDelete').disabled = state.meterChain.length <= 1;
  }

  function addMeter(beats, denominator) {
    if (playing) stop();
    ensureChain();
    const meter = makeMeter(beats, denominator);
    state.meterChain.push(meter);
    selectedChainIndex = state.meterChain.length - 1;
    persist();
    renderCore();
    notify(`${beats}/${denominator} 박자를 추가했습니다.`);
  }

  function duplicateSelectedMeter() {
    if (playing) stop();
    ensureChain();
    const source = state.meterChain[selectedChainIndex];
    const copy = makeMeter(source.beats, source.denominator, source.pattern);
    state.meterChain.splice(selectedChainIndex + 1, 0, copy);
    selectedChainIndex += 1;
    persist();
    renderCore();
  }

  function moveSelectedMeter(dir) {
    if (playing) stop();
    ensureChain();
    const next = selectedChainIndex + dir;
    if (next < 0 || next >= state.meterChain.length) return;
    const [item] = state.meterChain.splice(selectedChainIndex, 1);
    state.meterChain.splice(next, 0, item);
    selectedChainIndex = next;
    persist();
    renderCore();
  }

  function deleteSelectedMeter() {
    if (playing) stop();
    ensureChain();
    if (state.meterChain.length <= 1) {
      notify('Meter Chain에는 최소 1개의 박자가 필요합니다.');
      return;
    }
    state.meterChain.splice(selectedChainIndex, 1);
    selectedChainIndex = clamp(selectedChainIndex, 0, state.meterChain.length - 1);
    persist();
    renderCore();
  }

  function renderTraining() {
    const t = state.training;
    $$('[data-toggle]').forEach(btn => {
      const k = btn.dataset.toggle;
      btn.classList.toggle('on', !!t[k]);
      const body = document.querySelector(`[data-body="${k}"]`);
      if (body) body.classList.toggle('hidden', !t[k]);
      btn.closest('.training-row')?.classList.toggle('enabled', !!t[k]);
    });

    $('randomMute').value = t.randomMute;
    $('randomMuteOut').textContent = `${t.randomMute}%`;
    setRangeStyle($('randomMute'), 0, 90, t.randomMute);

    $('gradualTarget').value = t.gradualTarget;
    $('gradualTargetOut').textContent = `${t.gradualTarget}% 목표`;
    setRangeStyle($('gradualTarget'), 10, 100, t.gradualTarget);

    $$('#tempoMode button').forEach(b => b.classList.toggle('selected', b.dataset.mode === t.tempoMode));
    $$('#gradualSeconds button').forEach(b => b.classList.toggle('selected', Number(b.dataset.sec) === t.gradualSeconds));
    $$('#timerMinutes button').forEach(b => b.classList.toggle('selected', Number(b.dataset.min) === t.timerMinutes));

    const vals = {
      soundBars: t.soundBars,
      muteBars: t.muteBars,
      tempoStep: t.tempoStep,
      everyBars: t.everyBars,
      targetBpm: t.targetBpm
    };

    $$('.stepper').forEach(s => {
      const k = s.dataset.stepper;
      s.querySelector('[data-value]').textContent = k === 'everyBars'
        ? `${vals[k]}마디`
        : k === 'tempoStep'
          ? `${t.tempoMode === 'down' ? '-' : '+'}${vals[k]}`
          : vals[k];
    });

    const count = ['randomMuteEnabled', 'internalEnabled', 'autoTempoEnabled', 'timerEnabled', 'gradualEnabled'].filter(k => t[k]).length;
    $('trainingCount').textContent = count;
    $('trainingCount').classList.toggle('hidden', count === 0);
    $('trainingList').classList.toggle('hidden', !trainingExpanded);
    $('trainingChevron').textContent = trainingExpanded ? '⌃' : '⌄';
  }

  function setRangeStyle(el, min, max, val) {
    const pct = (val - min) / (max - min) * 100;
    el.style.setProperty('--pct', `${pct}%`);
  }

  function renderSound() {
    const g = $('soundGrid');
    g.innerHTML = '';
    Object.entries(SOUND_LABELS).forEach(([key, label]) => {
      const b = document.createElement('button');
      b.className = `sound-card card ${state.sound === key ? 'selected' : ''}`;
      b.innerHTML = `<span class="sound-symbol">♪</span><strong>${label}</strong><span>${state.sound === key ? '✓ 사용 중' : '미리듣기'}</span>`;
      b.onclick = async () => {
        state.sound = key;
        persist();
        renderSound();
        renderCore();
        await ensureAudio();
        synthClick(audioCtx.currentTime + .02, key, true, state.volume);
      };
      g.appendChild(b);
    });
    $('volume').value = Math.round(state.volume * 100);
    $('volumeOut').textContent = `${Math.round(state.volume * 100)}%`;
    setRangeStyle($('volume'), 10, 100, Math.round(state.volume * 100));
  }

  function renderPresets() {
    const list = $('presetList');
    list.innerHTML = '';
    if (!presets.length) {
      list.innerHTML = '<div class="empty-state"><div class="big">☆</div><strong>아직 저장된 프리셋이 없습니다.</strong><span>Meter Chain과 Training 조합까지 함께 저장할 수 있습니다.</span></div>';
      return;
    }

    presets.forEach(p => {
      const normalized = deepMerge(defaults, p);
      const a = document.createElement('article');
      a.className = 'preset-card card';
      const detail = normalized.meterChainEnabled && normalized.meterChain.length
        ? normalized.meterChain.slice(0, 4).map(m => `${m.beats}/${m.denominator}`).join(' → ') + (normalized.meterChain.length > 4 ? ' → …' : '')
        : `${normalized.beatsPerBar}/${normalized.denominator}`;
      a.innerHTML = `<button class="preset-main"><div class="preset-bpm">${normalized.bpm}<small>BPM</small></div><div class="preset-copy"><strong>${escapeHtml(p.name)}</strong><span>${detail} · ${SOUND_LABELS[normalized.sound] || normalized.sound}</span></div></button><button class="danger-icon">×</button>`;
      a.querySelector('.preset-main').onclick = () => loadPreset(p);
      a.querySelector('.danger-icon').onclick = () => {
        presets = presets.filter(x => x.id !== p.id);
        persistPresets();
        renderPresets();
      };
      list.appendChild(a);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
  }

  function renderAll() {
    renderCore();
    renderTraining();
    renderSound();
    renderPresets();
  }

  async function ensureAudio() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new Ctx({ latencyHint: 'interactive' });
      master = audioCtx.createGain();
      master.gain.value = .94;
      master.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') await audioCtx.resume();
  }

  function synthClick(when, sound, accent = false, volume = .8) {
    if (!audioCtx || !master) return;

    const out = audioCtx.createGain();
    out.gain.setValueAtTime(.0001, when);
    out.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), when + .002);
    out.gain.exponentialRampToValueAtTime(.0001, when + (sound === 'cowbell' ? .13 : .07));
    out.connect(master);

    const osc = (type, f0, f1, end, gain = 1) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, when);
      if (f1) o.frequency.exponentialRampToValueAtTime(f1, when + end);
      g.gain.setValueAtTime(gain, when);
      g.gain.exponentialRampToValueAtTime(.0001, when + end);
      o.connect(g).connect(out);
      o.start(when);
      o.stop(when + end + .02);
    };

    const noise = (end, gain = .25, hp = 1200) => {
      const len = Math.max(1, Math.floor(audioCtx.sampleRate * end));
      const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = audioCtx.createBufferSource();
      const f = audioCtx.createBiquadFilter();
      const g = audioCtx.createGain();
      src.buffer = buf;
      f.type = 'highpass';
      f.frequency.value = hp;
      g.gain.setValueAtTime(gain, when);
      g.gain.exponentialRampToValueAtTime(.0001, when + end);
      src.connect(f).connect(g).connect(out);
      src.start(when);
    };

    const hi = accent ? 1.22 : 1;
    switch (sound) {
      case 'wood':
        osc('sine', 880 * hi, 360 * hi, .06, .95);
        osc('sine', 1320 * hi, 550 * hi, .045, .35);
        break;
      case 'digital':
        osc('square', 1700 * hi, 1000 * hi, .035, .45);
        noise(.025, .14, 2800);
        break;
      case 'clave':
        osc('sine', 2200 * hi, 1700 * hi, .04, .8);
        osc('sine', 3300 * hi, 2500 * hi, .025, .25);
        break;
      case 'cowbell':
        osc('square', 560 * hi, null, .12, .35);
        osc('square', 845 * hi, null, .10, .25);
        break;
      case 'rim':
        noise(.035, .45, 1800);
        osc('triangle', 1250 * hi, 800 * hi, .035, .4);
        break;
      case 'beep':
        osc('sine', accent ? 1320 : 880, null, .055, .85);
        break;
      default:
        osc('triangle', 1900 * hi, 800 * hi, .045, .75);
        noise(.025, .18, 2200);
    }
  }

  function scheduleStep(time) {
    const t = state.training;
    const meter = getPlaybackMeter();
    const chainIndexForStep = state.meterChainEnabled ? playbackChainIndex : -1;
    const step = stepIndex;
    const beat = Math.floor(step / state.subdivision);
    const sub = step % state.subdivision;
    const isMain = sub === 0;
    const pat = meter.pattern[beat] || 'normal';

    let audible = pat !== 'mute';
    let trainingMuted = false;

    if (t.internalEnabled) {
      const cycle = Math.max(1, t.soundBars + t.muteBars);
      const phase = barIndex % cycle;
      if (phase >= t.soundBars) trainingMuted = true;
    }

    let mutePct = t.randomMuteEnabled ? t.randomMute : 0;
    if (t.gradualEnabled) {
      const sec = Math.max(0, audioCtx.currentTime - startTime);
      const ratio = clamp(sec / Math.max(1, t.gradualSeconds), 0, 1);
      mutePct = Math.max(mutePct, t.gradualTarget * ratio);
    }

    if (!trainingMuted && mutePct > 0 && Math.random() * 100 < mutePct) trainingMuted = true;
    audible = audible && !trainingMuted;

    if (audible) {
      synthClick(time, state.sound, isMain && pat === 'accent', isMain ? state.volume : state.volume * .47);
    }

    visualQueue.push({ time, beat, chainIndex: chainIndexForStep });

    stepIndex += 1;
    const perBar = meter.beats * state.subdivision;

    if (stepIndex >= perBar) {
      stepIndex = 0;
      barIndex += 1;

      if (state.meterChainEnabled && state.meterChain.length) {
        playbackChainIndex = (playbackChainIndex + 1) % state.meterChain.length;
      }

      if (t.autoTempoEnabled && barIndex % Math.max(1, t.everyBars) === 0) {
        let next = state.bpm;
        if (t.tempoMode === 'down') {
          next = Math.max(t.targetBpm, state.bpm - Math.abs(t.tempoStep));
        } else if (t.tempoMode === 'pyramid') {
          next = state.bpm + t.tempoStep * tempoDir;
          if (tempoDir > 0 && next >= t.targetBpm) {
            next = t.targetBpm;
            tempoDir = -1;
          } else if (tempoDir < 0 && next <= sessionBaseBpm) {
            next = sessionBaseBpm;
            tempoDir = 1;
          }
        } else {
          next = Math.min(t.targetBpm, state.bpm + Math.abs(t.tempoStep));
        }
        setBpm(next);
      }
    }

    return meter;
  }

  async function start() {
    await ensureAudio();
    ensureNormalPattern();
    if (state.meterChainEnabled) ensureChain();

    stepIndex = 0;
    barIndex = 0;
    playbackChainIndex = 0;
    visualChainIndex = state.meterChainEnabled ? 0 : -1;
    selectedChainIndex = state.meterChainEnabled ? 0 : selectedChainIndex;
    sessionBaseBpm = state.bpm;
    tempoDir = state.training.tempoMode === 'down' ? -1 : 1;
    nextNoteTime = audioCtx.currentTime + .06;
    startTime = audioCtx.currentTime;
    visualQueue = [];
    elapsed = 0;
    playing = true;
    currentBeat = -1;
    requestWakeLock();

    const tick = () => {
      const ahead = .11;
      while (nextNoteTime < audioCtx.currentTime + ahead) {
        const meterUsed = scheduleStep(nextNoteTime);
        const beatDuration = (60 / state.bpm) * (4 / meterUsed.denominator);
        nextNoteTime += beatDuration / state.subdivision;
      }
    };

    tick();
    scheduler = setInterval(tick, 25);
    renderCore();
    startVisualLoop();
  }

  function stop() {
    playing = false;
    if (scheduler) clearInterval(scheduler);
    scheduler = null;
    cancelAnimationFrame(rafId);
    stepIndex = 0;
    barIndex = 0;
    playbackChainIndex = 0;
    visualChainIndex = -1;
    visualQueue = [];
    currentBeat = -1;
    elapsed = 0;
    releaseWakeLock();
    renderCore();
  }

  function startVisualLoop() {
    let lastUi = 0;
    const draw = () => {
      if (!playing || !audioCtx) return;
      const now = audioCtx.currentTime;
      elapsed = now - startTime;
      let beatChanged = false;
      let chainChanged = false;

      while (visualQueue.length && visualQueue[0].time <= now + .012) {
        const event = visualQueue.shift();
        currentBeat = event.beat;
        beatChanged = true;
        if (state.meterChainEnabled && event.chainIndex !== visualChainIndex) {
          visualChainIndex = event.chainIndex;
          selectedChainIndex = clamp(event.chainIndex, 0, state.meterChain.length - 1);
          chainChanged = true;
        }
      }

      if (chainChanged) {
        renderCore();
      } else if (beatChanged) {
        updateActiveBeat();
        renderMeterChain();
      }

      visualQueue = visualQueue.filter(e => e.time > now - .3);

      if (state.training.timerEnabled && elapsed >= state.training.timerMinutes * 60) {
        notify('연습 시간이 끝났습니다.');
        stop();
        return;
      }

      if (performance.now() - lastUi > 100) {
        updateSessionStatus();
        lastUi = performance.now();
      }
      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);
  }

  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    } catch {}
  }

  async function releaseWakeLock() {
    try {
      await wakeLock?.release();
    } catch {}
    wakeLock = null;
  }

  function savePreset() {
    const name = $('presetName').value.trim() || `Preset ${presets.length + 1}`;
    presets.unshift({
      id: (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
      name,
      ...JSON.parse(JSON.stringify(state))
    });
    persistPresets();
    $('presetName').value = '';
    renderPresets();
    notify('프리셋을 저장했습니다.');
  }

  function loadPreset(p) {
    if (playing) stop();
    state = deepMerge(defaults, p);
    selectedChainIndex = 0;
    ensureNormalPattern();
    if (state.meterChainEnabled) ensureChain();
    persist();
    renderAll();
    switchTab('metronome');
    notify(`${p.name} 불러오기 완료`);
  }

  function switchTab(name) {
    $$('.tab-page').forEach(x => x.classList.remove('active'));
    $(`tab${name[0].toUpperCase() + name.slice(1)}`).classList.add('active');
    $$('.bottom-nav button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    if (name === 'sound') renderSound();
    if (name === 'presets') renderPresets();
  }

  function resetSettings() {
    if (playing) stop();
    state = deepMerge(defaults, {});
    selectedChainIndex = 0;
    persist();
    renderAll();
    notify('기본값으로 초기화했습니다.');
  }

  for (let i = 1; i <= 16; i++) {
    const o = document.createElement('option');
    o.value = o.textContent = i;
    $('beatsPerBar').appendChild(o);
  }

  $('beatsPerBar').onchange = (e) => {
    if (playing) stop();
    setSelectedMeterField('beats', Number(e.target.value));
    renderCore();
  };

  $('denominator').onchange = (e) => {
    if (playing) stop();
    setSelectedMeterField('denominator', Number(e.target.value));
    renderCore();
  };

  $('subdivision').onchange = (e) => {
    if (playing) stop();
    state.subdivision = Number(e.target.value);
    persist();
    renderCore();
  };

  $('meterChainToggle').onclick = () => {
    if (playing) stop();
    state.meterChainEnabled = !state.meterChainEnabled;
    if (state.meterChainEnabled) {
      ensureChain();
      selectedChainIndex = 0;
      notify('Meter Chain을 켰습니다. 여러 박자를 이어서 재생합니다.');
    }
    persist();
    renderCore();
  };

  $$('#commonMeterRow [data-meter]').forEach(btn => {
    btn.onclick = () => {
      const [beats, denominator] = btn.dataset.meter.split('/').map(Number);
      addMeter(beats, denominator);
    };
  });

  $('chainMoveLeft').onclick = () => moveSelectedMeter(-1);
  $('chainMoveRight').onclick = () => moveSelectedMeter(1);
  $('chainDuplicate').onclick = duplicateSelectedMeter;
  $('chainDelete').onclick = deleteSelectedMeter;

  $('playButton').onclick = () => playing ? stop() : start();

  $('tapTempo').onclick = () => {
    const now = performance.now();
    tapTimes = tapTimes.filter(t => now - t < 2500);
    tapTimes.push(now);
    tapTimes = tapTimes.slice(-6);
    if (tapTimes.length >= 2) {
      const ints = tapTimes.slice(1).map((t, i) => t - tapTimes[i]);
      setBpm(60000 / (ints.reduce((a, b) => a + b, 0) / ints.length));
    }
  };

  function startRepeat(dir) {
    setBpm(state.bpm + dir);
    repeatDelay = setTimeout(() => {
      repeatTimer = setInterval(() => setBpm(state.bpm + dir), 70);
    }, 420);
  }

  function stopRepeat() {
    clearTimeout(repeatDelay);
    clearInterval(repeatTimer);
  }

  $('minusBpm').onpointerdown = () => startRepeat(-1);
  $('plusBpm').onpointerdown = () => startRepeat(1);
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => {
    $('minusBpm').addEventListener(ev, stopRepeat);
    $('plusBpm').addEventListener(ev, stopRepeat);
  });

  $('bpmDrag').onpointerdown = (e) => {
    drag = { x: e.clientX, y: e.clientY, bpm: state.bpm };
    $('bpmDrag').setPointerCapture?.(e.pointerId);
  };

  $('bpmDrag').onpointermove = (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = drag.y - e.clientY;
    setBpm(drag.bpm + Math.round((dx + dy * .65) / 6));
  };

  $('bpmDrag').onpointerup = $('bpmDrag').onpointercancel = () => drag = null;
  $('bpmDrag').onwheel = (e) => {
    e.preventDefault();
    setBpm(state.bpm + (e.deltaY < 0 ? 1 : -1));
  };

  function dialToBpm(e) {
    const r = $('tempoDial').getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let deg = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI + 90;
    if (deg > 180) deg -= 360;
    deg = clamp(deg, -135, 135);
    const v = BPM_MIN + (deg + 135) / 270 * (BPM_MAX - BPM_MIN);
    setBpm(v);
  }

  $('tempoDial').onpointerdown = (e) => {
    dialDragging = true;
    $('tempoDial').setPointerCapture?.(e.pointerId);
    dialToBpm(e);
  };
  $('tempoDial').onpointermove = (e) => {
    if (dialDragging) dialToBpm(e);
  };
  $('tempoDial').onpointerup = $('tempoDial').onpointercancel = () => dialDragging = false;

  $('trainingToggle').onclick = () => {
    trainingExpanded = !trainingExpanded;
    renderTraining();
  };

  $$('[data-toggle]').forEach(btn => {
    btn.onclick = () => setTraining(btn.dataset.toggle, !state.training[btn.dataset.toggle]);
  });

  $('randomMute').oninput = e => setTraining('randomMute', Number(e.target.value));
  $('gradualTarget').oninput = e => setTraining('gradualTarget', Number(e.target.value));
  $('volume').oninput = e => {
    state.volume = Number(e.target.value) / 100;
    persist();
    renderSound();
  };

  $$('.stepper').forEach(s => s.querySelectorAll('[data-step]').forEach(btn => {
    btn.onclick = () => {
      const k = s.dataset.stepper;
      const delta = Number(btn.dataset.step);
      const bounds = {
        soundBars: [1, 16],
        muteBars: [1, 16],
        tempoStep: [1, 20],
        everyBars: [1, 16],
        targetBpm: [30, 300]
      }[k];
      setTraining(k, clamp(state.training[k] + delta, bounds[0], bounds[1]));
    };
  }));

  $$('#tempoMode button').forEach(b => b.onclick = () => setTraining('tempoMode', b.dataset.mode));
  $$('#gradualSeconds button').forEach(b => b.onclick = () => setTraining('gradualSeconds', Number(b.dataset.sec)));
  $$('#timerMinutes button').forEach(b => b.onclick = () => setTraining('timerMinutes', Number(b.dataset.min)));

  $$('.bottom-nav button').forEach(b => b.onclick = () => switchTab(b.dataset.tab));
  $('savePreset').onclick = savePreset;
  $('openSettings').onclick = () => $('settingsModal').classList.remove('hidden');
  $('closeSettings').onclick = () => $('settingsModal').classList.add('hidden');
  $('settingsModal').onclick = e => {
    if (e.target === $('settingsModal')) $('settingsModal').classList.add('hidden');
  };
  $('resetSettings').onclick = resetSettings;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && playing) requestWakeLock();
  });

  window.addEventListener('beforeunload', () => {
    if (scheduler) clearInterval(scheduler);
    if (audioCtx) audioCtx.close();
  });

  ensureNormalPattern();
  if (state.meterChainEnabled) ensureChain();
  renderAll();
})();
