# Beatronome v0.17.2 — Full Track Stem Engine & Practice UX

> 현재 빌드: **v0.17.2 / 2026-11-21**. 기존 v0.16.9의 사용자 데이터 저장키와 서비스워커 버전 캐시 정책을 유지하면서 31개 점검 항목을 기준으로 개선했습니다.

## 설치 및 업데이트

ZIP 안의 파일과 폴더를 GitHub Pages용 Beatronome 저장소 루트에 덮어쓰고 Commit → Push합니다. **`audio/basic/`의 18개 WAV와 `sw.js`, `beatronome.bundle.css`, `app.js`, `backing.js`가 함께 올라가야 합니다.** 업데이트 후 v0.17.2이 표시되는지 확인합니다. 새 CSS 번들은 런타임에서 하나만 불러오고 기존 CSS 파일은 보수용 원본으로 보존합니다.

## v0.17.0 신규/수정

- **Groove:** 저장했던 드럼 OFF(0) 패턴이 기본값으로 재활성화되는 오류 수정.
- **Undo:** BPM·박자·Meter Chain·분할·프리셋·일부 삭제/초기화·백업 복원에 대한 5초 실행 취소. Backing 데이터를 실제 교체한 복원에서는 Backing도 함께 취소.
- **훈련 타이머:** 애니메이션 프레임에 종속되지 않는 벽시계 종료 시각/복귀 정산 및 중복 처리 방지.
- **실시간 변경:** BPM/박자/분할/음색의 예정된 Web Audio 클릭 취소 및 재스케줄, 적용 시점 즉시·다음 박·다음 마디 선택.
- **전체 백업:** 설정·프리셋·루틴/연습기록·Backing 설정·YouTube URL/마커/Loop/속도 등 JSON 스키마2. 사전 미리보기·선택 복원·실패 시 롤백. **로컬 미디어 바이너리, 로그인 인증 토큰 제외**.
- **Meter Chain:** 현재/다음 박자, 숫자 편집 및 저장한 체인 패턴 저장/불러오기/삭제.
- **YouTube:** IFrame API 로딩 실패/타임아웃 시 다시 시도, 요청 속도와 실제 속도 분리, 수동 싱크 보정 및 TAP BPM.
- **로컬 Backing:** 사용자 클릭 안에서 음원과 메트로놈 시작, 수동 싱크 보정 및 TAP BPM.
- **Cloud Sync:** 두 기기 수정 충돌 감지 시 원격 상태를 로컬 복구 지점에 보관, 복구 지점 JSON 내보내기. **서버 경쟁 상태를 완전히 방지하는 트랜잭션/잠금은 구현하지 않았으므로 실제 2기기 테스트 필수**.
- **오디오 진단/접근성:** 오디오 상태·클럭 드라이버·복구 횟수 확인/진단 JSON, iOS 웹 진동 미지원 안내, 일부 `aria` 개선, 모바일~PC 너비 확인.
- **일관성:** v0.17.0 하나로 메인/QUALITY/UX 버전 표시 통합, 스타일 로딩 단일 번들 및 서비스워커 캐시 버전 정합.

## 검증 및 한계

`node QA_V0170_TESTS.js`에서 17건, 자체 포함 Chromium 브라우저 상호작용에서 18건을 통과했습니다. 추가로 Chromium Web Audio 실행·BPM 120→121·정지 동작 및 HTML ID/CSS/자바스크립트 정적 검사를 확인했습니다. 자세한 내용은 **`QA_V0170.md`**입니다.

**중요:** 실제 iPhone/iPad Safari/PWA의 재생 소리, PDF로 앱 전환 후 2~5분 유지, YouTube 실영상 동시재생, Supabase 실계정 동기화, Bluetooth 및 30~60분 실청음은 현재 환경에서 검증할 수 없었습니다. 해당 항목을 통과로 표시하지 않았습니다. `HARDWARE_QA_CHECKLIST.md`에 재현 절차를 명시했습니다. iOS가 백그라운드 Web Audio를 중단하면 웹앱만으로 무중단 재생을 보장할 수 없습니다.

## QA 사용법

- `node QA_V0172_TESTS.js` — v0.17.2 풀송/WASM 오류/새 UI 모의 검사.
- `python QA_V0172_INTERACTION.py` — Chromium 5개 화면 폭에서 YouTube/로컬 전환, 클릭 끄기, 루프 시간/볼륨 조작 검사(모의 영상).
- `node QA_V0172_REGRESSION.js` — 기존 중요 기능에 대한 19건 정적/회귀 검사.
- `python VERIFY_RELEASE.py` — 릴리스 파일 해시, HTML·JS·캐시 버전 및 오프라인 필수 리소스 확인.
- `HISTORICAL_TESTS/` — 당시 버전에 고정된 레거시 회귀 스크립트. 현재 버전 검사에 직접 사용하지 마세요.

---


# 이전 버전 개발 기록 (현재 버전 안내 아님)

## Beatronome v0.16.9 — iPhone 롱프레스 대응 · 설정 메인화면 · Meter Chain 숫자 선택

당시 배포 기준 버전은 **v0.16.9**였습니다. 해당 버전의 변경/검증은 `QA_V0169.md`를, 이전 버전 이력은 `QA_V0168.md` 및 `PROJECT_HISTORY/`를 확인하세요.

## v0.16.9 추가 기능 (2026-11-21)

- **iPhone 길게 누르기:** TAP, BPM, 박자 패턴, 내비게이션 등의 사용자 조작 버튼을 길게 눌러도 iOS 기본 복사/텍스트 선택 메뉴가 끼어들지 않도록 CSS+이벤트를 조정했습니다. URL·검색 입력창의 복사/선택은 유지합니다.
- **메트로놈 메인:** 박자(1~16)/분모(2·4·8·16)를 TAP 왼쪽에, 분할을 오른쪽에 배치했습니다. TAP을 좁히고 BPM ± 버튼은 별도 한 줄로 유지했습니다. 클릭 사운드와 FOCUS, 고급 기능 펼치기/접기도 팝업 없이 표시합니다.
- **고급 훈련:** Count-in, 화면 Pulse, 진동을 고급 기능 내부로 이동했습니다.
- **Meter Chain:** 선택 단계의 박자/분모를 숫자로 직접 수정할 수 있고, 숫자 지정(1~16/2·4·8·16)으로 새 단계를 추가할 수 있습니다. 기존 빠른 추가·복제·이동·반복 옵션 유지.
- **코드 보존:** Web Audio, YouTube, Groove, Supabase 동기화의 핵심 엔진은 변경하지 않았습니다. v0.16.8 오디오 복구 기능도 유지됩니다.

**검증:** Node 정적/회귀 및 Chromium 가상 화면 320·390·768·1366px에서 주요 조작/저장 데이터 통과. 실제 iPhone/iPad Safari·홈화면 앱에서 길게 누르기, 진동, 오디오 재생은 아직 별도 확인이 필요합니다.


- YouTube 탭 URL 옆 **초기화**: 영상 iframe을 정리하고 빈 화면, URL·시간·현재 영상 Loop 등을 초기화합니다. 저장된 마커 목록과 사용자가 설정한 재생 속도는 보존됩니다.
- iPhone/iPad 오디오: 재생 시작 시 오디오 세션 고정, iOS `interrupted` 상태 대응, 첫 클릭에서 18개 샘플 로딩을 기다리지 않도록 수정, 화면 복귀 시 재개 시도. 소리가 안 들리면 메트로놈 화면의 **↻ 소리 복구**를 누릅니다.
- 기존 프리셋, 사용자 설정키, Meter Chain, Cloud Sync·오프라인 데이터 구조를 유지합니다.
- iOS 실제 기기, 실제 YouTube 영상의 소리 출력까지 자동 테스트한 것은 아닙니다.

이하 구버전 설명은 보존했습니다. v0.16.5~v0.16.9 변경은 개별 QA 문서와 PROJECT_HISTORY 폴더를 확인하세요.

# Beatronome v0.16.2 – Design System + Interaction + Performance

기존 v0.14.3을 기반으로 한 **통합 업데이트**입니다. 기존 GitHub Pages `Beatronome` 저장소에 ZIP 안의 파일을 **전체 덮어쓰기**한 뒤 Commit → Push origin 하면 됩니다. 기존 Supabase 테이블 변경은 필요하지 않습니다.

## 이번 v0.16.2 새 개선 사항

### v0.16.0 Design System
- 기존 Jazz Club/Studio Dark 테마와 오디오 기능을 그대로 유지하면서, Deep Navy·Champagne Gold·Burgundy·Muted Teal 색상 역할을 통일했습니다.
- 한글은 오프라인에서도 사용할 수 있는 시스템 고딕 폴백, BPM은 tabular numeric, 영문 템포 이름은 Serif 폴백을 적용했습니다. *Pretendard/Inter/DM Serif 자체 폰트를 다운로드하거나 번들에 포함하지 않았으므로 기기별 폴백 차이는 있을 수 있습니다.*
- 메트로놈은 Hero 콘솔, 그루브는 Bento 구조, 튜너는 넓은 화면에서 Split, Knowledge는 Card Grid, More는 균형 잡힌 카드 그리드로 정리했습니다.
- 더보기 카드 아이콘은 통일된 선형 SVG로 교체했습니다. 버튼/카드/정보 글자 가독성을 높였습니다.

### v0.16.1 Interaction
- 하단 탭은 가벼운 Fade Through, 더보기에서 상세 페이지로 이동할 때는 짧은 Push 느낌을 적용했습니다.
- Bottom Sheet는 나타날 때 약 210ms 가벼운 등장 효과를 적용하고, **손잡이 영역에서만** 아래로 당겨 닫습니다. 시트 본문 스크롤을 가로채지 않습니다.
- 버튼 Press 피드백을 추가하되 클릭을 막거나 페이지 전체 레이아웃을 다시 계산하지 않도록 했습니다.
- 기존 BPM 좌우 드래그/ROTATE/±버튼 길게 누르기 및 Beat 짧게/길게 누르기는 그대로 유지합니다.
- 프리셋을 길게 누르거나 PC에서 오른쪽 클릭하면 **적용·이름 변경·복제·삭제(2회 확인)**을 고를 수 있습니다. 기존 단순 탭은 즉시 적용합니다.
- Knowledge의 이론/역사 카드에 펼치기 버튼을 넣었습니다. 첫 카드 외에는 모바일에서 접힌 상태로 시작하므로 필요한 내용만 확인할 수 있습니다.

### v0.16.2 Performance/Accessibility
- `prefers-reduced-motion`과 기존 `저사양 성능 모드`에서 모션을 최소화합니다. Stage 모드는 기존처럼 애니메이션 없이 사용합니다.
- 모바일 화면에서는 시트/네비게이션 가림과 겹침을 줄이고, PC에서는 기존 BPM 카드가 왼쪽 열에 몰리던 CSS grid 충돌까지 수정했습니다.
- 기존 오디오 스케줄러, Cloud Sync, 튜너 DSP, Backing Player DSP는 변경하지 않았습니다.
- `design-v016.css`, `ux-v016.js` 파일을 추가했고, 오프라인 캐시에도 포함했습니다.

## 버전별 통합 개선 범위

### v0.14.4 – 안정성 및 데이터 보호
- Service Worker 캐시를 빌드별로 명확하게 분리했습니다. 페이지 이동 시 `caches.match()`가 과거 버전의 HTML을 가져오는 문제를 막습니다.
- **새 빌드의 필수 파일이 모두 저장된 뒤에만** 새로운 Service Worker가 활성화됩니다. 열려 있는 앱은 자동 강제 새로고침하지 않습니다.
- 기존 캐시는 열려 있는 과거 버전 세션을 보호하기 위해 자동 즉시 삭제하지 않습니다.
- Cloud Sync 최초 접속 시 **로컬 프리셋을 일괄 폐기하지 않고 ID별 병합**합니다. 삭제 정보(tombstone), `updatedAt` 필드, 동기화 전 자동 로컬 백업 5개를 지원합니다.
- `앱 설정 → 앱 관리 → 동기화 전 백업 복원`으로 백업을 복구할 수 있습니다.
- 모바일/PC 스크롤 및 하단 메뉴 회귀 테스트를 진행했습니다.

### v0.14.5 – 설정 및 반응형 UI
- `앱 설정`을 **화면·디자인 / 사운드 / 연습·조작 / 저장·동기화 / 앱 관리**의 5개 카테고리로 분리했습니다.
- 긴 설정 설명을 좁은 2열에 억지로 넣지 않고 제목·설명·입력 컨트롤을 읽기 편한 너비로 표시합니다.
- 기존 `styles.css`는 호환을 위해 유지하고, **새 공통 UI 토큰과 레이아웃을 `polish.css`에 분리**해 후속 패치의 변경 지점을 줄였습니다.

### v0.14.6 – 오디오/튜너 신뢰성
- 메트로놈 예약된 클릭 간격과 스케줄러 복구 횟수를 기록하는 **가벼운 진단 메트릭**을 추가했습니다. 실제 스피커/블루투스 출력 지연을 측정하는 것은 아닙니다.
- 튜너 음정 표시를 최근 샘플의 **중앙값으로 안정화**, 급격한 실제 음 변화 시 즉시 창을 초기화합니다.
- 베이스 분석 주기를 조정하여 오래된 휴대폰의 부하를 낮췄습니다.
- 재생 중 **16분 → 8분** 등 subdivision 변경 시 재생이 멈추지 않는 기본 흐름을 브라우저에서 검증했습니다.

### v0.15.0 – Backing Player 편의성
- 파형을 한 번 누르면 Seek, **좌우 드래그하면 A–B Loop**를 지정합니다.
- 최근 불러온 파일 8개를 표시하고, **동일 파일을 다시 선택하면 해당 곡의 Speed·Key·Volume·A/B·BPM 설정을 복원**합니다.
- 브라우저 보안상 사용자의 파일을 자동으로 재열거나 서버에 업로드하지 않습니다.
- 32MB를 초과하는 파일은 모바일 메모리 보호를 위해 파형 생성만 생략합니다. 재생/Seek/A–B 설정은 계속 이용할 수 있습니다.
- Backing + Metronome은 Track BPM 설정을 함께 쓸 수 있지만 **음원의 첫 박을 자동 분석해 정확히 위상을 일치시키는 기능은 아닙니다**. 화면에 안내합니다.

### v0.15.1 – QA/문제 진단
- `더보기 → 앱 상태 진단` 또는 `앱 설정 → 앱 관리`에서 환경/버전/스크롤/캐시/오디오 상태를 확인할 수 있습니다.
- `상태 진단`, `클릭 간격 듣기(120 BPM 8박)`, `결과 복사`, `진단 JSON 저장` 기능을 추가했습니다.
- 진단 결과에는 **비밀번호·클라우드 인증 토큰·곡/프리셋 내용**을 넣지 않습니다.
- 메트로놈·그루브·튜너·연습·더보기 탭의 초기화 및 조작, 빠른 설정 스크롤, Backing 파일/파형 루프, 설정 카테고리 등을 여러 PC/모바일 화면 폭으로 점검했습니다.

## 설치 및 사용
1. ZIP을 풀어서 기존 GitHub Desktop `Beatronome` 폴더의 파일들을 전체 덮어씁니다.
2. GitHub Desktop → Commit to main (`Beatronome v0.16.2`) → Push origin.
3. 앱을 사용 중이었다면 연주가 끝난 뒤 탭/PWA 창을 모두 종료하고 다시 실행하세요. **재생 중 강제 업데이트는 하지 않습니다.**
4. 상단 버전이 `v0.16.2`이면 새 버전입니다.

## 한계/주의
- 현재 파일은 **웹/PWA 배포본**입니다. 과거 제작한 APK/Xcode 프로젝트는 자동으로 업데이트되지 않습니다.
- 실기기 iPhone/Galaxy의 백그라운드 오디오와 실제 음향 출력 지연은 별도의 장치 테스트가 필요합니다.
- YouTube는 공식 iframe 플레이어만 제어합니다. Key Shift는 로컬 파일에서만 사용 가능합니다.
- Cloud Sync의 최초 병합/백업을 개선했지만 여러 기기의 **동시 원자적 편집**은 현재 단일 JSON 행 구조에서 완전히 보장할 수 없습니다. 중요한 프리셋은 백업 파일도 함께 보관하세요.
- 기존 `styles.css`를 전체 재작성하지 않고 `polish.css` + `design-v016.css`와 `ux-v016.js`에 신규 디자인/상호작용을 분리한 **단계적 구조 개선**입니다.
- 자체 진단은 브라우저 상태/스케줄러 예약 간격을 확인합니다. 음향 계측장비처럼 하드웨어 출력음을 정확히 측정하지는 않습니다.

기존 v0.15.1 테스트는 `QA_REPORT.md`, 이번 UI/UX 변경의 검증 범위 및 한계는 `QA_V0162.md`를 참고하세요.


## v0.16.6 — Recent chip / Internal Clock consistency / save & live-state checks
- Recent knowledge chips now have explicit dark background, readable text, wrap and focus states.
- Training panel expansion is saved locally (`practice.trainingExpanded`).
- Collapsing Training OR hiding Advanced features turns **Internal Clock** OFF, saves immediately, and maintains selected sound/mute bar counts. Re-opening never silently re-enables it.
- Legacy saved settings, presets, cloud merges are sanitized so hidden Internal Clock cannot become active.
- Diagnostics bridge adds `getPracticeState()` without leaking secrets.
- Auto sync preserves edits made while a cloud request is in flight; reschedules any remaining dirty changes.


## v0.16.7 — Background Clock / Unified Layout / Exposed Meter Chain / YouTube Joint Playback
- 브라우저 백그라운드 타이머 제한에 대비하여 AudioWorklet의 오디오 스레드 heartbeat, Web Worker 보조, 백그라운드 3초 선행 스케줄을 도입. 늦은 틱 복구 때에는 기존 BPM 위상을 유지하도록 누락된 step을 건너뜀. 사용 환경/OS 정책상 다른 앱이 WebAudio 자체를 중지하면 완전한 백그라운드 재생은 보장할 수 없음.
- 태블릿/PC에도 모바일과 같은 단일 컬럼, 하단 5탭 내비게이션, 주요 카드 순서를 적용. 최대 760px 앱 너비로 큰 화면에서는 가운데 정렬.
- Meter Chain을 메트로놈 홈 프리셋 바로 아래/고급 훈련 바로 위로 이동. 기존 설정·컨트롤 ID/저장 구조 유지.
- YouTube 화면에 독립적인 `영상 + 메트로놈` 버튼과 토글을 노출. 같은 클릭 동작 내에서 WebAudio 시작을 시도하도록 변경, 플레이어 재생/일시정지 시 소유권을 구분하여 연동. 자동 박자 맞춤이나 YouTube 오디오 우회 기능 없음.


## v0.17.1 (이전 릴리스 참고)

이전 v0.17.1은 음원의 일부 구간 AI 분리/분리된 파일 수동 가져오기 및 YouTube 관련 안내 UI를 제공했습니다. **v0.17.2에서 해당 UI와 구간 제한은 제거**되었으므로 현행 동작은 아래 v0.17.2 항목을 우선 참고하세요.

## v0.17.2 — 2026-11-21
- AI STEM MIXER에서 구간 입력, 분리 파일 가져오기 제거. 선택한 로컬 음악 파일 **전체**를 6파트로 처리하도록 변경.
- Demucs ONNX 처리를 메인 UI에서 별도 `stem-worker.js`로 분리. 모델 로딩/추론 실패 시 사용자 오디오 및 기존 기능 유지; 작업 중 진행률, 메모리 제한 안내. 44.1kHz 리샘플링과 트랙별 청크 WAV 인코딩으로 일시적인 메모리 사용량 개선. **실제 외부 136MB 모델/실기기 추론까지 성공했다고 확인한 것은 아닙니다.**
- MY FILE 음원 마스터 볼륨을 고급 메뉴 밖의 눈에 보이는 위치에 배치하고, 원본/분리 악기 전체 볼륨 및 개별 Stem 볼륨에 적용.
- YouTube 구간 Loop를 `00:00`, `03:50` 형식으로 표시/입력. `mm:ss`(선택적 `hh:mm:ss`)를 초로 환산하여 유효 범위 검증.
- Premium 안내, 외부 YouTube에서 보기, 악기 분리 설명 카드 제거. **삽입 플레이어의 광고는 Beatronome이 숨기거나 조작하지 않습니다.**
- `0.17.2` 버전/서비스워커 캐시 분리. 배포 시 `stem-worker.js`도 루트에 업로드해야 합니다.
- **동시 재생 명확화:** YouTube/MY FILE 모두 `▶ 영상(음원) + 메트로놈`과 `■ 클릭 끄기`를 나란히 두었습니다. **클릭 끄기 버튼은 영상/음원은 계속 재생하고 메트로놈만 중단**합니다. 기존 사용자 설정 저장키 유지.
- **YouTube 영상 중심 UX:** 태블릿/PC에서는 영상을 왼쪽, 메트로놈 시작·정지/첫 박 재정렬/±500ms 보정/속도를 오른쪽에 배치했습니다. 휴대폰은 같은 순서로 세로 배치합니다. Loop는 영상 바로 위 접이식 메뉴, 속도 슬라이더는 선택형 펼치기 메뉴.
- **MY FILE 간소화:** 음원 + 클릭 / 클릭 끄기, 첫 박 맞추기, 음원 볼륨을 주요 조작부 근처에 배치하고 AI 믹서와 고급 도구는 접이식으로 유지. 44.1kHz 원본은 불필요한 오프라인 재샘플링을 피하도록 메모리 사용량을 낮췄습니다.
- **메트로놈 홈:** Meter Chain을 QUICK SETUP 위로 변경. 과거 CSS의 화면 표시 순서를 강제하던 `order` 규칙까지 함께 덮어씌웠습니다.
- **AI 오류 처리:** 기존 `Aborted()`가 앱 전체를 멈추지 않도록 Worker 격리, 중단/재시도, 오류 단계 표시, 원본 재생 유지. 모델 자체의 실제 대용량 WASM 추론은 네트워크와 충분한 기기 메모리가 필요하여 **기기별 성공을 아직 보장할 수 없습니다**.
- **광고와 정책:** YouTube 공식 IFrame 플레이어 광고 제어·Premium 확인·광고 차단 코드는 구현하지 않았습니다. 사용자가 불필요하다고 판단한 외부 열기/광고 안내 문구는 화면에서 삭제했습니다.
- **테스트:** v0.17.2 Node 모의 9건, 기존 핵심 회귀 19건, 320/390/660/768/1366px Chromium 상호작용 5종, HTML/CSS/JS/오프라인 리소스 점검. **실제 CDN/6파트 AI 추론, 실기기 iPhone/iPad, 실제 YouTube 영상 및 Premium 광고는 미검증**.

