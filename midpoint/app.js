// 배열/객체·함수·DOM·fetch·폼·해시 라우팅만으로 만든 기초 프로젝트다.
const $ = id => document.getElementById(id);
let token = '', selected = null, editing = null, page = 1, q = '';
const show = text => { $('message').textContent = text; };
async function api(path, method = 'GET', value) {
  const response = await fetch(`/api${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(value ? { body: JSON.stringify(value) } : {}) });
  const result = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(result.error.message);
  return result;
}
function form(id, callback) {
  $(id).addEventListener('submit', async event => {
    event.preventDefault();
    if ($(id).dataset.busy) return;
    $(id).dataset.busy = 'true';
    try { await callback(Object.fromEntries(new FormData($(id))), event.submitter?.value); }
    catch (error) { show(error.message); }
    finally { delete $(id).dataset.busy; }
  });
}
async function list() {
  const { data, meta } = await api(`/posts?${new URLSearchParams({ q, page: String(page), limit: '5' })}`);
  $('list').replaceChildren(...data.map(post => {
    const li = document.createElement('li'), link = document.createElement('a');
    link.href = `#/posts/${post.id}`; link.textContent = post.title; li.append(link); return li;
  }));
  $('page').textContent = `${meta.page} / ${Math.max(1, meta.totalPages)}`;
  $('previous').disabled = page <= 1; $('next').disabled = page >= meta.totalPages;
}
async function detail() {
  const match = location.hash.match(/^#\/posts\/(\d+)$/);
  selected = match ? (await api(`/posts/${match[1]}`)).data : null;
  $('detail').textContent = selected ? `${selected.title}\n${selected.body}` : '목록에서 글을 선택하세요.';
}
form('account', async (data, action) => {
  if (action === 'signup') { await api('/auth/signup', 'POST', data); show('가입 완료. 로그인하세요.'); return; }
  const { data: result } = await api('/auth/login', 'POST', { email: data.email, password: data.password });
  token = result.accessToken; $('password').value = ''; show(`${result.user.nickname}님 로그인 중`);
});
form('search', async data => { q = data.q; page = 1; await list(); });
form('editor', async data => { const { data: post } = await api(editing ? `/posts/${editing}` : '/posts', editing ? 'PATCH' : 'POST', data); editing = null; $('editor').reset(); location.hash = `#/posts/${post.id}`; await list(); await detail(); show('저장했습니다.'); });
for (const [id, delta] of [['previous', -1], ['next', 1]]) $(id).onclick = async () => { page += delta; try { await list(); } catch (error) { show(error.message); } };
$('edit').onclick = () => { if (selected) { editing = selected.id; $('title').value = selected.title; $('body').value = selected.body; } };
$('cancel').onclick = () => { editing = null; $('editor').reset(); };
$('delete').onclick = async () => { if (!selected) return; try { await api(`/posts/${selected.id}`, 'DELETE'); selected = null; location.hash = '#/'; await list(); await detail(); show('삭제했습니다.'); } catch (error) { show(error.message); } };
$('logout').onclick = async () => { try { await api('/auth/logout', 'POST'); token = ''; show('로그아웃했습니다.'); } catch (error) { show(error.message); } };
window.addEventListener('hashchange', () => void detail().catch(error => show(error.message)));
await list().catch(error => show(error.message));
await detail().catch(error => show(error.message));
