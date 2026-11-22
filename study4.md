# study4 · HTML·CSS·JavaScript — 라우팅과 요청·응답

## ① 목표 한 줄

화면 경로와 서버 API 경로를 구분하고 동적 id·쿼리·404를 처리한다.

## ② 📖 이론

서버는 요청 메소드와 pathname을 함께 보고 처리 함수를 고른다. GET /api/posts는 목록을 조회하고 POST /api/posts는 새 자료를 만든다. 브라우저 해시 라우팅의 # 뒤 값은 HTTP 요청에 포함되지 않는다. 따라서 정적 서버에서도 #/posts/1 같은 화면 경로를 새로고침할 수 있다.

동적 경로는 패턴의 일부분을 값으로 뽑는 방식이다. 정규식으로 양의 정수 id만 받으면 /posts/abc 같은 경로를 구분할 수 있다. URLSearchParams는 쿼리를 직접 문자열로 붙일 때 생기는 인코딩 실수를 줄인다. '#' 화면 경로의 404는 화면 상태이고, API의 404는 HTTP 상태 코드다.

우편 주소에 비유하면 URL 경로는 받는 부서이고 메소드는 조회·등록 같은 요청 종류다. 화면은 #/posts/1을 표시하면서 실제 데이터는 GET /api/posts/1에서 받는다. 이 경로 계약을 문서와 코드 양쪽에 고정한다.

### 비유로 이해하기

URL은 우편 주소, 메소드는 요청 종류, 동적 id는 각 자료의 우편함 번호다.

## ③ 🛠️ 실기: 전체 코드와 줄별 설명

1. /lessons/study4/의 홈·상세·오류 링크를 차례로 누른다.
2. 상세 링크의 q를 HTML CSS로 바꾸고 URLSearchParams 해독을 본다.
3. 뒤로 가기와 앞으로 가기를 실행한다.
4. curl.exe -i http://localhost:3000/api/posts/999999 로 실제 HTTP 404를 확인한다.



### 단계별 실행 위치

`npm run dev` 후 `/lessons/study4/`에서 이 단계의 실습을 연다. [실습 HTML](lessons/study4/index.html)과 [전체 실습 목차](lessons/index.html)를 사용한다. 기초 중간 프로젝트 전체 화면은 `npm run midpoint` 후 `/midpoint/`에서 실행한다. 터미널 전용 DB·Docker·MCP 명령은 해당 문서의 실행 순서를 따른다.

### `lessons/study4/index.html` 전체 코드

```html
<!doctype html>
<html lang="ko"><meta charset="utf-8"><title>라우팅</title><nav><a href="#/">홈</a> <a href="#/posts/1?q=HTML">상세</a> <a href="#/missing">오류</a></nav><main><h1 id="page"></h1></main><script type="module" src="router.js"></script></html>
```

원본: [lessons/study4/index.html](lessons/study4/index.html) · SHA-256(LF 정규화): `0cc1059d48f7c793e9b989cac5a0cad3d36bc7171664a65048c71041f83219ca`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | HTML 표준 모드로 문서를 해석하도록 선언한다. |
| 2 | 문서 언어/루트 / 문자 인코딩·화면 배율·설명 / 브라우저 탭 제목 / 탐색 링크 / URL·해시 이동 / 본문 / 최상위 제목 / ESM 진입점 연결를 정의한다. |


### `lessons/study4/router.js` 전체 코드

```javascript
function route() {
  const [path, query = ''] = (location.hash.slice(1) || '/').split('?'); // fragment를 화면 경로로 사용한다.
  const params = new URLSearchParams(query); // 검색 문자열을 안전하게 해독한다.
  const match = path.match(/^\/posts\/([1-9]\d*)$/); // 동적 id 구간을 추출한다.
  const title = path === '/' ? '홈' : match ? `글 ${match[1]} · 검색어 ${params.get('q') || ''}` : '404: 페이지 없음';
  document.getElementById('page').textContent = title; // 경로마다 표시를 바꾼다.
}
window.addEventListener('hashchange', route); // 뒤로 가기/앞으로 가기도 감지한다.
route(); // 첫 주소도 처리한다.
```

원본: [lessons/study4/router.js](lessons/study4/router.js) · SHA-256(LF 정규화): `f9e618785ce6998089cb91a564fc88a673a05f0535fc37babd7ac0078ca02315`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 2 | `[path, query`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 3 | 검색 문자열을 안전하게 해독한다. |
| 4 | 동적 id 구간을 추출한다. |
| 5 | `title`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 6 | 경로마다 표시를 바꾼다. |
| 7 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 8 | 뒤로 가기/앞으로 가기도 감지한다. |
| 9 | 첫 주소도 처리한다. |


### `server/errors.js` 전체 코드

```javascript
import { randomUUID } from 'node:crypto';

// 모든 계층에서 같은 오류 객체를 사용한다.
export class HttpError extends Error {
  constructor(status, code, message, fields = {}) {
    super(message);
    Object.assign(this, { status, code, fields });
  }
}
export const fail = (status, code, message, fields) => { throw new HttpError(status, code, message, fields); };
export function send(res, status, data, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(status === 204 ? undefined : JSON.stringify(data));
}
export function sendError(res, error, requestId = randomUUID()) {
  if (res.headersSent) return res.end();
  const known = error instanceof HttpError;
  send(res, known ? error.status : 500, { error: {
    code: known ? error.code : 'INTERNAL',
    message: known ? error.message : '서버 오류가 발생했습니다.',
    fields: known ? error.fields : {}, requestId,
  } }, { 'X-Request-Id': requestId });
}
export async function readJson(req, limit = 64 * 1024) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) fail(413, 'PAYLOAD_TOO_LARGE', '요청이 너무 큽니다.');
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { fail(400, 'BAD_REQUEST', 'JSON 객체를 보내세요.'); }
}
```

원본: [server/errors.js](server/errors.js) · SHA-256(LF 정규화): `0489ce49ecaea613372cdf3eedb361cf00ea8e30fd733c31a184e1cdaf49db1f`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 3 | 모든 계층에서 같은 오류 객체를 사용한다. |
| 4 | 다른 모듈이 사용할 인터페이스를 공개한다. 현재 처리의 설정·호출·상태를 연결한다: `class HttpError extends Error {` |
| 5 | 현재 처리의 설정·호출·상태를 연결한다: `constructor(status, code, message, fields = {}) {` |
| 6 | 현재 처리의 설정·호출·상태를 연결한다: `super(message);` |
| 7 | 현재 처리의 설정·호출·상태를 연결한다: `Object.assign(this, { status, code, fields });` |
| 8 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 9 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 10 | 다른 모듈이 사용할 인터페이스를 공개한다. `fail`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 11 | 다른 모듈이 사용할 인터페이스를 공개한다. HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 12 | HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 13 | 객체를 JSON 문자열로 바꿔 저장·전송·관찰한다. |
| 14 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 15 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 16 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (res.headersSent) return res.end(); |
| 17 | `known`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 18 | HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 19 | 현재 처리의 설정·호출·상태를 연결한다: `code: known ? error.code : 'INTERNAL',` |
| 20 | 현재 처리의 설정·호출·상태를 연결한다: `message: known ? error.message : '서버 오류가 발생했습니다.',` |
| 21 | 현재 처리의 설정·호출·상태를 연결한다: `fields: known ? error.fields : {}, requestId,` |
| 22 | 현재 처리의 설정·호출·상태를 연결한다: `} }, { 'X-Request-Id': requestId });` |
| 23 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 24 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 25 | `size`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 26 | `chunks`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 27 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: for await (const chunk of req) { |
| 28 | 현재 처리의 설정·호출·상태를 연결한다: `size += chunk.length;` |
| 29 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 30 | 현재 처리의 설정·호출·상태를 연결한다: `chunks.push(chunk);` |
| 31 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 32 | 현재 처리의 설정·호출·상태를 연결한다: `try {` |
| 33 | 직렬화된 문자열을 객체로 복구한다. 잘못된 형식은 예외 경로로 보낸다. |
| 34 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!value // typeof value !== 'object' // Array.isArray(value)) throw new Error(); |
| 35 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 36 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 37 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `server/static.js` 전체 코드

```javascript
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fail } from './errors.js';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
export async function serveStatic(req, res, pathname) {
  const prefix = ['/midpoint/', '/workbook/', '/lessons/', '/practice/site/', '/final-project/'].find(p => pathname.startsWith(p));
  if (!prefix) fail(404, 'NOT_FOUND', '페이지가 없습니다.');
  const base = resolve('.' + prefix);
  let file;
  try { file = resolve('.' + decodeURIComponent(pathname)); } catch { fail(400, 'BAD_REQUEST', '잘못된 URL'); }
  if (!file.startsWith(base + sep) && file !== base) fail(403, 'FORBIDDEN', '허용하지 않는 경로');
  if (pathname.endsWith('/')) file = resolve(file, 'index.html');
  const type = types[extname(file)];
  if (!type || file.split(/[\\/]/).some(p => p.startsWith('.'))) fail(404, 'NOT_FOUND', '파일이 없습니다.');
  let body, info;
  try { [body, info] = await Promise.all([readFile(file), stat(file)]); } catch { fail(404, 'NOT_FOUND', '파일이 없습니다.'); }
  const etag = `"${info.size}-${Math.trunc(info.mtimeMs)}"`;
  const headers = { 'Content-Type': type, ETag: etag, 'Cache-Control': 'no-cache' };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }
  res.writeHead(200, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}
```

원본: [server/static.js](server/static.js) · SHA-256(LF 정규화): `4742e4341456938c8c875001bb89d7ab244aea6b748e715ba47dc7c91b922134`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 2 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 3 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 5 | `types`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 6 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 7 | `prefix`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 8 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 9 | `base`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 10 | `file;`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 11 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 12 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 13 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (pathname.endsWith('/')) file = resolve(file, 'index.html'); |
| 14 | `type`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 15 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 16 | `body, info;`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 17 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 18 | `etag`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 19 | `headers`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 20 | HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 21 | HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 22 | 응답 본문 또는 스트림을 끝내 연결 수명을 정리한다. |
| 23 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


## ④ 🔗 연동 포인트

화면 hash → id 추출 → /api/posts/{id} 호출 → JSON → DOM 순서로 연결한다. 다음 단계에서는 사용자가 입력한 값을 POST 요청 본문으로 보낸다.

## ⑤ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| 상세 새로고침이 404 | 서버가 history 경로를 모름 | 이 과정에서는 hash 경로를 쓰고 파일 경로와 분리 |
| 한글 쿼리가 깨짐 | 문자열 수동 결합 | URLSearchParams 사용 |
| 오류인데 화면이 성공 처리 | fetch가 404에서 reject한다고 가정 | response.ok와 status 검사 |

## ⑥ 직접 해보기

1. #/posts/2?q=CSS 링크를 추가한다.
2. id가 0·음수·문자인 주소의 오류 화면을 확인한다.
3. Network에서 fragment가 서버 요청에 포함되지 않음을 확인한다.

## ⑦ ☐ 체크리스트

학습자 수행 확인용이다. 문서·코드 작성 완료와 본인의 실습 완료는 다르므로 직접 확인한 뒤 체크한다. 원문 항목 배치는 [반영표](docs/coverage.md)를 따른다.

- [ ] URL·동적 경로·쿼리를 구분한다
- [ ] 화면 404와 API 404를 구분한다
- [ ] 프론트 #/posts/{id}와 백엔드 /api/posts/{id}를 연결한다

## ⑧ 다음 단계 연결

[study5.md](study5.md)에서 폼·입력·검증로 이어간다.

출처: [지정 노션](https://app.notion.com/p/3d6d7dec5e2e8147b212f0a23b93dfc1) · [공통 API v1](https://app.notion.com/p/3d6d7dec5e2e8139adbfd36dd506c65e) · [반영표](docs/coverage.md) · [검증 기록](docs/verification.md). 기술 근거: [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [Node 24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html). 설치 버전 API는 package-lock.json과 node_modules의 버전별 공식 문서를 기준으로 확인한다.
