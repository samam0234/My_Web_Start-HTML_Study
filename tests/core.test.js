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
