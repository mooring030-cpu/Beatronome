# Beatronome v0.14.3 Overlay Scroll Stability Fix


## v0.14.3 Overlay Scroll Stability Fix
- 모바일 빠른 설정/앱 설정 Bottom Sheet를 독립 세로 스크롤 컨테이너로 재구성
- 오버레이가 열려 있을 때 배경 페이지와 하단 네비게이션의 터치 간섭 차단
- 고급 기능을 펼쳐도 Sheet 내부에서 끝까지 스크롤 가능
- 검색/온보딩 등 전체 화면 오버레이도 모바일 독립 스크롤 규칙으로 통일

프로 뮤지션용 Offline-first PWA. 메트로놈, Groove Engine, 기타/베이스 튜너, Stage Mode, Practice Routine, Set List, Cloud Sync, Music Knowledge에 Backing Track 연습 플레이어를 추가했습니다.



## v0.14.3 Settings 모바일 가독성 수정
- Theme / Interface Size 설명이 한 글자씩 세로로 쪼개지던 모바일 flex 폭 충돌 수정
- Select형 설정은 설명 아래 전체 폭으로 배치
- 스위치형 설정은 설명은 넓게, 스위치는 우측 정렬 유지
- 한국어 설명은 단어 단위 자연스러운 줄바꿈(word-break: keep-all) 적용
- Latency / Cloud / Offline 등 같은 설정 레이아웃도 모바일 폭에 맞게 보강

## v0.14.3 Practice UX 정리
- 하단 `연습`은 Backing Player 전용으로 단순화
- 자동 연습 루틴 / 세트리스트 / 연습 기록은 별도 `Practice Tools` 화면으로 분리
- Practice Tools 내부도 `루틴 / 세트리스트 / 기록` 탭으로 분리해 한 번에 하나만 표시
- Backing Player의 메트로놈 연동 / Track BPM / 볼륨 / 마커 / Speed·12-Key Trainer는 `고급 연습 도구`에 접어서 기본 화면을 짧게 유지
- 메인 화면의 중복 바로가기 `TRAINING / TUNER / PRESETS` 3개 카드 제거
- 모바일에서 Speed / Key를 나란히 배치하고 플레이어 컨트롤 간격을 압축해 스크롤량 감소

## v0.14.3 핵심

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
