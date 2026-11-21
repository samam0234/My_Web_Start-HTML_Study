import { createRepository } from '../server/repository.js';

// Docker DB 컨테이너가 준비된 뒤 실행하는 실제 드라이버 계약 검사다.
for (const [driver, url] of [['postgres', 'postgresql://study:study@localhost:5432/study'], ['mariadb', 'mariadb://study:study@localhost:3306/study'], ['mongodb', 'mongodb://localhost:27017/study']]) {
  const repo = await createRepository({ DB_DRIVER: driver, DATABASE_URL: url });
  try {
    const created = await repo.create('checks', { message: '연결 검사' });
    if ((await repo.get('checks', created.id)).message !== '연결 검사') throw new Error(`${driver}: 조회 실패`);
    await repo.put('checks', created.id, { message: '수정' });
    if ((await repo.get('checks', created.id)).message !== '수정') throw new Error(`${driver}: 수정 실패`);
    await repo.delete('checks', created.id);
    if (await repo.get('checks', created.id)) throw new Error(`${driver}: 삭제 실패`);
    console.log(`${driver}: CRUD 통과`);
  } finally { await repo.close(); }
}
