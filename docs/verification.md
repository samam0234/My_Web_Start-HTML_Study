# 실행 검증 기록

기준일: **2026-11-22 (Asia/Seoul)**. 문서 작성·코드 구현과 외부 서비스 실제 실행을 구분한다. 모든 테스트는 학습 프로젝트의 경계를 검증하며 학습자 개인의 수강 완료 체크를 대신하지 않는다.

## 확인한 흐름

lessons 보완: study6~10·13~14·16~18·Midpoint·Final의 12개 누락 폴더와 study0·11·15 브라우저 진입점을 추가했다. Chromium에서 전체 21개 index.html의 HTTP 200·h1 렌더링·JS 예외 없음, 새 study6 가입/로그인/CRUD, study9 상태 모듈 검사를 확인했다. check 명령은 각 문서와 같은 이름의 lessons 폴더에 index.html이 없으면 실패한다. 터미널 전용 DB·Docker·MCP 검증 한계는 아래 기록을 유지한다.

사용자 흐름: HTML 폼 → fetch/Bearer → Node HTTP → 검증/작성자 권한 → SQLite → JSON/SSE → DOM 텍스트 출력.

| 검증 | 결과 | 근거 |
|---|---|---|
| 단위·요청·통합 검사 | 10개 통과 | `npm test`, 실패/건너뜀 0 |
| 공통 API v1 | 통과 | 회원가입·로그인·me·로그아웃, 글/댓글 CRUD, meta/Location/204/requestId |
| 권한·입력·정적 경로 | 통과 | 400·401·403·404·409·413·422·429, 다른 작성자/문서 접근 거부, .env/서버 파일 공개 거부 |
| DB 지속성 | 통과 | 파일 SQLite 연결 재생성 후 글·세션 유지 |
| AI 모의·한도 | 통과 | 발췌·근거 없음·질문 기록·요청 한도 |
| 설치된 AI SDK HTTP 경계 | 통과 | 테스트 모델 서버의 호환 SSE를 AI SDK 7.0.179로 읽고 토큰 사용량 30 기록 |
| SSE 청크 분할 | 통과 | 1바이트 분할·한글·미완료 종료·오류 이벤트 |
| MCP | 통과 | SDK 1.32.2 stdio initialize→도구 목록→공개 게시글 검색 호출 |
| 중간 기초 서버 | 통과 | 별도 basic.js 서버에서 가입·로그인·CRUD; AI 경로 404 |
| Chromium UI | 통과 | 가입·로그인·글 CRUD·댓글·XSS 문자열·Worker 업로드·SSE·질문 기록·테마·Todo 복구 |
| study12 라이브러리 | 통과 | Bootstrap CSS·Nano Stores·JustValidate 폼에서 서버 검사 후 상태 횟수 증가 |
| 화면 크기 | 통과 | 데스크톱 1280×900, 모바일 390×844; 가로 overflow 없음 |
| 브라우저 JS 예외 | 0개 | `pageerror` 수집 결과 [] |
| 정적 빌드 | 통과 | `npm run build`, dist에 서버/.env/DB 미포함 |
| 의존성 감사 | 통과 | `npm audit --omit=dev`, 취약점 0개 |
| 문서·구문·코드 일치·링크 | 통과 | `npm run check`, 21개 문서의 8개 구성·코드 전문/LF 정규화 해시·줄별 해설·로컬 링크 |
| SQLite 백업·복원 | 통과 | 온라인 백업 파일 생성 → PRAGMA integrity_check → 새 파일로 복원 |
| Compose 설정 구문 | 통과 | `docker compose config --quiet`; 컨테이너 실행 검증과 구분 |

## 재현 명령

```powershell
npm ci
npm run vendor
npm run docs
npm run check
npm test
npx playwright install chromium
npm run test:browser
npm run build
npm audit --omit=dev
```

브라우저 결과는 로컬 `artifacts/browser-result.json`, 모바일 캡처는 `artifacts/workbook-mobile.png`에 생성한다. 테스트 계정과 DB는 임시 경로에 만들고 종료 시 정리한다. artifacts·data·backups·.env는 Git에서 제외한다.

## 실제 연결을 검증하지 못한 것

- Docker CLI는 있으나 Docker Desktop Linux 엔진 named pipe가 없어 `docker info` 연결이 실패했다. Compose 구문은 검사하되 이미지 빌드·컨테이너 실행·외부 DB 컨테이너는 실행 완료로 표시하지 않는다.
- PostgreSQL·MariaDB·MongoDB는 구현과 `npm run test:databases` 재현 도구를 제공했다. 이 환경에서 실제 접속을 검증하지 않았다.
- SMTP·Stripe 테스트 결제/웹훅·GitHub OAuth는 실제 비밀을 사용하지 않았다. 모의 경계를 확인했다.
- 실제 Ollama/외부 모델은 호출하지 않았다. 호환 모델 HTTP 테스트 서버로 전송/스트림/사용량 경계만 확인했다.
- 원격 배포·도메인·HTTPS 발급·GitHub Actions 배포 실행은 별도 운영 설정 후 확인해야 한다. Git 푸시는 소스 게시이며 서비스 배포 완료와 다르다.
- Firefox·Safari·실기기·스크린리더는 확인하지 않았다.

## 발견 후 수정한 문제

1. PATCH 검증의 생성 기본값이 누락된 tags를 []로 바꾸었다. 기본값 없는 patchSchema로 분리하고 기존 태그 유지 검사를 통과했다.
2. 기존 Todo가 문법상 유효한 JSON 객체({})를 배열로 믿었다. 배열·항목 자료형 검증을 추가했고 Chromium에서 복구 후 추가·새로고침을 확인했다.
3. 기존 정적 JSON fetch가 HTTP 오류를 구분하지 않았다. response.ok와 배열 형식 검사를 추가했다.
4. 공개 작성자 객체에서 이메일을 제외하고 id·nickname만 반환하도록 공통 v1에 맞췄다.

## 백업·복원과 운영 한계

SQLite는 `npm run backup`으로 온라인 사본을 만들고 `npm run restore -- 원본 새대상`으로 새 경로에 복원한다. 복원은 PRAGMA integrity_check가 ok인 경우에만 수행하고 기존 대상은 덮어쓰지 않는다. 원격 주기 백업·암호화·외부 보관·복원 훈련은 운영 환경에서 별도로 설정한다.

현재 records Data Mapper는 종류 전체 조회, 단일 프로세스 직렬 쓰기, 메모리 작업 스케줄러를 사용한다. 다중 인스턴스 운영에는 정규화·DB UNIQUE/트랜잭션·DB 페이지네이션·공유 rate limit·내구성 큐·pub/sub가 필요하다.
