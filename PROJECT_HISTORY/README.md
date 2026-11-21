# Beatronome 프로젝트 이력관리 / 인수인계

- **최신 소스 버전:** `v0.16.7`
- **갱신일:** 2026-11-21 (KST)
- **기준 자료:** 사용자가 제공한 v0.16.6 통합 ZIP → v0.16.7 수정
- **원칙:** 소스 + 개발 이력을 단일 ZIP으로 전달하고, 코드 반영/자동 QA/실기기 완료를 구분한다.

## 다음 대화에서 이어가기

1. 최신 통합 ZIP을 새 대화에 첨부한다.
2. 먼저 `PROJECT_STATUS.md`, `TODO.md`, `BUG_TRACKER.md`, 최신 `QA_2026-11-21.md`를 검토한다.
3. 실제 변경 전에 ZIP을 백업하고 변경 후 `CHANGELOG.md`·버전·QA를 동시에 갱신한다.
4. `python3 PROJECT_HISTORY/tools/validate_release.py`로 정적/기능 모의 검사를 수행한다.
5. iOS/Android 실기기, 실제 YouTube 및 실제 Supabase 검증 여부를 반드시 별도로 명시한다.

## 문서

- `PROJECT_STATUS.md`: 현재 기능·소스 반영·남은 리스크
- `CHANGELOG.md`: 누적 버전별 변경
- `BUG_TRACKER.md`: 오류 ID·원인·수정·검증 단계
- `TODO.md`: 실기기 검증 및 후속 우선순위
- `DECISIONS.md`: 기능·UI 결정
- `RELEASE_CHECKLIST.md`: 배포 전후 수동 확인
- `SOURCE_FINGERPRINTS.md`: 원본 v0.16.6 및 현재 소스 SHA-256
- `QA_2026-11-17.md`: v0.16.6 이력 문서
- `QA_2026-11-21.md`, `../QA_V0167.md`: 최신 검증
- `tools/validate_release.py`: 기본 자동 점검

## 상태 용어

- **코드 적용:** 저장소 소스 변경 확인, 실제 작동 보장은 아님.
- **자동 QA 통과:** 해당 테스트 환경·대역에서만 통과.
- **실기기 검증 필요:** OS·하드웨어·서비스 제약까지 검증되지 않음.
- **완료:** 해당 이슈의 인수 기준과 현장 테스트까지 충족한 경우에만 기록.
