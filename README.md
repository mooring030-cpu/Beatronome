# Beatronome v0.11.9 — Native Scroll + Live Subdivision + Home

## v0.11.9 핵심 수정

- **PC/Mac 스크롤:** 전역 wheel 가로채기 코드를 제거하고 브라우저 기본 스크롤을 그대로 사용합니다. 휠/트랙패드 방향이 뒤집히거나 한 방향으로 걸리는 현상을 방지합니다.
- **재생 중 분할 변경:** 4분 → 8분 → 3연음 → 16분 변경 시 재생을 멈추지 않고 즉시 새 분할로 스케줄을 다시 잡습니다. 이미 예약된 이전 메트로놈 클릭은 가능한 범위에서 취소합니다.
- **Undo 안내 제거:** `BPM 변경 · 이전 설정으로 되돌릴 수 있습니다` 안내 바를 표시하지 않습니다.
- **고양이 홈 버튼:** 상단 Beatronome 로고 왼쪽의 고양이 아이콘을 누르면 언제든 메트로놈 홈으로 돌아갑니다.
- 박자/분모 변경 시 `stop()` 렌더링 때문에 새 선택값이 되돌아갈 수 있던 순서 문제도 함께 수정했습니다.

## v0.11.9 핵심 수정
- PC/Mac에서 세로 휠/트랙패드 스크롤을 앱 내부 컨트롤이 가로채지 않도록 메인 문서 단일 스크롤 구조로 정리했습니다.
- 메인 페이지에서는 휠 방향을 브라우저 창 스크롤에 직접 전달하며, 설정/검색 같은 모달만 자체 스크롤을 사용합니다.
- BPM 변경 시 `이전 설정으로 되돌릴 수 있습니다` Undo 안내가 더 이상 표시되지 않습니다.
- 상단에 고양이 Beatronome 로고를 추가했습니다. 누르면 언제든 메트로놈 홈으로 이동합니다.

## v0.11.9 핵심 개선
- PC/Mac에서 BPM 숫자 위에 마우스가 있어도 휠은 기본적으로 페이지 스크롤을 수행합니다.
- BPM을 휠로 조정하려면 `Alt`(Windows) / `Option`(Mac)을 누른 채 휠을 사용합니다.
- 탭 전환 시 강제 smooth-scroll을 제거해 긴 화면에서 스크롤 점프/버벅임을 줄였습니다.
- 데스크톱의 blur/sticky 합성 부담을 줄이고 브라우저 기본 세로 스크롤을 우선합니다.
- Practice의 sticky 카드가 데스크톱 스크롤을 방해하지 않도록 일반 흐름으로 변경했습니다.
- `다시 보지 않기` 버튼은 골드 배경/짙은 글씨의 고대비 스타일을 유지합니다.

Beatronome은 메트로놈, Groove Engine, 튜너, 연습 루틴/세트리스트, 음악이론·재즈 지식 레퍼런스를 하나로 묶은 Offline-first PWA입니다.

## v0.11.9 핵심 개선

### Performance / Stage
- 전체 화면 Stage Mode
- 큰 BPM / 박자 / START·STOP / PREV·NEXT
- Set List 곡명과 메모 표시
- PREV/NEXT는 길게 눌러 동작해 공연 중 오조작 방지
- BPM Lock: 드래그·다이얼·+/−·TAP의 의도치 않은 BPM 변경 차단
- 화면 자동 꺼짐 방지와 연동
- 선택형 Stage 화면 탭 START/STOP (기본 OFF)

### 빠른 조작 / 접근성
- One Hand Mode: START / TAP / BPM / Lock을 엄지 영역에 고정
- Interface Size: Compact / Normal / Large
- Undo: BPM, 박자, 분할, Meter Chain, 패턴, 프리셋 등의 주요 변경을 5초 내 되돌리기
- 마지막 탭, 마지막 설정, 진행 중 Routine/Set List 위치를 다음 실행에서 복원
- 주요 상단/하단 액션 아이콘을 SVG로 통일
- 의미 색상 통일: Gold=선택/Accent, Teal=정상/완료, Burgundy=Training, Red=정지/삭제

### Tuner Pro
- Normal / Strobe Display
- Sensitivity: Low / Normal / High
- Noise Gate 조정
- 베이스 Low B 대응을 위해 Bass 모드에서 더 큰 분석 버퍼 사용
- Electric / Acoustic Guitar, Bass 4/5/6, Chromatic 및 다양한 Drop/Open/Custom tuning 지원

### Audio Latency Calibration
- -250 ~ +250 ms 보정
- Bluetooth 등에서 클릭음과 Visual Beat가 어긋날 때 화면 타이밍을 맞출 수 있음

### Music Knowledge → Practice
- 코드/스케일 즐겨찾기
- 최근 본 항목
- Theory Lab의 코드/스케일에서 바로 Metronome 연습 시작
- 지식 레퍼런스는 Offline-ready 후 인터넷 없이 사용 가능

### Set List / Practice
- 곡 메모 저장
- 드래그 또는 ↑/↓로 곡 순서 변경
- 저장된 Set List 재편집
- Stage Mode와 연동
- Practice Log: Metronome / Groove / Tuner 사용시간과 최근 7일 기록

### Global Search
- 상단 검색 또는 `Cmd/Ctrl + K`
- 기능, 프리셋, Routine, Set List 검색
- 검색어를 Music Knowledge 검색으로 바로 전달

### First-run Onboarding
- BPM 조작
- Training
- Groove / Tuner
- Knowledge → Practice
- 4단계 빠른 안내
- 설정에서 다시 보기 가능

## 키보드 단축키
- `Space`: 재생 / 정지
- `↑ / ↓`: BPM ±1
- `Shift + ↑ / ↓`: BPM ±5
- `T`: Tap Tempo
- `M`: Mute
- `F`: Focus Mode
- `L`: BPM Lock
- `S`: Stage Mode
- `1~9`: 저장 프리셋 호출
- `Cmd/Ctrl + K`: 전체 검색
- `Esc`: 검색 / Stage Mode 닫기

## Offline-first
1. 설정 → 오프라인 사용 준비
2. `OFFLINE READY` 확인
3. 이후 데이터/Wi-Fi 없이 메트로놈, Basic Sample, Groove, Tuner, Knowledge, Preset, Routine/Set List 사용 가능

새 버전은 백그라운드에서 준비하지만 현재 연주/튜너 세션을 강제로 새로고침하지 않습니다. Beatronome 창을 모두 닫은 뒤 다음 실행부터 새 버전이 적용됩니다.

## Cloud Sync
Cloud Sync는 선택 기능입니다. 로그인하지 않아도 모든 핵심 기능은 로컬/오프라인으로 동작합니다.

로그인 시 다음 항목이 Local-first 방식으로 동기화됩니다.
- 앱 설정
- Preset
- Groove / Drum Pattern
- Tuner 설정
- Routine / Set List
- Music Knowledge 즐겨찾기 / 최근 항목
- Practice Log

기존 `beatronome_sync` JSON 테이블을 그대로 사용하므로 v0.11.9 전용 추가 테이블은 필요하지 않습니다.

## GitHub Pages 업데이트
1. ZIP 압축 해제
2. 기존 Beatronome 저장소 폴더에 파일 전체 덮어쓰기
3. GitHub Desktop → Commit to main
4. Commit 예: `Beatronome v0.11.9`
5. Push origin

상단 버전 배지가 `v0.11.9`이면 최신 버전입니다.

## v0.11.9 Onboarding Button Contrast Fix
- 모바일 스크롤 이벤트에서 `getBoundingClientRect()`를 계속 호출하던 빠른 컨트롤 로직 제거
- 자동 Mobile Scroll Dock 비활성화 (고정 컨트롤이 필요하면 One Hand Mode 사용)
- 모바일 Topbar의 sticky + backdrop blur 제거
- 모바일 Bottom Navigation의 backdrop blur 제거
- 주요 카드의 무거운 그림자/전환 효과 최소화
- BPM 숫자 영역에서 세로 스와이프는 페이지 스크롤로 처리
- 모바일 BPM 드래그는 좌우 제스처가 확실할 때만 시작
- 모바일 Tempo Dial도 세로 스와이프와 충돌하지 않도록 좌우 제스처 우선으로 변경
- BPM 변경 시 전체 화면을 다시 렌더하지 않고 숫자·다이얼 등 필요한 UI만 갱신
- BPM 연속 변경 시 localStorage/Cloud 변경 표시를 매 이벤트마다 실행하지 않고 짧게 묶어서 저장
- Stage Mode가 닫혀 있을 때 매 박자마다 숨겨진 Stage DOM을 다시 만들던 작업 제거
- 모바일 탭 전환 시 강제 smooth scroll 대신 즉시 위치 이동
- v0.11.1의 화면 폭 고정 및 v0.11.2의 짧아진 모바일 레이아웃은 유지

## v0.11.9 처음 사용 안내 개선
- `나중에 보기`는 현재 실행에서만 안내를 닫습니다. 다음 실행 시 다시 볼 수 있습니다.
- `다시 보지 않기`는 버전이 올라가도 유지되는 영구 설정으로 저장됩니다.
- 마지막 단계의 `시작하기`까지 완료한 경우에도 다시 자동 표시하지 않습니다.
- 설정 → 처음 사용 안내 → 다시 보기에서는 언제든 수동으로 다시 열 수 있습니다.

## v0.11.9 Onboarding Button Contrast Fix

- `다시 보지 않기` 버튼을 밝은 브라스 골드 배경 + 짙은 글자로 변경해 모바일 다크 화면에서도 확실히 보이도록 수정
- `나중에 보기`는 딥 네이비, `다음/시작하기`는 버건디로 역할과 색상을 분리
- 모바일에서 온보딩 버튼 글자 크기와 높이도 상향