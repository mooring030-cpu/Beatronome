# Beatronome 현재 프로젝트 현황

**최신 소스 기준:** 2026-11-21, **v0.16.8** — GitHub Pages 대상 웹앱·PWA. 사용자의 v0.16.6 통합본에서 업데이트.

## 모듈 현황

| 기능 | 현재 구현 | 주의사항 |
|---|---|---|
| 메트로놈 | BPM, 박자/세분화, accent, click 음원, 프리셋 | 백그라운드 예약 강화(v0.16.7); OS의 Web Audio 일시정지 시 지속 재생 보장은 불가 |
| Meter Chain | **기본 메트로놈 화면**의 고급 훈련 바로 위 독립 카드 | 팝업을 열지 않고 이용; 실제 박자 전환 청음 필요 |
| Grooves | 드럼 패턴·Kit·Swing·볼륨 | 선예약 드럼 중지 처리 추가; 실기기 회귀 확인 필요 |
| Tuner | 오디오 분석, 기타·베이스 | 태블릿/PC에서도 모바일형 단일 열 렌더링 |
| Internal Clock/고급 훈련 | ON/OFF, 숨길 때 OFF, 저장/복원, Auto Tempo | v0.16.6 반영 로직 유지. 자동 템포와 백그라운드 선예약 혼합 시 실기기 청음 필요 |
| Local Backing | 음원·파형·Loop·Speed·Key | 기존 기능 유지, 회귀 확인 필요 |
| YouTube | IFrame, Loop·Speed, **영상 + 메트로놈 버튼** | 실제 YouTube 서비스/OS 오디오 포커스 미검증; 2개 스트림 첫 박 자동 일치 기능 없음 |
| Knowledge | 음악 이론, 최근 본 항목, 즐겨찾기 | v0.16.6 칩 스타일 유지 |
| 프리셋/클라우드 | 로컬 저장·백업·Supabase 로직 | 실제 2기기 충돌 해결과 실서비스 점검은 별도 |
| PWA/오프라인 | 0.16.7 버전 캐시·새 CSS/Worklet/Worker 포함 | GitHub Pages 실제 업데이트/오프라인 검증 필요 |

## v0.16.8 추가 변경

- `backing.js`: YouTube 초기화로 iframe/URL/ID/Loop/시간을 제거, 늦은 로드 콜백 방지.
- `app.js`: iOS AudioContext `interrupted` 상태·사용자 제스처·무음 복구 버튼, Basic 샘플 비차단 초기화.
- `fix-v0168.css`: 추가 버튼 스타일; `sw.js`/HTML 버전 0.16.8.

## v0.16.7 핵심 소스 변경

1. `app.js`: AudioWorklet heartbeat + WebWorker 보조 + 백그라운드 3초 선예약 + 스케줄 공백 후 기존 박자 위상으로 복구; 재생 중단 시 미리 예약한 음원 제거.
2. `fix-v0167.css`: 휴대폰/태블릿/PC에 공통으로 모바일형 단일 열·하단 고정 5개 탭 적용(최대 760px).
3. `index.html`: Meter Chain을 기본 화면에 노출, YouTube 동시 재생 UI 신설.
4. `backing.js`: YouTube + 메트로놈을 **같은 사용자 클릭 동작**에서 시작 요청. 영상 일시정지 시 자체 시작한 메트로놈만 정지.
5. `sw.js`: v0.16.7 오프라인 캐시 및 신규 파일 등록.

## 현재 검증 수준

- v0.16.8 Node 정적/모의 회귀 검사 통과. 이전 v0.16.7 Chromium 렌더 QA 기록은 유효하나 **이번 변경에 대한 Chromium 렌더 시도는 환경 URL 차단으로 수행하지 못함.**
- 오디오 `visibilitychange` 이벤트 모의, YouTube IFrame 객체 모의 검사 통과.
- **미검증:** 실제 PDF/다른 앱 백그라운드 전환 2~5분, AudioWorklet URL 로딩 실사용, 모바일 OS의 오디오 포커스, 실제 YouTube, iOS PWA, Supabase, 실제 배포 캐시.

**릴리스 판단:** 수정 소스 전달 가능. 플랫폼 특성상 백그라운드 재생 및 실제 YouTube 동시 소리는 실기기 확인이 반드시 필요함. 상세: `../QA_V0167.md`.
