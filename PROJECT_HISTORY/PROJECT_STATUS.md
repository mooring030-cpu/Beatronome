# Beatronome 프로젝트 현황 — v0.17.4 (2026-11-22)

- **현재 배포 기준:** v0.17.4 안정화 패치. 기본 저장키/프리셋/루틴 보존.
- **AI STEM MIXER:** UI, 처리 코드, 브라우저 Worker, PC AI 서버까지 제거함. 사용자 별도 요청 없이는 다시 추가하지 않음.
- **MY FILE:** 음악 전체 볼륨(0~100%), Speed/Key, Loop, 마커, 메트로놈 연동, 첫 박 수동 보정 유지.
- **YouTube:** IFrame API, 구간 Loop(mm:ss), Speed, 함께 재생/클릭만 끄기, 첫 박 수동 보정 유지. 광고 제거는 제공하지 않음.
- **메트로놈/기타:** Meter Chain이 QUICK SETUP 위에 위치. 튜너, Groove, 훈련, 저장/백업/Cloud Sync 유지.
- **자동 검증:** Node 6 + 19, Chromium UI 5뷰포트, 실제 로컬 WAV 재생/볼륨, 릴리스 해시/JS/CSS 등 통과.
- **실기기 미검증:** iOS 사운드/백그라운드, 실제 YouTube, Supabase 실계정, 장시간 Bluetooth 재생.

과거 `QA_V0171.md` ~ `QA_V0173.md`는 더 이상 제공하지 않는 AI 실험 기능에 관한 역사적 기록입니다. 현재 배포 기능 정의에는 사용하지 않습니다.
