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
