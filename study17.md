# study17 · HTML·CSS·JavaScript — 실시간 알림·파일 처리·확장

## ① 목표 한 줄

WebSocket 공개 변경 알림과 Worker 파일 검사를 화면에 붙인다.

## ② 📖 이론

WebSocket은 연결을 유지하며 양방향 메시지를 주고받는 통로다. 이 실습은 공개 게시글의 변경 id만 서버에서 브라우저로 보낸다. 비공개 문서·토큰·메일 주소는 전달하지 않는다. 메시지를 받으면 목록을 다시 읽어 API를 진실의 원천으로 삼는다.

서버는 /ws 경로와 Origin을 검사하고 연결 수·메시지 크기를 제한한다. 클라이언트가 보내는 임의 메시지는 거절한다. ping/pong으로 끊어진 연결을 정리하고 브라우저는 3초 뒤 재연결한다. 여러 서버 인스턴스로 늘리면 인스턴스 사이 알림은 Redis 같은 pub/sub로 공유해야 한다.

Web Worker는 별도 실행 맥락에서 파일을 해독·검사한다. DOM은 직접 만지지 않고 postMessage로 파일 정보와 텍스트를 돌려준다. Worker 종료를 finally에서 수행해 자원을 정리한다. 허용 확장자는 콘텐츠 안전 보장의 전부가 아니므로 서버에서도 다시 입력을 검사하고 텍스트로 출력한다.

WebSocket과 SSE는 목적이 다르다. 게시글 변경 통지는 WebSocket으로, POST와 인증 헤더가 필요한 모델 응답은 fetch+SSE로 받는다. HTTPS 페이지는 wss를 사용하여 혼합 콘텐츠를 피한다.

### 비유로 이해하기

일반 요청이 전화 한 통이라면 WebSocket은 계속 열린 통화이고 Worker는 별도 작업실이다.

## ③ 🛠️ 실기: 전체 코드와 줄별 설명

1. 같은 게시판을 탭 두 개로 열고 한쪽에서 글을 작성한다.
2. 다른 탭의 목록이 알림 후 갱신되는지 확인한다.
3. Network → WS에서 posts.changed 메시지와 id만 전달되는지 본다.
4. 서버를 재시작해 재연결을 확인한다.
5. UTF-8 TXT·MD와 잘못된 인코딩·큰 파일을 업로드한다.

### `server/realtime.js` 전체 코드

```javascript
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
```

원본: [server/realtime.js](server/realtime.js) · SHA-256(LF 정규화): `db48354a3e9d8d1ff9b771192c0cf2d380e0ad7f23ef38586801a9230b9d0b69`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 3 | 공개 게시판의 변경 알림만 전달한다. 비공개 본문/사용자 정보는 전송하지 않는다. |
| 4 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 5 | `wss`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 6 | 사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다. |
| 7 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (req.url !== '/ws' // req.headers.origin !== origin // wss.clients.size >= 100) return socket.destroy(); |
| 8 | 현재 처리의 설정·호출·상태를 연결한다: `wss.handleUpgrade(req, socket, head, ws => {` |
| 9 | 현재 처리의 설정·호출·상태를 연결한다: `wss.emit('connection', ws, req);` |
| 10 | 사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다. |
| 11 | 사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다. |
| 12 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 13 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 14 | `timer`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 15 | 목록 또는 스트림의 각 항목을 반복 처리한다. |
| 16 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (client.isAlive === false) { client.terminate(); continue; } |
| 17 | 현재 처리의 설정·호출·상태를 연결한다: `client.isAlive = false;` |
| 18 | 현재 처리의 설정·호출·상태를 연결한다: `client.ping();` |
| 19 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 20 | 현재 처리의 설정·호출·상태를 연결한다: `}, 30000);` |
| 21 | 현재 처리의 설정·호출·상태를 연결한다: `timer.unref();` |
| 22 | 사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다. |
| 23 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 24 | HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 25 | 현재 처리의 설정·호출·상태를 연결한다: `close: () => { clearInterval(timer); for (const client of wss.clients) client.terminate(); wss.close(); },` |
| 26 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 27 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `workbook/js/realtime.js` 전체 코드

```javascript
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
```

원본: [workbook/js/realtime.js](workbook/js/realtime.js) · SHA-256(LF 정규화): `96b01fce47feeca6fe0392af20ca54402c0c37a24758bc82a9a5c6339be3ae5c`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 브라우저와 같은 호스트를 사용하므로 HTTPS이면 WSS를 선택한다. |
| 2 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 3 | `stopped`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 4 | 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 5 | 현재 처리의 설정·호출·상태를 연결한다: `socket = new WebSocket(${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws);` |
| 6 | 사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다. |
| 7 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 8 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 9 | 사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다. |
| 10 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 11 | 현재 처리의 설정·호출·상태를 연결한다: `connect();` |
| 12 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 13 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `workbook/js/file-worker.js` 전체 코드

```javascript
// 큰 파일의 검사/해독을 메인 UI 스레드에서 분리한다.
self.onmessage = async ({ data: file }) => {
  try {
    if (!/\.(txt|md)$/i.test(file.name) || file.size > 60000) throw new Error('TXT·MD 60KB 이하만 허용합니다.');
    const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
    if (!text.trim() || text.length > 20000) throw new Error('문서는 1~20000자여야 합니다.');
    self.postMessage({ filename: file.name, text });
  } catch (error) { self.postMessage({ error: error.message }); }
};
```

원본: [workbook/js/file-worker.js](workbook/js/file-worker.js) · SHA-256(LF 정규화): `cb87200440f7172eee4c4510f70d68f38f9e2c20da388ee46eea43ba7af07c6f`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 큰 파일의 검사/해독을 메인 UI 스레드에서 분리한다. |
| 2 | 현재 처리의 설정·호출·상태를 연결한다: `self.onmessage = async ({ data: file }) => {` |
| 3 | 현재 처리의 설정·호출·상태를 연결한다: `try {` |
| 4 | 독립적으로 재현할 동작과 기대 결과를 하나의 테스트로 등록한다. |
| 5 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer()); |
| 6 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!text.trim() // text.length > 20000) throw new Error('문서는 1~20000자여야 합니다.'); |
| 7 | 현재 처리의 설정·호출·상태를 연결한다: `self.postMessage({ filename: file.name, text });` |
| 8 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 9 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


## ④ 🔗 연동 포인트

DB 변경 완료 → realtime.notify → WebSocket 이벤트 → 기존 목록 GET → DOM 갱신이다. Worker의 파일 텍스트는 /api/documents로 보내고 다음 단계 AI 질의의 근거로 쓴다.

## ⑤ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| HTTPS에서 WS 실패 | ws:// 하드코딩 | location.protocol에 맞춰 wss 선택 |
| 연결 후 알림 없음 | upgrade 콜백에서 connection 초기화 누락 | connection 이벤트와 clients 등록 확인 |
| Worker는 통과했는데 서버 거절 | 서버 한도·문자수·스키마 불일치 | 서버 기준 오류를 표시하고 파일 크기 조정 |

## ⑥ 직접 해보기

1. 다른 출처의 WebSocket 연결이 거절되는지 확인한다.
2. 탭을 닫고 서버 연결이 정리되는지 관찰한다.
3. 파일 확장자만 바꾼 비 UTF-8 데이터를 보내 오류를 확인한다.

## ⑦ ☐ 체크리스트

학습자 수행 확인용이다. 문서·코드 작성 완료와 본인의 실습 완료는 다르므로 직접 확인한 뒤 체크한다. 원문 항목 배치는 [반영표](docs/coverage.md)를 따른다.

- [ ] WebSocket 공개 알림·Origin·크기·연결 수·정리를 확인한다
- [ ] 두 탭의 글 변경 알림을 확인한다
- [ ] Worker 입력·응답·종료와 서버 재검증을 연결한다

## ⑧ 다음 단계 연결

[study18.md](study18.md)에서 AI API·프롬프트·스트리밍·MCP로 이어간다.

출처: [지정 노션](https://app.notion.com/p/3d6d7dec5e2e8147b212f0a23b93dfc1) · [공통 API v1](https://app.notion.com/p/3d6d7dec5e2e8139adbfd36dd506c65e) · [반영표](docs/coverage.md) · [검증 기록](docs/verification.md). 기술 근거: [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [Node 24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html). 설치 버전 API는 package-lock.json과 node_modules의 버전별 공식 문서를 기준으로 확인한다.
