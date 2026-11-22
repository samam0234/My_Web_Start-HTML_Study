import { api, json, setToken } from '../workbook/js/api.js';
import { readSSE } from '../workbook/js/sse.js';
import { createStore } from '../workbook/js/store.js';

// 단계별 설정은 각 app.js에 두고 네트워크·출력·취소 수명만 공유한다.
export function mountLesson(config) {
  const main = document.querySelector('main');
  const title = document.createElement('h1'); title.textContent = config.title;
  const intro = document.createElement('p'); intro.textContent = config.intro;
  const nav = document.createElement('nav');
  const home = document.createElement('a'); home.href = '/lessons/'; home.textContent = '전체 실습 목차';
  nav.append(home);
  const editor = document.createElement('textarea'); editor.id = 'payload'; editor.rows = 10;
  editor.value = JSON.stringify(config.input || {}, null, 2);
  const label = document.createElement('label'); label.htmlFor = editor.id; label.textContent = '요청 JSON (필요한 값을 수정하세요)';
  const output = document.createElement('pre'); output.id = 'output'; output.setAttribute('role', 'status');
  const actions = document.createElement('div'); actions.className = 'actions';
  main.append(nav, title, intro, label, editor, actions, output);
  let selectedId, documentId, socket, controller;
  const buttons = [];
  for (const action of config.actions) {
    const button = document.createElement('button'); button.textContent = action.label; buttons.push(button); actions.append(button);
    button.addEventListener('click', async () => {
      buttons.forEach(b => { b.disabled = true; });
      output.textContent = '실행 중';
      try {
        const input = JSON.parse(editor.value);
        let result;
        if (action.kind === 'state') {
          const store = createStore({ count: 0 });
          store.set({ count: 1 }); result = { state: store.get(), module: '공통 상태 모듈을 호출했습니다.' };
        } else if (action.kind === 'tests') {
          const store = createStore({ count: 0 });
          const values = []; const stop = store.subscribe(value => values.push(value.count));
          store.set({ count: 1 }); stop(); store.set({ count: 2 });
          if (values.join() !== '1') throw new Error('구독 해제 검사 실패');
          const original = store.get(); original.count = 99;
          if (store.get().count !== 2) throw new Error('외부 변이 차단 실패');
          result = { passed: ['구독 전달', '구독 해제', '상태 복제'], requestTests: '전체 HTTP 검사는 npm test로 실행합니다.' };
        } else if (action.kind === 'socket') {
          socket?.close();
          socket = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`);
          socket.onmessage = event => { output.textContent = event.data; };
          socket.onerror = () => { output.textContent = '연결 실패: 심화 서버와 Origin을 확인하세요.'; };
          await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onclose = () => reject(new Error('연결이 닫혔습니다.')); });
          result = { connected: true, next: '다른 탭 /workbook/에서 글을 변경하면 알림이 표시됩니다.' };
        } else if (action.kind === 'health' || action.kind === 'schema' || action.kind === 'cache') {
          const response = await fetch(action.kind === 'schema' ? '/api-docs' : action.kind === 'cache' ? '/workbook/style.css' : '/health');
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          result = action.kind === 'cache' ? { status: response.status, etag: response.headers.get('etag'), cache: response.headers.get('cache-control') } : await response.json();
        } else {
          const path = action.path.replace('{id}', String(selectedId || input.id || '')).replace('{documentId}', String(documentId || input.documentId || ''));
          if (path.includes('//') || path.endsWith('/posts/')) throw new Error('먼저 등록하거나 요청 JSON에 id를 입력하세요.');
          let body;
          if (action.fields) body = Object.fromEntries(action.fields.filter(key => key in input).map(key => [key, input[key]]));
          if (action.stream) {
            controller = new AbortController();
            const response = await api(path, { ...json('POST', { documentId: documentId || input.documentId, question: input.question }), raw: true, signal: controller.signal });
            output.textContent = '';
            await readSSE(response, event => { output.textContent += event.text || (event.sources ? JSON.stringify(event) + '\n' : ''); });
          } else {
            result = await api(path, json(action.method || 'GET', body));
            if (result?.data?.accessToken) setToken(result.data.accessToken);
            if (path === '/auth/logout') setToken('');
            if (path === '/posts' && action.method === 'POST') selectedId = result.data.id;
            if (path === '/documents' && action.method === 'POST') documentId = result.data.id;
            // 원문 토큰은 화면/로그로 출력하지 않는다.
            if (result?.data?.accessToken) result = { data: { user: result.data.user, message: '이 탭 메모리에 로그인 토큰을 보관했습니다.' } };
          }
        }
        if (result !== undefined) output.textContent = JSON.stringify(result, null, 2);
      } catch (error) { output.textContent = `${error.status || ''} ${error.message}`; }
      finally { buttons.forEach(b => { b.disabled = false; }); }
    });
  }
  const stop = document.createElement('button'); stop.textContent = '연결·응답 중단';
  stop.onclick = () => { controller?.abort(); socket?.close(); };
  main.append(stop);
  for (const [text, href] of config.links || []) {
    const p = document.createElement('p'), a = document.createElement('a'); a.textContent = text; a.href = href; p.append(a); main.append(p);
  }
  window.addEventListener('pagehide', () => { controller?.abort(); socket?.close(); }, { once: true });
}
