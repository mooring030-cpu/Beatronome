# Beatronome v0.7.2 Offline + Loudness

## Offline-first
- 최초 온라인 접속 후 앱 본체와 Basic 샘플 18개를 기기에 저장합니다.
- 저장이 완료되면 비행기 모드 / 데이터 불안정 환경에서도 메트로놈, 그루브, 튜너, Training, Preset을 사용할 수 있습니다.
- 설정 > 오프라인 사용 준비에서 상태 확인 및 재다운로드가 가능합니다.
- 프리셋과 앱 설정은 localStorage에 로컬 우선 저장됩니다.
- 인터넷이 연결되면 앱은 백그라운드에서 최신 HTML을 확인하며, 새 Service Worker 배포 시 새 버전 캐시로 전환됩니다.

## 이번 패치
- 전체 출력 부스트 50~250%
- Web Audio 출력에 리미터/컴프레서 추가
- iOS/iPadOS Audio Session API가 지원되는 환경에서 `playback` 모드를 자동 요청
- iPhone 옆면 무음 스위치가 켜진 상태에서도 재생되도록 대응
- 튜너 마이크 사용 중에는 `play-and-record`, 종료 후 `playback`으로 복귀
- PWA 복귀/재생 시 Audio Session 재설정

## 업데이트
기존 Beatronome 저장소에 파일을 모두 덮어쓴 후 GitHub Desktop에서 Commit → Push origin 하세요.
브라우저에서 한 번 새로고침(Ctrl+F5)하면 v0.7.2 캐시로 갱신됩니다.

## iPhone 참고
최신 iOS의 Safari/PWA는 Audio Session API의 `playback` 타입을 지원하면 무음 스위치의 영향을 받지 않도록 설정할 수 있습니다. 구형 iOS 또는 일부 WebKit 상태에서는 시스템 정책/버그로 예외가 있을 수 있습니다.

## v0.7.2 Loudness 패치
- 전체 출력 부스트 범위: 50~400%
- 빠른 프리셋: 100% / LOUD 200% / MAC 300% / MAX 400%
- 리미터를 -1 dB 근처에서 동작하도록 조정해 기존보다 체감 출력 여유를 확대
- 앱 상단과 설정 하단에 v0.7.2 버전 표시

주의: 브라우저는 운영체제의 최종 스피커 볼륨 한계를 넘을 수 없습니다. 300~400%는 낮은 레벨의 클릭/샘플을 끌어올리는 용도이며, 원본이 이미 큰 소리라면 리미터가 작동합니다.


## v0.7.2
- 장르 프리셋 OFF / `없음 · 메트로놈만` 모드 추가
- 해당 모드에서는 DRUM/BOTH를 비활성화하고 클릭 메트로놈만 재생
- 기존 장르/드럼 설정은 삭제하지 않고 보존
- 프리셋에도 Metronome Only 상태 저장
