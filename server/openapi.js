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
