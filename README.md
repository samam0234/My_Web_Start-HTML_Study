# HTML · CSS · JavaScript 학습

[지정 노션](https://app.notion.com/p/3d6d7dec5e2e8147b212f0a23b93dfc1)을 바탕으로 순수 HTML·CSS·JavaScript만 학습한다. 다른 앱 프레임워크와 비교·이식·통합하지 않는다. DB·인증·외부 서비스는 브라우저가 Node 기본 HTTP 서버를 호출하는 구조로 연결한다.

## 시작

Node **24.14.0 이상**, npm, Git이 필요하다. Node 24의 `node:sqlite`는 실험적 API 경고가 표시될 수 있다. 이 저장소는 lockfile로 설치 버전을 고정한다.

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

이미 `.env`가 있다면 복사로 덮어쓰지 말고 필요한 키만 추가한다. http://localhost:3000/workbook/ 에서 심화 실습을 연다. 기본 DB는 SQLite이며 메일·결제·OAuth·AI는 **모의 모드**다. 실제 API 키는 `.env`에만 넣는다.

기초 중간 프로젝트는 실행 중인 서버를 종료한 뒤 `npm run midpoint` → http://localhost:3000/midpoint/ 로 연다. 여기서는 study0~10 기능만 사용한다.

## 학습 순서

각 문서는 목표 → 📖 이론(목적·개념·비유) → 🛠️ 전체 코드·줄별 설명 → 🔗 연동 → 오류 노트 → 직접 해보기 3개 → ☐ 체크리스트 → 다음 연결로 구성한다. 체크박스는 학습자가 직접 수행한 뒤 표시한다.

| 파일 | 주제 |
|---|---|
| [study0](study0.md) | 환경·설치·Git·env·용어 |
| [study1](study1.md) | Hello World·HTML/CSS/JS 문법 |
| [study2](study2.md) | 함수·ESM·인자·콜백 |
| [study3](study3.md) | 상태·localStorage·Todo·테마 |
| [study4](study4.md) | URL·동적 경로·요청·응답 |
| [study5](study5.md) | 폼·검증·중복 제출 |
| [study6](study6.md) | SQLite·CRUD·공통 API v1 |
| [study7](study7.md) | 가입·인증·권한·보안 |
| [study8](study8.md) | 구조·공통 모듈·환경 설정 |
| [study9](study9.md) | 테스트·mock·디버깅·오류 TOP 10 |
| [study10](study10.md) | 빌드·DNS·HTTPS·배포 점검 |
| [studyMidpoint](studyMidpoint.md) | 기초만으로 만든 게시판 |
| [study11](study11.md) | DB 교체·ORM |
| [study12](study12.md) | Bootstrap CSS·Nano Stores·JustValidate |
| [study13](study13.md) | 메일·테스트 결제·업로드·OAuth |
| [study14](study14.md) | REST·OpenAPI·버전·페이지네이션 |
| [study15](study15.md) | 측정·캐시·비동기·작업 |
| [study16](study16.md) | Docker·CI/CD·로그·백업·복원 |
| [study17](study17.md) | WebSocket·알림·파일 Worker |
| [study18](study18.md) | 모델 API·SSE·MCP·DocuForge 아이디어 |
| [studyFinal](studyFinal.md) | 심화 서비스를 완성하는 전체 코드 |

## 실행 위치

| URL/명령 | 내용 |
|---|---|
| `/lessons/study1/` ~ `/lessons/study5/` | 독립 기초 예제 |
| `/lessons/study12/` | UI·상태·폼 라이브러리 실제 연결 |
| `/practice/site/` | 기존 3페이지·메뉴·테마·fetch |
| `/final-project/` | 기존 정적 Todo·localStorage |
| `/midpoint/` | 기초 게시판 UI (`npm run midpoint`) |
| `/workbook/` | 심화 게시판·댓글·문서 AI |
| `/api-docs` | 심화 서버의 OpenAPI 3 JSON |
| `npm run mcp:client` | 서버 실행 후 로컬 MCP 검색 도구 연결 |

## 검증·빌드·문서 갱신

```powershell
npm run vendor
npm run docs
npm run check
npm test
npx playwright install chromium
npm run test:browser
npm run build
```

코드 변경 후 `npm run docs`가 문서의 전문·줄 번호·SHA-256을 다시 만든다. `npm run check`는 필수 구성·코드 일치·링크·문법을 검사한다. `npm run vendor`는 study12의 브라우저 번들을 lockfile 버전으로 재생성한다. 직접 편집할 학습 본문은 [scripts/build_docs.py](scripts/build_docs.py)에 있다.

`dist/`는 정적 산출물이다. API 서버는 별도 Node 실행이 필요하다. Docker·외부 DB·운영 배포는 study11·16의 설정과 점검표를 따른다. 자동 배포는 저장소 변수 `DEPLOY_ENABLED=true`와 production 시크릿을 설정한 뒤에만 실행된다.

## 실제 확인 범위

- [노션 반영표와 제외 항목](docs/coverage.md)
- [실행한 검증과 미검증 경계](docs/verification.md)
- [원문 스냅샷](docs/notion-sources.json)
- [라이브러리 출처·라이선스](docs/third-party.md)

외부 DB 3종·실제 모델·실제 SMTP/결제/OAuth·Docker 이미지 실행·원격 서비스 배포는 설정과 실행 증거 없이 완료로 표시하지 않는다. 이 과정의 자료 모델과 큐는 단일 프로세스 학습용이며 운영 확대 전에 DB 제약·트랜잭션·정규화·내구 큐가 필요하다.
