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



### 단계별 실행 위치

`npm run dev` 후 `/lessons/study8/`에서 이 단계의 실습을 연다. [실습 HTML](lessons/study8/index.html)과 [전체 실습 목차](lessons/index.html)를 사용한다. 기초 중간 프로젝트 전체 화면은 `npm run midpoint` 후 `/midpoint/`에서 실행한다. 터미널 전용 DB·Docker·MCP 명령은 해당 문서의 실행 순서를 따른다.

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


### `lessons/study8/index.html` 전체 코드

```html
<!doctype html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>study8 실습</title><link rel="stylesheet" href="/workbook/style.css"></head>
<body><main class="container"></main><script type="module" src="app.js"></script></body>
</html>
```

원본: [lessons/study8/index.html](lessons/study8/index.html) · SHA-256(LF 정규화): `9dc0658fe43afdbe3193e2dee9603238fdf60048abf71bcf6623c9483c4eb72d`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | HTML 표준 모드로 문서를 해석하도록 선언한다. |
| 2 | 문서 언어/루트를 정의한다. |
| 3 | 메타정보 / 문자 인코딩·화면 배율·설명 / 브라우저 탭 제목 / 공통 CSS 연결를 정의한다. |
| 4 | body 요소 / 본문 / ESM 진입점 연결를 정의한다. |
| 5 | 현재 HTML 요소를 닫는다. |


### `lessons/study8/app.js` 전체 코드

```javascript
import { mountLesson } from '../runner.js';

// 이 단계의 요청·입력·실행 순서를 선언한다.
mountLesson({
  "title": "study8 · 공통 모듈 재사용",
  "intro": "이 화면은 공통 api.js와 store.js를 import합니다. app.js는 설정, runner.js는 제출·오류·출력 수명을 맡습니다.",
  "input": {},
  "actions": [
    {
      "label": "상태 모듈 호출",
      "kind": "state"
    },
    {
      "label": "목록 조회",
      "path": "/posts"
    }
  ],
  "links": [
    [
      "전체 게시판·문서 AI",
      "/workbook/"
    ]
  ]
});
```

원본: [lessons/study8/app.js](lessons/study8/app.js) · SHA-256(LF 정규화): `0d0cb30c6d9beab9bc259e643a6d8072663d1bf3027034eb5ed1d9ca77a7ed33`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 3 | 이 단계의 요청·입력·실행 순서를 선언한다. |
| 4 | 현재 처리의 설정·호출·상태를 연결한다: `mountLesson({` |
| 5 | 현재 처리의 설정·호출·상태를 연결한다: `"title": "study8 · 공통 모듈 재사용",` |
| 6 | 현재 처리의 설정·호출·상태를 연결한다: `"intro": "이 화면은 공통 api.js와 store.js를 import합니다. app.js는 설정, runner.js는 제출·오류·출력 수명을 맡습니다.",` |
| 7 | 현재 처리의 설정·호출·상태를 연결한다: `"input": {},` |
| 8 | 현재 처리의 설정·호출·상태를 연결한다: `"actions": [` |
| 9 | 현재 처리의 설정·호출·상태를 연결한다: `{` |
| 10 | 현재 처리의 설정·호출·상태를 연결한다: `"label": "상태 모듈 호출",` |
| 11 | 현재 처리의 설정·호출·상태를 연결한다: `"kind": "state"` |
| 12 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 13 | 현재 처리의 설정·호출·상태를 연결한다: `{` |
| 14 | 현재 처리의 설정·호출·상태를 연결한다: `"label": "목록 조회",` |
| 15 | 현재 처리의 설정·호출·상태를 연결한다: `"path": "/posts"` |
| 16 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 17 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 18 | 현재 처리의 설정·호출·상태를 연결한다: `"links": [` |
| 19 | 현재 처리의 설정·호출·상태를 연결한다: `[` |
| 20 | 현재 처리의 설정·호출·상태를 연결한다: `"전체 게시판·문서 AI",` |
| 21 | 현재 처리의 설정·호출·상태를 연결한다: `"/workbook/"` |
| 22 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 23 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 24 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `lessons/runner.js` 전체 코드

```javascript
import { api, json, setToken } from '../workbook/js/api.js';
import { readSSE } from '../workbook/js/sse.js';
import { createStore } from '../workbook/js/store.js';

// 단계별 설정은 각 app.js에 두고 네트워크·출력·취소 수명만 공유한다.
export function mountLesson(config) {
  const main = document.querySelector('main');
  const title = document.createElement('h1'); title.textContent = config.title;
  const intro = document.createElement('p'); intro.textContent = config.intro;
  const nav = document.createElement('nav');
  const home = document.createElement('a'); home.href = '/lessons/'; home.textContent = '전체 실습 목차';
  nav.append(home);
  const editor = document.createElement('textarea'); editor.id = 'payload'; editor.rows = 10;
  editor.value = JSON.stringify(config.input || {}, null, 2);
  const label = document.createElement('label'); label.htmlFor = editor.id; label.textContent = '요청 JSON (필요한 값을 수정하세요)';
  const output = document.createElement('pre'); output.id = 'output'; output.setAttribute('role', 'status');
  const actions = document.createElement('div'); actions.className = 'actions';
  main.append(nav, title, intro, label, editor, actions, output);
  let selectedId, documentId, socket, controller;
  const buttons = [];
  for (const action of config.actions) {
    const button = document.createElement('button'); button.textContent = action.label; buttons.push(button); actions.append(button);
    button.addEventListener('click', async () => {
      buttons.forEach(b => { b.disabled = true; });
      output.textContent = '실행 중';
      try {
        const input = JSON.parse(editor.value);
        let result;
        if (action.kind === 'state') {
          const store = createStore({ count: 0 });
          store.set({ count: 1 }); result = { state: store.get(), module: '공통 상태 모듈을 호출했습니다.' };
        } else if (action.kind === 'tests') {
          const store = createStore({ count: 0 });
          const values = []; const stop = store.subscribe(value => values.push(value.count));
          store.set({ count: 1 }); stop(); store.set({ count: 2 });
          if (values.join() !== '1') throw new Error('구독 해제 검사 실패');
          const original = store.get(); original.count = 99;
          if (store.get().count !== 2) throw new Error('외부 변이 차단 실패');
          result = { passed: ['구독 전달', '구독 해제', '상태 복제'], requestTests: '전체 HTTP 검사는 npm test로 실행합니다.' };
        } else if (action.kind === 'socket') {
          socket?.close();
          socket = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`);
          socket.onmessage = event => { output.textContent = event.data; };
          socket.onerror = () => { output.textContent = '연결 실패: 심화 서버와 Origin을 확인하세요.'; };
          await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onclose = () => reject(new Error('연결이 닫혔습니다.')); });
          result = { connected: true, next: '다른 탭 /workbook/에서 글을 변경하면 알림이 표시됩니다.' };
        } else if (action.kind === 'health' || action.kind === 'schema' || action.kind === 'cache') {
          const response = await fetch(action.kind === 'schema' ? '/api-docs' : action.kind === 'cache' ? '/workbook/style.css' : '/health');
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          result = action.kind === 'cache' ? { status: response.status, etag: response.headers.get('etag'), cache: response.headers.get('cache-control') } : await response.json();
        } else {
          const path = action.path.replace('{id}', String(selectedId || input.id || '')).replace('{documentId}', String(documentId || input.documentId || ''));
          if (path.includes('//') || path.endsWith('/posts/')) throw new Error('먼저 등록하거나 요청 JSON에 id를 입력하세요.');
          let body;
          if (action.fields) body = Object.fromEntries(action.fields.filter(key => key in input).map(key => [key, input[key]]));
          if (action.stream) {
            controller = new AbortController();
            const response = await api(path, { ...json('POST', { documentId: documentId || input.documentId, question: input.question }), raw: true, signal: controller.signal });
            output.textContent = '';
            await readSSE(response, event => { output.textContent += event.text || (event.sources ? JSON.stringify(event) + '\n' : ''); });
          } else {
            result = await api(path, json(action.method || 'GET', body));
            if (result?.data?.accessToken) setToken(result.data.accessToken);
            if (path === '/auth/logout') setToken('');
            if (path === '/posts' && action.method === 'POST') selectedId = result.data.id;
            if (path === '/documents' && action.method === 'POST') documentId = result.data.id;
            // 원문 토큰은 화면/로그로 출력하지 않는다.
            if (result?.data?.accessToken) result = { data: { user: result.data.user, message: '이 탭 메모리에 로그인 토큰을 보관했습니다.' } };
          }
        }
        if (result !== undefined) output.textContent = JSON.stringify(result, null, 2);
      } catch (error) { output.textContent = `${error.status || ''} ${error.message}`; }
      finally { buttons.forEach(b => { b.disabled = false; }); }
    });
  }
  const stop = document.createElement('button'); stop.textContent = '연결·응답 중단';
  stop.onclick = () => { controller?.abort(); socket?.close(); };
  main.append(stop);
  for (const [text, href] of config.links || []) {
    const p = document.createElement('p'), a = document.createElement('a'); a.textContent = text; a.href = href; p.append(a); main.append(p);
  }
  window.addEventListener('pagehide', () => { controller?.abort(); socket?.close(); }, { once: true });
}
```

원본: [lessons/runner.js](lessons/runner.js) · SHA-256(LF 정규화): `89c5bdee38c6cf9b8d6f77766ab09e760a332f40e6b081c4d607496b712865d6`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 2 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 3 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 5 | 단계별 설정은 각 app.js에 두고 네트워크·출력·취소 수명만 공유한다. |
| 6 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 7 | `main`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 8 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 9 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 10 | `nav`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 11 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 12 | 데이터로 만든 DOM 요소를 부모에 삽입하거나 기존 화면을 교체한다. |
| 13 | `editor`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 14 | 객체를 JSON 문자열로 바꿔 저장·전송·관찰한다. |
| 15 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 16 | `output`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 17 | `actions`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 18 | 데이터로 만든 DOM 요소를 부모에 삽입하거나 기존 화면을 교체한다. |
| 19 | `selectedId, documentId, socket, controller;`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 20 | `buttons`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 21 | 목록 또는 스트림의 각 항목을 반복 처리한다. |
| 22 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 23 | 사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다. |
| 24 | 현재 처리의 설정·호출·상태를 연결한다: `buttons.forEach(b => { b.disabled = true; });` |
| 25 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 26 | 현재 처리의 설정·호출·상태를 연결한다: `try {` |
| 27 | 직렬화된 문자열을 객체로 복구한다. 잘못된 형식은 예외 경로로 보낸다. |
| 28 | `result;`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 29 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (action.kind === 'state') { |
| 30 | `store`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 31 | 현재 처리의 설정·호출·상태를 연결한다: `store.set({ count: 1 }); result = { state: store.get(), module: '공통 상태 모듈을 호출했습니다.' };` |
| 32 | 현재 처리의 설정·호출·상태를 연결한다: `} else if (action.kind === 'tests') {` |
| 33 | `store`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 34 | `values`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 35 | 현재 처리의 설정·호출·상태를 연결한다: `store.set({ count: 1 }); stop(); store.set({ count: 2 });` |
| 36 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (values.join() !== '1') throw new Error('구독 해제 검사 실패'); |
| 37 | `original`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 38 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (store.get().count !== 2) throw new Error('외부 변이 차단 실패'); |
| 39 | 현재 처리의 설정·호출·상태를 연결한다: `result = { passed: ['구독 전달', '구독 해제', '상태 복제'], requestTests: '전체 HTTP 검사는 npm test로 실행합니다.' };` |
| 40 | 현재 처리의 설정·호출·상태를 연결한다: `} else if (action.kind === 'socket') {` |
| 41 | 현재 처리의 설정·호출·상태를 연결한다: `socket?.close();` |
| 42 | 현재 처리의 설정·호출·상태를 연결한다: `socket = new WebSocket(${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws);` |
| 43 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 44 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 45 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onclose = () => reject(new  |
| 46 | 현재 처리의 설정·호출·상태를 연결한다: `result = { connected: true, next: '다른 탭 /workbook/에서 글을 변경하면 알림이 표시됩니다.' };` |
| 47 | 현재 처리의 설정·호출·상태를 연결한다: `} else if (action.kind === 'health' // action.kind === 'schema' // action.kind === 'cache') {` |
| 48 | 약속한 URL·메소드·본문으로 요청하고 응답을 기다린다. |
| 49 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!response.ok) throw new Error(`HTTP ${response.status}`); |
| 50 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: result = action.kind === 'cache' ? { status: response.status, etag: response.headers.get('etag'), ca |
| 51 | 현재 처리의 설정·호출·상태를 연결한다: `} else {` |
| 52 | `path`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 53 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (path.includes('//') // path.endsWith('/posts/')) throw new Error('먼저 등록하거나 요청 JSON에 id를 입력하세요.'); |
| 54 | `body;`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 55 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (action.fields) body = Object.fromEntries(action.fields.filter(key => key in input).map(key => [key, input[ |
| 56 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (action.stream) { |
| 57 | 현재 처리의 설정·호출·상태를 연결한다: `controller = new AbortController();` |
| 58 | 약속한 URL·메소드·본문으로 요청하고 응답을 기다린다. |
| 59 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 60 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 61 | 현재 처리의 설정·호출·상태를 연결한다: `} else {` |
| 62 | 약속한 URL·메소드·본문으로 요청하고 응답을 기다린다. |
| 63 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (result?.data?.accessToken) setToken(result.data.accessToken); |
| 64 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (path === '/auth/logout') setToken(''); |
| 65 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (path === '/posts' && action.method === 'POST') selectedId = result.data.id; |
| 66 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (path === '/documents' && action.method === 'POST') documentId = result.data.id; |
| 67 | 원문 토큰은 화면/로그로 출력하지 않는다. |
| 68 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (result?.data?.accessToken) result = { data: { user: result.data.user, message: '이 탭 메모리에 로그인 토큰을 보관했습니다.'  |
| 69 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 70 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 71 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 72 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 73 | 성공·실패와 관계없이 버튼·연결·자원을 정리한다. |
| 74 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 75 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 76 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 77 | 사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다. |
| 78 | 데이터로 만든 DOM 요소를 부모에 삽입하거나 기존 화면을 교체한다. |
| 79 | 목록 또는 스트림의 각 항목을 반복 처리한다. |
| 80 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 81 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 82 | 사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다. |
| 83 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


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
