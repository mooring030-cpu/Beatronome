# Beatronome v0.12.6 — Stage Control Contrast Fix — Inline START / ROTATE Controls

## 수정 사항
- 8분/16분/3연음 등 모든 subdivision에서 다운비트와 업비트 강약 계층을 강제로 통일
  - 1박 accent > 다른 downbeat > upbeat/subdivision
- Basic 녹음 샘플의 bank별 레벨 차이가 있어도 업비트가 더 튀지 않도록 역할별 gain 보정
- 기타/베이스 튜너를 octave-aware 방식으로 변경
  - 개방현뿐 아니라 같은 줄의 12프렛(+1 octave), 24프렛(+2 octave) 같은 음을 같은 줄로 인식
  - 악기 모드에서는 음이름(pitch class)을 크게 표시하고 실제 주파수/cents는 그대로 표시
- v0.12.6 캐시/버전 갱신


## v0.12.6
- 모바일/PC 모두 박자 패턴(A/•/×)을 화면 최상단으로 이동
- 중복되던 단순 1·2·3·4 Visual Beat 행 제거
- 상단 박자 버튼이 현재 박자 점등과 강박/일반/무음 편집을 동시에 담당
- 재생 중에도 박자 강약 패턴 변경 시 메트로놈을 멈추지 않음


## v0.12.6
- START/STOP 버튼을 별도 하단 카드에서 제거했습니다.
- ROTATE 다이얼 옆에 START/STOP을 배치했습니다.
- 모바일/PC 모두 동일한 조작 순서를 사용합니다.
- BPM 카드 아래 세로 공간을 줄였습니다.


## v0.12.6 Always Awake
- 앱이 화면에 열려 있는 동안 Screen Wake Lock을 항상 요청합니다.
- 메트로놈 재생 여부와 무관하게 튜너/그루브/연습/지식/설정에서도 화면 자동 꺼짐을 방지합니다.
- 앱이 백그라운드/비가시 상태가 되면 OS가 Wake Lock을 해제할 수 있으며, 다시 화면으로 돌아오면 자동 재요청합니다.
