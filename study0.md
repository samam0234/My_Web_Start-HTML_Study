# study0 · HTML·CSS·JavaScript — 환경 설정

## ① 목표 한 줄

브라우저와 Node 실행 환경을 구분하고 같은 저장소에서 실습 서버를 시작한다.

## ② 📖 이론

HTML은 문서 구조, CSS는 표현, JavaScript는 동작을 맡는다. HTML·CSS·JS는 별도 프레임워크 설치 대상이 아니다. 브라우저가 문서를 해석하고, Node는 브라우저 밖에서 JavaScript를 실행한다. 식당에 비유하면 HTML은 공간 배치, CSS는 인테리어, JS는 주문을 처리하는 동작이다.

웹 페이지는 HTML 한 장, 사이트는 연결된 페이지들의 집합이다. 브라우저는 클라이언트이고 서버는 HTTP 요청에 응답한다. URL은 프로토콜·호스트·포트·경로·쿼리·fragment로 나뉜다. DNS로 서버를 찾고 HTTPS로 HTML을 받은 뒤 DOM과 CSSOM을 만들고 레이아웃·페인트를 진행한다. module 스크립트는 문서 파싱 후 실행된다.

정적 서버는 이미 있는 파일을 전달한다. API 서버는 요청에 따라 JSON을 만들고 저장소를 변경한다. 이 과정은 같은 JavaScript를 Node 기본 HTTP 모듈에서 실행하며 다른 웹 프레임워크를 추가하지 않는다. 브라우저는 DB 암호를 가져서는 안 되므로 DB·메일·모델 호출은 서버에 둔다.

ESM은 import/export로 파일 범위를 나누는 규칙이다. DOM은 화면 요소의 객체 트리이고, state는 화면을 결정하는 데이터다. Promise는 나중에 완료될 작업, await는 그 결과를 이어서 사용하는 문법이다. origin은 프로토콜·호스트·포트가 모두 같은 범위다.

### 비유로 이해하기

HTML은 공간 배치, CSS는 인테리어, JavaScript는 공간 안에서 실제로 움직이는 일이다.

## ③ 🛠️ 실기: 전체 코드와 줄별 설명

1. Node 24.14.0 이상, Git, VS Code와 최신 브라우저를 설치한다. 설치 후 터미널을 다시 열어 PATH를 갱신한다.
2. 기존 저장소에서는 루트 폴더를 연다. 새 복제라면 아래 clone 명령을 실행한다. 이미 Git 저장소인 이 폴더에서 git init을 다시 할 필요는 없다.
3. npm ci로 lockfile에 고정된 패키지를 설치한다. 빈 새 프로젝트라면 mkdir html-study → cd html-study → npm init -y 순서로 만든 뒤 package.json의 type을 module로 설정한다.
4. .env.example을 .env로 복사한다. .env는 서버가 읽는 비공개 설정이고 브라우저는 자동으로 읽지 않는다. API URL 같은 공개 값만 프론트에 전달한다.
5. npm run dev를 실행하고 http://localhost:3000/lessons/study1/ 을 연다. Node --watch는 서버를 재시작한다. 브라우저 자동 새로고침은 VS Code Live Server를 기초 정적 예제에 사용할 때 제공된다.
6. VS Code 확장 Live Server, Prettier, ESLint를 설치한다. 현재 코드는 npm run check로 문법을 검사하므로 확장 설치는 실행 필수 조건이 아니다.
7. F12에서 Elements, Console, Network, Application을 각각 열고 문서·로그·요청·저장소 위치를 확인한다.

### 설치·버전·Git 명령 (PowerShell)

```powershell
node --version
npm --version
git --version
git clone https://github.com/samam0234/My_Web_Start-HTML_Study.git
cd My_Web_Start-HTML_Study
npm ci
Copy-Item .env.example .env
node lessons/study0/hello.js
npm run dev
```

빈 프로젝트를 별도로 만들 때만 `git init` → `.gitignore` 작성 → `git add .` → `git commit -m "chore: 학습 프로젝트 초기화"` 순서다. `.env.example`에는 키 이름과 가짜 값만 남긴다. 실제 키·DB 파일은 커밋하지 않는다.

### 폴더 구조

```text
study0.md ... study10.md, studyMidpoint.md, study11.md ... study18.md, studyFinal.md
lessons/       단계별 독립 예제
practice/site/ 기존 3페이지 정적 실습
final-project/ 기존 정적 Todo
midpoint/      기초 게시판 UI
workbook/      심화 게시판·문서 AI UI
server/        순수 Node HTTP·저장소·인증·외부 연동
mcp/           로컬 MCP 서버·클라이언트
tests/         단위·요청·모델 경계 검사
scripts/       문서·빌드·브라우저·백업 도구
ops/           운영 설정
docs/          요구사항 추적·검증 기록·노션 원문
```


### `lessons/study0/hello.js` 전체 코드

```javascript
// Node 실행 환경과 브라우저 실행 환경을 구분하는 첫 명령이다.
console.log(`JavaScript 실행 환경: ${process.version}`);
```

원본: [lessons/study0/hello.js](lessons/study0/hello.js) · SHA-256(LF 정규화): `673d69ccf714c3bfdb3878b9c7ba5162e5101fb8d27bb5cf2addf92e57a5dc80`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | Node 실행 환경과 브라우저 실행 환경을 구분하는 첫 명령이다. |
| 2 | 개발·운영에서 관찰할 실행 결과를 콘솔에 남긴다. |


### `.env.example` 전체 코드

```text
PORT=3000
HOST=127.0.0.1
NODE_ENV=development
PUBLIC_ORIGIN=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
DB_DRIVER=sqlite
SQLITE_PATH=data/study.sqlite
# postgres: postgresql://study:study@localhost:5432/study
# mariadb: mariadb://study:study@localhost:3306/study
# mongodb: mongodb://localhost:27017/study
DATABASE_URL=
INTEGRATIONS_MODE=mock
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=study@example.test
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
AI_PROVIDER=mock
AI_BASE_URL=http://localhost:11434/v1
AI_MODEL=
AI_API_KEY=
AI_DAILY_REQUEST_LIMIT=20
AI_MAX_OUTPUT_TOKENS=512
MCP_API_BASE=http://localhost:3000
```

원본: [.env.example](.env.example) · SHA-256(LF 정규화): `ef8f6088040b7d2fc1102dfe1bca4cd06e129b85d1595490f5b32eed380c8cfc`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 서버 설정 PORT의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 2 | 서버 설정 HOST의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 3 | 서버 설정 NODE_ENV의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 4 | 서버 설정 PUBLIC_ORIGIN의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 5 | 서버 설정 CORS_ORIGIN의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 6 | 서버 설정 DB_DRIVER의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 7 | 서버 설정 SQLITE_PATH의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 8 | 서버 설정 # postgres: postgresql://study:study@localhost:5432/study의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 9 | 서버 설정 # mariadb: mariadb://study:study@localhost:3306/study의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 10 | 서버 설정 # mongodb: mongodb://localhost:27017/study의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 11 | 서버 설정 DATABASE_URL의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 12 | 서버 설정 INTEGRATIONS_MODE의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 13 | 서버 설정 SMTP_HOST의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 14 | 서버 설정 SMTP_PORT의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 15 | 서버 설정 SMTP_USER의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 16 | 서버 설정 SMTP_PASSWORD의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 17 | 서버 설정 MAIL_FROM의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 18 | 서버 설정 STRIPE_SECRET_KEY의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 19 | 서버 설정 STRIPE_WEBHOOK_SECRET의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 20 | 서버 설정 STRIPE_PRICE_ID의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 21 | 서버 설정 GITHUB_CLIENT_ID의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 22 | 서버 설정 GITHUB_CLIENT_SECRET의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 23 | 서버 설정 AI_PROVIDER의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 24 | 서버 설정 AI_BASE_URL의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 25 | 서버 설정 AI_MODEL의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 26 | 서버 설정 AI_API_KEY의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 27 | 서버 설정 AI_DAILY_REQUEST_LIMIT의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 28 | 서버 설정 AI_MAX_OUTPUT_TOKENS의 예시 값이며 실제 비밀은 .env에만 넣는다. |
| 29 | 서버 설정 MCP_API_BASE의 예시 값이며 실제 비밀은 .env에만 넣는다. |


### `.gitignore` 전체 코드

```text
node_modules/
.env
.env.*
!.env.example
data/
backups/
dist/
artifacts/
__pycache__/
*.log
```

원본: [.gitignore](.gitignore) · SHA-256(LF 정규화): `11d032b83d618c8bc11b92d2964b2723457f933a44a506f739c34c7a29aa25fc`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 이 경로 패턴이 Git 또는 이미지에 포함되지 않도록 제외한다. |
| 2 | 이 경로 패턴이 Git 또는 이미지에 포함되지 않도록 제외한다. |
| 3 | 이 경로 패턴이 Git 또는 이미지에 포함되지 않도록 제외한다. |
| 4 | 이 경로 패턴이 Git 또는 이미지에 포함되지 않도록 제외한다. |
| 5 | 이 경로 패턴이 Git 또는 이미지에 포함되지 않도록 제외한다. |
| 6 | 이 경로 패턴이 Git 또는 이미지에 포함되지 않도록 제외한다. |
| 7 | 이 경로 패턴이 Git 또는 이미지에 포함되지 않도록 제외한다. |
| 8 | 이 경로 패턴이 Git 또는 이미지에 포함되지 않도록 제외한다. |
| 9 | 이 경로 패턴이 Git 또는 이미지에 포함되지 않도록 제외한다. |
| 10 | 이 경로 패턴이 Git 또는 이미지에 포함되지 않도록 제외한다. |


### `package.json` 전체 코드

```json
{
  "name": "html-css-js-study",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=24.14.0"
  },
  "scripts": {
    "dev": "node --watch --env-file-if-exists=.env server/index.js",
    "midpoint": "node --env-file-if-exists=.env server/basic.js",
    "start": "node --env-file-if-exists=.env server/index.js",
    "test": "node --test tests/*.test.js",
    "test:browser": "node scripts/browser-check.js",
    "test:databases": "node --env-file-if-exists=.env scripts/check-databases.js",
    "check": "node scripts/check.js",
    "build": "node scripts/build.js",
    "vendor": "node scripts/vendor.js",
    "docs": "python scripts/build_docs.py",
    "backup": "node --env-file-if-exists=.env scripts/backup.js",
    "restore": "node --env-file-if-exists=.env scripts/restore.js",
    "mcp:client": "node --env-file-if-exists=.env mcp/client.js"
  },
  "dependencies": {
    "@ai-sdk/openai-compatible": "^3.0.94",
    "@modelcontextprotocol/sdk": "^1.32.2",
    "ai": "^7.0.179",
    "bootstrap": "^5.3.9",
    "drizzle-orm": "^0.45.4",
    "just-validate": "^4.3.0",
    "mariadb": "^3.5.5",
    "mongodb": "^7.9.1",
    "nanostores": "^1.5.5",
    "nodemailer": "^10.6.1",
    "pg": "^8.23.1",
    "stripe": "^23.2.0",
    "ws": "^8.23.0",
    "zod": "^4.6.7"
  },
  "devDependencies": {
    "esbuild": "^0.28.2",
    "playwright": "^1.65.1"
  }
}
```

원본: [package.json](package.json) · SHA-256(LF 정규화): `d2a83e10cb66309546b7ffd6845de9c3a8d62a9b58657e07b9eb05ca0b8d2c94`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 설정/데이터 필드 {의 값을 정의한다. |
| 2 | 설정/데이터 필드 name의 값을 정의한다. |
| 3 | 설정/데이터 필드 version의 값을 정의한다. |
| 4 | 설정/데이터 필드 private의 값을 정의한다. |
| 5 | 설정/데이터 필드 type의 값을 정의한다. |
| 6 | 설정/데이터 필드 engines의 값을 정의한다. |
| 7 | 설정/데이터 필드 node의 값을 정의한다. |
| 8 | 설정/데이터 필드 }의 값을 정의한다. |
| 9 | 설정/데이터 필드 scripts의 값을 정의한다. |
| 10 | 설정/데이터 필드 dev의 값을 정의한다. |
| 11 | 설정/데이터 필드 midpoint의 값을 정의한다. |
| 12 | 설정/데이터 필드 start의 값을 정의한다. |
| 13 | 설정/데이터 필드 test의 값을 정의한다. |
| 14 | 설정/데이터 필드 test의 값을 정의한다. |
| 15 | 설정/데이터 필드 test의 값을 정의한다. |
| 16 | 설정/데이터 필드 check의 값을 정의한다. |
| 17 | 설정/데이터 필드 build의 값을 정의한다. |
| 18 | 설정/데이터 필드 vendor의 값을 정의한다. |
| 19 | 설정/데이터 필드 docs의 값을 정의한다. |
| 20 | 설정/데이터 필드 backup의 값을 정의한다. |
| 21 | 설정/데이터 필드 restore의 값을 정의한다. |
| 22 | 설정/데이터 필드 mcp의 값을 정의한다. |
| 23 | 설정/데이터 필드 }의 값을 정의한다. |
| 24 | 설정/데이터 필드 dependencies의 값을 정의한다. |
| 25 | 설정/데이터 필드 @ai-sdk/openai-compatible의 값을 정의한다. |
| 26 | 설정/데이터 필드 @modelcontextprotocol/sdk의 값을 정의한다. |
| 27 | 설정/데이터 필드 ai의 값을 정의한다. |
| 28 | 설정/데이터 필드 bootstrap의 값을 정의한다. |
| 29 | 설정/데이터 필드 drizzle-orm의 값을 정의한다. |
| 30 | 설정/데이터 필드 just-validate의 값을 정의한다. |
| 31 | 설정/데이터 필드 mariadb의 값을 정의한다. |
| 32 | 설정/데이터 필드 mongodb의 값을 정의한다. |
| 33 | 설정/데이터 필드 nanostores의 값을 정의한다. |
| 34 | 설정/데이터 필드 nodemailer의 값을 정의한다. |
| 35 | 설정/데이터 필드 pg의 값을 정의한다. |
| 36 | 설정/데이터 필드 stripe의 값을 정의한다. |
| 37 | 설정/데이터 필드 ws의 값을 정의한다. |
| 38 | 설정/데이터 필드 zod의 값을 정의한다. |
| 39 | 설정/데이터 필드 }의 값을 정의한다. |
| 40 | 설정/데이터 필드 devDependencies의 값을 정의한다. |
| 41 | 설정/데이터 필드 esbuild의 값을 정의한다. |
| 42 | 설정/데이터 필드 playwright의 값을 정의한다. |
| 43 | 설정/데이터 필드 }의 값을 정의한다. |
| 44 | 설정/데이터 필드 }의 값을 정의한다. |


## ④ 🔗 연동 포인트

설정 파일 → 서버 process.env → 저장소/외부 API로 연결한다. 비밀을 HTML·JS·Git에 넣지 않는다. 다음 단계에서는 이 서버가 전달하는 HTML을 수정한다.

## ⑤ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| node 명령을 찾지 못함 | 설치 전 터미널의 PATH | 터미널을 다시 열고 node --version |
| EADDRINUSE | 3000 포트가 이미 사용 중 | 기존 서버 종료 또는 PORT·PUBLIC_ORIGIN·CORS_ORIGIN을 함께 변경 |
| 설정이 프론트에 없음 | .env를 브라우저가 자동으로 읽는다고 가정 | 서버에서만 사용하고 공개 설정은 명시적으로 전달 |

## ⑥ 직접 해보기

1. .env를 수정한 뒤 git status --ignored에서 제외 여부를 확인한다.
2. 기초 HTML을 Live Server로 열고 저장 시 자동 새로고침을 확인한다.
3. Network에서 HTML과 module JS 요청을 하나씩 찾아 역할을 설명한다.

## ⑦ ☐ 체크리스트

학습자 수행 확인용이다. 문서·코드 작성 완료와 본인의 실습 완료는 다르므로 직접 확인한 뒤 체크한다. 원문 항목 배치는 [반영표](docs/coverage.md)를 따른다.

- [ ] node --version, npm --version, git --version을 실행했다
- [ ] HTTP 서버로 HTML을 열고 file://와 차이를 설명한다
- [ ] .env와 data/가 Git에서 제외된다
- [ ] HTML/CSS/JS·DOM·HTTP·origin·ESM을 내 말로 설명한다

## ⑧ 다음 단계 연결

[study1.md](study1.md)에서 Hello World와 기본 문법로 이어간다.

출처: [지정 노션](https://app.notion.com/p/3d6d7dec5e2e8147b212f0a23b93dfc1) · [공통 API v1](https://app.notion.com/p/3d6d7dec5e2e8139adbfd36dd506c65e) · [반영표](docs/coverage.md) · [검증 기록](docs/verification.md). 기술 근거: [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [Node 24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html). 설치 버전 API는 package-lock.json과 node_modules의 버전별 공식 문서를 기준으로 확인한다.
