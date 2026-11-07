# Beatronome v0.1

SBL Groove Trainer의 빠른 조작성, Time Guru의 내부박 훈련, Tempo 스타일의 BPM 조작을 참고해 새로 설계한 설치형 웹앱(PWA) 프로토타입입니다.

## 포함 기능
- BPM 30~300
- BPM 숫자 드래그(좌우/상하), 마우스 휠, 원형 다이얼
- +/- 짧게 누르기 및 길게 눌러 연속 조절
- Tap Tempo
- 1~16박 / 2, 4, 8, 16 분모
- 1/2/3/4 subdivision
- 박마다 Accent / Normal / Mute 순환
- 7개 합성 클릭 사운드: Classic, Wood, Digital, Clave, Cowbell, Rim, Beep
- Random Mute
- Internal Clock: 소리 N마디 / 무음 N마디
- Auto Tempo: 증가 / 감소 / 왕복
- Gradual Mute
- Practice Timer
- Preset 저장/불러오기/삭제 (LocalStorage)
- 재생 중 Screen Wake Lock 지원
- 오프라인 PWA 캐시

## 실행
별도 빌드가 필요 없습니다. 파일 전체를 정적 웹호스팅에 올리면 됩니다.

로컬 테스트:
```bash
python3 -m http.server 8080
```
브라우저에서 http://localhost:8080 을 엽니다.

## GitHub Pages
이 폴더의 파일을 저장소 최상위에 업로드한 뒤 Settings > Pages에서 배포합니다. 모든 경로는 상대경로로 작성되어 프로젝트 페이지에서도 동작하도록 구성했습니다.

## 모바일 설치
HTTPS로 배포한 사이트를 Chrome/Safari로 연 뒤 ‘홈 화면에 추가’를 사용합니다.

## 다음 버전 권장
1. Supabase 로그인 및 프리셋 기기간 동기화
2. 연습 이력/누적시간/최고 BPM 기록
3. Bluetooth 시각 보정
4. 프리셋 공유/내보내기
5. 백그라운드/화면 잠금 환경별 오디오 안정성 테스트

> 기존 앱의 UI, 음원, 소스코드를 복사하지 않고 기능 개념을 바탕으로 독립 구현했습니다. 클릭음도 Web Audio API로 합성합니다.
