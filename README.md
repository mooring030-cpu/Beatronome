# Beatronome v0.3

웹에서 바로 실행하고 휴대폰 홈 화면에 설치할 수 있는 PWA 리듬 트레이너입니다.

## v0.3 추가 기능
- Meter Chain 각 항목별 반복 마디 수 1~32마디 지정
- 예: `4/4 ×2 → 7/8 ×1 → 3/4 ×4`
- 재생 중 현재 Meter와 해당 Meter의 반복 진행 마디 표시
- 복제 시 반복 마디 설정도 함께 복사
- 프리셋 저장/불러오기 시 반복 마디 설정 유지
- Service Worker 캐시 버전 강제 갱신
- CSS/JS에 v0.3 쿼리 버전을 적용해 GitHub Pages 업데이트 반영 개선

## 기존 기능
- BPM 30~300
- +/- 길게 누르기, 숫자 드래그, 원형 다이얼, Tap Tempo
- 1~16박, 2/4/8/16 분모, 4분/8분/3연음/16분 subdivision
- Beat Accent / Normal / Mute
- 7종 합성 메트로놈 사운드
- Random Mute / Internal Clock / Auto Tempo / Gradual Mute / Practice Timer
- Meter Chain 순서 이동, 복제, 삭제
- Preset 로컬 저장
- Jazz Club UI
- 화면 꺼짐 방지 / 오프라인 PWA

## GitHub Pages 업데이트
기존 `Beatronome` 저장소 폴더에 이번 ZIP의 파일을 전부 덮어쓴 뒤:

1. GitHub Desktop에서 변경 파일 확인
2. Summary에 `Beatronome v0.3` 입력
3. **Commit to main**
4. **Push origin**
5. 사이트에서 한 번 새로고침

이번 버전은 캐시 갱신 로직을 보강했습니다. 그래도 오래된 화면이 보이면 브라우저에서 한 번 강력 새로고침(Ctrl+F5)을 하거나 설치한 PWA를 완전히 종료 후 다시 실행하세요.
