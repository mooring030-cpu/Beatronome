# Beatronome v0.17.0 배포 전 점검표

| 항목 | 상태 |
|---|---|
| JavaScript 문법 | 통과 |
| 주요 기능 Node 테스트 | 17/17 통과 |
| Chromium 가상 DOM 상호작용 | 18/18 통과 |
| Chromium AudioContext 시뮬레이션 | 시작/변경/중지 통과 (음향 출력 청음 아님) |
| 320/390/768/1366px 가로 스크롤 | 통과 |
| HTML 중복 ID / CSS 파서 | 통과 |
| 18개 Basic WAV 존재 | 통과 |
| 버전/manifest/SW/PWA 정적 파일 | 통과 |
| 소스 파일 지문 검증 | `python VERIFY_RELEASE.py` 통과 시 완료 |
| iPhone/iPad 실기기 | **미실시** |
| 실제 YouTube/MP3·MP4/Supabase | **미실시** |
| GitHub Pages 배포 및 실제 오프라인 실행 | **미실시** |

**출고 구분:** 코드 통합·자동 QA 완료본 / 물리기기 안정성 인증 전. 배포 후 `HARDWARE_QA_CHECKLIST.md` 검증 필요.
