import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// 기초 구간에서 사용할 SQLite 전용 저장소다. 심화 드라이버를 불러오지 않는다.
export function createSQLite(path = 'data/study.sqlite') {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS records (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, payload TEXT NOT NULL); CREATE INDEX IF NOT EXISTS records_kind ON records(kind);');
  const repo = {
    list: async kind => db.prepare('SELECT id,payload FROM records WHERE kind=?').all(kind).map(row => ({ ...JSON.parse(row.payload), id: Number(row.id) })),
    get: async (kind, id) => (await repo.list(kind)).find(row => row.id === id),
    create: async (kind, value) => ({ ...value, id: Number(db.prepare('INSERT INTO records(kind,payload) VALUES(?,?)').run(kind, JSON.stringify(value)).lastInsertRowid) }),
    put: async (kind, id, value) => { db.prepare('UPDATE records SET payload=? WHERE kind=? AND id=?').run(JSON.stringify(value), kind, id); return { ...value, id }; },
    delete: async (kind, id) => db.prepare('DELETE FROM records WHERE kind=? AND id=?').run(kind, id),
    close: async () => db.close(),
  };
  return repo;
}
