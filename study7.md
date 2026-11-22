# study7 · HTML·CSS·JavaScript — 인증·보안 기초

## ① 목표 한 줄

회원가입·로그인·만료·로그아웃과 작성자 권한을 서버에서 검증한다.

## ② 📖 이론

인증은 누구인지 확인하고 인가는 무엇을 할 수 있는지 확인한다. 회원가입은 비밀번호를 salt+scrypt 해시로 바꾸어 저장한다. salt는 사용자마다 다른 난수이고 같은 비밀번호도 다른 해시가 된다. 로그인 비교는 timingSafeEqual로 수행한다.

이 과정은 JWT 대신 32바이트 난수 opaque Bearer 토큰을 사용한다. 서버는 토큰의 SHA-256 해시와 사용자 id·1시간 만료를 세션 records에 저장한다. 응답 모양은 공통 스펙의 data.user/accessToken을 유지한다. 토큰 원문은 브라우저 메모리에만 두고 새로고침하면 다시 로그인한다. 로그아웃은 세션을 삭제해 토큰을 즉시 무효화한다.

목록·상세는 공개, 작성·댓글은 인증 필요, 수정·삭제는 작성자만 가능하다. 버튼 숨김은 편의 기능이며 서버 board의 own 검사가 최종 권한 경계다. 회원정보 응답에는 passwordHash가 없다. 공개 작성자에는 id와 nickname만 전달한다.

XSS는 외부 문자열이 스크립트로 실행되는 문제다. textContent로 출력하고 CSP로 스크립트 출처를 제한한다. CORS는 브라우저의 교차 출처 접근 규칙이며 인증의 대체물이 아니다. CSRF는 자동 전송되는 쿠키를 악용한다. Bearer를 JS 헤더로 보내는 현재 방식은 자동 쿠키 인증을 쓰지 않는다. 나중에 로그인 쿠키를 쓰면 Secure·HttpOnly·SameSite와 CSRF 토큰/Origin 검사를 함께 설계해야 한다.

기초 서버는 동일 출처만 받고, 심화 서버는 CORS_ORIGIN 한 곳을 추가 허용한다. 심화 로그인에는 IP별 15분 30회 제한이 있다. 운영에서는 역방향 프록시 신뢰 설정·공유 rate limit·계정 잠금·만료 세션 정리를 보강한다.

### 비유로 이해하기

인증은 신분증 확인, 인가는 그 신분으로 들어갈 수 있는 방을 확인하는 일이다. 토큰은 만료되는 출입증이다.

## ③ 🛠️ 실기: 전체 코드와 줄별 설명

1. 다른 개발 서버를 끄고 npm run midpoint로 /midpoint/을 연다.
2. 12자 이상 비밀번호로 가입하고 로그인한다.
3. 글을 작성한 뒤 다른 이메일로 가입하여 같은 글 수정·삭제를 요청한다.
4. 로그아웃 후 이전 토큰으로 /api/auth/me를 호출해 401을 확인한다.



### 단계별 실행 위치

`npm run dev` 후 `/lessons/study7/`에서 이 단계의 실습을 연다. [실습 HTML](lessons/study7/index.html)과 [전체 실습 목차](lessons/index.html)를 사용한다. 기초 중간 프로젝트 전체 화면은 `npm run midpoint` 후 `/midpoint/`에서 실행한다. 터미널 전용 DB·Docker·MCP 명령은 해당 문서의 실행 순서를 따른다.

### `server/auth.js` 전체 코드

```javascript
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { fail } from './errors.js';

const scrypt = promisify(scryptCallback);
const digest = value => createHash('sha256').update(value).digest('hex');
export const publicUser = user => ({ id: user.id, email: user.email, nickname: user.nickname });
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
}
export async function verifyPassword(password, stored = '') {
  const [salt, encoded] = stored.split(':');
  if (!salt || !encoded) return false;
  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(encoded, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function createAuth(repo) {
  return {
    async issue(user) {
      const token = randomBytes(32).toString('hex');
      await repo.create('sessions', { userId: user.id, hash: digest(token), expiresAt: Date.now() + 3600000 });
      return { user: publicUser(user), accessToken: token };
    },
    async require(req) {
      const token = req.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
      if (!token) fail(401, 'UNAUTHORIZED', '로그인이 필요합니다.');
      const session = (await repo.list('sessions')).find(row => row.hash === digest(token) && row.expiresAt > Date.now());
      const user = session && await repo.get('users', session.userId);
      if (!user) fail(401, 'UNAUTHORIZED', '로그인이 만료되었습니다.');
      return { user, session };
    },
  };
}
```

원본: [server/auth.js](server/auth.js) · SHA-256(LF 정규화): `1e7c0c8b0a7806673c155ed0fc490b182a666cdfd526df764f4300960c406509`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 2 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 3 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 5 | `scrypt`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 6 | `digest`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 7 | 다른 모듈이 사용할 인터페이스를 공개한다. `publicUser`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 8 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 9 | `salt`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 10 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const hash = await scrypt(password, salt, 64); |
| 11 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 12 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 13 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 14 | `[salt, encoded]`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 15 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!salt // !encoded) return false; |
| 16 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const actual = await scrypt(password, salt, 64); |
| 17 | `expected`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 18 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 19 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 20 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 21 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 22 | 현재 처리의 설정·호출·상태를 연결한다: `async issue(user) {` |
| 23 | `token`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 24 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 25 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 26 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 27 | 현재 처리의 설정·호출·상태를 연결한다: `async require(req) {` |
| 28 | `token`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 29 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 30 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 31 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 32 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 33 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 34 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 35 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 36 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `server/validation.js` 전체 코드

```javascript
import { z } from 'zod';
import { fail } from './errors.js';

// 브라우저의 required와 별개로 서버가 입력을 다시 검사한다.
export const signupSchema = z.object({ email: z.email().max(200).transform(v => v.toLowerCase()), password: z.string().min(12).max(128), nickname: z.string().trim().min(1).max(40) }).strict();
export const loginSchema = signupSchema.pick({ email: true, password: true });
export const postSchema = z.object({ title: z.string().trim().min(1).max(200), body: z.string().trim().min(1).max(10000), tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]) }).strict();
export const patchSchema = postSchema.omit({ tags: true }).partial().extend({ tags: postSchema.shape.tags.removeDefault().optional() });
export const commentSchema = z.object({ body: z.string().trim().min(1).max(2000) }).strict();
export function validate(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    const fields = {};
    for (const issue of result.error.issues) (fields[issue.path.join('.') || 'body'] ??= []).push(issue.message);
    fail(400, 'VALIDATION_ERROR', '입력값을 확인하세요.', fields);
  }
  return result.data;
}
export function numericId(value) {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) fail(400, 'BAD_REQUEST', 'id는 양의 정수입니다.');
  return Number(value);
}
```

원본: [server/validation.js](server/validation.js) · SHA-256(LF 정규화): `b1b7d5e2c6c655f23770b94fd8cb3bbd57bea4c6062d79419270d11b38933cde`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 2 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 4 | 브라우저의 required와 별개로 서버가 입력을 다시 검사한다. |
| 5 | 다른 모듈이 사용할 인터페이스를 공개한다. `signupSchema`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 6 | 다른 모듈이 사용할 인터페이스를 공개한다. `loginSchema`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 7 | 다른 모듈이 사용할 인터페이스를 공개한다. `postSchema`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 8 | 다른 모듈이 사용할 인터페이스를 공개한다. `patchSchema`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 9 | 다른 모듈이 사용할 인터페이스를 공개한다. `commentSchema`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 10 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 11 | `result`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 12 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!result.success) { |
| 13 | `fields`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 14 | 목록 또는 스트림의 각 항목을 반복 처리한다. |
| 15 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 16 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 17 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 18 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 19 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 20 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 21 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 22 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `server/basic.js` 전체 코드

```javascript
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createSQLite } from './sqlite.js';
import { createBoard } from './board.js';
import { createAuth, publicUser, hashPassword, verifyPassword } from './auth.js';
import { validate, signupSchema, loginSchema, postSchema, patchSchema, commentSchema, numericId } from './validation.js';
import { send, sendError, fail, readJson } from './errors.js';
import { serveStatic } from './static.js';

// study0~10만 사용하는 중간 프로젝트 서버다. 외부 서비스/AI/웹소켓은 없다.
export function createBasicApp(repo, origin = 'http://localhost:3000') {
  const auth = createAuth(repo), board = createBoard(repo);
  let queue = Promise.resolve();
  const current = async req => (await auth.require(req)).user;
  const server = createServer((req, res) => {
    const requestId = randomUUID();
    res.setHeader('X-Request-Id', requestId);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'; base-uri 'none'");
    const run = async () => {
      try {
        if (req.headers.origin && req.headers.origin !== origin) fail(403, 'FORBIDDEN', '동일 출처만 허용합니다.');
        const { pathname: path, searchParams } = new URL(req.url, origin);
        const method = req.method;
        if (path === '/health' && method === 'GET') return send(res, 200, { status: 'ok' });
        if (path === '/' && method === 'GET') { res.writeHead(302, { Location: '/midpoint/' }); return res.end(); }
        if (['/api/auth/signup', '/api/auth/login'].includes(path) && method === 'POST') {
          const signup = path.endsWith('signup');
          const input = validate(signup ? signupSchema : loginSchema, await readJson(req));
          let user = (await repo.list('users')).find(u => u.email === input.email);
          if (signup) {
            if (user) fail(409, 'EMAIL_TAKEN', '이미 가입한 이메일입니다.');
            user = await repo.create('users', { email: input.email, nickname: input.nickname, passwordHash: await hashPassword(input.password) });
            return send(res, 201, { data: publicUser(user) });
          }
          if (!user || !await verifyPassword(input.password, user.passwordHash)) fail(401, 'INVALID_CREDENTIALS', '로그인 정보를 확인하세요.');
          return send(res, 200, { data: await auth.issue(user) });
        }
        if (path === '/api/auth/me' && method === 'GET') return send(res, 200, { data: publicUser(await current(req)) });
        if (path === '/api/auth/logout' && method === 'POST') { const { session } = await auth.require(req); await repo.delete('sessions', session.id); return send(res, 204); }
        if (path === '/api/posts' && method === 'GET') return send(res, 200, await board.list(searchParams));
        if (path === '/api/posts' && method === 'POST') {
          const user = await current(req);
          const data = await board.create(validate(postSchema, await readJson(req)), user);
          return send(res, 201, { data }, { Location: `/api/posts/${data.id}` });
        }
        const match = path.match(/^\/api\/posts\/([^/]+)$/);
        if (match) {
          const id = numericId(match[1]);
          if (method === 'GET') return send(res, 200, { data: await board.get(id) });
          if (method === 'PATCH') return send(res, 200, { data: await board.patch(id, validate(patchSchema, await readJson(req)), await current(req)) });
          if (method === 'DELETE') { await board.delete(id, await current(req)); return send(res, 204); }
        }
        const comments = path.match(/^\/api\/posts\/([^/]+)\/comments$/);
        if (comments && method === 'GET') return send(res, 200, { data: await board.comments(numericId(comments[1])) });
        if (comments && method === 'POST') return send(res, 201, { data: await board.comment(numericId(comments[1]), validate(commentSchema, await readJson(req)), await current(req)) });
        const comment = path.match(/^\/api\/comments\/([^/]+)$/);
        if (comment && method === 'DELETE') { await board.deleteComment(numericId(comment[1]), await current(req)); return send(res, 204); }
        if (method === 'GET' && !path.startsWith('/api/')) return serveStatic(req, res, path);
        fail(404, 'NOT_FOUND', '경로가 없습니다.');
      } catch (error) { sendError(res, error, requestId); }
    };
    if (['POST', 'PATCH', 'DELETE'].includes(req.method)) queue = queue.then(run, run);
    else void run();
  });
  return { server, close: async () => { await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); await queue; await repo.close(); } };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const app = createBasicApp(createSQLite(process.env.SQLITE_PATH || 'data/midpoint.sqlite'), process.env.PUBLIC_ORIGIN);
  app.server.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => console.log('중간 실습: http://localhost:3000/midpoint/'));
  process.once('SIGINT', () => void app.close());
}
```

원본: [server/basic.js](server/basic.js) · SHA-256(LF 정규화): `71acc9e0df0af65a3562316418ed8e4897a34ea437fae9e366e7d925b7c3c939`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 2 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 3 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 4 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 5 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 6 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 7 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 8 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 9 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 11 | study0~10만 사용하는 중간 프로젝트 서버다. 외부 서비스/AI/웹소켓은 없다. |
| 12 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 13 | `auth`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 14 | `queue`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 15 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const current = async req => (await auth.require(req)).user; |
| 16 | `server`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 17 | `requestId`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 18 | 현재 처리의 설정·호출·상태를 연결한다: `res.setHeader('X-Request-Id', requestId);` |
| 19 | 현재 처리의 설정·호출·상태를 연결한다: `res.setHeader('Cache-Control', 'no-store');` |
| 20 | 현재 처리의 설정·호출·상태를 연결한다: `res.setHeader('X-Content-Type-Options', 'nosniff');` |
| 21 | 현재 처리의 설정·호출·상태를 연결한다: `res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none` |
| 22 | `run`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 23 | 현재 처리의 설정·호출·상태를 연결한다: `try {` |
| 24 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 25 | `{ pathname: path, searchParams }`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 26 | `method`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 27 | HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 28 | HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 29 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (['/api/auth/signup', '/api/auth/login'].includes(path) && method === 'POST') { |
| 30 | `signup`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 31 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const input = validate(signup ? signupSchema : loginSchema, await readJson(req)); |
| 32 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 33 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (signup) { |
| 34 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 35 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 36 | HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 37 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 38 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 39 | HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 40 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 41 | HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 42 | HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 43 | HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 44 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (path === '/api/posts' && method === 'POST') { |
| 45 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const user = await current(req); |
| 46 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const data = await board.create(validate(postSchema, await readJson(req)), user); |
| 47 | HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 48 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 49 | `match`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 50 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (match) { |
| 51 | `id`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 52 | HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 53 | HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 54 | HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 55 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 56 | `comments`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 57 | HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 58 | HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 59 | `comment`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 60 | HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 61 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (method === 'GET' && !path.startsWith('/api/')) return serveStatic(req, res, path); |
| 62 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 63 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 64 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 65 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (['POST', 'PATCH', 'DELETE'].includes(req.method)) queue = queue.then(run, run); |
| 66 | 현재 처리의 설정·호출·상태를 연결한다: `else void run();` |
| 67 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 68 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 69 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 70 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) { |
| 71 | `app`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 72 | 개발·운영에서 관찰할 실행 결과를 콘솔에 남긴다. |
| 73 | 현재 처리의 설정·호출·상태를 연결한다: `process.once('SIGINT', () => void app.close());` |
| 74 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `lessons/study7/index.html` 전체 코드

```html
<!doctype html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>study7 실습</title><link rel="stylesheet" href="/workbook/style.css"></head>
<body><main class="container"></main><script type="module" src="app.js"></script></body>
</html>
```

원본: [lessons/study7/index.html](lessons/study7/index.html) · SHA-256(LF 정규화): `8e6341a76f4b287e4ccb0b820b8000ff177440d841ce57f0c17cb6e1629dbc3b`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | HTML 표준 모드로 문서를 해석하도록 선언한다. |
| 2 | 문서 언어/루트를 정의한다. |
| 3 | 메타정보 / 문자 인코딩·화면 배율·설명 / 브라우저 탭 제목 / 공통 CSS 연결를 정의한다. |
| 4 | body 요소 / 본문 / ESM 진입점 연결를 정의한다. |
| 5 | 현재 HTML 요소를 닫는다. |


### `lessons/study7/app.js` 전체 코드

```javascript
import { mountLesson } from '../runner.js';

// 이 단계의 요청·입력·실행 순서를 선언한다.
mountLesson({
  "title": "study7 · 인증·권한",
  "intro": "로그인 전 내 정보 401, 가입·로그인 후 200, 로그아웃 후 401을 확인하세요. 비밀번호는 학습용 새 계정에만 사용하세요.",
  "input": {
    "email": "lesson@example.com",
    "password": "lesson-password-123",
    "nickname": "학습자"
  },
  "actions": [
    {
      "label": "내 정보",
      "path": "/auth/me"
    },
    {
      "label": "회원가입",
      "path": "/auth/signup",
      "method": "POST",
      "fields": [
        "email",
        "password",
        "nickname"
      ]
    },
    {
      "label": "로그인",
      "path": "/auth/login",
      "method": "POST",
      "fields": [
        "email",
        "password"
      ]
    },
    {
      "label": "로그아웃",
      "path": "/auth/logout",
      "method": "POST"
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

원본: [lessons/study7/app.js](lessons/study7/app.js) · SHA-256(LF 정규화): `d097f742291245629f71fe26a2f7d497d4fad9f4d7c36c6009a929de2910c558`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 3 | 이 단계의 요청·입력·실행 순서를 선언한다. |
| 4 | 현재 처리의 설정·호출·상태를 연결한다: `mountLesson({` |
| 5 | 현재 처리의 설정·호출·상태를 연결한다: `"title": "study7 · 인증·권한",` |
| 6 | 현재 처리의 설정·호출·상태를 연결한다: `"intro": "로그인 전 내 정보 401, 가입·로그인 후 200, 로그아웃 후 401을 확인하세요. 비밀번호는 학습용 새 계정에만 사용하세요.",` |
| 7 | 현재 처리의 설정·호출·상태를 연결한다: `"input": {` |
| 8 | 현재 처리의 설정·호출·상태를 연결한다: `"email": "lesson@example.com",` |
| 9 | 현재 처리의 설정·호출·상태를 연결한다: `"password": "lesson-password-123",` |
| 10 | 현재 처리의 설정·호출·상태를 연결한다: `"nickname": "학습자"` |
| 11 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 12 | 현재 처리의 설정·호출·상태를 연결한다: `"actions": [` |
| 13 | 현재 처리의 설정·호출·상태를 연결한다: `{` |
| 14 | 현재 처리의 설정·호출·상태를 연결한다: `"label": "내 정보",` |
| 15 | 현재 처리의 설정·호출·상태를 연결한다: `"path": "/auth/me"` |
| 16 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 17 | 현재 처리의 설정·호출·상태를 연결한다: `{` |
| 18 | 현재 처리의 설정·호출·상태를 연결한다: `"label": "회원가입",` |
| 19 | 현재 처리의 설정·호출·상태를 연결한다: `"path": "/auth/signup",` |
| 20 | 현재 처리의 설정·호출·상태를 연결한다: `"method": "POST",` |
| 21 | 현재 처리의 설정·호출·상태를 연결한다: `"fields": [` |
| 22 | 현재 처리의 설정·호출·상태를 연결한다: `"email",` |
| 23 | 현재 처리의 설정·호출·상태를 연결한다: `"password",` |
| 24 | 현재 처리의 설정·호출·상태를 연결한다: `"nickname"` |
| 25 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 26 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 27 | 현재 처리의 설정·호출·상태를 연결한다: `{` |
| 28 | 현재 처리의 설정·호출·상태를 연결한다: `"label": "로그인",` |
| 29 | 현재 처리의 설정·호출·상태를 연결한다: `"path": "/auth/login",` |
| 30 | 현재 처리의 설정·호출·상태를 연결한다: `"method": "POST",` |
| 31 | 현재 처리의 설정·호출·상태를 연결한다: `"fields": [` |
| 32 | 현재 처리의 설정·호출·상태를 연결한다: `"email",` |
| 33 | 현재 처리의 설정·호출·상태를 연결한다: `"password"` |
| 34 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 35 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 36 | 현재 처리의 설정·호출·상태를 연결한다: `{` |
| 37 | 현재 처리의 설정·호출·상태를 연결한다: `"label": "로그아웃",` |
| 38 | 현재 처리의 설정·호출·상태를 연결한다: `"path": "/auth/logout",` |
| 39 | 현재 처리의 설정·호출·상태를 연결한다: `"method": "POST"` |
| 40 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 41 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 42 | 현재 처리의 설정·호출·상태를 연결한다: `"links": [` |
| 43 | 현재 처리의 설정·호출·상태를 연결한다: `[` |
| 44 | 현재 처리의 설정·호출·상태를 연결한다: `"전체 게시판·문서 AI",` |
| 45 | 현재 처리의 설정·호출·상태를 연결한다: `"/workbook/"` |
| 46 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 47 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 48 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


## ④ 🔗 연동 포인트

브라우저 메모리 토큰 → Authorization 헤더 → 세션 해시/만료 조회 → user → 작성자 검사로 이어진다. 연결된 토큰을 다음 단계 공통 API 모듈에 모아 각 화면이 같은 규칙을 사용하게 한다.

## ⑤ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| 가입은 됐지만 로그인 실패 | 잘못된 이메일·비밀번호 또는 OAuth 전용 계정 | INVALID_CREDENTIALS로 통일해 표시 |
| 버튼은 숨겼는데 수정 가능 | 서버 권한 검사 누락 | 서버에서 authorId와 user.id 비교 |
| CORS 허용 후 누구나 쓰기 가능 | CORS를 인증으로 오해 | 쓰기 경로에 Bearer 검증 유지 |

## ⑥ 직접 해보기

1. 서로 다른 두 사용자로 401·403 차이를 재현한다.
2. DB를 읽어 비밀번호와 토큰 원문이 없는지 확인한다.
3. 글 제목에 <script>alert(1)</script>를 넣어 문자열로 보이는지 확인한다.

## ⑦ ☐ 체크리스트

학습자 수행 확인용이다. 문서·코드 작성 완료와 본인의 실습 완료는 다르므로 직접 확인한 뒤 체크한다. 원문 항목 배치는 [반영표](docs/coverage.md)를 따른다.

- [ ] 회원가입·로그인·내 정보·로그아웃을 확인한다
- [ ] 비밀번호와 토큰 원문을 DB·로그·localStorage에 남기지 않는다
- [ ] 작성자 권한과 1시간 토큰 만료를 서버에서 검사한다
- [ ] CORS·XSS·CSRF의 역할을 설명한다

## ⑧ 다음 단계 연결

[study8.md](study8.md)에서 구조화·재사용·설정로 이어간다.

출처: [지정 노션](https://app.notion.com/p/3d6d7dec5e2e8147b212f0a23b93dfc1) · [공통 API v1](https://app.notion.com/p/3d6d7dec5e2e8139adbfd36dd506c65e) · [반영표](docs/coverage.md) · [검증 기록](docs/verification.md). 기술 근거: [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [Node 24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html). 설치 버전 API는 package-lock.json과 node_modules의 버전별 공식 문서를 기준으로 확인한다.
