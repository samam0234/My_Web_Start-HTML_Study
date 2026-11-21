import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { createRepository } from '../server/repository.js';
import { createSQLite } from '../server/sqlite.js';
import { createAI } from '../server/ai.js';
import { createApp } from '../server/app.js';
import { createBasicApp } from '../server/basic.js';

test('설치된 AI SDK가 호환 모델 HTTP 스트림과 사용량을 실제 해독한다', async () => {
  let request;
  const model = createServer(async (req, res) => {
    const chunks = [];
    for await (const part of req) chunks.push(part);
    request = JSON.parse(Buffer.concat(chunks).toString());
    assert.equal(req.url, '/v1/chat/completions');
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    for (const content of ['HTML은 ', '구조다. (발췌 1)']) res.write(`data: ${JSON.stringify({ id: 'test', object: 'chat.completion.chunk', created: 1, model: 'fixture-model', choices: [{ index: 0, delta: { content }, finish_reason: null }] })}\n\n`);
    res.write(`data: ${JSON.stringify({ id: 'test', object: 'chat.completion.chunk', created: 1, model: 'fixture-model', choices: [{ index: 0, delta: {}, finish_reason: 'stop' }], usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 } })}\n\n`);
    res.end('data: [DONE]\n\n');
  });
  model.listen(0, '127.0.0.1'); await once(model, 'listening');
  const repo = await createRepository({ SQLITE_PATH: ':memory:' });
  try {
    const ai = createAI({ AI_PROVIDER: 'compatible', AI_BASE_URL: `http://127.0.0.1:${model.address().port}/v1`, AI_MODEL: 'fixture-model' }, repo);
    const events = [];
    for await (const event of ai({ id: 1 }, { id: 2, text: 'HTML은 구조다.' }, 'HTML', new AbortController().signal)) events.push(event);
    assert.equal(events[0].mock, false);
    assert.equal(events.filter(e => e.text).map(e => e.text).join(''), 'HTML은 구조다. (발췌 1)');
    assert.equal(request.model, 'fixture-model'); assert.equal(request.stream, true);
    assert.equal((await repo.list('usage'))[0].tokens.totalTokens, 30);
    assert.equal(events.at(-1).done, true);
  } finally { model.closeAllConnections(); await new Promise(resolve => model.close(resolve)); await repo.close(); }
});
test('MCP initialize → tools/list → tools/call → 기존 게시판 HTTP API', async () => {
  const app = createApp(await createRepository({ SQLITE_PATH: ':memory:' }), { LOG_REQUESTS: 'false' });
  app.server.listen(0, '127.0.0.1'); await once(app.server, 'listening');
  const client = new Client({ name: 'test', version: '1.0.0' });
  const transport = new StdioClientTransport({ command: process.execPath, args: ['mcp/server.js'], env: { ...process.env, MCP_API_BASE: `http://127.0.0.1:${app.server.address().port}` } });
  try {
    await client.connect(transport);
    assert.equal((await client.listTools()).tools[0].name, 'search_posts');
    const result = await client.callTool({ name: 'search_posts', arguments: { q: '', limit: 5 } });
    assert.equal(JSON.parse(result.content[0].text).meta.total, 0);
    assert.equal(result.isError, undefined);
  } finally { await client.close(); await app.close(); }
});
test('중간 프로젝트는 심화 모듈 없이 별도 기초 서버로 실행된다', async () => {
  const app = createBasicApp(createSQLite(':memory:'));
  app.server.listen(0, '127.0.0.1'); await once(app.server, 'listening');
  const base = `http://127.0.0.1:${app.server.address().port}`;
  try {
    assert.equal((await fetch(`${base}/midpoint/`)).status, 200);
    const headers = { 'Content-Type': 'application/json' };
    const account = { email: 'basic@example.com', password: 'basic-password-123', nickname: '기초' };
    assert.equal((await fetch(`${base}/api/auth/signup`, { method: 'POST', headers, body: JSON.stringify(account) })).status, 201);
    const login = await (await fetch(`${base}/api/auth/login`, { method: 'POST', headers, body: JSON.stringify({ email: account.email, password: account.password }) })).json();
    headers.Authorization = `Bearer ${login.data.accessToken}`;
    const post = await (await fetch(`${base}/api/posts`, { method: 'POST', headers, body: JSON.stringify({ title: '중간', body: '게시판' }) })).json();
    assert.equal(post.data.title, '중간');
    assert.equal((await fetch(`${base}/api/posts/${post.data.id}`, { method: 'DELETE', headers })).status, 204);
    assert.equal((await fetch(`${base}/api/ai/chat`, { method: 'POST', headers, body: '{}' })).status, 404);
  } finally { await app.close(); }
});
