# 로드맵 발표 목차

> 두 이니셔티브의 관계: 클라우드 전환으로 CI/CD와 서버 인프라를 클라우드에 구성하고,
> 그 위에서 AI를 코딩·테스트·문서화 자동화에 접목한다. 즉 "AI와 친해지기"는
> 클라우드 전환으로 만들어지는 CI/CD 환경을 기반으로 실현된다.

> 대상: KFESS (프론트 / 스크래핑 서비스 / 잡서비스(API)).
> 완성된 발표 자료: [`presentations/2026-09-cloud-modernization-roadmap.html`](presentations/2026-09-cloud-modernization-roadmap.html)

- 클라우드 전환
  - 프론트엔드 전환하기
    - 현재 상황
      - 서비스 구성: 프론트 / 스크래핑 서비스 / 잡서비스(API)
      - 프론트엔드는 JSP + Java 1.8 레거시 모놀리식 구조
      - 문제점: 배포 과정이 불편하고, 신규 개발 후 빠르게 배포해야 하는 상황에서도 배포 속도가 느림 → CI/CD 구축의 직접적인 배경
    - 목표
      - 기존 JSP를 API로 전환해 재활용
      - 프론트엔드를 Next.js로 전환 — JSP의 서버사이드 렌더링 이점을 SSR로 이어받으면서, SEO뿐 아니라 GEO(생성형 엔진 최적화, AI 검색/답변 엔진 노출)까지 고려해 URL(의미 있는 슬러그) 설계 단계부터 반영 (자세한 내용은 [`target-architecture.md`](target-architecture.md#프론트엔드-렌더링-전략-seogeo-고려))
        - 왜 Next.js인가: CSR(순수 SPA)보다 SSR이 SEO에 유리 — 크롤러가 빈 HTML만 보는 문제를 프레임워크 차원에서 해결. 단, 화면마다 SSR/CSR을 명확히 구분해서 개발해야 하므로 개발 복잡도는 올라간다 (자세한 내용은 [`target-architecture.md`](target-architecture.md#왜-nextjs인가))
          - CSR vs SSR 비교: SEO/초기 렌더링뿐 아니라 서버 부하·인프라 비용(정적 호스팅 vs 상시 서버), 초기 로딩 vs 페이지 전환 체감 속도, 개발/디버깅 복잡도(하이드레이션 불일치), 캐싱 전략까지 항목별로 비교 — 결론은 SSR 기본 채택 + 변경 적은 화면은 SSG/ISR + 인터랙션 위주 화면만 의도적으로 CSR (자세한 내용은 [`target-architecture.md`](target-architecture.md#csr-vs-ssr-비교))
      - 프론트엔드를 컨테이너 이미지로 만들어 AWS ECS(Fargate)에 배포 (앞단은 CloudFront)
        - 컨테이너를 택하는 이유: 환경 동일성(로컬=운영), 배포=이미지 교체라 롤백이 쉬움, CI/CD와 자연스럽게 연결(빌드→ECR→ECS), 오토스케일링, Fargate로 서버 관리 부담 감소, 스크래핑 배치와의 리소스 격리, 런타임(Java 11→17) 업그레이드를 카나리로 안전하게 실험, 클라우드/폐쇄망 양쪽에서 같은 이미지 실행 (자세한 내용은 [`target-architecture.md`](target-architecture.md#왜-컨테이너ecs인가))
        - 프론트·API·스크래핑/잡서비스의 배포 방식을 하나로 통일해 CI/CD·관측성·롤백 절차를 두 벌로 유지하지 않는 것이 목적
      - CI/CD 환경 구축
      - 폐쇄망 환경을 극복하기 위한 폐쇄망 DB 접근용 DMZ API 개발
      - AWS Private Network(PrivateLink/Direct Connect)로 폐쇄망 환경 극복 — 단, 국내 법규상 가능 여부는 법무팀 검토가 선행되어야 하는 옵션 A이며(확인 필요), 어려울 경우 mTLS·IP 화이트리스트·WAF 기반 퍼블릭 엔드포인트 등 옵션 B로 대체
      - 클라우드는 AWS 사용
      - (장기) 프론트엔드가 단일 서비스 분리를 넘어, 여러 마이크로서비스가 모이는 슈퍼앱(마이크로프론트엔드) 구조로 진화
    - 전환 전략
      - 점진적인 페이지 단위 전환은 어려움 — 도메인이 클라우드 환경에 있지 않아 경로 기반 라우팅 구성이 불가능
        - 완화 방안: 도메인을 CloudFront로 향하게 하고 기존 온프레미스 서버를 커스텀 오리진(**서버 IP가 아니라 DMZ 게이트웨이 도메인**)으로 등록, 경로(path)별로 신규 경로만 ALB(Next.js ECS)/API Gateway로 분기 — 도메인 완전 이관 전에도 페이지 단위 전환을 1.5단계로 앞당길 수 있음 (자세한 내용은 [`target-architecture.md`](target-architecture.md#점진적-전환을-앞당기는-방법-cdn-리버스-프록시))
      - 1단계 (현재): 모놀리식 구조를 유지하며 API를 지속적으로 추가, 기존 JSP 프론트는 vanilla JS로 API와 연동
        - CI/CD는 이 단계의 API 서비스부터 우선 구축 (프론트 CI/CD는 2단계 클라우드 이관과 함께)
      - 1.5단계 (추후): 폐쇄망 DB 접근용 DMZ API 구축, AWS Private Network 연결, 관측성/IaC 기반 마련
      - 2단계 (추후): 도메인/인프라를 클라우드로 이관한 뒤 Next.js 전환(ECS 배포) 및 슈퍼앱(마이크로프론트엔드) 구조로 확장
      - 업계 사례 — Netflix는 신규 가입자만 먼저 신규 서비스로 라우팅 → 사용자 세그먼트를 점진 이관 → 병행 운영으로 결과 비교 → 완전 전환의 4단계 스트랭글러 무화과 패턴으로 서비스 중단 없이 700개 이상의 마이크로서비스로 이관했다. 우리의 1→1.5→2단계 전략과 같은 접근.
    - 리스크 및 고려사항
      - 모놀리식과 신규 API가 공존하는 기간 동안의 병행 운영 부담
      - 기존 JSP(세션 기반 인증)와 vanilla JS로 호출하는 API 간 인증/세션 처리 방식 정리 필요
      - PrivateLink/Direct Connect 등 AWS Private Network 연결이 국내 법규상 어려울 가능성 있음(확인 필요 — 법무팀 검토 필요) — 대안(mTLS/IP 화이트리스트/WAF 기반 퍼블릭 엔드포인트, VPN 등)으로 전환할 준비 필요
      - 서비스 경계를 무조건 잘게 나누는 것이 능사는 아님 — Amazon Prime Video는 과도하게 쪼갠 마이크로서비스를 단일 프로세스로 되돌려 비용을 90% 절감한 사례가 있다. 분리는 실제 배포 주기·트래픽 패턴 차이가 있는 경계에서만.
      - Next.js를 정적 호스팅이 아니라 ECS에서 상시 실행하므로 정적 배포보다 운영 부담·비용이 올라간다 — 배포 방식 통일의 이점과 맞바꾸는 선택임을 명시적으로 합의하고 간다
      - SSR·CSR을 화면 단위로 명확히 구분해서 개발해야 해 순수 CSR SPA보다 개발 복잡도가 올라간다 — 코드 리뷰·컨벤션으로 구분 기준을 지속적으로 지켜야 함
      - 금융회사의 완전한 클라우드 이관도 선례가 있다 — Capital One은 자체 데이터센터를 모두 폐쇄하고 AWS로 전면 이관했다 (확인 필요: 공식 출처 링크 미확보)
      - (초안 — 실제 리스크 확인 후 보완 필요)
  - 폐쇄망 극복 — DMZ API & AWS Private Network
    - 배경: 금융회사 특성상 DB 등 핵심 자원이 망분리된 폐쇄망 안에 있어, 클라우드로 옮긴 프론트/API가 직접 접근할 수 없음
    - 목표
      - 폐쇄망 DB 접근을 전담하는 DMZ API 계층 구축 (내부망 VPC 직접 노출 없이 DMZ VPC를 경유)
      - AWS PrivateLink 또는 Direct Connect로 인터넷 구간 없이 클라우드-폐쇄망 연결 (법무팀 검토 필요 — 옵션 A, 어려울 경우 mTLS/IP 화이트리스트 기반 퍼블릭 엔드포인트 등 옵션 B로 대체)
      - 금융보안원 「금융분야 상용 클라우드서비스 보안 관리 참고서」의 Multi-VPC(DMZ VPC/내부망 VPC + Transit Gateway) 표준 패턴 채택
    - 근거: 2022~2023년 전자금융감독규정 개정으로 망분리 규제가 단계적으로 완화되며, 국내 은행의 다수가 컨테이너화 + CI/CD 기반 클라우드 네이티브 방식을 채택하는 추세
  - 그 외 발견한 개선 기회 (레거시 현대화 사례 조사 기반)
    - Java 버전 업그레이드: JSP를 API로 전환하는 과정에서 런타임도 Java 1.8 → 11 → 17(LTS)로 단계적으로 올려, 신규 API부터 최신 LTS 위에서 개발
      - 숨은 장벽: Tomcat 10+/Spring Boot 3+로 옮기는 시점에 `javax.*` → `jakarta.*` 네임스페이스 변경(Jakarta EE 9)을 함께 처리해야 함 — OpenRewrite의 [`rewrite-migrate-java`](https://github.com/openrewrite/rewrite-migrate-java) 레시피로 자동화 가능 (자세한 내용은 [`target-architecture.md`](target-architecture.md#java-18--17-업그레이드의-숨은-장벽-javax--jakarta-네임스페이스))
    - 인증 체계 통합: 세션 기반(JSP) → 토큰 기반(JWT/OAuth2), API Gateway 단에서 인증 통합
    - 관측성 확보: 구조화 로깅 + CloudWatch/APM — 배포 빈도가 늘어날수록 장애 원인 추적 속도가 중요해짐
    - IaC 도입: Terraform 등으로 인프라를 코드화해 DMZ/Private Network 구성을 재현 가능하게 관리
    - 테스트 자동화: JSP를 API로 옮기기 **직전**에 캐릭터라이제이션 테스트(Michael Feathers, 골든 마스터 테스트)로 기존 로직의 실제 입출력을 스냅샷으로 고정해 회귀 안전망부터 확보 → 이후 신구 API 병행 비교(shadow traffic) — GitHub이 권한/결제 로직 리팩터링에 쓴 [Scientist](https://github.com/github/scientist) 방식처럼, 신규 코드를 실제 트래픽에 함께 실행하되 응답은 기존 로직 결과만 반환하고 차이는 비동기로 비교 (자세한 내용은 [`target-architecture.md`](target-architecture.md#레거시-코드-안전망-characterization-test))
    - API 문서화: 기존 JSP를 API로 전환할 때 OpenAPI 명세로 계약을 명확히 해 프론트/타 서비스와의 결합도를 낮춤
    - 스크래핑/잡서비스 컨테이너화: 상시 프로세스 대신 이벤트 기반 스케줄링(EventBridge, Step Functions 등)으로 전환해 리소스 낭비 감소
    - 모듈러 모놀리스 대안 검토: Shopify는 전면 마이크로서비스 대신 명시적 모듈 경계(Packwerk)를 둔 모듈러 모놀리스로 온보딩 시간 55% 단축, 모듈 간 회귀 68% 감소 — 잡서비스(API)처럼 도메인이 아직 명확히 안 나뉜 영역은 무리하게 서비스 분리부터 하지 않는 선택지도 고려
- AI와 친해지기
  - 목표: AI를 코딩에 접목 — 코딩부터 테스트, 문서화까지 자동화
  - 전제조건: 클라우드 전환으로 구성되는 CI/CD·서버 환경 위에서 자동화 파이프라인 구성
  - 하네스 엔지니어링
  - 지침 파일 사용하기
    - 모든 내용을 하나의 지침 파일에 작성하지 않는다.
    - 가장 중요한 지침만 지침 파일에 추가하고 path 구조를 추가해서 올바른 지침을 읽도록 유도한다
