# 로드맵 발표 목차

> 두 이니셔티브의 관계: 클라우드 전환으로 CI/CD와 서버 인프라를 클라우드에 구성하고,
> 그 위에서 AI를 코딩·테스트·문서화 자동화에 접목한다. 즉 "AI와 친해지기"는
> 클라우드 전환으로 만들어지는 CI/CD 환경을 기반으로 실현된다.

> **범위 주의**: 이번 현대화의 대상은 **프론트 / 스크래핑 서비스 / 잡서비스(API)** 3개 서비스다.
> **백오피스는 개선 대상이 아니다** — 백오피스가 참조하는 공통 모듈/DB 스키마를 건드릴 때는
> 영향도를 별도로 검토한다.

- 클라우드 전환
  - 프론트엔드 전환하기
    - 현재 상황
      - 서비스 구성: 프론트 / 백오피스(대상 아님) / 스크래핑 서비스 / 잡서비스(API)
      - 프론트엔드는 JSP + Java 1.8 레거시 모놀리식 구조
      - 문제점: 배포 과정이 불편하고, 신규 개발 후 빠르게 배포해야 하는 상황에서도 배포 속도가 느림 → CI/CD 구축의 직접적인 배경
      - Java 8은 2026년 11월 커뮤니티 업데이트 종료 예정 — 보안 패치 공백이 생기기 전에 버전 업그레이드 경로를 확정해야 함
    - 목표
      - 기존 JSP를 API로 전환해 재활용
      - 프론트엔드를 React로 전환
      - 프론트엔드를 클라우드 서비스로 전환
      - CI/CD 환경 구축
      - (장기) 프론트엔드가 단일 서비스 분리를 넘어, 여러 마이크로서비스가 모이는 슈퍼앱(마이크로프론트엔드) 구조로 진화
    - 전환 전략 (Strangler Fig 패턴)
      - 점진적인 페이지 단위 전환은 어려움 — 도메인이 클라우드 환경에 있지 않아 경로 기반 라우팅 구성이 불가능
      - 1단계 (현재): 모놀리식 구조를 유지하며 API를 지속적으로 추가, 기존 JSP 프론트는 vanilla JS로 API와 연동
        - CI/CD는 이 단계의 API 서비스부터 우선 구축 (프론트 CI/CD는 2단계 클라우드 이관과 함께)
        - API 파사드(façade)를 두고 트래픽을 점진적으로 신규 서비스 쪽으로 옮기는 방식(Strangler Fig)을 적용 — 한 번에 전체를 바꾸는 빅뱅 전환은 지양
      - 2단계 (추후): 도메인/인프라를 클라우드로 이관한 뒤 React 전환 및 슈퍼앱(마이크로프론트엔드) 구조로 확장
        - BFF(Backend for Frontend) 계층을 두어 화면 전용 API 조합/인증을 프론트와 레거시 백엔드 사이에서 흡수
      - **참고 사례와 교훈**: 레거시 JSP UI를 신규 React 관리자 화면으로 그대로 옮기되 화면 로직만 유지한 프로젝트가, 페이지 1회 호출에 레거시 모놀리식 API를 47회 호출하는 구조를 그대로 이어받아 성능·안정성 문제로 4개월 만에 중단된 사례가 있음.
        UI만 먼저 바꾸는 대신 **API 계약(BFF/집계 API)을 먼저 정리한 뒤 화면을 이관**하는 순서가 중요.
        또한 strangler 패턴을 적용한 41개 기업 프로젝트 중 68%가 90일 안에 첫 컴포넌트 전환도 못 마치고 정체되었다는 조사도 있음 — 작은 단위로 쪼개서 **초기 90일 내 가시적 성과(early win)**를 만드는 것이 중요.
    - 리스크 및 고려사항
      - 모놀리식과 신규 API가 공존하는 기간 동안의 병행 운영 부담
      - 기존 JSP(세션 기반 인증)와 vanilla JS로 호출하는 API 간 인증/세션 처리 방식 정리 필요 → BFF 계층에서 인증 방식을 통합해 흡수
      - (초안 — 실제 리스크 확인 후 보완 필요)
  - 백엔드(스크래핑 서비스 · 잡서비스) 현대화
    - Java 버전 업그레이드
      - Java 8 → 17(LTS) → 21(LTS) 단계적 업그레이드, Spring Boot 사용 시 2.7 → 3.x 브릿지 경로(javax → jakarta 네임스페이스 전환 포함)
      - OpenRewrite 등 자동 마이그레이션 도구로 기계적 변경(패키지 경로, 제거된 API) 비용 절감
      - 서비스 규모에 따라 단계적으로 진행 (소규모 서비스부터 검증 후 확대)
    - 스크래핑 서비스
      - 컨테이너화 후 Kubernetes Job/CronJob 기반으로 전환 — 스크래핑은 상시 부하가 아니므로 실행한 만큼만 자원을 쓰는 구조가 비용 효율적
      - 헤드리스 브라우저 기반 스크래핑은 오토스케일링 가능한 워커 풀로 분리
    - 잡서비스(API/배치)
      - 배치 스케줄/실행이력/선후행 제어와 실제 실행 자원(K8s)의 역할을 분리
      - 기존 JSP가 직접 참조하던 로직을 API로 노출해 프론트·타 서비스에서 재사용 가능하게 함
  - 안전망 확보 (리팩터링 전에 선행)
    - 특성화 테스트(characterization test) / 골든 마스터 테스트로 현재 동작을 고정한 뒤 리팩터링 — 테스트 없이 구조를 바꾸는 것은 개선이 아니라 도박
    - 리팩터링 착수 전 관측성(분산 트레이싱, 구조화된 로깅, 서비스 간 호출 지연 지표) 확보 — 지금 시스템이 어떻게 동작하는지 파악하지 못한 채 분해를 시작하지 않는다
  - 폐쇄망 환경 극복
    - 문제: DB 등 핵심 자원이 폐쇄망에 있어 클라우드에서 직접 접근 불가
    - 접근 방식
      - 폐쇄망 DB 접근 전용 DMZ API 개발 — 외부(클라우드)에서는 이 API로만 접근하고, DMZ가 내부망과의 유일한 통로 역할을 함
      - 가능하다면 AWS PrivateLink / Direct Connect / Transit Gateway 등 AWS Private Network를 활용해 인터넷 구간 노출 없이 VPC 간 통신 구성
      - 2024년 8월 금융위원회 발표 "금융분야 망분리 개선 로드맵"으로 연구·개발망에 한해 논리적 망분리가 허용되는 등 규제 완화 흐름이 있음 — 규제 대응 로드맵을 별도로 관리
    - CI/CD와의 관계: 폐쇄망 내부 빌드/배포 파이프라인과 클라우드 파이프라인을 연결하는 하이브리드 구조 필요 (승인 게이트 포함)
  - CI/CD 환경 구축
    - 1단계: 신규 API 서비스부터 파이프라인 구축 (빌드 → 테스트 → 배포 자동화)
    - 2단계: 프론트엔드 클라우드 이관과 함께 프론트 파이프라인 구축
    - 배포 승인·롤백 절차를 파이프라인에 포함 (특히 폐쇄망 연계 구간)
  - AWS 클라우드 전환
    - 프론트엔드부터 클라우드로 우선 이관, 이후 API/배치 서비스 순으로 확장
    - 인프라 코드화(IaC)로 환경 재현성 확보 — 클라우드 이관과 CI/CD 구축을 동시에 추진할 수 있는 전제
- AI와 친해지기
  - 목표: AI를 코딩에 접목 — 코딩부터 테스트, 문서화까지 자동화
  - 전제조건: 클라우드 전환으로 구성되는 CI/CD·서버 환경 위에서 자동화 파이프라인 구성
  - 하네스 엔지니어링
  - 지침 파일 사용하기
    - 모든 내용을 하나의 지침 파일에 작성하지 않는다.
    - 가장 중요한 지침만 지침 파일에 추가하고 path 구조를 추가해서 올바른 지침을 읽도록 유도한다

## 참고 자료

- Martin Fowler, [Strangler Fig Application](https://martinfowler.com/bliki/StranglerFigApplication.html) — 점진적 마이그레이션 패턴의 원전
- [Strangler Fig Pattern for Application Modernization (vFunction)](https://vfunction.com/resources/guide-how-to-use-the-strangler-fig-pattern-for-application-modernization/)
- [Refactoring Monoliths to Microservices with the BFF and Strangler Patterns (WunderGraph)](https://wundergraph.com/blog/wg-strangler-bff)
- [Strangler Fig Pattern: A Real Case Study with Metrics — $4.2M Savings / 실패 사례 포함 (Modernization Intel)](https://softwaremodernizationservices.com/insights/strangler-fig-pattern-example/)
- [Legacy Code Modernization: A Practical Guide (Sourcegraph)](https://sourcegraph.com/blog/legacy-code-modernization)
- [Surviving Legacy Code with Golden Master and Sampling](https://blog.thecodewhisperer.com/permalink/surviving-legacy-code-with-golden-master-and-sampling)
- [How to Migrate from Java 8 to Java 17 (BellSoft)](https://bell-sw.com/blog/migration-from-java-8-to-java-17/)
- [How to Migrate from Java 8 to Java 21: The Enterprise Guide (Katyella)](https://katyella.com/blog/java-8-to-21-migration-guide/)
- [Let me introduce you to a DMZ based Architecture](https://isriramkumarm.medium.com/let-me-introduce-you-to-a-dmz-based-architecture-d54675f83dbf)
- [Enhanced security with DMZ architecture using Amazon VPC Block Public Access (AWS)](https://aws.amazon.com/blogs/networking-and-content-delivery/enhanced-security-with-dmz-architecture-using-amazon-vpc-block-public-access/)
- 금융위원회, "금융분야 망분리 개선 로드맵" (2024.08) 관련 — [AWS 금융 클라우드 길라잡이 A to Z Part 2](https://aws.amazon.com/ko/blogs/tech/financial-cloud-guide-a-to-z-part2/)
- 삼성SDS, [레거시 시스템의 새로운 비즈니스 가치 창출 - IT 현대화(Modernization) 방안과 사례](https://www.samsungsds.com/kr/insights/it_modernization.html)
- LG CNS, [Kubernetes 환경에서 J-Jobs를 활용하는 4가지 업무 패턴](https://solution.lgcns.com/kr/solution/jjobs/tech/container-jjobs-patterns/)
