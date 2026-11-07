# Beatronome v0.6

## 이번 패치
- 전체 출력 부스트 50~250%
- Web Audio 출력에 리미터/컴프레서 추가
- iOS/iPadOS Audio Session API가 지원되는 환경에서 `playback` 모드를 자동 요청
- iPhone 옆면 무음 스위치가 켜진 상태에서도 재생되도록 대응
- 튜너 마이크 사용 중에는 `play-and-record`, 종료 후 `playback`으로 복귀
- PWA 복귀/재생 시 Audio Session 재설정

## 업데이트
기존 Beatronome 저장소에 파일을 모두 덮어쓴 후 GitHub Desktop에서 Commit → Push origin 하세요.
브라우저에서 한 번 새로고침(Ctrl+F5)하면 v0.6 캐시로 갱신됩니다.

## iPhone 참고
최신 iOS의 Safari/PWA는 Audio Session API의 `playback` 타입을 지원하면 무음 스위치의 영향을 받지 않도록 설정할 수 있습니다. 구형 iOS 또는 일부 WebKit 상태에서는 시스템 정책/버그로 예외가 있을 수 있습니다.
