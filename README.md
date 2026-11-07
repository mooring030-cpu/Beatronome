# Beatronome v0.5

Jazz UI 기반의 메트로놈 · 리듬 트레이너 · 드럼 그루브 · 기타/베이스 튜너 PWA입니다.

## v0.5 주요 기능
- `Basic · Sample` 클릭 사운드: 사용자 제공 녹음에서 추출한 강세/약세/일반 샘플
- 세분박 6종: 4분, 8분, 3연음, 3연음(1·3), 16분, 16분(1·4)
- Guitar/Bass Tuner
  - 일렉기타 / 어쿠스틱기타
  - 베이스 4현 / 5현 / 6현
  - Chromatic
  - Standard, Drop D/C#/C/B, 반음/온음 다운, D/C#/C Standard, Open G/D/E/C, DADGAD 등
  - A4 430~450Hz 보정
  - 줄별 기준음 재생
  - Custom tuning: 각 줄 반음 단위 수정
- Mini Mode
  - BPM, Start/Stop, +/- BPM, Tap, Mute만 표시하는 악보 연습용 작은 화면
  - 갤럭시에서는 `최근 앱 → Beatronome 아이콘 → 팝업 화면으로 보기`와 함께 사용 권장
- 기존 Groove Engine / Meter Chain / Training / Presets 유지

## 다른 앱 위에 표시 관련
Beatronome은 PWA이므로 Android의 `SYSTEM_ALERT_WINDOW` 권한을 직접 요청할 수 없습니다. 완전한 시스템 오버레이는 네이티브 Android 앱이 필요합니다. 현재 PWA에서는 삼성 갤럭시의 팝업 보기/분할 화면 + Beatronome Mini Mode 조합을 권장합니다.

## GitHub Pages 업데이트
1. 이 ZIP의 파일 전체를 기존 `Beatronome` 저장소 폴더에 덮어쓰기
2. GitHub Desktop에서 `Commit to main`
3. `Push origin`
4. 사이트에서 한 번 새로고침. v0.5 Service Worker가 이전 캐시를 자동 교체합니다.

마이크 튜너는 HTTPS 환경(GitHub Pages)에서 권한 허용 후 사용할 수 있습니다.
