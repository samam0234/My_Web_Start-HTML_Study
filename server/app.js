import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { createAuth, hashPassword, verifyPassword, publicUser } from './auth.js';
import { createBoard } from './board.js';
import { signupSchema, loginSchema, postSchema, patchSchema, commentSchema, validate, numericId } from './validation.js';
import { send, sendError, fail, readJson } from './errors.js';
import { serveStatic } from './static.js';
import { createIntegrations } from './integrations.js';
import { createAI } from './ai.js';
import { attachRealtime } from './realtime.js';
import { openapi } from './openapi.js';

export function createApp(repo, config = process.env) {
  const origin = config.PUBLIC_ORIGIN || 'http://localhost:3000';
  const cors = config.CORS_ORIGIN || origin;
  const auth = createAuth(repo);
  const board = createBoard(repo);
  const integrations = createIntegrations(config, repo);
  const ai = createAI(config, repo);
  const attempts = new Map();
  let writes = Promise.resolve();
  const current = async req => (await auth.require(req)).user;
  const needDocument = async (id, user) => {
    const document = await repo.get('documents', id);
    if (!document) fail(404, 'NOT_FOUND', '문서가 없습니다.');
    if (document.userId !== user.id) fail(403, 'FORBIDDEN', '내 문서만 볼 수 있습니다.');
    return document;
  };
  async function route(req, res, url) {
    const path = url.pathname;
    const method = req.method;
    if (method === 'GET' && path === '/health') return send(res, 200, { status: 'ok' });
    if (method === 'GET' && path === '/api-docs') return send(res, 200, openapi);
    if (method === 'GET' && path === '/') { res.writeHead(302, { Location: '/workbook/' }); return res.end(); }
    if (method === 'POST' && path === '/api/validate') {
      const value = await readJson(req);
      if (typeof value.title !== 'string' || !value.title.trim()) fail(400, 'VALIDATION_ERROR', '제목을 입력하세요.', { title: ['필수 입력'] });
      if (value.title.length > 200) fail(422, 'VALIDATION_ERROR', '제목은 200자 이하여야 합니다.', { title: ['최대 200자'] });
      return send(res, 200, { data: { message: '입력 검사를 통과했습니다.' } });
    }
    if (method === 'POST' && ['/api/auth/signup', '/api/auth/login'].includes(path)) {
      const key = req.socket.remoteAddress;
      const now = Date.now();
      for (const [address, value] of attempts) if (now > value.reset) attempts.delete(address);
      const attempt = attempts.get(key) || { count: 0, reset: now + 900000 };
      attempts.set(key, attempt);
      if (++attempt.count > 30) fail(429, 'RATE_LIMITED', '잠시 후 다시 시도하세요.');
      const signup = path.endsWith('signup');
      const input = validate(signup ? signupSchema : loginSchema, await readJson(req));
      let user = (await repo.list('users')).find(u => u.email === input.email);
      if (signup) {
        if (user) fail(409, 'EMAIL_TAKEN', '이미 사용 중인 이메일입니다.');
        user = await repo.create('users', { email: input.email, nickname: input.nickname, passwordHash: await hashPassword(input.password) });
        return send(res, 201, { data: publicUser(user) });
      }
      if (!user || !await verifyPassword(input.password, user.passwordHash)) fail(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호를 확인하세요.');
      return send(res, 200, { data: await auth.issue(user) });
    }
    if (method === 'GET' && path === '/api/auth/me') return send(res, 200, { data: publicUser(await current(req)) });
    if (method === 'POST' && path === '/api/auth/logout') {
      const { session } = await auth.require(req);
      await repo.delete('sessions', session.id);
      return send(res, 204);
    }
    if (method === 'GET' && path === '/api/auth/github') {
      const result = integrations.oauthStart();
      if (result.state) res.setHeader('Set-Cookie', `oauthState=${result.state}; HttpOnly; SameSite=Lax; Path=/api/auth/github; Max-Age=300${config.NODE_ENV === 'production' ? '; Secure' : ''}`);
      const { state, ...data } = result;
      return send(res, 200, { data });
    }
    if (method === 'GET' && path === '/api/auth/github/callback') {
      const cookie = req.headers.cookie?.match(/(?:^|;\s*)oauthState=([a-f0-9]{64})/)?.[1];
      const user = await integrations.oauthFinish(url.searchParams, cookie);
      const result = await auth.issue(user);
      // 토큰은 URL 쿼리/로그에 넣지 않고 fragment로 한 번 전달한 뒤 UI가 즉시 지운다.
      res.writeHead(302, { Location: `/workbook/#oauth=${result.accessToken}`, 'Set-Cookie': 'oauthState=; HttpOnly; SameSite=Lax; Path=/api/auth/github; Max-Age=0' });
      return res.end();
    }
    if (path === '/api/posts' && method === 'GET') return send(res, 200, await board.list(url.searchParams));
    if (path === '/api/posts' && method === 'POST') {
      const user = await current(req);
      const data = await board.create(validate(postSchema, await readJson(req)), user);
      realtime.notify(data.id);
      return send(res, 201, { data }, { Location: `/api/posts/${data.id}` });
    }
    const postMatch = path.match(/^\/api\/posts\/([^/]+)$/);
    if (postMatch) {
      const id = numericId(postMatch[1]);
      if (method === 'GET') return send(res, 200, { data: await board.get(id) });
      const user = await current(req);
      if (method === 'PATCH') {
        const value = validate(patchSchema, await readJson(req));
        if (!Object.keys(value).length) fail(400, 'VALIDATION_ERROR', '수정 필드가 없습니다.');
        const data = await board.patch(id, value, user);
        realtime.notify(id);
        return send(res, 200, { data });
      }
      if (method === 'DELETE') { await board.delete(id, user); realtime.notify(id); return send(res, 204); }
    }
    const comments = path.match(/^\/api\/posts\/([^/]+)\/comments$/);
    if (comments) {
      const id = numericId(comments[1]);
      if (method === 'GET') return send(res, 200, { data: await board.comments(id) });
      if (method === 'POST') return send(res, 201, { data: await board.comment(id, validate(commentSchema, await readJson(req)), await current(req)) });
    }
    const comment = path.match(/^\/api\/comments\/([^/]+)$/);
    if (comment && method === 'DELETE') { await board.deleteComment(numericId(comment[1]), await current(req)); return send(res, 204); }
    if (method === 'POST' && path === '/api/mail') return send(res, 202, { data: await integrations.mail(await current(req)) });
    if (method === 'POST' && path === '/api/checkout') return send(res, 200, { data: await integrations.checkout(await current(req)) });
    if (method === 'POST' && path === '/api/payments/webhook') {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 65536) fail(413, 'PAYLOAD_TOO_LARGE', '요청 한도 초과'); chunks.push(chunk); }
      return send(res, 200, await integrations.webhook(Buffer.concat(chunks), req.headers['stripe-signature']));
    }
    if (method === 'GET' && path === '/api/jobs') {
      const user = await current(req);
      return send(res, 200, { data: (await repo.list('jobs')).filter(j => j.userId === user.id) });
    }
    if (path === '/api/documents') {
      const user = await current(req);
      if (method === 'GET') return send(res, 200, { data: (await repo.list('documents')).filter(d => d.userId === user.id) });
      if (method === 'POST') {
        const value = await readJson(req);
        if (typeof value.filename !== 'string' || !/\.(txt|md)$/i.test(value.filename) || typeof value.text !== 'string' || !value.text.trim() || value.text.length > 20000) fail(400, 'VALIDATION_ERROR', 'TXT·MD 문서(1~20000자)를 보내세요.');
        const data = await repo.create('documents', { filename: value.filename.slice(0, 200), text: value.text, userId: user.id, createdAt: new Date().toISOString() });
        return send(res, 201, { data });
      }
    }
    const doc = path.match(/^\/api\/documents\/([^/]+)(?:\/(questions))?$/);
    if (doc) {
      const user = await current(req);
      const document = await needDocument(numericId(doc[1]), user);
      if (method === 'GET' && !doc[2]) return send(res, 200, { data: document });
      if (method === 'GET' && doc[2]) return send(res, 200, { data: (await repo.list('questions')).filter(q => q.documentId === document.id && q.userId === user.id) });
    }
    if (method === 'POST' && ['/api/ai/chat', '/api/ai/chat/stream'].includes(path)) {
      const user = await current(req);
      const value = await readJson(req);
      if (typeof value.question !== 'string' || !value.question.trim() || value.question.length > 1000 || !Number.isSafeInteger(value.documentId)) fail(400, 'VALIDATION_ERROR', 'documentId와 1~1000자 질문을 보내세요.');
      const document = await needDocument(value.documentId, user);
      const controller = new AbortController();
      res.on('close', () => controller.abort());
      const stream = path.endsWith('/stream');
      let text = '', sources = [], mock = false;
      try {
        for await (const event of ai(user, document, value.question, controller.signal)) {
          if (stream) {
            if (!res.headersSent) res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' });
            res.write(`data: ${JSON.stringify(event)}\n\n`);
          } else { text += event.text || ''; if (event.sources) sources = event.sources; if ('mock' in event) mock = event.mock; }
        }
        return stream ? res.end() : send(res, 200, { data: { text, sources, mock } });
      } catch (error) {
        if (stream && res.headersSent) { if (!res.destroyed) res.end(`data: ${JSON.stringify({ error: { code: 'AI_UNAVAILABLE', message: 'AI 응답이 중단되었습니다.' } })}\n\n`); return; }
        if (error.status) throw error;
        fail(502, 'AI_UNAVAILABLE', 'AI 서버 연결에 실패했습니다.');
      }
    }
    if (method === 'GET' && path === '/api/metrics') return send(res, 200, { data: { uptimeSeconds: Math.floor(process.uptime()), memoryBytes: process.memoryUsage().rss } });
    if (['GET', 'HEAD'].includes(method) && !path.startsWith('/api')) return serveStatic(req, res, path);
    fail(404, 'NOT_FOUND', '경로가 없습니다.');
  }
  const server = createServer((req, res) => {
    const start = performance.now();
    const requestId = /^[a-zA-Z0-9-]{1,80}$/.test(req.headers['x-request-id'] || '') ? req.headers['x-request-id'] : randomUUID();
    res.setHeader('X-Request-Id', requestId);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    if (config.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    const execute = async () => {
      try {
        if (req.headers.origin && req.headers.origin !== origin && req.headers.origin !== cors) fail(403, 'FORBIDDEN', '허용하지 않는 출처입니다.');
        if (req.headers.origin) { res.setHeader('Access-Control-Allow-Origin', req.headers.origin); res.setHeader('Vary', 'Origin'); }
        if (req.method === 'OPTIONS') return send(res, 204, undefined, { 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Request-Id' });
        const url = new URL(req.url, origin);
        await route(req, res, url);
      } catch (error) {
        if (!error.status && config.LOG_REQUESTS !== 'false') console.error(JSON.stringify({ requestId, error: error.message }));
        sendError(res, error, requestId);
      }
    };
    res.on('finish', () => { if (config.LOG_REQUESTS !== 'false') console.log(JSON.stringify({ requestId, method: req.method, path: req.url.split('?')[0], status: res.statusCode, ms: Math.round(performance.now() - start) })); });
    // 단일 인스턴스에서 사용자 중복 등록과 quota 경쟁을 막는 직렬 쓰기 큐다.
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) writes = writes.then(execute, execute);
    else void execute();
  });
  server.requestTimeout = 120000;
  const realtime = attachRealtime(server, origin);
  return { server, close: async () => { realtime.close(); await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); await writes; await repo.close(); } };
}
