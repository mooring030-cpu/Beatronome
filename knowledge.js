(()=>{
  const $=id=>document.getElementById(id);
  const $$=sel=>[...document.querySelectorAll(sel)];
  const ROOTS=['C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B'];
  const ROOT_CANON={};
  const ROOT_PC={C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11};
  const NATURAL_PC={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  const LETTERS=['C','D','E','F','G','A','B'];
  const pitchNamesSharp=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const pitchNamesFlat=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

  const CHORDS={
    maj:{label:'Major',symbol:'',formula:'1 · 3 · 5',ints:[0,4,7],deg:[1,3,5],desc:'기본 메이저 트라이어드'},
    min:{label:'Minor',symbol:'m',formula:'1 · ♭3 · 5',ints:[0,3,7],deg:[1,3,5],desc:'기본 마이너 트라이어드'},
    dim:{label:'Diminished',symbol:'dim',formula:'1 · ♭3 · ♭5',ints:[0,3,6],deg:[1,3,5],desc:'감3화음'},
    aug:{label:'Augmented',symbol:'aug',formula:'1 · 3 · ♯5',ints:[0,4,8],deg:[1,3,5],desc:'증3화음'},
    maj7:{label:'Major 7',symbol:'maj7',formula:'1 · 3 · 5 · 7',ints:[0,4,7,11],deg:[1,3,5,7],desc:'장7화음'},
    dom7:{label:'Dominant 7',symbol:'7',formula:'1 · 3 · 5 · ♭7',ints:[0,4,7,10],deg:[1,3,5,7],desc:'도미넌트 7th'},
    min7:{label:'Minor 7',symbol:'m7',formula:'1 · ♭3 · 5 · ♭7',ints:[0,3,7,10],deg:[1,3,5,7],desc:'마이너 7th'},
    mMaj7:{label:'Minor Major 7',symbol:'m(maj7)',formula:'1 · ♭3 · 5 · 7',ints:[0,3,7,11],deg:[1,3,5,7],desc:'Melodic/Harmonic minor 계열'},
    m7b5:{label:'Half Diminished',symbol:'m7♭5',formula:'1 · ♭3 · ♭5 · ♭7',ints:[0,3,6,10],deg:[1,3,5,7],desc:'Half-diminished'},
    dim7:{label:'Diminished 7',symbol:'dim7',formula:'1 · ♭3 · ♭5 · 𝄫7',ints:[0,3,6,9],deg:[1,3,5,7],desc:'대칭 감7화음'},
    six:{label:'Major 6',symbol:'6',formula:'1 · 3 · 5 · 6',ints:[0,4,7,9],deg:[1,3,5,6],desc:'Major 6'},
    min6:{label:'Minor 6',symbol:'m6',formula:'1 · ♭3 · 5 · 6',ints:[0,3,7,9],deg:[1,3,5,6],desc:'Minor 6'},
    sus2:{label:'Sus2',symbol:'sus2',formula:'1 · 2 · 5',ints:[0,2,7],deg:[1,2,5],desc:'3rd 대신 2nd'},
    sus4:{label:'Sus4',symbol:'sus4',formula:'1 · 4 · 5',ints:[0,5,7],deg:[1,4,5],desc:'3rd 대신 4th'},
    add9:{label:'Add9',symbol:'add9',formula:'1 · 3 · 5 · 9',ints:[0,4,7,14],deg:[1,3,5,9],desc:'7th 없이 9th 추가'},
    nine:{label:'Dominant 9',symbol:'9',formula:'1 · 3 · 5 · ♭7 · 9',ints:[0,4,7,10,14],deg:[1,3,5,7,9],desc:'Dominant 9'},
    maj9:{label:'Major 9',symbol:'maj9',formula:'1 · 3 · 5 · 7 · 9',ints:[0,4,7,11,14],deg:[1,3,5,7,9],desc:'Major 9'},
    min9:{label:'Minor 9',symbol:'m9',formula:'1 · ♭3 · 5 · ♭7 · 9',ints:[0,3,7,10,14],deg:[1,3,5,7,9],desc:'Minor 9'},
    eleven:{label:'Dominant 11',symbol:'11',formula:'1 · 3 · 5 · ♭7 · 9 · 11',ints:[0,4,7,10,14,17],deg:[1,3,5,7,9,11],desc:'Dominant 확장'},
    thirteen:{label:'Dominant 13',symbol:'13',formula:'1 · 3 · 5 · ♭7 · 9 · 13',ints:[0,4,7,10,14,21],deg:[1,3,5,7,9,13],desc:'자주 쓰는 13th voicing 핵심음'},
    sevenSus:{label:'7sus4',symbol:'7sus4',formula:'1 · 4 · 5 · ♭7',ints:[0,5,7,10],deg:[1,4,5,7],desc:'Dominant sus'}
  };
  const SCALES={
    major:{label:'Major / Ionian',formula:'1 2 3 4 5 6 7',ints:[0,2,4,5,7,9,11],deg:[1,2,3,4,5,6,7]},
    naturalMinor:{label:'Natural Minor / Aeolian',formula:'1 2 ♭3 4 5 ♭6 ♭7',ints:[0,2,3,5,7,8,10],deg:[1,2,3,4,5,6,7]},
    harmonicMinor:{label:'Harmonic Minor',formula:'1 2 ♭3 4 5 ♭6 7',ints:[0,2,3,5,7,8,11],deg:[1,2,3,4,5,6,7]},
    melodicMinor:{label:'Melodic Minor (Jazz)',formula:'1 2 ♭3 4 5 6 7',ints:[0,2,3,5,7,9,11],deg:[1,2,3,4,5,6,7]},
    dorian:{label:'Dorian',formula:'1 2 ♭3 4 5 6 ♭7',ints:[0,2,3,5,7,9,10],deg:[1,2,3,4,5,6,7]},
    phrygian:{label:'Phrygian',formula:'1 ♭2 ♭3 4 5 ♭6 ♭7',ints:[0,1,3,5,7,8,10],deg:[1,2,3,4,5,6,7]},
    lydian:{label:'Lydian',formula:'1 2 3 ♯4 5 6 7',ints:[0,2,4,6,7,9,11],deg:[1,2,3,4,5,6,7]},
    mixolydian:{label:'Mixolydian',formula:'1 2 3 4 5 6 ♭7',ints:[0,2,4,5,7,9,10],deg:[1,2,3,4,5,6,7]},
    locrian:{label:'Locrian',formula:'1 ♭2 ♭3 4 ♭5 ♭6 ♭7',ints:[0,1,3,5,6,8,10],deg:[1,2,3,4,5,6,7]},
    locrian2:{label:'Locrian ♮2',formula:'1 2 ♭3 4 ♭5 ♭6 ♭7',ints:[0,2,3,5,6,8,10],deg:[1,2,3,4,5,6,7]},
    lydianDom:{label:'Lydian Dominant',formula:'1 2 3 ♯4 5 6 ♭7',ints:[0,2,4,6,7,9,10],deg:[1,2,3,4,5,6,7]},
    altered:{label:'Altered / Super Locrian',formula:'1 ♭2 ♭3 ♭4 ♭5 ♭6 ♭7',ints:[0,1,3,4,6,8,10],deg:[1,2,3,4,5,6,7]},
    majorPent:{label:'Major Pentatonic',formula:'1 2 3 5 6',ints:[0,2,4,7,9],deg:[1,2,3,5,6]},
    minorPent:{label:'Minor Pentatonic',formula:'1 ♭3 4 5 ♭7',ints:[0,3,5,7,10],deg:[1,3,4,5,7]},
    blues:{label:'Blues Scale',formula:'1 ♭3 4 ♭5 5 ♭7',ints:[0,3,5,6,7,10],deg:[1,3,4,5,5,7]},
    wholeTone:{label:'Whole Tone',formula:'1 2 3 ♯4 ♯5 ♭7',ints:[0,2,4,6,8,10],chromatic:true},
    dimHW:{label:'Diminished Half–Whole',formula:'H–W 반복',ints:[0,1,3,4,6,7,9,10],chromatic:true},
    dimWH:{label:'Diminished Whole–Half',formula:'W–H 반복',ints:[0,2,3,5,6,8,9,11],chromatic:true},
    chromatic:{label:'Chromatic',formula:'12 notes',ints:[0,1,2,3,4,5,6,7,8,9,10,11],chromatic:true}
  };
  const INTERVALS=[['P1','Unison','0'],['m2','단2도','1'],['M2','장2도','2'],['m3','단3도','3'],['M3','장3도','4'],['P4','완전4도','5'],['TT','Tritone','6'],['P5','완전5도','7'],['m6','단6도','8'],['M6','장6도','9'],['m7','단7도','10'],['M7','장7도','11'],['P8','Octave','12']];
  const KEY_SIGS=[
    ['C','Am','—'],['G','Em','F♯'],['D','Bm','F♯ C♯'],['A','F♯m','F♯ C♯ G♯'],['E','C♯m','F♯ C♯ G♯ D♯'],['B','G♯m','F♯ C♯ G♯ D♯ A♯'],['F♯','D♯m','F♯ C♯ G♯ D♯ A♯ E♯'],['C♯','A♯m','F♯ C♯ G♯ D♯ A♯ E♯ B♯'],
    ['F','Dm','B♭'],['B♭','Gm','B♭ E♭'],['E♭','Cm','B♭ E♭ A♭'],['A♭','Fm','B♭ E♭ A♭ D♭'],['D♭','B♭m','B♭ E♭ A♭ D♭ G♭'],['G♭','E♭m','B♭ E♭ A♭ D♭ G♭ C♭'],['C♭','A♭m','B♭ E♭ A♭ D♭ G♭ C♭ F♭']
  ];
  const MODES=[
    ['Ionian','1 2 3 4 5 6 7','maj7','밝고 안정적인 Major'],['Dorian','1 2 ♭3 4 5 6 ♭7','m7','minor + natural 6'],['Phrygian','1 ♭2 ♭3 4 5 ♭6 ♭7','m7','♭2의 강한 색채'],['Lydian','1 2 3 ♯4 5 6 7','maj7','♯4 / maj7의 개방감'],['Mixolydian','1 2 3 4 5 6 ♭7','7','dominant 기본'],['Aeolian','1 2 ♭3 4 5 ♭6 ♭7','m7','Natural minor'],['Locrian','1 ♭2 ♭3 4 ♭5 ♭6 ♭7','m7♭5','♭5의 불안정감']
  ];
  const CHORD_SCALES=[
    ['maj7','Ionian · Lydian','Lydian은 ♯11 색채가 필요할 때 자주 사용'],['m7','Dorian · Aeolian · Phrygian','기능과 key center에 따라 선택'],['7','Mixolydian · Lydian Dominant · Altered · Half–Whole Dim.','dominant의 tension과 해결 방향에 따라 선택'],['m7♭5','Locrian · Locrian ♮2','minor ii–V에서 Locrian ♮2가 자주 사용'],['dim7','Whole–Half Diminished','대칭 구조'],['m(maj7)','Melodic Minor · Harmonic Minor','minor tonic 색채'],['7sus4','Mixolydian 계열 / sus vocabulary','3rd 대신 4th 중심으로 접근']
  ];
  const JAZZ_TIMELINE=[
    ['1890s–1910s','Roots & New Orleans','Blues·ragtime·marching band·African American musical practices가 New Orleans에서 융합되며 초기 jazz 어법이 형성.'],
    ['1920s','Jazz Age / Chicago','녹음과 이주를 통해 jazz가 전국적으로 확산. Louis Armstrong의 솔로 중심 improvisation이 큰 전환점.'],
    ['1930s','Swing Era','Big band, dance music, arranged sections와 강한 four-beat feel. Duke Ellington·Count Basie 등의 개성이 확립.'],
    ['1940s','Bebop','Charlie Parker·Dizzy Gillespie·Thelonious Monk 등이 빠른 tempo, 복잡한 harmony, 긴 improvised lines를 발전.'],
    ['Late 1940s–1950s','Cool Jazz / Hard Bop','Cool은 섬세한 색채와 arrangement를, Hard bop은 blues·gospel·R&B와 강한 groove를 강조.'],
    ['Late 1950s–1960s','Modal / Post-bop / Free','Modal harmony, 열린 form, collective improvisation 등으로 어법 확장. Miles Davis·John Coltrane·Ornette Coleman 등이 중심.'],
    ['Late 1960s–1970s','Fusion','Electric instruments, rock/funk rhythm과 jazz improvisation의 결합. Miles Davis 이후 Weather Report, Return to Forever 등으로 확장.'],
    ['1980s–2000s','Neo-bop & Global Jazz','전통 어법의 재해석과 동시에 Latin, world music, hip-hop 등 다양한 요소와 결합.'],
    ['2010s–Now','Contemporary Jazz','acoustic/electric 경계를 넘나들며 R&B, hip-hop, electronic music과 상호작용하는 다층적 장면이 지속.']
  ];
  const MUSICIANS=[
    ['Louis Armstrong','Trumpet / Vocal','trumpet','Early Jazz','솔로 improvisation과 swing phrasing의 중심적 모델을 확립.','West End Blues · Hot Five/Hot Seven'],
    ['Duke Ellington','Piano / Composer','piano','Swing','오케스트레이션과 작곡으로 big-band jazz의 색채를 확장.','Mood Indigo · Ellington Orchestra'],
    ['Count Basie','Piano / Bandleader','piano','Swing','경제적인 piano comping과 강한 rhythm-section swing으로 영향.','Basie Orchestra · Kansas City swing'],
    ['Charlie Parker','Alto Sax','sax','Bebop','bebop language의 핵심. 빠른 harmonic motion 위의 선율 어법을 혁신.','Ko-Ko · Confirmation'],
    ['Dizzy Gillespie','Trumpet','trumpet','Bebop / Afro-Cuban','bebop trumpet language와 Afro-Cuban jazz 발전에 핵심 역할.','A Night in Tunisia'],
    ['Thelonious Monk','Piano / Composer','piano','Bebop / Modern','독특한 voicing, rhythmic displacement, 작곡 어법으로 독자적 세계 구축.','Round Midnight · Straight, No Chaser'],
    ['Bud Powell','Piano','piano','Bebop','bebop piano의 오른손 single-line과 왼손 comping 접근에 큰 영향.','Un Poco Loco'],
    ['Miles Davis','Trumpet','trumpet','Cool / Modal / Fusion','여러 시대의 jazz language 변화를 이끈 bandleader이자 trumpet stylist.','Kind of Blue · Bitches Brew'],
    ['John Coltrane','Tenor/Soprano Sax','sax','Hard Bop / Modal / Avant-garde','harmonic density, modal development, spiritual expression을 크게 확장.','Giant Steps · A Love Supreme'],
    ['Charles Mingus','Bass / Composer','bass','Post-bop','강렬한 bass concept과 blues·gospel·collective improvisation을 결합한 작곡.','Mingus Ah Um'],
    ['Art Blakey','Drums / Bandleader','drums','Hard Bop','Jazz Messengers를 통해 hard bop groove와 수많은 젊은 연주자를 배출.','Moanin’ · Jazz Messengers'],
    ['Bill Evans','Piano','piano','Modal / Modern','상호작용적 trio concept, impressionistic voicing, lyrical time feel로 영향.','Sunday at the Village Vanguard'],
    ['Ornette Coleman','Alto Sax / Composer','sax','Free Jazz','전통적 chord progression 중심에서 벗어난 열린 improvisation 개념을 전개.','The Shape of Jazz to Come'],
    ['Herbie Hancock','Piano / Keyboards','piano','Post-bop / Fusion','acoustic post-bop부터 funk/electronic까지 폭넓은 harmony와 groove를 확장.','Maiden Voyage · Head Hunters'],
    ['Wayne Shorter','Tenor/Soprano Sax','sax','Post-bop / Fusion','독창적 composition과 harmonic ambiguity로 현대 jazz writing에 큰 영향.','Speak No Evil · Weather Report'],
    ['Chick Corea','Piano / Keyboards','piano','Post-bop / Fusion','acoustic·electric 양쪽에서 rhythmic/harmonic vocabulary를 확장.','Now He Sings, Now He Sobs · Return to Forever'],
    ['Jaco Pastorius','Electric Bass','bass','Fusion','electric bass의 harmonic, melodic, technical 가능성을 크게 확장.','Weather Report · Word of Mouth'],
    ['Ron Carter','Bass','bass','Post-bop','정교한 walking line, time feel, harmonic choice로 modern jazz bass의 대표적 모델.','Miles Davis Quintet · extensive session work'],
    ['Elvin Jones','Drums','drums','Modal / Post-bop','polyrhythmic drive와 rolling triplet feel로 rhythm-section concept을 확장.','John Coltrane Quartet'],
    ['Tony Williams','Drums','drums','Post-bop / Fusion','젊은 나이에 interaction과 metric freedom을 혁신하며 modern drumming에 영향.','Miles Davis Quintet · Lifetime']
  ];

  function parseRoot(root){const r=ROOT_CANON[root]||root,letter=r[0],acc=r.slice(1);let pc=NATURAL_PC[letter]??0;for(const c of acc){if(c==='#')pc++;else if(c==='b')pc--;}pc=(pc%12+12)%12;return {name:r,letter,pc};}
  function accidental(diff){if(diff>6)diff-=12;if(diff<-6)diff+=12;return diff>0?'#'.repeat(diff):diff<0?'b'.repeat(-diff):'';}
  function spellDegree(root,degree,semitone){const p=parseRoot(root),li=LETTERS.indexOf(p.letter),targetLetter=LETTERS[(li+((degree-1)%7)+7)%7],target=(p.pc+semitone)%12,diff=(target-NATURAL_PC[targetLetter]+12)%12;return targetLetter+accidental(diff);}
  function simplePitch(root,semitone){const p=parseRoot(root),pc=(p.pc+semitone)%12,flat=/b/.test(p.name)||['F','Bb','Eb','Ab','Db','Gb','Cb'].includes(p.name);return (flat?pitchNamesFlat:pitchNamesSharp)[pc];}
  function notesForDef(root,def){return def.ints.map((x,i)=>def.chromatic?simplePitch(root,x):spellDegree(ROOT_CANON[root]||root,def.deg[i]||1,x));}
  function selectOptions(el,arr,selected){if(!el)return;el.innerHTML='';arr.forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;o.selected=v===selected;el.appendChild(o);});}

  let toneCtx=null;
  function noteToFreq(name,oct=4){const n=name.replace(/♯/g,'#').replace(/♭/g,'b'),letter=n[0];let pc=NATURAL_PC[letter]??0;for(const c of n.slice(1)){if(c==='#')pc++;else if(c==='b')pc--;}pc=(pc%12+12)%12;const midi=12*(oct+1)+pc;return 440*Math.pow(2,(midi-69)/12);}
  async function playTone(name,index=0){try{toneCtx=toneCtx||new (window.AudioContext||window.webkitAudioContext)();if(toneCtx.state==='suspended')await toneCtx.resume();const o=toneCtx.createOscillator(),g=toneCtx.createGain();o.type='sine';const oct=3+Math.floor(index/7);o.frequency.value=noteToFreq(name,oct);g.gain.setValueAtTime(.0001,toneCtx.currentTime);g.gain.exponentialRampToValueAtTime(.16,toneCtx.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,toneCtx.currentTime+.48);o.connect(g).connect(toneCtx.destination);o.start();o.stop(toneCtx.currentTime+.5);}catch{}}
  function notePills(notes){return `<div class="note-pill-row">${notes.map((n,i)=>`<button class="note-pill" data-note="${n}" data-note-index="${i}">${n}</button>`).join('')}</div><button class="play-theory" data-play-all>▶ 구성음 듣기</button>`;}
  function wireResult(el,notes){el.querySelectorAll('[data-note]').forEach(b=>b.onclick=()=>playTone(b.dataset.note,Number(b.dataset.noteIndex)));const all=el.querySelector('[data-play-all]');if(all)all.onclick=()=>notes.forEach((n,i)=>setTimeout(()=>playTone(n,i),i*280));}
  function renderChord(){const root=$('chordRoot')?.value||'C',key=$('chordType')?.value||'maj7',d=CHORDS[key],notes=notesForDef(root,d),name=(ROOT_CANON[root]||root)+d.symbol;const el=$('chordResult');if(!el)return;el.innerHTML=`<div class="theory-name"><strong>${name}</strong><span>${d.label}</span></div><div class="formula-badge">${d.formula}</div>${notePills(notes)}<p>${d.desc}</p>`;wireResult(el,notes);}
  function renderScale(){const root=$('scaleRoot')?.value||'C',key=$('scaleType')?.value||'major',d=SCALES[key],notes=notesForDef(root,d),el=$('scaleResult');if(!el)return;el.innerHTML=`<div class="theory-name"><strong>${ROOT_CANON[root]||root} ${d.label}</strong><span>${d.ints.length} notes</span></div><div class="formula-badge">${d.formula}</div>${notePills(notes)}`;wireResult(el,notes);}
  function renderDiatonic(){const root=$('diatonicRoot')?.value||'C',mode=$('diatonicMode')?.value||'major',scale=notesForDef(root,SCALES[mode==='major'?'major':'naturalMinor']);const roman=mode==='major'?['Imaj7','ii7','iii7','IVmaj7','V7','vi7','viiø7']:['i7','iiø7','IIImaj7','iv7','v7','VImaj7','VII7'];const quals=mode==='major'?['maj7','min7','min7','maj7','dom7','min7','m7b5']:['min7','m7b5','maj7','min7','min7','maj7','dom7'];const el=$('diatonicResult');if(!el)return;el.innerHTML=scale.map((n,i)=>{const chord=notesForDef(n,CHORDS[quals[i]]);return `<div class="diatonic-chord"><span>${roman[i]}</span><strong>${n}${CHORDS[quals[i]].symbol}</strong><small>${chord.join(' · ')}</small></div>`}).join('');}
  function renderStatic(){
    const ks=$('keySignatureTable');if(ks)ks.innerHTML=KEY_SIGS.map((r,i)=>`<div class="signature-row"><b>${r[0]}</b><span>${r[1]}</span><small>${r[2]}</small></div>`).join('');
    const ig=$('intervalGrid');if(ig)ig.innerHTML=INTERVALS.map(r=>`<div><b>${r[0]}</b><strong>${r[1]}</strong><span>${r[2]} semitones</span></div>`).join('');
    const cf=$('chordFormulaTable');if(cf)cf.innerHTML=Object.values(CHORDS).map(x=>`<div><b>${x.symbol||'maj'}</b><span>${x.formula}</span><small>${x.desc}</small></div>`).join('');
    const mt=$('modeTable');if(mt)mt.innerHTML=MODES.map((x,i)=>`<div><span>${i+1}</span><b>${x[0]}</b><strong>${x[1]}</strong><small>${x[2]} · ${x[3]}</small></div>`).join('');
    const cs=$('chordScaleTable');if(cs)cs.innerHTML=CHORD_SCALES.map(x=>`<div><b>${x[0]}</b><span>${x[1]}</span><small>${x[2]}</small></div>`).join('');
    const jt=$('jazzTimeline');if(jt)jt.innerHTML=JAZZ_TIMELINE.map(x=>`<div class="timeline-row"><span>${x[0]}</span><div><b>${x[1]}</b><p>${x[2]}</p></div></div>`).join('');
    renderMusicians('all');
  }
  function renderMusicians(inst='all'){const grid=$('musicianGrid');if(!grid)return;grid.innerHTML=MUSICIANS.filter(x=>inst==='all'||x[2]===inst).map(x=>`<article class="musician-card" data-knowledge-search="${x.join(' ')}"><span>${x[3]}</span><h4>${x[0]}</h4><b>${x[1]}</b><p>${x[4]}</p><small>${x[5]}</small></article>`).join('');}
  function setPanel(name){$$('[data-knowledge-panel]').forEach(b=>b.classList.toggle('selected',b.dataset.knowledgePanel===name));$$('[data-knowledge-content]').forEach(p=>p.classList.toggle('active',p.dataset.knowledgeContent===name));applySearch();}
  function applySearch(){const q=($('knowledgeSearch')?.value||'').trim().toLowerCase(),empty=$('knowledgeEmpty');if(!q){$$('[data-knowledge-content]').forEach(p=>p.classList.toggle('search-show',false));$$('[data-knowledge-search], .knowledge-tool').forEach(x=>x.classList.remove('knowledge-hidden'));if(empty)empty.classList.add('hidden');return;}let hits=0;$$('[data-knowledge-content]').forEach(p=>p.classList.add('search-show'));$$('[data-knowledge-search], .knowledge-tool').forEach(x=>{const hay=((x.dataset.knowledgeSearch||'')+' '+x.textContent).toLowerCase(),show=hay.includes(q);x.classList.toggle('knowledge-hidden',!show);if(show)hits++;});if(empty)empty.classList.toggle('hidden',hits>0);}
  function init(){
    if(!$('tabKnowledge'))return;
    const rootOpts=ROOTS.map(x=>[x,x]);['chordRoot','scaleRoot','diatonicRoot'].forEach(id=>selectOptions($(id),rootOpts,'C'));
    selectOptions($('chordType'),Object.entries(CHORDS).map(([k,v])=>[k,`${v.symbol||'maj'} · ${v.label}`]),'maj7');
    selectOptions($('scaleType'),Object.entries(SCALES).map(([k,v])=>[k,v.label]),'major');
    ['chordRoot','chordType'].forEach(id=>$(id).onchange=renderChord);['scaleRoot','scaleType'].forEach(id=>$(id).onchange=renderScale);['diatonicRoot','diatonicMode'].forEach(id=>$(id).onchange=renderDiatonic);
    $$('[data-knowledge-panel]').forEach(b=>b.onclick=()=>setPanel(b.dataset.knowledgePanel));
    $('knowledgeSearch').oninput=applySearch;$('clearKnowledgeSearch').onclick=()=>{$('knowledgeSearch').value='';applySearch();$('knowledgeSearch').focus();};
    $('musicianFilters').querySelectorAll('[data-inst]').forEach(b=>b.onclick=()=>{$('musicianFilters').querySelectorAll('[data-inst]').forEach(x=>x.classList.toggle('selected',x===b));renderMusicians(b.dataset.inst);applySearch();});
    renderChord();renderScale();renderDiatonic();renderStatic();
  }
  init();
})();
