# Beatronome v0.9.0 — UX + Practice + Manual

이번 버전은 기능 추가보다 실제 연습 흐름과 조작성 개선에 초점을 둔 UX/Practice 업데이트입니다.

## 주요 기능

### 빠른 메트로놈
- BPM 30~300: 드래그, 다이얼, +/- 길게 누르기, Tap Tempo
- Count-in: OFF / 1 / 2 / 4마디
- Visual Beat, 화면 Pulse, 진동 보조
- 기본 화면은 단순 모드, 필요할 때 `고급 기능 펼치기`
- Quick Preset 3개와 상단 ☆ 즉시 저장
- Focus Mode: BPM/박자/재생만 크게 표시

### 고급 리듬 훈련
- Beat Accent / Normal / Mute
- Meter Chain + 각 박자 1~32마디 반복
- Random Mute / Internal Clock / Auto Tempo / Gradual Mute / Practice Timer

### Groove Engine
- Metronome Only / Metro / Drum / Both
- Rock / Jazz / Funk / Blues / Latin / Pop / R&B
- 16-step Kick / Snare / Hi-hat / Ride 등 8악기 편집
- Swing / Humanize / Drum Dropout

### Tuner
- 일렉기타 / 어쿠스틱기타
- 베이스 4현 / 5현 / 6현
- Standard, Drop tuning, 다운튜닝, Open tuning, DADGAD, Custom
- 마이크 크로매틱 튜너 + cents 표시 + 기준음 재생

### Practice Routine
현재 설정을 단계로 추가하고 각 단계 시간을 정합니다.
루틴 실행 시 시간이 끝나면 다음 BPM/박자/그루브 설정으로 자동 전환됩니다.

### Set List
곡 이름과 현재 설정을 저장해 합주/리허설 중 PREV/NEXT로 즉시 전환합니다.
활성 세션은 어느 화면에 있어도 하단의 작은 컨트롤 바에서 이동할 수 있습니다.

### Preset / Backup / Cloud
- 현재 설정을 Preset으로 저장
- JSON 백업 파일 내보내기 / 가져오기
- Cloud Sync 로그인 시 폰, Mac, 태블릿 간 설정/프리셋/루틴/세트리스트 동기화
- 인터넷이 없어도 로컬 우선 저장

### Offline-first
Settings → 오프라인 사용 준비 완료 후 앱 본체와 Basic 샘플을 기기에 저장합니다.
비행기 모드에서도 메트로놈, 드럼, 튜너, Preset, Routine 등을 사용할 수 있습니다.

### Mac 키보드 단축키
- Space: START / STOP
- ↑ / ↓: BPM ±1
- Shift + ↑ / ↓: BPM ±5
- T: Tap Tempo
- M: Mute
- F: Focus Mode
- 1~9: 저장된 프리셋 1~9 불러오기

## 앱 내 매뉴얼
`더보기 → 매뉴얼`에서 기능별 사용법과 추천 연습 방법을 검색할 수 있습니다.

## GitHub Pages 업데이트
1. ZIP 압축 해제
2. GitHub Desktop에서 사용 중인 `Beatronome` 저장소 폴더에 전체 파일 덮어쓰기
3. Commit: `Beatronome v0.9.0`
4. Push origin
5. 사이트에서 상단 버전이 `v0.9.0`인지 확인

기존 Supabase Cloud Sync를 사용 중이라면 `beatronome_sync` 테이블을 그대로 사용합니다. v0.9의 루틴/세트리스트는 settings JSON 안에 포함되어 별도의 DB 테이블 추가가 필요하지 않습니다.
