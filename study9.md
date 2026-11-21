# study9 · HTML·CSS·JavaScript — 테스트·디버깅

## ① 목표 한 줄

단위·요청 테스트와 가짜 DB/API로 실패 경계를 재현한다.

## ② 📖 이론

단위 테스트는 작은 규칙 하나를 빠르게 확인한다. 요청 테스트는 HTTP 요청을 실제 서버에 보내 상태·본문·헤더·영속성을 확인한다. 브라우저 테스트는 사용자가 클릭하는 DOM에서 시작해 DB를 거쳐 다시 DOM으로 돌아오는 흐름을 확인한다. 서로 다른 경계의 증거가 필요하다.

mock은 의존하는 외부 시스템을 테스트용 구현으로 바꾸는 것이다. createBoard에 Map 기반 repo를 넣으면 DB 설치 없이 권한·검색 규칙을 시험할 수 있다. AI는 기본 mock provider로 과금 없이 SSE·사용량 제한을 검증한다. 실제 모델 품질과 네트워크 연결 검증을 대체하지는 않는다.

DevTools Sources에서 중단점을 걸고 입력→요청→응답→화면 순서로 본다. Network에서 메소드·경로·상태·본문을 확인하고 Console에서 예외를 본다. 서버 로그의 requestId와 오류 응답 requestId를 맞추면 어느 요청이 실패했는지 찾을 수 있다. 비밀번호·토큰·문서 본문을 로그에 넣지 않는다.

### 비유로 이해하기

단위 테스트는 부품 검사, 요청 테스트는 조립 검사, 브라우저 검사는 사용자가 직접 운전하는 시운전이다.

## ③ 🛠️ 실기: 전체 코드와 줄별 설명

1. npm test로 단위·요청 검사를 실행한다. 테스트는 임시 SQLite를 쓰고 종료 후 지운다.
2. tests/core.test.js의 mock 저장소와 실제 SQLite 테스트를 구분해 읽는다.
3. npx playwright install chromium 후 npm run test:browser를 실행한다.
4. npm run dev 서버에서 한 요청을 실패시키고 X-Request-Id와 로그를 대조한다.

### 자주 나는 오류 TOP 10

| 증상 | 원인 | 해결 |
|---|---|---|
| EADDRINUSE | 포트 중복 | 기존 서버 종료 또는 주소 설정 일괄 변경 |
| import 실패 | type=module·확장자 누락 | module과 .js 확인 |
| fetch 차단 | file:// 또는 CORS | HTTP·허용 origin 확인 |
| 404 | 경로·대소문자 오류 | Network와 서버 라우트 대조 |
| 400 | 필드명·JSON·스키마 오류 | error.fields와 본문 확인 |
| 401 | 토큰 없음·만료·로그아웃 | 로그인 후 메모리 토큰 갱신 |
| 403 | 다른 작성자·출처 | 권한과 Origin 확인 |
| JSON 파싱 실패 | 204 또는 저장값 손상 | 본문 유무·try/catch 확인 |
| 버튼 중복/잠김 | pending/finally 누락 | 제출 잠금과 복구 동시 적용 |
| DB 자료 사라짐 | 다른 파일·볼륨 미연결 | SQLITE_PATH·작업 폴더·볼륨 확인 |


### `tests/core.test.js` 전체 코드

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRepository } from '../server/repository.js';
import { hashPassword, verifyPassword } from '../server/auth.js';
import { selectSources, createAI } from '../server/ai.js';
import { createStore } from '../workbook/js/store.js';
import { readSSE } from '../workbook/js/sse.js';
import { createBoard } from '../server/board.js';

test('비밀번호를 평문으로 보관하지 않고 올바른 값만 검증한다', async () => {
  const hash = await hashPassword('correct-password');
  assert.notEqual(hash, 'correct-password');
  assert.equal(await verifyPassword('correct-password', hash), true);
  assert.equal(await verifyPassword('wrong-password', hash), false);
  assert.equal(await verifyPassword('wrong-password', ''), false);
});
test('상태 저장소가 외부 변이와 구독 해제를 처리한다', () => {
  const store = createStore({ count: 0 });
  let received;
  const stop = store.subscribe(value => { received = value.count; });
  store.set({ count: 1 });
  const copy = store.get(); copy.count = 99;
  assert.equal(store.get().count, 1);
  assert.equal(received, 1);
  stop(); store.set({ count: 2 }); assert.equal(received, 1);
});
test('SSE는 임의의 바이트 경계와 한글을 복구하고 중단을 감지한다', async () => {
  const bytes = new TextEncoder().encode('data: {"text":"한글"}\n\ndata: {"done":true}\n\n');
  const stream = new ReadableStream({ start(c) { for (const byte of bytes) c.enqueue(new Uint8Array([byte])); c.close(); } });
  const values = [];
  await readSSE(new Response(stream), value => values.push(value));
  assert.equal(values[0].text, '한글');
  await assert.rejects(readSSE(new Response('data: {"text":"중단"}\n\n'), () => {}), /완료되기 전/);
  await assert.rejects(readSSE(new Response('data: {"error":{"message":"실패"}}\n\n'), () => {}), /실패/);
});
test('검색 근거가 없을 때 발췌를 만들지 않는다', () => {
  assert.deepEqual(selectSources('HTML은 문서 구조다.', '결제'), []);
  assert.equal(selectSources('HTML은 문서 구조다.', 'HTML')[0].index, 1);
});
test('가짜 저장소로 게시판 필터/권한을 검증한다', async () => {
  const rows = new Map();
  let sequence = 0;
  const mock = {
    list: async kind => [...rows.values()].filter(row => row.kind === kind).map(({ kind, ...v }) => v),
    get: async (kind, id) => (await mock.list(kind)).find(r => r.id === id),
    create: async (kind, value) => { const row = { ...value, id: ++sequence }; rows.set(row.id, { ...row, kind }); return row; },
    put: async (kind, id, value) => { rows.set(id, { ...value, id, kind }); return { ...value, id }; },
    delete: async (kind, id) => rows.delete(id),
  };
  const user = await mock.create('users', { nickname: '학습자', email: 'a@test.local' });
  const board = createBoard(mock);
  const post = await board.create({ title: 'HTML', body: '문서', tags: [] }, user);
  const list = await board.list(new URLSearchParams('q=html&limit=99'));
  assert.equal(list.meta.limit, 50); assert.equal(list.meta.total, 1);
  await assert.rejects(board.patch(post.id, { title: '변경' }, { id: 999 }), { status: 403 });
});
test('AI 모의 응답과 사용량 한도도 저장소로 검증한다', async () => {
  const repo = await createRepository({ SQLITE_PATH: ':memory:' });
  try {
    const ai = createAI({ AI_PROVIDER: 'mock', AI_DAILY_REQUEST_LIMIT: '1' }, repo);
    const values = [];
    for await (const event of ai({ id: 1 }, { id: 2, text: 'HTML은 구조다.' }, 'HTML', new AbortController().signal)) values.push(event);
    assert.equal(values[0].mock, true); assert.equal(values.at(-1).done, true);
    assert.equal((await repo.list('questions')).length, 1);
    await assert.rejects(async () => { for await (const event of ai({ id: 1 }, { id: 2, text: 'HTML' }, 'HTML', new AbortController().signal)) void event; }, { status: 429 });
  } finally { await repo.close(); }
});
```

원본: [tests/core.test.js](tests/core.test.js) · SHA-256(LF 정규화): `9a8408f659fe21cd3b170a007e5f300e5bccbbe2489c74a3a441b763a2a585bb`

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
| 10 | 독립적으로 재현할 동작과 기대 결과를 하나의 테스트로 등록한다. |
| 11 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const hash = await hashPassword('correct-password'); |
| 12 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 13 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 14 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 15 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 16 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 17 | 독립적으로 재현할 동작과 기대 결과를 하나의 테스트로 등록한다. |
| 18 | `store`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 19 | `received;`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 20 | `stop`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 21 | 현재 처리의 설정·호출·상태를 연결한다: `store.set({ count: 1 });` |
| 22 | `copy`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 23 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 24 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 25 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 26 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 27 | 독립적으로 재현할 동작과 기대 결과를 하나의 테스트로 등록한다. |
| 28 | `bytes`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 29 | `stream`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 30 | `values`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 31 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await readSSE(new Response(stream), value => values.push(value)); |
| 32 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 33 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 34 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 35 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 36 | 독립적으로 재현할 동작과 기대 결과를 하나의 테스트로 등록한다. |
| 37 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 38 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 39 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 40 | 독립적으로 재현할 동작과 기대 결과를 하나의 테스트로 등록한다. |
| 41 | `rows`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 42 | `sequence`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 43 | `mock`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 44 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 45 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: get: async (kind, id) => (await mock.list(kind)).find(r => r.id === id), |
| 46 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 47 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 48 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 49 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 50 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const user = await mock.create('users', { nickname: '학습자', email: 'a@test.local' }); |
| 51 | `board`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 52 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const post = await board.create({ title: 'HTML', body: '문서', tags: [] }, user); |
| 53 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const list = await board.list(new URLSearchParams('q=html&limit=99')); |
| 54 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 55 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 56 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 57 | 독립적으로 재현할 동작과 기대 결과를 하나의 테스트로 등록한다. |
| 58 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const repo = await createRepository({ SQLITE_PATH: ':memory:' }); |
| 59 | 현재 처리의 설정·호출·상태를 연결한다: `try {` |
| 60 | `ai`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 61 | `values`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 62 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: for await (const event of ai({ id: 1 }, { id: 2, text: 'HTML은 구조다.' }, 'HTML', new AbortController() |
| 63 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 64 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 65 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 66 | 성공·실패와 관계없이 버튼·연결·자원을 정리한다. |
| 67 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `tests/api.test.js` 전체 코드

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import WebSocket from 'ws';
import { createRepository } from '../server/repository.js';
import { createApp } from '../server/app.js';

test('API v1 전체 흐름·권한·영속성·문서 AI·정적 보안', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'html-study-'));
  const path = join(directory, 'test.sqlite');
  const config = { SQLITE_PATH: path, PUBLIC_ORIGIN: 'http://localhost:3000', LOG_REQUESTS: 'false', AI_DAILY_REQUEST_LIMIT: '2' };
  let app = createApp(await createRepository(config), config);
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  let base = `http://127.0.0.1:${app.server.address().port}`;
  async function call(path, method = 'GET', value, token, headers = {}) {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, ...(value === undefined ? {} : { body: typeof value === 'string' ? value : JSON.stringify(value) }) });
    return { response, status: response.status, body: response.status === 204 || response.status === 304 ? null : (response.headers.get('content-type') || '').includes('json') ? await response.json() : await response.text() };
  }
  try {
    const credentials = { email: 'test@example.com', password: 'valid-password-123', nickname: '학습자' };
    assert.equal((await call('/health')).status, 200);
    assert.equal((await call('/api/auth/signup', 'POST', credentials)).status, 201);
    assert.equal((await call('/api/auth/signup', 'POST', credentials)).status, 409);
    assert.equal((await call('/api/auth/login', 'POST', { email: credentials.email, password: 'wrong-password' })).status, 401);
    const login = await call('/api/auth/login', 'POST', { email: credentials.email, password: credentials.password });
    const token = login.body.data.accessToken;
    assert.equal(token.length, 64);
    assert.equal((await call('/api/auth/me', 'GET', undefined, token)).body.data.nickname, '학습자');
    assert.equal(JSON.stringify(login.body).includes('passwordHash'), false);
    assert.equal((await call('/api/posts', 'POST', { title: 'x', body: 'y' })).status, 401);
    const invalid = await call('/api/posts', 'POST', { title: '', body: 'y' }, token);
    assert.equal(invalid.status, 400); assert.ok(invalid.body.error.fields.title);
    assert.equal(invalid.response.headers.get('x-request-id'), invalid.body.error.requestId);
    const created = await call('/api/posts', 'POST', { title: '<img onerror=alert(1)> HTML', body: '본문', tags: ['html'] }, token);
    assert.equal(created.status, 201);
    const id = created.body.data.id;
    assert.equal(created.response.headers.get('location'), `/api/posts/${id}`);
    assert.equal(created.body.data.commentCount, 0);
    assert.equal((await call('/api/posts?q=html&page=1&limit=99')).body.meta.limit, 50);
    assert.equal((await call('/api/posts?sort=bad')).status, 400);
    assert.equal((await call('/api/posts/nan')).status, 400);
    assert.equal((await call('/api/posts/99999')).status, 404);
    await call('/api/auth/signup', 'POST', { ...credentials, email: 'other@example.com' });
    const other = (await call('/api/auth/login', 'POST', { email: 'other@example.com', password: credentials.password })).body.data.accessToken;
    assert.equal((await call(`/api/posts/${id}`, 'PATCH', { title: '침입' }, other)).status, 403);
    const patched = await call(`/api/posts/${id}`, 'PATCH', { title: '수정 HTML' }, token);
    assert.equal(patched.body.data.title, '수정 HTML');
    assert.deepEqual(patched.body.data.tags, ['html']);
    const comment = await call(`/api/posts/${id}/comments`, 'POST', { body: '댓글' }, token);
    assert.equal(comment.status, 201);
    assert.equal((await call(`/api/posts/${id}`)).body.data.commentCount, 1);
    assert.equal((await call(`/api/comments/${comment.body.data.id}`, 'DELETE', undefined, other)).status, 403);
    assert.equal((await call(`/api/comments/${comment.body.data.id}`, 'DELETE', undefined, token)).status, 204);
    assert.equal((await call('/api/posts', 'POST', '{oops', token)).status, 400);
    assert.equal((await call('/api/posts', 'POST', { title: 'x', body: 'y'.repeat(70000) }, token)).status, 413);
    assert.equal((await call('/api/posts', 'GET', undefined, undefined, { Origin: 'https://evil.invalid' })).status, 403);
    const preflight = await call('/api/posts', 'OPTIONS', undefined, undefined, { Origin: 'http://localhost:3000' });
    assert.equal(preflight.status, 204);
    const doc = await call('/api/documents', 'POST', { filename: '학습.md', text: 'HTML은 문서의 구조다. CSS는 표현이다.' }, token);
    assert.equal(doc.status, 201);
    const documentId = doc.body.data.id;
    assert.equal((await call(`/api/documents/${documentId}`, 'GET', undefined, other)).status, 403);
    assert.equal((await call('/api/documents', 'POST', { filename: 'bad.pdf', text: 'no' }, token)).status, 400);
    const ai = await call('/api/ai/chat', 'POST', { documentId, question: 'HTML' }, token);
    assert.equal(ai.body.data.mock, true); assert.match(ai.body.data.text, /발췌 1/);
    const stream = await call('/api/ai/chat/stream', 'POST', { documentId, question: 'HTML' }, token);
    assert.equal(stream.status, 200); assert.match(stream.body, /"done":true/);
    assert.equal((await call('/api/ai/chat', 'POST', { documentId, question: 'HTML' }, token)).status, 429);
    assert.equal((await call(`/api/documents/${documentId}/questions`, 'GET', undefined, token)).body.data.length, 2);
    assert.equal((await call('/api/checkout', 'POST', undefined, token)).body.data.mock, true);
    assert.equal((await call('/api/mail', 'POST', undefined, token)).status, 202);
    const jobs = await call('/api/jobs', 'GET', undefined, token);
    assert.equal(jobs.body.data.length, 1);
    assert.equal((await call('/api/auth/github')).body.data.mock, true);
    const socket = new WebSocket(base.replace('http:', 'ws:') + '/ws', { origin: 'http://localhost:3000' });
    await once(socket, 'open');
    const notification = once(socket, 'message');
    await call(`/api/posts/${id}`, 'PATCH', { body: '알림' }, token);
    assert.equal(JSON.parse(String((await notification)[0])).type, 'posts.changed');
    socket.close(); await once(socket, 'close');
    const staticPage = await call('/workbook/');
    assert.equal(staticPage.status, 200); assert.match(staticPage.body, /Vanilla/);
    const cached = await call('/workbook/', 'GET', undefined, undefined, { 'If-None-Match': staticPage.response.headers.get('etag') });
    assert.equal(cached.status, 304);
    for (const url of ['/.env', '/server/auth.js', '/package.json', '/workbook/%2e%2e%2fserver%2fauth.js', '/workbook/%xx']) assert.notEqual((await call(url)).status, 200);
    assert.equal((await call('/api-docs')).body.openapi, '3.0.3');
    assert.equal((await call('/api/validate', 'POST', { title: 'x'.repeat(201) })).status, 422);
    // 프로세스 재생성 뒤에도 DB 자료와 세션이 남는지 확인한다.
    await app.close();
    app = createApp(await createRepository(config), config);
    await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${app.server.address().port}`;
    assert.equal((await call(`/api/posts/${id}`)).body.data.body, '알림');
    assert.equal((await call(`/api/posts/${id}`, 'DELETE', undefined, token)).status, 204);
    assert.equal((await call(`/api/posts/${id}`)).status, 404);
    assert.equal((await call('/api/auth/logout', 'POST', undefined, token)).status, 204);
    assert.equal((await call('/api/auth/me', 'GET', undefined, token)).status, 401);
    t.diagnostic('회원가입→로그인→게시글·댓글 CRUD→문서 AI→재시작→로그아웃 확인');
  } finally { await app.close(); await rm(directory, { recursive: true, force: true }); }
});
```

원본: [tests/api.test.js](tests/api.test.js) · SHA-256(LF 정규화): `4f8c4e38da33c054884e273a7cfddef2904bc31adb7a5c1356edf70579c549f3`

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
| 11 | 독립적으로 재현할 동작과 기대 결과를 하나의 테스트로 등록한다. |
| 12 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const directory = await mkdtemp(join(tmpdir(), 'html-study-')); |
| 13 | `path`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 14 | `config`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 15 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: let app = createApp(await createRepository(config), config); |
| 16 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve)); |
| 17 | `base`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 18 | 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 19 | 약속한 URL·메소드·본문으로 요청하고 응답을 기다린다. |
| 20 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: return { response, status: response.status, body: response.status === 204 // response.status === 304 |
| 21 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 22 | 현재 처리의 설정·호출·상태를 연결한다: `try {` |
| 23 | `credentials`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 24 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 25 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 26 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 27 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 28 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const login = await call('/api/auth/login', 'POST', { email: credentials.email, password: credential |
| 29 | `token`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 30 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 31 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 32 | 객체를 JSON 문자열로 바꿔 저장·전송·관찰한다. |
| 33 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 34 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const invalid = await call('/api/posts', 'POST', { title: '', body: 'y' }, token); |
| 35 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 36 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 37 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const created = await call('/api/posts', 'POST', { title: '<img onerror=alert(1)> HTML', body: '본문', |
| 38 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 39 | `id`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 40 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 41 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 42 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 43 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 44 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 45 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 46 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await call('/api/auth/signup', 'POST', { ...credentials, email: 'other@example.com' }); |
| 47 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const other = (await call('/api/auth/login', 'POST', { email: 'other@example.com', password: credent |
| 48 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 49 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const patched = await call(`/api/posts/${id}`, 'PATCH', { title: '수정 HTML' }, token); |
| 50 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 51 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 52 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const comment = await call(`/api/posts/${id}/comments`, 'POST', { body: '댓글' }, token); |
| 53 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 54 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 55 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 56 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 57 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 58 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 59 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 60 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const preflight = await call('/api/posts', 'OPTIONS', undefined, undefined, { Origin: 'http://localh |
| 61 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 62 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const doc = await call('/api/documents', 'POST', { filename: '학습.md', text: 'HTML은 문서의 구조다. CSS는 표현이 |
| 63 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 64 | `documentId`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 65 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 66 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 67 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const ai = await call('/api/ai/chat', 'POST', { documentId, question: 'HTML' }, token); |
| 68 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 69 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const stream = await call('/api/ai/chat/stream', 'POST', { documentId, question: 'HTML' }, token); |
| 70 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 71 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 72 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 73 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 74 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 75 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const jobs = await call('/api/jobs', 'GET', undefined, token); |
| 76 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 77 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 78 | `socket`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 79 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await once(socket, 'open'); |
| 80 | `notification`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 81 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await call(`/api/posts/${id}`, 'PATCH', { body: '알림' }, token); |
| 82 | 직렬화된 문자열을 객체로 복구한다. 잘못된 형식은 예외 경로로 보낸다. |
| 83 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: socket.close(); await once(socket, 'close'); |
| 84 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const staticPage = await call('/workbook/'); |
| 85 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 86 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const cached = await call('/workbook/', 'GET', undefined, undefined, { 'If-None-Match': staticPage.r |
| 87 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 88 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 89 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 90 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 91 | 프로세스 재생성 뒤에도 DB 자료와 세션이 남는지 확인한다. |
| 92 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await app.close(); |
| 93 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: app = createApp(await createRepository(config), config); |
| 94 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve)); |
| 95 | 현재 처리의 설정·호출·상태를 연결한다: `base = http://127.0.0.1:${app.server.address().port};` |
| 96 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 97 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 98 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 99 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 100 | 실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다. |
| 101 | 현재 처리의 설정·호출·상태를 연결한다: `t.diagnostic('회원가입→로그인→게시글·댓글 CRUD→문서 AI→재시작→로그아웃 확인');` |
| 102 | 성공·실패와 관계없이 버튼·연결·자원을 정리한다. |
| 103 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


## ④ 🔗 연동 포인트

mock 저장소 → 도메인 규칙 검증, 임시 SQLite → HTTP 계약 검증, Chromium → 사용자 흐름 검증을 연결한다. 다음 단계는 검증한 파일을 빌드하고 배포 환경을 점검하는 일이다.

## ⑤ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| 테스트가 내 DB를 변경 | 운영 경로 재사용 | 임시 폴더·:memory: 사용 |
| 브라우저 실행 파일 없음 | Playwright 브라우저 미설치 | npx playwright install chromium |
| 테스트만 통과하고 UI 실패 | HTTP와 DOM 계약이 다름 | 브라우저 흐름까지 실행 |

## ⑥ 직접 해보기

1. PATCH에서 태그를 지우는 버그를 일부러 만들고 요청 테스트 실패를 확인한다.
2. 가짜 저장소의 list가 예외를 던지게 해 실패 경로를 관찰한다.
3. DevTools에서 Offline으로 바꾸고 폼 버튼 복구를 확인한다.

## ⑦ ☐ 체크리스트

학습자 수행 확인용이다. 문서·코드 작성 완료와 본인의 실습 완료는 다르므로 직접 확인한 뒤 체크한다. 원문 항목 배치는 [반영표](docs/coverage.md)를 따른다.

- [ ] 단위 테스트와 요청 테스트를 실행한다
- [ ] 가짜 DB와 mock AI의 범위를 설명한다
- [ ] requestId로 프론트와 서버 오류를 연결한다
- [ ] 자주 나는 오류 TOP 10을 재현·해결한다

## ⑧ 다음 단계 연결

[study10.md](study10.md)에서 빌드·배포·기초 정리로 이어간다.

출처: [지정 노션](https://app.notion.com/p/3d6d7dec5e2e8147b212f0a23b93dfc1) · [공통 API v1](https://app.notion.com/p/3d6d7dec5e2e8139adbfd36dd506c65e) · [반영표](docs/coverage.md) · [검증 기록](docs/verification.md). 기술 근거: [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [Node 24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html). 설치 버전 API는 package-lock.json과 node_modules의 버전별 공식 문서를 기준으로 확인한다.
