# Beatronome v0.8.0 Cloud Sync + Offline

## Cloud Sync
- 기존처럼 로그인 없이도 로컬/오프라인 사용 가능
- 로그인하면 현재 설정과 프리셋을 폰, Mac, 태블릿 간 동기화
- 로컬 우선 저장: 인터넷이 없어도 저장/사용되고, 연결 복구 후 자동 동기화
- 기존 일본어 학습 앱에서 사용한 Supabase 프로젝트의 Auth 계정을 그대로 사용할 수 있음
- Beatronome 데이터는 `beatronome_sync` 별도 테이블에 저장되어 다른 앱 데이터와 분리됨

## 최초 1회 Supabase 설정
1. Supabase 프로젝트의 SQL Editor를 엽니다.
2. 이 ZIP에 포함된 `supabase_setup.sql` 전체를 실행합니다.
3. Beatronome > 설정 > Cloud Sync에서 기존 계정으로 로그인하거나 새 계정을 만듭니다.

`cloud-config.js`에는 브라우저 공개용 Supabase publishable key만 들어 있습니다. 서비스 역할(service-role) 또는 secret key를 넣지 마세요.

## 동기화 정책
- 이 기기에서 수정하면 즉시 localStorage에 저장
- 로그인 + 온라인 + 자동 동기화 ON이면 약 1.6초 후 클라우드 저장
- 다른 기기에서 앱을 다시 열면 최신 클라우드 설정을 가져옴
- 오프라인 상태에서는 `기기 변경사항 저장됨`으로 표시하고 연결 복구 후 동기화
- 동시에 여러 기기에서 수정한 경우 더 최신 변경을 우선 적용하는 Last-write-wins 방식

## 기존 기능 유지
- Offline-first PWA / Basic Sample / 400% Output Boost / iPhone Playback
- Meter Chain / Training / Groove Engine / Pure Metronome Mode
- Guitar/Bass Tuner / Mini Mode / Presets

## GitHub 업데이트
ZIP 내부 파일 전체를 기존 Beatronome 저장소에 덮어쓰기 → GitHub Desktop에서 Commit → Push origin.
브라우저에서 버전이 `v0.8.0`으로 표시되면 적용 완료입니다.
