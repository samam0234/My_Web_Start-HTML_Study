import { createRepository } from './repository.js';
import { createApp } from './app.js';

// .env는 Node의 --env-file-if-exists가 읽고 브라우저에는 전달하지 않는다.
const repo = await createRepository();
const app = createApp(repo);
const port = Number(process.env.PORT || 3000);
app.server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`학습 서버: http://localhost:${port}/workbook/`));
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
  if (stopping) return;
  stopping = true;
  await app.close();
});
