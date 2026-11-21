# Beatronome 프로젝트 상태

- **현재 통합 코드:** v0.17.1 (2026-11-21). v0.17.0을 기반으로 YouTube Loop/Premium 대응 UX와 로컬 Stem Mixer를 추가.
- **로컬 STEM MIXER:** 악기별 볼륨/MUTE/수동 분리된 파일 Import는 Chromium에서 테스트 통과. 6-part AI Demucs ONNX는 모델 다운로드와 외부 라이브러리 실행이 필요하므로 **실서비스 검증 미완료(실험적)**.
- **YouTube:** IFrame API 공식 구현 유지. Premium 구독 판별/광고 차단/오디오 추출은 제공하지 않음. 링크+안내 및 A–B 초 단위 입력.
- **데이터:** 기존 저장키 및 백업 유지. 로컬 음원과 AI 분리 결과는 JSON Cloud Sync나 백업에 포함하지 않음.
- **QA:** Node 정적/회귀 19건, Chromium 통합 18건, 로컬 Stem 실기능 12건, 320·390·768·1366px 레이아웃. iPhone·iPad iOS WebAudio/PWA/30분 이상 장시간 재생 및 외부 모델 추론은 미검증.
- **다음 확인:** GitHub Pages 배포 후 실제 136MB 모델 다운로드와 6-part 연산/소리 출력, 원본 교체 및 iOS 기기 메모리 한계, YouTube Premium 로그인의 브라우저 쿠키 유지 동작.
