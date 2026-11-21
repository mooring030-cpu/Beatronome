## v0.17.0 | 2026-11-21 | Audit-wide Stability, Audio, Data Backup, Meter Chain & Manual Sync

- 기준: v0.16.9 소스 + 31항목 종합 점검(확인된 결함 B-01~07, 실기기 위험 R-01~10, 개선 제안 I-01~14).
- **확인 결함 수정**: 드럼 OFF 정규화 B01, 5초 실행 취소 B02, 백그라운드 타이머 B03, 전체 백업 B04, YouTube SDK 실패 재시도 B05, 현재 버전 전용 QA B06, Quality/UX 버전 불일치 B07.
- **오디오**: 예약음원 취소·적용 시점 선택; 백그라운드 예약 기반 구조 유지·복귀 시 타이머/오디오 복구 보완. iOS/PDF/BT 청음은 미검증.
- **동시재생**: 로컬 Backing/YouTube 동일 사용자 클릭 내 시도; 수동 Sync Offset ±500ms, TAP BPM. 영상과 샘플 정확한 위상 동기 보장 없음.
- **사용자 데이터**: v2 JSON 백업(설정, 루틴, 프리셋, Backing 영상/마커), 선택 복원/실패 롤백, Cloud 동시 편집 백업 및 JSON 내보내기.
- **UI**: Meter Chain 현재/다음, 저장 패턴, 진동 미지원 경고, 오디오 진단, VoiceOver/키보드 일부 레이블, 1개 CSS 런타임 번들.
- **회귀 검사**: Node 17/17, Chromium DOM 18/18, Chromium AudioContext running→BPM 조작→stop, JS/CSS/ID/캐시 검사. 하드웨어/실서비스 검증 미실시: `QA_V0170.md`·`HARDWARE_QA_CHECKLIST.md` 참고.
- **배포**: GitHub Pages 배포는 사용자가 수행하며 배포 상태는 검증하지 않음. 진행 중 세션 강제 새로고침하지 않는 SW 정책 유지.


## v0.16.9 | 2026-11-21 | iOS Long-press · Inline Meter/Subdivision · Advanced Utilities · Numeric Meter Chain
- 사용자 요청 4건: iPhone 조작 버튼 롱프레스 시 복사 메뉴, 메인에서 빠른 설정을 바로 조작, Count-in/Pulse/진동 고급 기능 이동, Meter Chain 박자·분모 숫자 선택.
- `index.html`: 팝업 `coreSettingsModal`을 제거하고 **박자/분모 - TAP - 분할** 3열로 배치; BPM −/+ 버튼 유지. 클릭 사운드·고급 기능 토글·FOCUS를 별도 노출; Count-in/Pulse/진동을 고급 훈련 내부로 이동. Meter Chain 선택 단계 편집·사용자 숫자 추가 UI 신설.
- `app.js`: 기존 설정 객체 및 저장키에 연결해 단일 제어 ID 유지; 체인 선택 단계 편집/추가 이벤트 및 렌더 동기화. 길게 누를 때 앱 버튼의 contextmenu/selectstart만 차단하고 텍스트 입력은 예외 처리. 워커/워크렛 URL의 버전 갱신.
- `fix-v0169.css`: 터치 콜아웃 금지(버튼 한정), 작은 화면 3열 리듬 설정 및 간결한 TAP, 메인 설정 및 고급 기능·체인 편집 레이아웃.
- `sw.js`: 0.16.9 캐시 및 새 스타일 등록, HTML·JS·CSS 쿼리 통일.
- 기존 WebAudio/YouTube/Cloud Sync 엔진은 수정하지 않음.
- **검증:** Node v0.16.6 회귀 + v0.16.9 정적 QA, Chromium 320/390/768/1366px 실제 DOM 조작 테스트 통과. 가상 브라우저는 URL 직접 접속 제한으로 `set_content` 내장 자산을 사용. iPhone 실기기 터치·실제 오디오 출력·YouTube는 미검증. 상세 `../QA_V0169.md`.

# Beatronome 누적 변경 이력

> 기록 근거: 제공된 v0.16.6 ZIP 안의 `README.md`, `QA_*.md`, `V*.md` 및 실제 `app.js`, `backing.js`, `index.html`, `sw.js` 검토. 누락된 초기 버전은 임의로 복원하지 않음.

## v0.16.8 | 2026-11-21 | YouTube Clear · iPhone/iPad Audio Recovery
- 사용자 추가 요청: YouTube 영상 불러온 후 빈 화면으로 초기화, iPhone/iPad에서 메트로놈 시작 시 간헐적 무음(앱 재시작 후 동작).
- `index.html`, `fix-v0168.css`: YouTube URL 오른쪽에 **초기화** 버튼 추가. iOS 메트로놈 화면에 **↻ 소리 복구** 버튼 제공.
- `backing.js`: YouTube iframe destroy 및 재삽입, 영상 URL/ID·시간·Seek·구간 Loop·현재 영상 키를 초기화하고 저장. API 로딩 중 지우기 및 늦은 iframe 이벤트를 무시. 기존 재생 속도/마커 데이터는 보존.
- `app.js`: 초기 START에서 iOS audioSession ambient/playback 강제 교대 제거, `suspended`뿐 아니라 `interrupted` 상태도 검사. 정지 상태에서 중단된 WebAudio Context 재생성, 재생 중에는 resume 우선. 재생 실패 시 플레이 표시를 켜 두지 않고 수동 복구 유도.
- 사용자 제스처에서 20ms 초저레벨 오디오 신호를 예약해 iOS 오디오 경로 초기화를 돕고, Basic WAV 18개를 병렬 비차단 로딩(준비 전에는 기존 synth fallback 사용). 1.2초 이내에 오디오가 동작하지 않으면 무한 대기 대신 실패 표시.
- 화면 복귀 시 iOS `resume()`을 시도하며, 수동 복구에서는 오디오 그래프를 재생성하되 BPM/프리셋/설정은 유지. 재생 중 워커/워크렛 비동기 생성 레이스 방어 및 Stop 도중 늦게 재생되는 문제 차단.
- `sw.js`: v0.16.8 버전 분리 캐시 + 신규 CSS 등록, `manifest.webmanifest`/HTML 쿼리 통일.
- **검증**: 정적 검사, v0.16.6 회귀 및 v0.16.8 신규 Node 가상 이벤트 모의 QA 통과. **실제 iOS Safari/PWA 청음·실제 YouTube 재생은 미검증**; 브라우저 내 URL 접근이 제한되어 UI 런타임 렌더까지 확인하지 못함. 상세: `../QA_V0168.md`.

## v0.16.7 | 2026-11-21 | Background Audio · Mobile UI · Meter Chain · YouTube
- 사용자 요청: PDF/타 앱 백그라운드 전환 후 템포 저하, PC·태블릿 UI 차이, Meter Chain 팝업 의존, YouTube+메트로놈 동시 재생 실패.
- `app.js`: AudioWorklet/Worker/타이머 다단 스케줄 heartbeat, 백그라운드 3초 선예약(자동 템포는 1초), 끊긴 스케줄의 박자 위상 복구, Stop 시 예약 드럼·클릭 취소. OS가 AudioContext 자체를 중단하는 상황은 복구 보장 불가.
- `fix-v0167.css`: 태블릿·PC·모바일 단일 열(최대 760px) + 하단 메뉴 UI 통일.
- `index.html`: Meter Chain을 설정 팝업 밖으로 옮겨 고급 훈련 바로 위에 표시. YouTube 동시 재생 버튼 및 상태 표시 추가.
- `backing.js`: YouTube iframe play 전에 **사용자 클릭 이벤트 안에서** 메트로놈 시작 요청; 영상이 시작한 메트로놈만 영상 정지 시 종료. 첫 박 자동 정렬 기능은 아님.
- `sw.js`: `0.16.7` 캐시 및 신규 CSS/AudioWorklet/Worker 포함. QA 0.16.6 + 신규 0.16.7 회귀 검사 실행.
- 검증: Node 정적/모의 테스트, Chromium (390·768·1366px) DOM/버튼 렌더 및 가상 오디오/YouTube 이벤트 통과. **실제 PDF 백그라운드, iOS·Android, 실제 YouTube·GitHub Pages·Supabase는 미검증.** 상세: `QA_2026-11-21.md`, `../QA_V0167.md`.

## 2026-11-17 | 프로젝트 이력관리 통합 (기능 버전 변경 없음)
- 제공된 최신 ZIP이 **v0.16.6**임을 소스·manifest·서비스워커 기준으로 확인.
- 기존 이력관리 초안의 `v0.16.5`, `미해결/소스 미검증` 표기를 실제 0.16.6 반영 상태에 맞춰 정정.
- `PROJECT_HISTORY/` 아래 개발 이력, 문제 추적, 의사결정, 재검증 계획, QA 및 소스 식별 기록 추가.
- 루트 `README.md`의 첫 제목이 구버전 0.16.5로 남아 있던 문서 오류만 교정. JS/CSS/오디오/manifest/서비스워커 실행 파일 **변경 없음**.

## v0.16.6 | Recent / Internal Clock / Save & Sync
- 최근 본 항목/즐겨찾기 칩이 기본 흰색으로 보일 수 있는 CSS 배경 미지정 문제 개선 (`fix-v0166.css`).
- 훈련 패널 접기 또는 고급 기능 숨기기 시 Internal Clock 자동 OFF + 로컬 저장. 소리/무음 마디 수는 유지.
- `practice.trainingExpanded` 저장, 구버전 저장값·프리셋·클라우드·백업 적용 시 숨겨진 ON 상태 정규화.
- 실시간 오디오 스케줄러가 변경된 training 값을 참조하도록 유지; BPM 지연 저장은 화면 종료 시 flush.
- 동기화 요청 도중 새 편집을 지우지 않도록 수정 리비전 감지 및 후속 동기화.
- 근거: `QA_V0166.md`, `QA_V0166_TESTS.js`, 소스. 실기기/실서버는 미검증.

## v0.16.5 | Knowledge 카드·튜너 겹침
- 레퍼런스 카드의 즐겨찾기/확장 컨트롤을 같은 흐름 그룹으로 배치; aria 상태 및 작은 화면 대응.
- 태블릿 너비의 튜너 표시/현 카드 행 겹침 개선.
- 근거: `QA_V0165.md`, `V0165_FIX_NOTES.md`.

## v0.16.4 | LOOP 및 YouTube 속도
- 로컬·YouTube A–B LOOP 표기를 `LOOP`, 구간 버튼을 `START`/`END`로 통일.
- YouTube 속도 25–200%(5% 단계) 슬라이더, 숫자 직접 입력 및 ±5% 버튼 추가.
- iframe API가 지원하는 실제 속도와 사용자가 요청한 속도를 분리 표시.
- 근거: `V0164_CHANGELOG.md`, `QA_V0164.md`, `backing.js`, `index.html`.

## v0.16.3–0.16.4 | 반응형 배치 개선
- 연습 Backing Player 너비 및 좌우 콘텐츠 배치, 더보기 9개 카드의 그리드 위치 수정.
- 근거: `V0163_FIX_NOTES.md`. 해당 파일 제목에는 0.16.4로 기록된 부분이 있으므로 버전 경계는 원본 문서의 표현을 유지함.

## v0.16.0–v0.16.2 | 디자인/인터랙션/성능
- Jazz/Studio 다크 테마의 색상/카드 레이아웃 체계화, 퀵시트/탭 이동 애니메이션, 프리셋 롱프레스 메뉴, reduced-motion 지원.
- 근거: 제공된 `README.md` 역사 부분, `QA_V0162.md`.

## v0.15.0–v0.15.1 | Backing Player·상태 진단
- 로컬 음원 파형 Seek·A–B Loop·최근 파일 설정 복원, 상태 진단 기능 추가.
- 근거: 제공된 `README.md` 역사 부분, `QA_REPORT.md`.

## v0.14.4–v0.14.6 | 캐시·설정·오디오 안정성
- 버전별 캐시/프리셋 병합·백업, 설정 카테고리 정리, 스케줄러 진단·튜너 표시 안정화.
- 근거: 제공된 `README.md` 역사 부분.

## 새 버전 기록 템플릿
### vX.Y.Z | YYYY-MM-DD
- 변경 요청 / 관련 BUG·TODO:
- 변경 파일:
- 적용 내용:
- 자동 테스트 결과:
- 실기기/실서버 결과 (미검증이면 명시):
- 남은 위험/배포 메모:


## v0.17.1 · 2026-11-21 — YouTube Loop UX + Local AI Stem Mixer
- YouTube Loop 위치를 영상 상단의 접이식 구간 설정으로 이동. 초 단위 START/END 직접 입력, 현재 시점 복사, 적용 시 LOOP ON, 지속 입력값 보존.
- YouTube Premium 이용자 외부 원본 영상 열기 링크 및 공식 로그인/쿠키 안내 추가. **임베디드 광고 제거 기능 없음.** YouTube 스트림 추출 및 오디오 분리 없음.
- MY FILE에 6-stem Demucs ONNX 모델을 이용하는 실험적, 사용자가 직접 시작하는 AI 분리 옵션 추가(보컬/드럼/베이스/기타/피아노/그 외). 외부 모델 약 136MB 필요, 메모리 대량 사용, 구간 제한 있음.
- 이미 분리된 로컬 파일 2~6개 다중 불러오기, 볼륨(0~200%)/MUTE/초기화/원본 복귀, 메트로놈 동시재생과 마스터 영상의 타임라인 연동. 다른 트랙 선택 시 미디어 객체 URL 해제.
- 소스 탭 변경 시 비활성된 탭의 소리 재생 중단, 새 오디오 소스 전환과 객체 정리, PWA 오프라인 쉘에 새 분리 스크립트 추가.
- Node 회귀 19, Chromium 기능 18, 로컬 Stem Mixer Chromium 12, 320~1366px 반응형 검사 통과. **원격 Demucs 실제 실행과 iOS 실기기/실제 Premium 광고 여부는 미검증.**
