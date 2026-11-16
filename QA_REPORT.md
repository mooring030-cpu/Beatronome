# Beatronome v0.15.1 QA Report

## 검증 환경
- Chromium headless (Linux) + Playwright
- 실제 URL 네트워크 탐색이 제한되어 HTML/CSS/JS를 인라인으로 로딩하고 브라우저 저장소를 메모리로 모사해 **인터페이스와 동작을 검증**했습니다.
- 실제 iPhone Safari, Galaxy Chrome, Mac Safari 및 GitHub Pages 서비스워커 네트워크 업데이트는 이번 환경에서 직접 실기기 검증하지 못했습니다.

## 브라우저 통과 항목
- 가로폭 360, 390, 430, 768, 1024, 1440 px: 초기화 자바스크립트 오류 0건, 상단 `v0.15.1`, 페이지 수평 overflow 없음
- 5개 하단 탭 메트로놈/그루브/튜너/연습/더보기: 모두 전환 성공
- 빠른 설정에서 Meter Chain 길이를 늘렸을 때 실제 시트 `scrollTop`이 변경됨 (390px 너비: 193px 스크롤 테스트)
- 재생 상태 유지: 16분 → 8분 전환 뒤에도 `isPlaying() === true` 및 8분 선택값 유지
- 로컬 WAV 로드: 파일명·재생시간 표시, 최근 파일 목록 생성
- 파형 가로 드래그: `A–B LOOP` 범위 설정, LOOP ON 표기
- 설정 5개 카테고리, Cloud 로그인 영역/Theme 선택/앱 진단 영역: 표시 및 클릭 성공
- UI 진단 JSON 생성 및 JavaScript 오류 0건

## 정적 통과 항목
- JavaScript 문법 검사, 리소스 경로/존재 검사, Basic WAV 18개, HTML ID 중복, ZIP 무결성
- Service Worker는 v0.15.1 버전으로 precache를 구성하며, 설치 중 필수 자산 실패 시 활성화를 중단하는 경로를 갖습니다.

## 실기기에서 반드시 확인할 항목
1. Android/iOS: 홈 화면 PWA 설치·비행기 모드 실행·오디오 재생
2. 업데이트 중 기존 세션 유지 → 다음 실행 시 v0.15.1 적용 (`Ctrl+F5` 없이)
3. 모바일: 빠른 설정에서 Meter Chain 활성화/8개 이상 추가 후 끝까지 스크롤
4. 60/120/200 BPM 장시간 30분 재생 정확도, 메트로놈+드럼 타이밍
5. 베이스 E1/E2 등 실제 악기의 개방현·12프렛/24프렛에서 정확한 주파수 표시
6. Backing Player A–B Loop, Speed/Key 변경 시 기기별 소리 깨짐/지연
7. Supabase 로그인한 폰/맥북의 병합 결과: 신규 프리셋, 중복 변경, 삭제, 오프라인 후 재동기화
8. Mac Safari/iOS Safari: 백그라운드 오디오/무음 스위치/화면 유지 권한

이 테스트를 수행하지 않았는데 실기기에서 100% 정상이라고 단정해서는 안 됩니다.
