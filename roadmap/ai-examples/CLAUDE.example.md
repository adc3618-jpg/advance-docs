# 프로젝트 지침

선정산 서비스 저장소입니다. 프론트엔드는 Next.js, 백엔드는 Spring Boot입니다.
이 파일에는 모든 작업에 공통인 명령만 둔다. 작업별 상세 기준은 아래 "참고 문서"의 경로를 필요할 때 읽는다.

## 공통 규칙

- 브랜치는 `develop`에서 `feature/<이슈번호>-<요약>`으로 만든다. `main`에 직접 커밋하지 않는다.
- 커밋 메시지는 한글로, "무엇을 왜 바꿨는지" 한 줄로 쓴다.
- 커밋·push는 사용자가 요청할 때만 한다.
- 비밀 값(API 키, 비밀번호, 토큰)은 코드와 커밋에 넣지 않는다. `.env.example`에 키 이름만 남긴다.
- DB 스키마 변경은 직접 하지 않고, 변경 SQL을 정리해 사용자에게 전달한다 (DBA 요청용).

## 작업 순서

기능 구현·수정 요청은 아래 순서로 진행한다. 앞 단계를 통과해야 다음 단계로 넘어간다.

1. 코딩 — 화면은 `senior-frontend-developer`, 백엔드는 `senior-java-developer` 서브에이전트에게 맡기고, `standards/security-checklist.md` 기준으로 보안 검토를 함께 한다.
2. 코드 리뷰 — `code-reviewer` 서브에이전트에게 변경 diff 리뷰를 맡기고, 지적 사항을 반영한다.
3. 테스트 — `test-runner` 서브에이전트로 테스트를 작성·실행한다. 실패하면 1단계로 돌아간다.
4. 문서화 — `doc-writer` 서브에이전트에게 API 문서(`services/<서비스명>/openapi.yaml`, OpenAPI 3.1)와 실행법 문서 갱신을 맡긴다.

작업을 마치면 단계별 결과(보안 검토 결과, 리뷰 반영 내역, 테스트 결과, 수정한 문서)를 짧게 요약한다.

## 참고 문서

작업 종류에 맞는 문서만 읽는다. 내용을 이 파일에 옮겨 적지 않는다.

| 작업 | 문서 |
|---|---|
| 프론트엔드 · API 응답 설계 | `standards/frontend-development-principles.md` |
| 보안 검토 | `standards/security-checklist.md` |
| API 계약 (OpenAPI) | `services/<서비스명>/openapi.yaml` |
| 서비스 실행 · 장애 대응 | `services/<서비스명>/` |
