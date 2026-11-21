# study8 · HTML·CSS·JavaScript — 구조화·재사용·설정

## ① 목표 한 줄

화면·요청·도메인·저장소 책임을 나누고 개발·운영 설정을 분리한다.

## ② 📖 이론

파일 분리는 줄 수를 줄이는 일이 아니라 변경 이유를 분리하는 일이다. HTML은 입력·출력 자리, api.js는 전송, forms.js는 제출 수명, board.js는 게시판 규칙, repository는 저장 방법을 맡는다. 진입점은 모듈을 조립하므로 모듈이 역으로 진입점을 import하지 않는다.

설정은 실행 환경에서 주입한다. 개발에서는 .env 파일을 Node CLI가 읽고 운영에서는 컨테이너 env_file 또는 배포 시크릿으로 넣는다. NODE_ENV=production은 기능을 자동으로 안전하게 만들지 않으므로 PUBLIC_ORIGIN·CORS_ORIGIN·DB 경로·비밀 키를 각각 확인한다. 브라우저 코드는 상대경로 /api를 사용하여 서버 주소를 중복 하드코딩하지 않는다.

도서관에 비유하면 화면은 안내대, API 모듈은 운송 창구, 도메인은 대출 규칙, 저장소는 서고다. 서고를 바꾸어도 안내대의 질문 형식은 유지할 수 있다. 공통 함수는 부작용과 반환값을 드러내어 테스트에서 바꿔 넣을 수 있게 만든다.

### 비유로 이해하기

화면은 안내대, API 모듈은 운송 창구, 도메인은 규칙집, 저장소는 서고다.

## ③ 🛠️ 실기: 전체 코드와 줄별 설명

1. api.js에서 공통 헤더·204·오류 처리를 확인한다.
2. forms.js의 try/catch/finally를 확인하고 폼마다 중복하던 코드를 비교한다.
3. .env에서 PUBLIC_ORIGIN과 CORS_ORIGIN을 동일한 개발 주소로 설정한다.
4. 운영에서는 HTTPS 주소와 별도 DB·SMTP·AI 시크릿을 넣는다.

### `workbook/js/api.js` 전체 코드

```javascript
// 토큰은 영구 저장소에 쓰지 않아 새로고침하면 로그인이 풀린다.
let token = '';
export const setToken = value => { token = value; };
export async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  if (options.raw && response.ok) return response;
  const value = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const error = new Error(value.error?.message || '요청 실패');
    Object.assign(error, { status: response.status, fields: value.error?.fields || {} });
    throw error;
  }
  return value;
}
export const json = (method, value) => ({ method, ...(value === undefined ? {} : { body: JSON.stringify(value) }) });
```

원본: [workbook/js/api.js](workbook/js/api.js) · SHA-256(LF 정규화): `8409bc90b72405dad723d8a391ea05462836a442bb7663b59a04b2eeef94ed59`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 토큰은 영구 저장소에 쓰지 않아 새로고침하면 로그인이 풀린다. |
| 2 | `token`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 3 | 다른 모듈이 사용할 인터페이스를 공개한다. `setToken`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 4 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 5 | 약속한 URL·메소드·본문으로 요청하고 응답을 기다린다. |
| 6 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (options.raw && response.ok) return response; |
| 7 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const value = response.status === 204 ? null : await response.json(); |
| 8 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!response.ok) { |
| 9 | `error`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 10 | 현재 처리의 설정·호출·상태를 연결한다: `Object.assign(error, { status: response.status, fields: value.error?.fields // {} });` |
| 11 | 현재 처리의 설정·호출·상태를 연결한다: `throw error;` |
| 12 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 13 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 14 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 15 | 다른 모듈이 사용할 인터페이스를 공개한다. 객체를 JSON 문자열로 바꿔 저장·전송·관찰한다. |


### `workbook/js/forms.js` 전체 코드

```javascript
// 폼 제어를 한곳에 모으고 실패해도 finally에서 버튼을 복구한다.
export function bindForm(form, action, onError) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (form.dataset.busy === 'true' || !form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const buttonValue = event.submitter?.value;
    form.dataset.busy = 'true';
    const buttons = [...form.querySelectorAll('button')];
    buttons.forEach(button => { button.disabled = true; });
    try { await action(data, buttonValue); }
    catch (error) { onError(error); }
    finally { form.dataset.busy = 'false'; buttons.forEach(button => { button.disabled = false; }); }
  });
}
```

원본: [workbook/js/forms.js](workbook/js/forms.js) · SHA-256(LF 정규화): `31671c33083af2965ed5d75d2b04f5de81a616f2831f2b027a02c8b11aa5a10a`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 폼 제어를 한곳에 모으고 실패해도 finally에서 버튼을 복구한다. |
| 2 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 3 | 사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다. |
| 4 | 현재 처리의 설정·호출·상태를 연결한다: `event.preventDefault();` |
| 5 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (form.dataset.busy === 'true' // !form.reportValidity()) return; |
| 6 | `data`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 7 | `buttonValue`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 8 | 현재 처리의 설정·호출·상태를 연결한다: `form.dataset.busy = 'true';` |
| 9 | `buttons`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 10 | 현재 처리의 설정·호출·상태를 연결한다: `buttons.forEach(button => { button.disabled = true; });` |
| 11 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: try { await action(data, buttonValue); } |
| 12 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 13 | 성공·실패와 관계없이 버튼·연결·자원을 정리한다. |
| 14 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 15 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `server/index.js` 전체 코드

```javascript
import { createRepository } from './repository.js';
import { createApp } from './app.js';

// .env는 Node의 --env-file-if-exists가 읽고 브라우저에는 전달하지 않는다.
const repo = await createRepository();
const app = createApp(repo);
const port = Number(process.env.PORT || 3000);
app.server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`학습 서버: http://localhost:${port}/workbook/`));
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
  if (stopping) return;
  stopping = true;
  await app.close();
});
```

원본: [server/index.js](server/index.js) · SHA-256(LF 정규화): `1ca246efd6e53295b40baed45bd3fc2e1e9966908a180cbead85114b1e5f3f79`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 2 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 4 | .env는 Node의 --env-file-if-exists가 읽고 브라우저에는 전달하지 않는다. |
| 5 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const repo = await createRepository(); |
| 6 | `app`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 7 | `port`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 8 | 개발·운영에서 관찰할 실행 결과를 콘솔에 남긴다. |
| 9 | `stopping`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 10 | 사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다. |
| 11 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (stopping) return; |
| 12 | 현재 처리의 설정·호출·상태를 연결한다: `stopping = true;` |
| 13 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await app.close(); |
| 14 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


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


## ④ 🔗 연동 포인트

UI → api → route → board → repository 방향으로 의존한다. 테스트에서는 createBoard(mockRepo)처럼 저장소만 바꿔 넣는다. 다음 단계는 이 경계를 직접 검증하는 테스트다.

## ⑤ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| 설정 변경이 반영 안 됨 | 서버가 예전 환경을 사용 | 서버 재시작 |
| 운영에서 localhost API 호출 | 프론트 주소 하드코딩 | 상대경로 /api와 동일 출처 프록시 |
| 순환 import로 초기화 오류 | 하위 모듈이 진입점 import | 값을 인자·콜백으로 주입 |

## ⑥ 직접 해보기

1. UI 파일에서 fetch 호출을 api 모듈 한곳으로 모은다.
2. 없는 설정을 주었을 때 어떤 오류가 필요한지 기록한다.
3. 같은 API 모듈로 GET과 본문 없는 DELETE를 실행한다.

## ⑦ ☐ 체크리스트

학습자 수행 확인용이다. 문서·코드 작성 완료와 본인의 실습 완료는 다르므로 직접 확인한 뒤 체크한다. 원문 항목 배치는 [반영표](docs/coverage.md)를 따른다.

- [ ] 역할별 폴더와 공통 유틸을 구분한다
- [ ] 개발·운영 환경변수와 공개/비밀 값을 나눈다
- [ ] 테마·메뉴·폼·데이터 초기화를 진입점에서 조립한다

## ⑧ 다음 단계 연결

[study9.md](study9.md)에서 테스트·디버깅로 이어간다.

출처: [지정 노션](https://app.notion.com/p/3d6d7dec5e2e8147b212f0a23b93dfc1) · [공통 API v1](https://app.notion.com/p/3d6d7dec5e2e8139adbfd36dd506c65e) · [반영표](docs/coverage.md) · [검증 기록](docs/verification.md). 기술 근거: [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [Node 24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html). 설치 버전 API는 package-lock.json과 node_modules의 버전별 공식 문서를 기준으로 확인한다.
