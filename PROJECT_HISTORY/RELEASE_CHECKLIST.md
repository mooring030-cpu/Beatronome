## v0.17.2 릴리스 필수 항목

- [x] 앱/Manifest/서비스워커 캐시 v0.17.2 일치
- [x] JS 문법, HTML ID 중복 및 CSS 파싱/Basic WAV 18개 점검
- [x] Node 9 + 19 회귀 검증 및 Chromium 5개 화면 폭 상호작용 검증
- [x] YouTube/MY FILE STOP 버튼 메트로놈만 중단하는지 모의 테스트
- [x] Meter Chain → QUICK SETUP 표시 order 컴퓨티드 스타일 확인
- [x] CDN 모델 실패 시 원본 유지·Worker 종료·재시도 버튼 해제 모의 테스트
- [ ] **실제 136MB AI 모델 다운로드/3분 음원 전체 추론 성공 검증**
- [ ] **iPhone/iPad/실 YouTube/Supabase/장시간 실기기 테스트**
- [ ] GitHub Pages 배포 후 PWA 새 버전 재실행 및 오프라인 기본 소리 확인

# v0.17.1 배포 전 체크리스트

| 항목 | 상태 |
|---|---|
| Node 정적/회귀 및 모의 API 검사 | 통과 19건 |
| Chromium DOM 기능 회귀 | 통과 18건 |
| Chromium 2~6 stem WAV 가져오기/볼륨/MUTE/원본복귀/파일교체 | 통과 12건 |
| 320/390/768/1366px 가로스크롤·필수 UI | 통과 |
| JS 구문/HTML ID/CSS/PWA 파일/18개 WAV | 출고 시 VERIFY_RELEASE.py로 최종 검증 |
| 외부 YouTube Premium 광고 없는 재생 | **미검증·앱에서 광고 제거 불가** |
| 실제 136MB Demucs-6s ONNX 모델 추론 | **미검증(실험적)** |
| Safari/iOS/PWA 배터리·메모리 안정성 | **미검증** |
| GitHub Pages 배포 | 사용자 배포 필요 |

앱 전체 테스트 통과/실서비스 인증을 의미하지 않음.
