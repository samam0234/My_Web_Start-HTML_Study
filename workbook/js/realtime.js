// 브라우저와 같은 호스트를 사용하므로 HTTPS이면 WSS를 선택한다.
export function subscribePosts(onChange) {
  let stopped = false, socket, timer;
  function connect() {
    socket = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`);
    socket.addEventListener('message', event => {
      try { if (JSON.parse(event.data).type === 'posts.changed') onChange(); } catch { /* 잘못된 알림은 무시 */ }
    });
    socket.addEventListener('close', () => { if (!stopped) timer = setTimeout(connect, 3000); });
  }
  connect();
  return () => { stopped = true; clearTimeout(timer); socket.close(); };
}
