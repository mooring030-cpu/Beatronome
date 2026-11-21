# Beatronome 프로젝트 현재 상태

- 소스 버전: **v0.17.0** (2026-11-21)
- 릴리스 성격: 데이터 결함 수정 + 사용자 선택형 실시간 오디오 스케줄 + 백업/복원 + 장기 개선 기능 통합
- 실행 방식: GitHub Pages용 정적 웹앱/PWA. 프로젝트 기존 저장키 유지.
- 주요 컴포넌트: 메트로놈, Groove/튜너, Meter Chain, 고급 훈련, 로컬 Backing, YouTube, Knowledge, 프리셋·Cloud Sync, 설정·QA.
- 자동 테스트: Node 17, Chromium DOM 18, Chromium WebAudio 가상 실행 1시나리오, 리소스/문법/해시 검사.
- 고객 환경: **실제 iPhone/iPad Safari PWA, YouTube 실영상, Supabase 실계정, GitHub Pages 배포 미확인.**
- 알려진 시스템 제한: iOS에서 OS가 Web Audio/웹앱을 중단하는 경우 브라우저 코드만으로 백그라운드 무중단을 보장할 수 없음.

`QA_V0170.md`, `HARDWARE_QA_CHECKLIST.md` 및 현행 `TODO.md`를 함께 관리합니다.
