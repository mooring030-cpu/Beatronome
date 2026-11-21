# Beatronome 프로젝트 상태 — v0.17.2 (2026-11-21)

- **현재 코드:** v0.17.2. v0.17.1 기반 사용자 요청 전체 반영: AI 전체 음원 분리, 로컬 전체 볼륨, YouTube 미니 연습 스테이지/클릭 끄기/첫 박 보정, 입력 LOOP mm:ss, Premium/YouTube 안내 삭제, Meter Chain/QUICK SETUP 순서.
- **AI STEM:** 6개 악기별 음량/MUTE를 제공하며, 모델은 Hugging Face 6-stem Demucs ONNX(136MB) 다운로드 후 브라우저 Worker에서 실행. 실제 136MB 모델 추론은 **미검증**이고 PC에서도 RAM 상황에 따라 Aborted 가능. 실패해도 원본 유지. 로컬 파일/스템은 서버로 전송하지 않음.
- **YouTube:** IFrame 공식 SDK. 음원 추출/광고 제거/프리미엄 로그인 자동확인은 구현하지 않음. 불필요한 링크/광고 안내는 화면에서 제거.
- **호환:** 기존 v0.17.1 로컬 저장키, 서비스워커 버전 격리, 프리셋 및 데이터 유지.
- **QA:** v0.17.2 Node 9 + 회귀 19, Chromium 320/390/660/768/1366px 모의 상호작용 통과. 실제 iOS·실영상·CDN 모델 추론·클라우드 실계정은 별도 검증 필요.
- **검증:** `QA_V0172.md`, 실기기 `HARDWARE_QA_CHECKLIST.md` 참고.

# Beatronome 프로젝트 상태

- **현재 통합 코드:** v0.17.1 (2026-11-21). v0.17.0을 기반으로 YouTube Loop/Premium 대응 UX와 로컬 Stem Mixer를 추가.
- **로컬 STEM MIXER:** 악기별 볼륨/MUTE/수동 분리된 파일 Import는 Chromium에서 테스트 통과. 6-part AI Demucs ONNX는 모델 다운로드와 외부 라이브러리 실행이 필요하므로 **실서비스 검증 미완료(실험적)**.
- **YouTube:** IFrame API 공식 구현 유지. Premium 구독 판별/광고 차단/오디오 추출은 제공하지 않음. 링크+안내 및 A–B 초 단위 입력.
- **데이터:** 기존 저장키 및 백업 유지. 로컬 음원과 AI 분리 결과는 JSON Cloud Sync나 백업에 포함하지 않음.
- **QA:** Node 정적/회귀 19건, Chromium 통합 18건, 로컬 Stem 실기능 12건, 320·390·768·1366px 레이아웃. iPhone·iPad iOS WebAudio/PWA/30분 이상 장시간 재생 및 외부 모델 추론은 미검증.
- **다음 확인:** GitHub Pages 배포 후 실제 136MB 모델 다운로드와 6-part 연산/소리 출력, 원본 교체 및 iOS 기기 메모리 한계, YouTube Premium 로그인의 브라우저 쿠키 유지 동작.
