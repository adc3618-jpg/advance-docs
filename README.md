# 서비스 문서 저장소

메인 서비스(마이크로서비스 아키텍처)에 대한 모든 문서를 모아두는 레포입니다.

## 구조

- `roadmap/` — 서비스 발전 방향, 목표 아키텍처, 발표 자료 (재작성 예정)
- [`assets/css/`](assets/css/) — 공통 CSS (`common.css`, `slides.css`)와 미리보기
- [`tools/dev_server.mjs`](tools/dev_server.mjs) — 저장 시 브라우저가 자동 새로고침되는 개발 서버 (`node tools/dev_server.mjs`)
- [`tools/export_html.mjs`](tools/export_html.mjs) — 문서 HTML을 단독 HTML 파일로 내보내기 (`node tools/export_html.mjs 문서.html`)
- [`services/`](services/) — 서비스별 상세 문서 (API, 실행법, 장애 대응)
- [`standards/`](standards/) — 팀 공통 개발 원칙 (프론트엔드/백엔드 책임 분리 등)

## 새 서비스 문서 추가하기

1. `services/_template/`을 `services/<서비스명>/`으로 복사
2. 각 파일의 내용을 채운다

## 개발 서버로 HTML 즉시 확인하기

문서 HTML을 작성하는 동안 저장하면 브라우저가 자동으로 새로고침되게 하려면 [`tools/dev_server.mjs`](tools/dev_server.mjs)를 쓴다.
Node 18 이상만 있으면 되고 별도 패키지 설치는 필요 없다.

```bash
node tools/dev_server.mjs                 # http://localhost:4000 (저장소 루트)
node tools/dev_server.mjs --port 5000     # 포트 변경
node tools/dev_server.mjs --dir roadmap   # 특정 폴더를 루트로 서비스
```

- 브라우저에서 `http://localhost:4000/assets/css/common-preview.html`처럼 파일 경로로 접속한다. 폴더 경로로 접속하면 파일 목록이 나온다.
- `.html`, `.css`, `.js`, 이미지 등 저장소 안의 파일이 바뀌면 열려 있는 페이지가 자동으로 새로고침된다.
- HTML 응답에만 새로고침 스크립트를 덧붙이므로 문서 파일은 수정되지 않는다. 내보내기(`export_html.mjs`) 결과에도 영향이 없다.
- 같은 PC(127.0.0.1)에서만 접속된다. 종료는 `Ctrl+C`.

## 단독 HTML 파일로 내보내기

공통 CSS를 쓰는 문서 HTML을 외부 파일 없이 열리는 단일 `.html`로 만들 때 [`tools/export_html.mjs`](tools/export_html.mjs)를 쓴다.
메일 첨부나 공유용으로 적합하다. Node 18 이상만 있으면 되고 별도 패키지 설치는 필요 없다.

```bash
# 기본: 문서와 같은 폴더에 <이름>.standalone.html 생성
node tools/export_html.mjs docs/my-doc.html

# 출력 경로 지정
node tools/export_html.mjs docs/my-doc.html -o out/doc.html

# 웹폰트 등 외부(http/https) 리소스까지 받아서 포함 (오프라인용)
node tools/export_html.mjs docs/my-doc.html --inline-remote
```

변환 규칙:

- `<link rel="stylesheet">` → `<style>`로 인라인 (CSS 안의 `@import`, `url()`도 재귀 처리)
- `<script src>` → 인라인 `<script>`
- `<img src>`와 CSS `url()`의 로컬 이미지·폰트 → data URI
- `http(s)://` 외부 리소스는 기본적으로 그대로 두고, `--inline-remote`를 주면 받아서 포함

## 메모 남기기 (INBOX)

지금 바로 문서화하기 애매하거나 다음 세션(예약된 루틴 포함)이 처리했으면 하는 메모는
[`INBOX.md`](INBOX.md)에 적어둔다. 세션 시작 시 처리 방식은 [`CLAUDE.md`](CLAUDE.md) 참고.
