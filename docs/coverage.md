# 요구사항·노션 반영표

원문: [HTML·CSS·JS 기초](https://app.notion.com/p/3d6d7dec5e2e8147b212f0a23b93dfc1). 페이지 전체를 읽고 공통 API v1·AI/MCP·DocuForge·웹 사이트 상위 페이지를 추가 확인했다. 원문 스냅샷은 [notion-sources.json](notion-sources.json)에 보존했다. 지정 페이지에는 `[FW]`라는 별도 하위 페이지나 study 번호별 추가 체크박스가 없다. 아래 배치는 주제에 따른 이번 학습 문서의 배치이며 노션에 원래 번호가 있었다고 간주하지 않는다.

모든 루트 학습 파일은 `study`로 시작한다. 기존 study0~6·studyFinal은 덮어쓰고 study7~18·studyMidpoint를 추가했다. README는 별도 사용 안내다. 다른 앱 프레임워크 비교·이식·통합은 포함하지 않는다.

## 지정 페이지 항목 → 해당 번호의 ☐ 체크리스트

| 노션 원문 | 배치 | 코드/설명 |
|---|---|---|
| 시맨틱 태그, 폼, 테이블, 링크 | study1 | lessons/study1/index.html, practice/site |
| 접근성 기본 (label, alt) | study1 | label/id, alt, caption/scope |
| 박스 모델, flex, grid | study1 | lessons/study1/style.css, workbook/style.css |
| 반응형 기초 | study1 | viewport, 640px media query |
| 클래스를 의미 있게 나누는 법 | study1 | card-grid, actions 등 역할별 클래스 |
| 변수, 함수, 배열/객체 | study1 | hello.js |
| DOM 이벤트 | study2 | card.js 콜백, 기존 nav.js |
| fetch, Promise, async/await | study6 | api.js, 기존 data.js |
| 모듈(ESM) 개념 | study2 | card.js/app.js, 기존 main.js |
| CSS 변수로 색을 한 곳에 모으면 다크모드는 [data-theme="dark"]에서 변수만 다시 정의하면 끝난다. | study12 | CSS 변수·테마 |
| 헤더처럼 한 줄 배치는 flex, 카드 목록처럼 격자는 grid. 640px 이하에서는 미디어쿼리로 1열 + 햄버거 메뉴. | study12 | 기존 practice/site의 style.css·nav.js |
| CSS 변수 + grid + 반응형 | study1·12 | 같은 개념과 실행 코드를 연결 |
| 햄버거 메뉴 + 현재 페이지 표시 | study2·12 | 기존 practice/site/js/nav.js 유지 |
| fetch + async/await + try/catch | study6 | data.js, api.js |
| Vanilla JS Todo: localStorage 저장 + 다시 그리기 | study3·studyMidpoint | 기존 Todo 유지·자료형 복구 보강 |
| 다크모드 토글 | study3 | 기존 theme.js와 workbook 테마 |
| fetch는 file://에서 막힘·ESM도 서버 필요 | study0·6 | HTTP로 실행, 오류 노트 |
| localStorage JSON.parse 예외 → try/catch | study3 | 구문·자료형 검증, 배열 복구 |
| 폼 submit 기본 새로고침 → preventDefault | study5 | 폼 이벤트, pending/finally |

굵게·인라인 코드 같은 서식은 Markdown 표현으로 바꾸고 원문 문구는 체크리스트에 유지했다. 코드 스니펫의 기능 설명과 원문 체크 항목은 구분한다. 원문에 없던 체크 항목도 실행 점검용으로 추가했으며 학습자 실습 여부를 대신 체크하지 않았다.

## 사용자 요청 21개 문서의 연결

모든 21개 단계에 lessons/study번호/index.html 진입점을 갖췄다. 공통 서버·모듈 구현은 기존 위치에서 재사용하고 각 폴더의 app.js에 단계별 요청·검사 순서를 둔다. lessons/index.html이 실행 목차이며, scripts/create_lesson_entries.py가 추가 진입점을 재생성한다. study0·11·15의 기존 Node 스크립트는 유지하고 브라우저 진입점도 함께 제공한다.

| 파일 | 필수 내용과 실행 근거 |
|---|---|
| study0 | 설치·버전·생성·구조·서버·에디터·용어·Git·ignore·env |
| study1 | 첫 화면·HTML/CSS/JS·템플릿·개발자도구·자동 새로고침 구분 |
| study2 | 함수/ESM·진입점·인자/콜백·DOM 부품 |
| study3 | 상태·수동 바인딩·JSON·localStorage·Todo·테마 |
| study4 | URL·동적 id·query·이동·HTTP/화면 404 |
| study5 | 폼·검증·메시지·중복 방지·200/400/422 |
| study6 | SQLite 모델·CRUD·환경 설정·공통 API v1 |
| study7 | 가입·로그인·토큰/세션·권한·해시·CORS/XSS/CSRF |
| study8 | 폴더·공통 API/폼·설정·개발/운영 |
| study9 | 단위·요청·mock·로그·DevTools·오류 TOP 10 |
| study10 | 빌드·정적/API 배포·DNS/HTTPS·DB/env·점검 |
| studyMidpoint | 목표·기능·구조·구현 순서·구성도·1차 점검·회고 |
| study11 | PostgreSQL/MariaDB/MongoDB 드라이버·ORM 차이·자료 이관 구분 |
| study12 | Bootstrap CSS·Nano Stores·JustValidate와 자체 모듈 |
| study13 | Stripe 테스트·SMTP·TXT/MD 업로드·GitHub OAuth |
| study14 | REST·OpenAPI JSON·버전·페이지네이션·오류 |
| study15 | ETag/304·no-store·비동기/Worker/jobs·반복 측정 |
| study16 | Docker·Actions·시크릿·로그/모니터링·백업/복원 |
| study17 | WebSocket·공개 알림·재연결·파일 Worker |
| study18 | 모델 API·프롬프트·SSE·quota/사용량·MCP 서버/클라이언트·DocuForge |
| studyFinal | 중간/심화 통합·목표·기능·구성도·구현 순서·배포/보안/테스트·회고 |

모든 파일에 목표·📖 이론(목적/개념/비유)·🛠️ 실기(전체 코드/줄별 설명)·🔗 연동·오류 노트·직접 해보기 3개·☐ 체크리스트·다음 연결을 넣었다. 생성기는 실제 파일 전문과 SHA-256을 넣고 check 도구는 누락·코드 불일치·로컬 링크를 검사한다.

## 구현과 검증의 범위

- DB 교체는 실제 드라이버 코드와 계약 검사 스크립트가 있다. Docker 엔진 미실행으로 외부 DB 3종은 이 작업에서 접속 검증하지 못했다. DB 변경이 기존 데이터 자동 이관을 의미하지 않는다.
- 외부 결제·메일·OAuth는 모의 모드와 실제 설정 경계가 있다. 실제 계정·키를 사용한 호출은 실행하지 않았다.
- 모델은 기본 모의 응답이다. 설치된 AI SDK와 호환 HTTP/SSE의 연결은 테스트 서버로 검증했다. 실제 Ollama/외부 모델 품질·GPU·비용은 검증하지 않았다.
- DocuForge는 기능 아이디어만 적용했다. TXT·MD, 단어 기반 발췌 검색, 근거 인용, 질문 기록을 구현했다. PDF·DOCX·PPTX·OCR·임베딩은 구현하지 않았다.
- AI 참고 페이지의 JWT 지정·일일 토큰 총량·자동 도구 호출·원격 MCP/Claude 연결은 완료 처리하지 않는다. 여기서는 opaque Bearer·일일 요청 수·출력 토큰 상한·로컬 읽기 전용 MCP를 구현했다.
- 단일 프로세스용 학습 구조다. 정규화·UNIQUE·트랜잭션·DB 쿼리 페이지네이션·내구 큐·다중 인스턴스 pub/sub는 다음 보강 항목이다.

## 마지막: 그대로 넣지 않은 원문 항목

1. **“Vanilla JS로 Todo 한 개 만든 뒤 같은 것을 Vue로 옮기기”**: Todo 구현만 반영했다. Vue 이식은 이번 “다른 프레임워크와 비교하거나 통합하지 마” 지시에 따라 제외했다.
2. **“같은 Todo를 Vue로 옮기기 (위 \"예제\"의 남은 반쪽)”**: 같은 이유로 제외했다. 원래 Vue 페이지를 변경하지 않았다.
3. **“같은 Todo를 jQuery로 다시 만들어 비교”**: 비교 실습은 이번 범위에서 제외했다. 원래 jQuery 페이지를 변경하지 않았다.
4. **“이 \"상태 → 다시 그리기\"가 Vue·React가 자동으로 해 주는 일이다.”**: 상태→다시 그리기는 반영했고 타 프레임워크 비교 설명은 제외했다.

지정 페이지의 나머지 기초 주제·코드 패턴·오류 노트에 누락된 항목은 없다. 노션의 기존 실습 완료 기록은 학습자의 과거 기록이며 새로 추가한 심화/배포 항목까지 완료했다는 의미로 확대하지 않는다.
