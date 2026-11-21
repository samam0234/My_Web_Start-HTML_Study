import { WebSocketServer } from 'ws';

// 공개 게시판의 변경 알림만 전달한다. 비공개 본문/사용자 정보는 전송하지 않는다.
export function attachRealtime(server, origin) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 });
  server.on('upgrade', (req, socket, head) => {
    if (req.url !== '/ws' || req.headers.origin !== origin || wss.clients.size >= 100) return socket.destroy();
    wss.handleUpgrade(req, socket, head, ws => {
      wss.emit('connection', ws, req);
      ws.on('error', () => ws.terminate());
      ws.on('message', () => ws.close(1008, '서버 알림 전용입니다.'));
    });
  });
  const timer = setInterval(() => {
    for (const client of wss.clients) {
      if (client.isAlive === false) { client.terminate(); continue; }
      client.isAlive = false;
      client.ping();
    }
  }, 30000);
  timer.unref();
  wss.on('connection', client => { client.isAlive = true; client.on('pong', () => { client.isAlive = true; }); });
  return {
    notify: id => { for (const client of wss.clients) if (client.readyState === 1) client.send(JSON.stringify({ type: 'posts.changed', id })); },
    close: () => { clearInterval(timer); for (const client of wss.clients) client.terminate(); wss.close(); },
  };
}
