# study14 · HTML·CSS·JavaScript — REST·OpenAPI·버전·페이지네이션

## ① 목표 한 줄

노션 공통 API v1을 문서화하고 리소스·상태·오류·페이지 규칙을 고정한다.

## ② 📖 이론

REST 경로는 복수 명사 리소스로 작성한다. /api/posts와 /api/posts/{id}를 사용하고 /api/getPosts 같은 동사 경로를 만들지 않는다. GET은 읽기, POST는 생성, PATCH는 부분 변경, DELETE는 삭제다. 이 계약의 버전은 v1이지만 기본 경로는 /api다.

호환성을 깨는 필드·의미 변경이 필요할 때만 새 버전 계약을 별도로 설계한다. 기존 경로를 조용히 /api/v1로 바꾸지 않는다. 목록은 q·page·limit·sort를 받고 페이지는 1부터 시작한다. totalPages는 ceil(total/limit)이며 빈 목록은 0이다. UI에서 보이는 1/1은 빈 상태 표시용이다.

OpenAPI는 경로·입력·응답을 기계가 읽는 계약이다. /api-docs에서 OpenAPI 3 JSON을 반환한다. Swagger UI를 번들에 포함하지 않으며 Swagger Editor나 UI에 이 JSON을 가져와 시각화할 수 있다. API 문서가 실제 라우트와 다르면 오히려 오류를 만들므로 요청 테스트와 함께 검증한다.

모든 오류는 error.code/message/fields/requestId를 가지며 X-Request-Id와 본문 id가 같다. 500에는 예외 원문을 노출하지 않는다. 게시판 검증은 400이고 study5의 별도 학습 경로만 422를 시연한다. 클라이언트는 상태 코드와 error.code를 기준으로 다음 행동을 결정한다.

### 비유로 이해하기

OpenAPI는 양쪽이 함께 읽는 주문서 사전이고 버전은 그 사전의 개정판이다.

## ③ 🛠️ 실기: 전체 코드와 줄별 설명

1. npm run dev 후 /api-docs의 JSON을 연다.
2. Swagger Editor에 가져와 경로·Bearer·id 파라미터를 확인한다.
3. /api/posts?page=1&limit=2&sort=-createdAt&q=HTML을 요청한다.
4. 400·401·403·404·409·413·429 응답을 테스트와 대조한다.



### 단계별 실행 위치

`npm run dev` 후 `/lessons/study14/`에서 이 단계의 실습을 연다. [실습 HTML](lessons/study14/index.html)과 [전체 실습 목차](lessons/index.html)를 사용한다. 기초 중간 프로젝트 전체 화면은 `npm run midpoint` 후 `/midpoint/`에서 실행한다. 터미널 전용 DB·Docker·MCP 명령은 해당 문서의 실행 순서를 따른다.

### `server/openapi.js` 전체 코드

```javascript
// OpenAPI 3 문서는 /api-docs에서 JSON으로 제공한다. Swagger Editor에 가져올 수 있다.
const success = description => ({ description });
const operation = (summary, statuses, secured = false) => ({ summary, ...(secured ? { security: [{ bearerAuth: [] }] } : {}), responses: Object.fromEntries(statuses.map(s => [String(s), success(s < 400 ? '성공' : '공통 오류')])) });
export const openapi = {
  openapi: '3.0.3', info: { title: 'Vanilla JS 게시판 공통 API v1', version: '1.0.0' },
  servers: [{ url: '/' }],
  paths: {
    '/health': { get: operation('상태 확인', [200]) },
    '/api/auth/signup': { post: operation('회원가입', [201, 400, 409, 429]) },
    '/api/auth/login': { post: operation('로그인', [200, 400, 401, 429]) },
    '/api/auth/logout': { post: operation('로그아웃', [204, 401], true) },
    '/api/auth/me': { get: operation('내 정보', [200, 401], true) },
    '/api/posts': { get: { ...operation('목록·검색·페이지네이션', [200, 400]), parameters: ['q', 'page', 'limit', 'sort'].map(name => ({ in: 'query', name, schema: { type: 'string' } })) }, post: operation('게시글 작성', [201, 400, 401], true) },
    '/api/posts/{id}': { get: operation('상세', [200, 400, 404]), patch: operation('부분 수정', [200, 400, 401, 403, 404], true), delete: operation('삭제', [204, 400, 401, 403, 404], true) },
    '/api/posts/{id}/comments': { get: operation('댓글 목록', [200, 404]), post: operation('댓글 작성', [201, 400, 401, 404], true) },
    '/api/comments/{id}': { delete: operation('댓글 삭제', [204, 401, 403, 404], true) },
    '/api/documents': { get: operation('내 문서 목록', [200, 401], true), post: operation('TXT·MD 업로드', [201, 400, 401, 413], true) },
    '/api/documents/{id}': { get: operation('내 문서 상세', [200, 401, 403, 404], true) },
    '/api/documents/{id}/questions': { get: operation('문서 질문 기록', [200, 401, 403, 404], true) },
    '/api/ai/chat': { post: operation('문서 근거 기반 질의', [200, 400, 401, 403, 429, 502], true) },
    '/api/ai/chat/stream': { post: operation('SSE 문서 질의', [200, 400, 401, 403, 429, 502], true) },
    '/api/mail': { post: operation('메일 작업 접수', [202, 401], true) },
    '/api/checkout': { post: operation('테스트 결제', [200, 401, 503], true) },
    '/api/jobs': { get: operation('내 백그라운드 작업', [200, 401], true) },
  },
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', description: '1시간 만료 opaque 토큰, 메모리에만 보관' } }, schemas: { Error: { type: 'object', required: ['error'], properties: { error: { type: 'object', required: ['code', 'message', 'fields', 'requestId'], properties: { code: { type: 'string' }, message: { type: 'string' }, fields: { type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } }, requestId: { type: 'string' } } } } } } },
};
for (const [path, methods] of Object.entries(openapi.paths)) if (path.includes('{id}')) methods.parameters = [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }];

const ref = name => ({ $ref: `#/components/schemas/${name}` });
const object = (properties, required = Object.keys(properties)) => ({ type: 'object', required, properties });
const string = { type: 'string' };
const integer = { type: 'integer', minimum: 1 };
const datetime = { type: 'string', format: 'date-time' };
const schemas = openapi.components.schemas;
Object.assign(schemas, {
  Author: object({ id: integer, nickname: string }),
  User: object({ id: integer, email: { type: 'string', format: 'email' }, nickname: string }),
  Signup: object({ email: { type: 'string', format: 'email', maxLength: 200 }, password: { type: 'string', minLength: 12, maxLength: 128, writeOnly: true }, nickname: { type: 'string', minLength: 1, maxLength: 40 } }),
  Login: object({ email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 12, maxLength: 128, writeOnly: true } }),
  PostInput: object({ title: { type: 'string', minLength: 1, maxLength: 200 }, body: { type: 'string', minLength: 1, maxLength: 10000 }, tags: { type: 'array', maxItems: 10, items: { type: 'string', minLength: 1, maxLength: 30 } } }, ['title', 'body']),
  CommentInput: object({ body: { type: 'string', minLength: 1, maxLength: 2000 } }),
  Post: object({ id: integer, title: string, body: string, tags: { type: 'array', items: string }, author: ref('Author'), commentCount: { type: 'integer', minimum: 0 }, createdAt: datetime, updatedAt: datetime }),
  Comment: object({ id: integer, postId: integer, body: string, author: ref('Author'), createdAt: datetime }),
  Meta: object({ page: integer, limit: { type: 'integer', minimum: 1, maximum: 50 }, total: { type: 'integer', minimum: 0 }, totalPages: { type: 'integer', minimum: 0 }, q: string }),
  DocumentInput: object({ filename: { type: 'string', pattern: '\\.(txt|md)$' }, text: { type: 'string', minLength: 1, maxLength: 20000 } }),
  AIInput: object({ documentId: integer, question: { type: 'string', minLength: 1, maxLength: 1000 } }),
});
schemas.PostPatch = { ...schemas.PostInput, required: [] };
const requestSchemas = {
  '/api/auth/signup': ['post', 'Signup'], '/api/auth/login': ['post', 'Login'],
  '/api/posts': ['post', 'PostInput'], '/api/posts/{id}': ['patch', 'PostPatch'],
  '/api/posts/{id}/comments': ['post', 'CommentInput'], '/api/documents': ['post', 'DocumentInput'],
  '/api/ai/chat': ['post', 'AIInput'], '/api/ai/chat/stream': ['post', 'AIInput'],
};
for (const [path, [method, schema]] of Object.entries(requestSchemas)) openapi.paths[path][method].requestBody = { required: true, content: { 'application/json': { schema: ref(schema) } } };
for (const name of ['page', 'limit']) openapi.paths['/api/posts'].get.parameters.find(p => p.name === name).schema = { type: 'integer', minimum: 1, ...(name === 'limit' ? { maximum: 50, default: 10 } : { default: 1 }) };
openapi.paths['/api/posts'].get.parameters.find(p => p.name === 'sort').schema = { type: 'string', enum: ['createdAt', '-createdAt', '-commentCount'], default: '-createdAt' };
for (const methods of Object.values(openapi.paths)) for (const [method, operation] of Object.entries(methods)) {
  if (method === 'parameters') continue;
  for (const [status, response] of Object.entries(operation.responses)) {
    response.headers = { 'X-Request-Id': { schema: string, description: '오류 본문의 requestId와 동일' } };
    if (Number(status) >= 400) response.content = { 'application/json': { schema: ref('Error') } };
  }
}
const jsonResponse = (path, method, status, schema) => { openapi.paths[path][method].responses[status].content = { 'application/json': { schema } }; };
jsonResponse('/health', 'get', 200, object({ status: { type: 'string', enum: ['ok'] } }));
jsonResponse('/api/auth/signup', 'post', 201, object({ data: ref('User') }));
jsonResponse('/api/auth/me', 'get', 200, object({ data: ref('User') }));
jsonResponse('/api/auth/login', 'post', 200, object({ data: object({ user: ref('User'), accessToken: string }) }));
jsonResponse('/api/posts', 'get', 200, object({ data: { type: 'array', items: ref('Post') }, meta: ref('Meta') }));
for (const [path, method, status] of [['/api/posts', 'post', 201], ['/api/posts/{id}', 'get', 200], ['/api/posts/{id}', 'patch', 200]]) jsonResponse(path, method, status, object({ data: ref('Post') }));
openapi.paths['/api/posts'].post.responses[201].headers.Location = { schema: string, description: '등록한 /api/posts/{id}' };
jsonResponse('/api/posts/{id}/comments', 'get', 200, object({ data: { type: 'array', items: ref('Comment') } }));
jsonResponse('/api/posts/{id}/comments', 'post', 201, object({ data: ref('Comment') }));
openapi.paths['/api/ai/chat/stream'].post.responses[200].content = { 'text/event-stream': { schema: { type: 'string', description: 'data: JSON + 빈 줄. text/sources/mock/finishReason/done 또는 error 이벤트' } } };
```

원본: [server/openapi.js](server/openapi.js) · SHA-256(LF 정규화): `229cff3809884e8fdd577675dfdb22383991b211caf1525e1aac3425d63804a2`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | OpenAPI 3 문서는 /api-docs에서 JSON으로 제공한다. Swagger Editor에 가져올 수 있다. |
| 2 | `success`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 3 | `operation`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 4 | 다른 모듈이 사용할 인터페이스를 공개한다. `openapi`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 5 | 현재 처리의 설정·호출·상태를 연결한다: `openapi: '3.0.3', info: { title: 'Vanilla JS 게시판 공통 API v1', version: '1.0.0' },` |
| 6 | 현재 처리의 설정·호출·상태를 연결한다: `servers: [{ url: '/' }],` |
| 7 | 현재 처리의 설정·호출·상태를 연결한다: `paths: {` |
| 8 | 현재 처리의 설정·호출·상태를 연결한다: `'/health': { get: operation('상태 확인', [200]) },` |
| 9 | 현재 처리의 설정·호출·상태를 연결한다: `'/api/auth/signup': { post: operation('회원가입', [201, 400, 409, 429]) },` |
| 10 | 현재 처리의 설정·호출·상태를 연결한다: `'/api/auth/login': { post: operation('로그인', [200, 400, 401, 429]) },` |
| 11 | 현재 처리의 설정·호출·상태를 연결한다: `'/api/auth/logout': { post: operation('로그아웃', [204, 401], true) },` |
| 12 | 현재 처리의 설정·호출·상태를 연결한다: `'/api/auth/me': { get: operation('내 정보', [200, 401], true) },` |
| 13 | 현재 처리의 설정·호출·상태를 연결한다: `'/api/posts': { get: { ...operation('목록·검색·페이지네이션', [200, 400]), parameters: ['q', 'page', 'limit', 'sort'].map(name => ` |
| 14 | 현재 처리의 설정·호출·상태를 연결한다: `'/api/posts/{id}': { get: operation('상세', [200, 400, 404]), patch: operation('부분 수정', [200, 400, 401, 403, 404], true), ` |
| 15 | 현재 처리의 설정·호출·상태를 연결한다: `'/api/posts/{id}/comments': { get: operation('댓글 목록', [200, 404]), post: operation('댓글 작성', [201, 400, 401, 404], true) ` |
| 16 | 현재 처리의 설정·호출·상태를 연결한다: `'/api/comments/{id}': { delete: operation('댓글 삭제', [204, 401, 403, 404], true) },` |
| 17 | 현재 처리의 설정·호출·상태를 연결한다: `'/api/documents': { get: operation('내 문서 목록', [200, 401], true), post: operation('TXT·MD 업로드', [201, 400, 401, 413], tru` |
| 18 | 현재 처리의 설정·호출·상태를 연결한다: `'/api/documents/{id}': { get: operation('내 문서 상세', [200, 401, 403, 404], true) },` |
| 19 | 현재 처리의 설정·호출·상태를 연결한다: `'/api/documents/{id}/questions': { get: operation('문서 질문 기록', [200, 401, 403, 404], true) },` |
| 20 | 현재 처리의 설정·호출·상태를 연결한다: `'/api/ai/chat': { post: operation('문서 근거 기반 질의', [200, 400, 401, 403, 429, 502], true) },` |
| 21 | 현재 처리의 설정·호출·상태를 연결한다: `'/api/ai/chat/stream': { post: operation('SSE 문서 질의', [200, 400, 401, 403, 429, 502], true) },` |
| 22 | 현재 처리의 설정·호출·상태를 연결한다: `'/api/mail': { post: operation('메일 작업 접수', [202, 401], true) },` |
| 23 | 현재 처리의 설정·호출·상태를 연결한다: `'/api/checkout': { post: operation('테스트 결제', [200, 401, 503], true) },` |
| 24 | 현재 처리의 설정·호출·상태를 연결한다: `'/api/jobs': { get: operation('내 백그라운드 작업', [200, 401], true) },` |
| 25 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 26 | 현재 처리의 설정·호출·상태를 연결한다: `components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', description: '1시간 만료 opaque 토큰, 메모리에만 보관'` |
| 27 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 28 | 목록 또는 스트림의 각 항목을 반복 처리한다. |
| 30 | `ref`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 31 | `object`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 32 | `string`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 33 | `integer`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 34 | `datetime`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 35 | `schemas`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 36 | 현재 처리의 설정·호출·상태를 연결한다: `Object.assign(schemas, {` |
| 37 | 현재 처리의 설정·호출·상태를 연결한다: `Author: object({ id: integer, nickname: string }),` |
| 38 | 현재 처리의 설정·호출·상태를 연결한다: `User: object({ id: integer, email: { type: 'string', format: 'email' }, nickname: string }),` |
| 39 | 현재 처리의 설정·호출·상태를 연결한다: `Signup: object({ email: { type: 'string', format: 'email', maxLength: 200 }, password: { type: 'string', minLength: 12, ` |
| 40 | 현재 처리의 설정·호출·상태를 연결한다: `Login: object({ email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 12, maxLength: 128, w` |
| 41 | 현재 처리의 설정·호출·상태를 연결한다: `PostInput: object({ title: { type: 'string', minLength: 1, maxLength: 200 }, body: { type: 'string', minLength: 1, maxLe` |
| 42 | 현재 처리의 설정·호출·상태를 연결한다: `CommentInput: object({ body: { type: 'string', minLength: 1, maxLength: 2000 } }),` |
| 43 | 현재 처리의 설정·호출·상태를 연결한다: `Post: object({ id: integer, title: string, body: string, tags: { type: 'array', items: string }, author: ref('Author'), ` |
| 44 | 현재 처리의 설정·호출·상태를 연결한다: `Comment: object({ id: integer, postId: integer, body: string, author: ref('Author'), createdAt: datetime }),` |
| 45 | 현재 처리의 설정·호출·상태를 연결한다: `Meta: object({ page: integer, limit: { type: 'integer', minimum: 1, maximum: 50 }, total: { type: 'integer', minimum: 0 ` |
| 46 | 현재 처리의 설정·호출·상태를 연결한다: `DocumentInput: object({ filename: { type: 'string', pattern: '\\.(txt/md)$' }, text: { type: 'string', minLength: 1, max` |
| 47 | 현재 처리의 설정·호출·상태를 연결한다: `AIInput: object({ documentId: integer, question: { type: 'string', minLength: 1, maxLength: 1000 } }),` |
| 48 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 49 | 현재 처리의 설정·호출·상태를 연결한다: `schemas.PostPatch = { ...schemas.PostInput, required: [] };` |
| 50 | `requestSchemas`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 51 | 현재 처리의 설정·호출·상태를 연결한다: `'/api/auth/signup': ['post', 'Signup'], '/api/auth/login': ['post', 'Login'],` |
| 52 | 현재 처리의 설정·호출·상태를 연결한다: `'/api/posts': ['post', 'PostInput'], '/api/posts/{id}': ['patch', 'PostPatch'],` |
| 53 | 현재 처리의 설정·호출·상태를 연결한다: `'/api/posts/{id}/comments': ['post', 'CommentInput'], '/api/documents': ['post', 'DocumentInput'],` |
| 54 | 현재 처리의 설정·호출·상태를 연결한다: `'/api/ai/chat': ['post', 'AIInput'], '/api/ai/chat/stream': ['post', 'AIInput'],` |
| 55 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 56 | 목록 또는 스트림의 각 항목을 반복 처리한다. |
| 57 | 목록 또는 스트림의 각 항목을 반복 처리한다. |
| 58 | 현재 처리의 설정·호출·상태를 연결한다: `openapi.paths['/api/posts'].get.parameters.find(p => p.name === 'sort').schema = { type: 'string', enum: ['createdAt', '` |
| 59 | 목록 또는 스트림의 각 항목을 반복 처리한다. |
| 60 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (method === 'parameters') continue; |
| 61 | 목록 또는 스트림의 각 항목을 반복 처리한다. |
| 62 | 현재 처리의 설정·호출·상태를 연결한다: `response.headers = { 'X-Request-Id': { schema: string, description: '오류 본문의 requestId와 동일' } };` |
| 63 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (Number(status) >= 400) response.content = { 'application/json': { schema: ref('Error') } }; |
| 64 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 65 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 66 | `jsonResponse`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 67 | 현재 처리의 설정·호출·상태를 연결한다: `jsonResponse('/health', 'get', 200, object({ status: { type: 'string', enum: ['ok'] } }));` |
| 68 | 현재 처리의 설정·호출·상태를 연결한다: `jsonResponse('/api/auth/signup', 'post', 201, object({ data: ref('User') }));` |
| 69 | 현재 처리의 설정·호출·상태를 연결한다: `jsonResponse('/api/auth/me', 'get', 200, object({ data: ref('User') }));` |
| 70 | 현재 처리의 설정·호출·상태를 연결한다: `jsonResponse('/api/auth/login', 'post', 200, object({ data: object({ user: ref('User'), accessToken: string }) }));` |
| 71 | 현재 처리의 설정·호출·상태를 연결한다: `jsonResponse('/api/posts', 'get', 200, object({ data: { type: 'array', items: ref('Post') }, meta: ref('Meta') }));` |
| 72 | 목록 또는 스트림의 각 항목을 반복 처리한다. |
| 73 | 현재 처리의 설정·호출·상태를 연결한다: `openapi.paths['/api/posts'].post.responses[201].headers.Location = { schema: string, description: '등록한 /api/posts/{id}' ` |
| 74 | 현재 처리의 설정·호출·상태를 연결한다: `jsonResponse('/api/posts/{id}/comments', 'get', 200, object({ data: { type: 'array', items: ref('Comment') } }));` |
| 75 | 현재 처리의 설정·호출·상태를 연결한다: `jsonResponse('/api/posts/{id}/comments', 'post', 201, object({ data: ref('Comment') }));` |
| 76 | 현재 처리의 설정·호출·상태를 연결한다: `openapi.paths['/api/ai/chat/stream'].post.responses[200].content = { 'text/event-stream': { schema: { type: 'string', de` |


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


### `lessons/study14/index.html` 전체 코드

```html
<!doctype html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>study14 실습</title><link rel="stylesheet" href="/workbook/style.css"></head>
<body><main class="container"></main><script type="module" src="app.js"></script></body>
</html>
```

원본: [lessons/study14/index.html](lessons/study14/index.html) · SHA-256(LF 정규화): `52b7c12838db379e3078f0a97ed73307795448049e8fe5034fdc64b3db49bcbd`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | HTML 표준 모드로 문서를 해석하도록 선언한다. |
| 2 | 문서 언어/루트를 정의한다. |
| 3 | 메타정보 / 문자 인코딩·화면 배율·설명 / 브라우저 탭 제목 / 공통 CSS 연결를 정의한다. |
| 4 | body 요소 / 본문 / ESM 진입점 연결를 정의한다. |
| 5 | 현재 HTML 요소를 닫는다. |


### `lessons/study14/app.js` 전체 코드

```javascript
import { mountLesson } from '../runner.js';

// 이 단계의 요청·입력·실행 순서를 선언한다.
mountLesson({
  "title": "study14 · OpenAPI·페이지네이션",
  "intro": "OpenAPI 3 문서와 page=1·limit=2 목록의 meta를 대조하세요. 잘못된 정렬은 400 오류를 반환합니다.",
  "input": {},
  "actions": [
    {
      "label": "OpenAPI 읽기",
      "kind": "schema"
    },
    {
      "label": "2개씩 목록",
      "path": "/posts?page=1&limit=2"
    },
    {
      "label": "잘못된 정렬",
      "path": "/posts?sort=invalid"
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

원본: [lessons/study14/app.js](lessons/study14/app.js) · SHA-256(LF 정규화): `1f2a7ea3bf202527285285e98e968bf9e0ddf57199b25e8aa83ffcae9b529f9c`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 3 | 이 단계의 요청·입력·실행 순서를 선언한다. |
| 4 | 현재 처리의 설정·호출·상태를 연결한다: `mountLesson({` |
| 5 | 현재 처리의 설정·호출·상태를 연결한다: `"title": "study14 · OpenAPI·페이지네이션",` |
| 6 | 현재 처리의 설정·호출·상태를 연결한다: `"intro": "OpenAPI 3 문서와 page=1·limit=2 목록의 meta를 대조하세요. 잘못된 정렬은 400 오류를 반환합니다.",` |
| 7 | 현재 처리의 설정·호출·상태를 연결한다: `"input": {},` |
| 8 | 현재 처리의 설정·호출·상태를 연결한다: `"actions": [` |
| 9 | 현재 처리의 설정·호출·상태를 연결한다: `{` |
| 10 | 현재 처리의 설정·호출·상태를 연결한다: `"label": "OpenAPI 읽기",` |
| 11 | 현재 처리의 설정·호출·상태를 연결한다: `"kind": "schema"` |
| 12 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 13 | 현재 처리의 설정·호출·상태를 연결한다: `{` |
| 14 | 현재 처리의 설정·호출·상태를 연결한다: `"label": "2개씩 목록",` |
| 15 | 현재 처리의 설정·호출·상태를 연결한다: `"path": "/posts?page=1&limit=2"` |
| 16 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 17 | 현재 처리의 설정·호출·상태를 연결한다: `{` |
| 18 | 현재 처리의 설정·호출·상태를 연결한다: `"label": "잘못된 정렬",` |
| 19 | 현재 처리의 설정·호출·상태를 연결한다: `"path": "/posts?sort=invalid"` |
| 20 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 21 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 22 | 현재 처리의 설정·호출·상태를 연결한다: `"links": [` |
| 23 | 현재 처리의 설정·호출·상태를 연결한다: `[` |
| 24 | 현재 처리의 설정·호출·상태를 연결한다: `"전체 게시판·문서 AI",` |
| 25 | 현재 처리의 설정·호출·상태를 연결한다: `"/workbook/"` |
| 26 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 27 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 28 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


## ④ 🔗 연동 포인트

노션 v1 → OpenAPI → 서버 라우트 → 요청 테스트 → 브라우저 API 모듈로 연결한다. 다음 단계에서 같은 계약의 지연·캐시·처리량을 측정한다.

## ⑤ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| 문서 경로는 있는데 서버 404 | 계약 문서와 라우트 불일치 | 실제 app.js 경로와 테스트 대조 |
| 페이지 수가 하나 많음 | 0/1 기준 혼동 | page=1 시작·ceil(total/limit) |
| 오류 추적 id가 다름 | 본문/헤더에서 별도 생성 | 요청당 requestId 하나 공유 |

## ⑥ 직접 해보기

1. OpenAPI에 새 응답 예시를 추가하고 문서와 테스트를 동시에 고친다.
2. limit=100 요청이 50으로 제한되는지 확인한다.
3. 빈 목록·마지막 페이지·범위 밖 페이지의 meta를 기록한다.

## ⑦ ☐ 체크리스트

학습자 수행 확인용이다. 문서·코드 작성 완료와 본인의 실습 완료는 다르므로 직접 확인한 뒤 체크한다. 원문 항목 배치는 [반영표](docs/coverage.md)를 따른다.

- [ ] 공통 API 스펙 v1의 /api 경로를 유지한다
- [ ] REST 메소드와 200·201·204·4xx 규칙을 설명한다
- [ ] OpenAPI와 실제 응답을 대조한다
- [ ] page·limit·total·totalPages·q와 공통 오류 형식을 확인한다

## ⑧ 다음 단계 연결

[study15.md](study15.md)에서 성능·캐시·비동기·백그라운드로 이어간다.

출처: [지정 노션](https://app.notion.com/p/3d6d7dec5e2e8147b212f0a23b93dfc1) · [공통 API v1](https://app.notion.com/p/3d6d7dec5e2e8139adbfd36dd506c65e) · [반영표](docs/coverage.md) · [검증 기록](docs/verification.md). 기술 근거: [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [Node 24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html). 설치 버전 API는 package-lock.json과 node_modules의 버전별 공식 문서를 기준으로 확인한다.
