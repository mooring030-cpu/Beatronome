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
