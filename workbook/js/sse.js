// TCP 청크와 SSE 이벤트 경계가 다를 수 있으므로 미완성 프레임을 보관한다.
export async function readSSE(response, onEvent) {
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '', finished = false;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      let boundary;
      while ((boundary = buffer.indexOf('\n\n')) >= 0) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const data = frame.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
        if (!data) continue;
        const event = JSON.parse(data);
        if (event.error) throw new Error(event.error.message);
        if (event.done) finished = true;
        onEvent(event);
      }
    }
    if (!finished) throw new Error('응답이 완료되기 전에 연결이 종료되었습니다.');
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
