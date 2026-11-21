import { api, json, setToken } from './api.js';
import { bindForm } from './forms.js';
import { createStore } from './store.js';
import { readSSE } from './sse.js';
import { subscribePosts } from './realtime.js';

const $ = id => document.getElementById(id);
const state = createStore({ user: null, editing: null });
const message = text => { $('message').textContent = text; };
const report = error => message(`${error.status || ''} ${error.message} ${Object.keys(error.fields || {}).join(', ')}`);
const run = fn => async () => { try { await fn(); } catch (error) { report(error); } };
const node = (tag, text) => { const element = document.createElement(tag); element.textContent = text; return element; };
state.subscribe(value => { $('identity').textContent = value.user ? `${value.user.nickname}님 로그인 중` : '로그인 전'; });

// 데이터는 textContent로만 출력하여 HTML/XSS로 해석하지 않는다.
async function list() {
  const query = new URLSearchParams(location.search);
  query.set('limit', '5');
  const { data, meta } = await api(`/posts?${query}`);
  $('q').value = meta.q;
  $('posts').replaceChildren(...data.map(post => {
    const card = node('article', '');
    const link = node('a', post.title);
    link.href = `#/posts/${post.id}`;
    card.append(link, node('p', `${post.author.nickname} · 댓글 ${post.commentCount}`));
    return card;
  }));
  $('page').textContent = `${meta.page} / ${Math.max(1, meta.totalPages)} · 총 ${meta.total}개`;
  $('previous').disabled = meta.page <= 1;
  $('next').disabled = meta.page >= meta.totalPages;
}
async function detail(id) {
  const { data: post } = await api(`/posts/${id}`);
  const content = $('post-detail');
  content.replaceChildren(node('h3', post.title), node('p', post.body), node('p', post.tags.join(', ')));
  if (state.get().user?.id === post.author.id) {
    const edit = node('button', '수정');
    edit.addEventListener('click', () => { state.set({ editing: post.id }); $('title').value = post.title; $('body').value = post.body; $('tags').value = post.tags.join(', '); $('title').focus(); });
    const remove = node('button', '삭제');
    remove.addEventListener('click', run(async () => { await api(`/posts/${id}`, json('DELETE')); location.hash = '#/'; await list(); message('삭제했습니다.'); }));
    content.append(edit, remove);
  }
  const { data: comments } = await api(`/posts/${id}/comments`);
  $('comments').replaceChildren(...comments.map(comment => {
    const li = node('li', `${comment.author.nickname}: ${comment.body}`);
    if (state.get().user?.id === comment.author.id) {
      const remove = node('button', '댓글 삭제');
      remove.addEventListener('click', run(async () => { await api(`/comments/${comment.id}`, json('DELETE')); await detail(id); }));
      li.append(remove);
    }
    return li;
  }));
}
async function documents() {
  const { data } = await api('/documents');
  $('document-id').replaceChildren(...data.map(doc => { const option = node('option', doc.filename); option.value = doc.id; return option; }));
}
async function route() {
  const hash = location.hash || '#/';
  const match = hash.match(/^#\/posts\/([1-9]\d*)$/);
  $('board').hidden = hash === '#/documents';
  $('documents').hidden = hash !== '#/documents';
  $('detail').hidden = !match;
  if (match) await detail(match[1]);
  else if (hash === '#/documents') { if (state.get().user) await documents(); }
  else if (hash !== '#/') message('404 · 화면 경로를 확인하세요.');
  if (!$('board').hidden) await list();
}
bindForm($('auth-form'), async (data, action) => {
  if (action === 'signup') { await api('/auth/signup', json('POST', data)); message('가입했습니다. 로그인하세요.'); return; }
  const { data: result } = await api('/auth/login', json('POST', { email: data.email, password: data.password }));
  setToken(result.accessToken);
  state.set({ user: result.user });
  $('password').value = '';
  message('로그인했습니다.');
  await route();
}, report);
$('logout').addEventListener('click', run(async () => { await api('/auth/logout', json('POST')); setToken(''); state.set({ user: null }); $('answer').textContent = ''; $('document-id').replaceChildren(); $('history-list').replaceChildren(); message('로그아웃했습니다.'); await route(); }));
bindForm($('search-form'), async data => { const query = new URLSearchParams({ q: data.q, page: '1' }); history.replaceState(null, '', `?${query}#/`); await route(); }, report);
for (const [id, delta] of [['previous', -1], ['next', 1]]) $(id).addEventListener('click', run(async () => { const query = new URLSearchParams(location.search); query.set('page', Math.max(1, (Number(query.get('page')) || 1) + delta)); history.replaceState(null, '', `?${query}#/`); await route(); }));
bindForm($('post-form'), async data => {
  const editing = state.get().editing;
  const value = { ...data, tags: data.tags.split(',').map(s => s.trim()).filter(Boolean) };
  const { data: post } = await api(editing ? `/posts/${editing}` : '/posts', json(editing ? 'PATCH' : 'POST', value));
  state.set({ editing: null }); $('post-form').reset(); location.hash = `#/posts/${post.id}`;
  await route(); message(editing ? '수정했습니다.' : '작성했습니다.');
}, report);
$('cancel-edit').addEventListener('click', () => { state.set({ editing: null }); $('post-form').reset(); });
bindForm($('comment-form'), async data => { const id = location.hash.split('/').pop(); await api(`/posts/${id}/comments`, json('POST', data)); $('comment-form').reset(); await detail(id); }, report);
bindForm($('upload-form'), async () => {
  const worker = new Worker(new URL('./file-worker.js', import.meta.url), { type: 'module' });
  try {
    const value = await new Promise((resolve, reject) => { worker.onmessage = ({ data }) => data.error ? reject(new Error(data.error)) : resolve(data); worker.onerror = reject; worker.postMessage($('file').files[0]); });
    const { data } = await api('/documents', json('POST', value));
    await documents(); $('document-id').value = data.id; message('문서를 저장했습니다.');
  } finally { worker.terminate(); }
}, report);
let controller;
bindForm($('question-form'), async data => {
  controller = new AbortController(); $('answer').textContent = ''; $('sources').replaceChildren();
  const response = await api('/ai/chat/stream', { ...json('POST', { question: data.question, documentId: Number($('document-id').value) }), raw: true, signal: controller.signal });
  await readSSE(response, event => {
    if (event.text) $('answer').textContent += event.text;
    if (event.sources) $('sources').replaceChildren(...event.sources.map(s => node('li', `(발췌 ${s.index}) ${s.text}`)));
    if ('mock' in event) message(event.mock ? '모의 응답 · 실제 모델 생성이 아닙니다.' : '모델 응답 수신 중');
    if (event.done) message('응답이 완료되었습니다.');
  });
}, report);
$('stop').addEventListener('click', () => controller?.abort());
$('history').addEventListener('click', run(async () => { const { data } = await api(`/documents/${$('document-id').value}/questions`); $('history-list').replaceChildren(...data.map(row => node('li', `${row.question} → ${row.answer}`))); }));
$('mail').addEventListener('click', run(async () => { const { data } = await api('/mail', json('POST')); message(data.mock ? '모의 메일 작업 접수' : '메일 작업 접수'); }));
$('jobs').addEventListener('click', run(async () => { const { data } = await api('/jobs'); $('job-output').textContent = JSON.stringify(data, null, 2); }));
$('checkout').addEventListener('click', run(async () => { const { data } = await api('/checkout', json('POST')); if (data.url && new URL(data.url).hostname === 'checkout.stripe.com') location.assign(data.url); else { $('notice-text').textContent = data.message || '결제 URL을 확인하세요.'; $('notice').showModal(); } }));
$('close-notice').addEventListener('click', () => $('notice').close());
$('oauth').addEventListener('click', run(async () => { const { data } = await api('/auth/github'); if (data.url) location.assign(data.url); else message(data.message); }));
function theme(value) { document.documentElement.dataset.theme = value; $('theme').setAttribute('aria-pressed', String(value === 'dark')); }
try { theme(localStorage.getItem('workbook-theme') || 'light'); } catch { theme('light'); }
$('theme').addEventListener('click', () => { const value = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; theme(value); try { localStorage.setItem('workbook-theme', value); } catch { message('테마 저장이 차단되었습니다.'); } });
window.addEventListener('hashchange', run(route));
window.addEventListener('popstate', run(route));
subscribePosts(() => { if (!$('board').hidden) void list().catch(report); });
if (location.hash.startsWith('#oauth=')) {
  setToken(location.hash.slice(7)); history.replaceState(null, '', location.pathname);
  api('/auth/me').then(({ data }) => { state.set({ user: data }); return route(); }).catch(report);
} else void route().catch(report);
