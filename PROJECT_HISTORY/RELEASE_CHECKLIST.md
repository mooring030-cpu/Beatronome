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
