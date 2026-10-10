# Claude Code 지침 예시

서비스 저장소에 바로 복사해 쓸 수 있는 Claude Code 지침·서브에이전트 예시입니다.
로드맵 발표(`roadmap/presentations/2026-10-roadmap.html`)의 "AI와 함께 개발하기" 섹션에서 모달로 열 수 있습니다.

| 파일 | 복사할 위치 | 내용 |
|---|---|---|
| [`CLAUDE.starter.md`](CLAUDE.starter.md) | 저장소 루트 `CLAUDE.md` | 처음 시작할 때 붙여 넣는 기본 코딩 원칙 4가지. 공개 저장소(`multica-ai/andrej-karpathy-skills`)의 CLAUDE.md 원문 |
| [`CLAUDE.example.md`](CLAUDE.example.md) | 저장소 루트 `CLAUDE.md` | 공통 규칙, 작업 순서(코딩 → 코드 리뷰 → 테스트 → 문서화), 참고 문서 경로 |
| [`agents/senior-frontend-developer.md`](agents/senior-frontend-developer.md) | `.claude/agents/senior-frontend-developer.md` | 프론트엔드(Next.js · TypeScript) 화면을 구현하는 에이전트 |
| [`agents/senior-java-developer.md`](agents/senior-java-developer.md) | `.claude/agents/senior-java-developer.md` | 백엔드(Java · Spring Boot) 기능을 구현하는 에이전트 |
| [`agents/code-reviewer.md`](agents/code-reviewer.md) | `.claude/agents/code-reviewer.md` | 변경 diff를 리뷰하는 읽기 전용 에이전트 |
| [`agents/test-runner.md`](agents/test-runner.md) | `.claude/agents/test-runner.md` | 테스트를 작성·실행하는 에이전트 |
| [`agents/doc-writer.md`](agents/doc-writer.md) | `.claude/agents/doc-writer.md` | API 문서(OpenAPI 3.1)와 서비스 문서를 갱신하는 에이전트 |

## 쓰는 방법

- 예시 지침은 `CLAUDE.example.md`로 둡니다. 하위 폴더의 `CLAUDE.md`는 Claude Code가 지침으로 읽기 때문에, 이 저장소 작업에 섞이지 않게 이름을 바꿔 두었습니다. 복사할 때 `CLAUDE.md`로 바꿉니다.
- 예시의 기술 스택(Next.js, Spring Boot), 브랜치 이름, 테스트 명령은 저장소에 맞게 바꿉니다.
- doc-writer는 API 문서를 `services/<서비스명>/openapi.yaml`(OpenAPI 3.1)로 관리하는 것을 전제로 합니다. 백엔드에서 Swagger(springdoc)로 문서를 자동 생성한다면, 생성된 사양을 원본으로 두고 doc-writer는 호환성 검토와 변경 보고를 맡기는 식으로 바꿔 씁니다.
- `standards/security-checklist.md`는 예시 경로입니다. 실제 체크리스트 문서를 두는 위치로 바꿔서 씁니다.
- 지침에는 공통 명령만 남기고, 상세 기준은 문서 경로로 연결합니다. 지침이 길어지면 토큰 소모만 늘고 AI가 헷갈릴 수 있습니다.
