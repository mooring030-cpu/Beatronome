# Beatronome v0.12.1 — Touch Navigation Fix

- Fixed a startup crash caused by bindings to removed mobile dock controls.
- Restored Groove / Tuner / Practice / More navigation taps.
- Removed global touch preventDefault handlers that could swallow taps.
- Zoom remains disabled through the viewport and touch CSS.

## 핵심 패치
- 모바일 확대 차단: double-tap/pinch zoom 방지, 고정 앱 스케일
- 상단 메뉴/툴바 완전 제거
- 비트 표시를 메트로놈 최상단 대형 Beat Hero로 이동
- 고양이 로고는 Beat Hero 안의 홈 버튼으로 유지
- Basic 다운비트/메인 비트 음색을 모든 subdivision에서 동일하게 통일
- 세분박만 subdivision별 weak 샘플 사용
- 오디오 scheduler look-ahead 확대 및 late recovery 추가
- 매 박마다 불필요한 Meter Chain DOM 재생성 제거
- 데스크톱도 상단 nav 없이 하단 navigation 유지

GitHub Pages 배포는 기존 파일 전체를 덮어쓴 뒤 Commit/Push 하면 됩니다.