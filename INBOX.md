# 수신함 (Inbox)

다음 세션(예약된 루틴 포함)이 처리할 원본 메모를 적어두는 곳입니다. 사용법은 [`CLAUDE.md`](CLAUDE.md) 참고.

## 대기 중

### CDN 리버스 프록시 오리진 — 서버 IP가 아니라 도메인(DMZ 게이트웨이)으로

`target-architecture.md`의 "점진적 전환을 앞당기는 방법: CDN 리버스 프록시" 섹션 보완.
CloudFront 커스텀 오리진을 온프레미스 레거시 JSP 서버의 **IP로 직접** 잡는 방식은 권장하지 않는다는
내용을 명확히 추가해야 함:

- IP 직결 시 문제: (1) 오리진 서버 인증서가 보통 도메인 이름 기준으로 발급되어 있어 TLS 검증이
  깨질 수 있음, (2) IP가 바뀔 때마다(서버 교체, 장애조치 등) CloudFront 배포 설정을 매번 손대야 함,
  (3) 사내망 사설 IP는 CloudFront가 애초에 도달 불가 — 퍼블릭 노출 엔드포인트나 VPC 오리진이 필요.
- 권장 방향: CloudFront는 레거시 서버 IP가 아니라 **DMZ VPC 쪽 게이트웨이(ALB/NLB 등)의 도메인**을
  오리진으로 잡고, 그 게이트웨이가 PrivateLink/Direct Connect로 사내망 레거시 서버에 연결하는 구조.
  즉 `CloudFront → DMZ VPC ALB(도메인) → PrivateLink/Direct Connect → 사내망 레거시 JSP 서버`.
- 반영 위치: `roadmap/target-architecture.md`(해당 섹션 본문 보강), 필요하면
  `roadmap/presentations/2026-09-cloud-modernization-roadmap.html`의 관련 슬라이드에도 한 줄 보강.
- **그림(다이어그램) 추가 요청**: 위 흐름(`사용자 → CloudFront → 경로별 분기 →
  [신규 경로] S3/API Gateway` / `[레거시 경로] DMZ VPC 게이트웨이(도메인) → PrivateLink/
  Direct Connect → 사내망 레거시 JSP 서버`)이 실제로 어떻게 처리되는지 한눈에 보이는
  플로우 차트를 추가한다. 실제 이미지 파일을 넣을 필요는 없고, 이미 문서/발표자료에서
  쓰고 있는 방식대로 텍스트/코드로 그린다.
  - `target-architecture.md`: 문서 상단 "현재 아키텍처 요약"·"목표 아키텍처"에 쓰인 것과
    같은 ASCII 박스-화살표 다이어그램 스타일로, 이 CDN 리버스 프록시 섹션 전용 다이어그램을
    코드 블록으로 추가.
  - 발표자료(`2026-09-cloud-modernization-roadmap.html`): 5번 슬라이드(목표 아키텍처
    다이어그램)에 이미 있는 `.diagram`/`.zone`/`.box`/`.arrow-row` CSS 클래스를 재사용해서,
    "CDN 리버스 프록시로 조기 전환" 내용을 설명하는 별도 다이어그램(또는 기존 5번 슬라이드
    다이어그램에 경로 분기 표시를 보강)을 추가.

### 프론트엔드 현대화 방향에 SEO/GEO 중점 추가

사용자 요청: React 전환 시 SEO(검색엔진 최적화)뿐 아니라 GEO(생성형 엔진 최적화 — AI
검색/답변 엔진에 노출되기 위한 최적화)에도 중점을 둔 프론트엔드로 개선할 것.

- 이유: 지금은 KFESS가 단일 아이템으로 서비스 중이지만, 앞으로 유관 서비스를 확장해서
  하나의 거대한 서비스(슈퍼앱)로 키울 계획 — 이미 로드맵에 있는 "(장기) 마이크로프론트엔드
  기반 슈퍼앱 확장"과 같은 방향이지만, 확장 이후 다수 서비스/콘텐츠를 사용자와 AI 검색
  엔진 양쪽에 잘 노출시키는 것이 목표에 추가됨.
- 검토할 것: React SPA 전환 시 CSR만으로는 SEO/GEO에 불리하므로 SSR(Next.js 등) 또는
  프리렌더링(SSG/ISR) 전략을 프론트엔드 기술 선택에 포함할지 검토. 구조화 데이터
  (JSON-LD 등), 시맨틱 마크업, AI 크롤러 대응(예: llms.txt류 관행) 같은 GEO 실무도 조사 필요.
- URL 설계도 SEO 항목으로 반드시 포함: 의미 없는 ID 기반 URL 대신, 콘텐츠를 설명하는
  의미 있는 슬러그(slug)를 쓴다.
  - 예) `test.com/blog/1` (X) → `test.com/blog/kg-financial-vs-allra` (O)
  - 신규 API/React 라우팅 설계 시부터 라우트 경로를 사람이 읽어도 내용을 짐작할 수 있는
    슬러그 기반으로 정한다 (검색엔진·생성형 엔진 모두 URL 자체를 콘텐츠 신호로 사용).
  - 기존 JSP 화면에 숫자 ID 기반 URL이 있다면 React 전환 시 슬러그 기반 URL로 정리하고,
    기존 ID URL은 301 리다이렉트로 연결해 기존 색인/링크의 SEO 가치를 보존한다.
- 반영 위치: `roadmap/vision.md`(목표 1. 프론트엔드 현대화 항목), `roadmap/target-architecture.md`
  (프론트엔드 렌더링/기술 선택 관련 섹션 — CSR vs SSR/SSG 트레이드오프 추가), `roadmap/outline.md`
  (프론트엔드 현대화 목표 항목), 발표자료의 관련 슬라이드.
