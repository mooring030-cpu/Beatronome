# Beatronome v0.14.1 Practice UX Edition

프로 뮤지션용 Offline-first PWA. 메트로놈, Groove Engine, 기타/베이스 튜너, Stage Mode, Practice Routine, Set List, Cloud Sync, Music Knowledge에 Backing Track 연습 플레이어를 추가했습니다.


## v0.14.1 Practice UX 정리
- 하단 `연습`은 Backing Player 전용으로 단순화
- 자동 연습 루틴 / 세트리스트 / 연습 기록은 별도 `Practice Tools` 화면으로 분리
- Practice Tools 내부도 `루틴 / 세트리스트 / 기록` 탭으로 분리해 한 번에 하나만 표시
- Backing Player의 메트로놈 연동 / Track BPM / 볼륨 / 마커 / Speed·12-Key Trainer는 `고급 연습 도구`에 접어서 기본 화면을 짧게 유지
- 메인 화면의 중복 바로가기 `TRAINING / TUNER / PRESETS` 3개 카드 제거
- 모바일에서 Speed / Key를 나란히 배치하고 플레이어 컨트롤 간격을 압축해 스크롤량 감소

## v0.14.1 핵심

### Backing Track · MY FILE
- MP3/WAV/M4A/AAC/OGG/MP4 등 브라우저가 재생 가능한 로컬 음원·영상
- Speed 50~150% (브라우저 pitch-preserve 사용)
- Key -12~+12 semitone 독립 조절 (Web Audio pitch shifter)
- A-B Loop / ±5초 이동 / Seek / 볼륨
- 파형 표시(디코딩 가능한 파일)
- Marker 저장
- Beatronome 메트로놈 함께 재생
- Track BPM을 Beatronome BPM으로 적용
- Speed Trainer: 반복 횟수마다 자동 속도 증가/감소
- 12-Key Trainer: 반복 횟수마다 자동 전조
- 로컬 파일은 업로드하지 않으며 해당 기기에서만 재생

### Backing Track · YOUTUBE
- YouTube URL 로드
- 공식 IFrame Player API 기반 재생/정지/Seek/±5초
- 지원 playback rate 선택
- A-B Loop / Marker
- 메트로놈 함께 재생
- YouTube 공식 API 제한으로 Key/Pitch 변경은 지원하지 않음
- 인터넷 연결 필요

## 사용
GitHub Pages에 전체 파일을 업로드하고 `index.html`을 실행합니다. 기존 Beatronome 저장소에 덮어쓰기 후 Commit/Push 하면 됩니다.

## 오프라인
앱 본체와 Basic 클릭음, Backing Track 처리 코드는 Service Worker에 캐시됩니다. 사용자가 선택한 로컬 미디어 파일 자체는 브라우저 보안상 앱 캐시에 자동 복제하지 않습니다. YouTube는 온라인 연결이 필요합니다.

## Third-party
`THIRD_PARTY_NOTICES.txt` 참고. 로컬 Key Shift의 delay/crossfade 처리 코어는 Chris Wilson의 Jungle 예제를 기반으로 합니다.
