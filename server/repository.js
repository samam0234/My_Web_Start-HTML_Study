import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// 도메인 객체를 records 테이블에 보관하는 작은 Data Mapper다.
// kind는 users/posts/comments/documents/usage/jobs, payload는 JSON이다.
export async function createRepository(config = process.env) {
  const driver = config.DB_DRIVER || 'sqlite';
  let insert, select, update, remove, close;
  if (driver === 'sqlite') {
    const path = config.SQLITE_PATH || 'data/study.sqlite';
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    const db = new DatabaseSync(path);
    db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS records (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, payload TEXT NOT NULL); CREATE INDEX IF NOT EXISTS records_kind ON records(kind);');
    insert = async (kind, payload) => Number(db.prepare('INSERT INTO records(kind,payload) VALUES(?,?)').run(kind, payload).lastInsertRowid);
    select = async kind => db.prepare('SELECT id,payload FROM records WHERE kind=?').all(kind);
    update = async (kind, id, payload) => db.prepare('UPDATE records SET payload=? WHERE kind=? AND id=?').run(payload, kind, id);
    remove = async (kind, id) => db.prepare('DELETE FROM records WHERE kind=? AND id=?').run(kind, id);
    close = async () => db.close();
  } else if (driver === 'postgres') {
    const { Pool } = await import('pg');
    const db = new Pool({ connectionString: config.DATABASE_URL });
    await db.query('CREATE TABLE IF NOT EXISTS records (id BIGSERIAL PRIMARY KEY, kind VARCHAR(32) NOT NULL, payload TEXT NOT NULL)');
    await db.query('CREATE INDEX IF NOT EXISTS records_kind ON records(kind)');
    insert = async (kind, payload) => Number((await db.query('INSERT INTO records(kind,payload) VALUES($1,$2) RETURNING id', [kind, payload])).rows[0].id);
    select = async kind => (await db.query('SELECT id,payload FROM records WHERE kind=$1', [kind])).rows;
    update = async (kind, id, payload) => db.query('UPDATE records SET payload=$1 WHERE kind=$2 AND id=$3', [payload, kind, id]);
    remove = async (kind, id) => db.query('DELETE FROM records WHERE kind=$1 AND id=$2', [kind, id]);
    close = () => db.end();
  } else if (driver === 'mariadb') {
    const { default: mariadb } = await import('mariadb');
    const url = new URL(config.DATABASE_URL);
    const db = mariadb.createPool({ host: url.hostname, port: Number(url.port || 3306), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: url.pathname.slice(1), connectionLimit: 4 });
    await db.query('CREATE TABLE IF NOT EXISTS records (id BIGINT AUTO_INCREMENT PRIMARY KEY, kind VARCHAR(32) NOT NULL, payload LONGTEXT NOT NULL, INDEX records_kind(kind))');
    insert = async (kind, payload) => Number((await db.query('INSERT INTO records(kind,payload) VALUES(?,?)', [kind, payload])).insertId);
    select = kind => db.query('SELECT id,payload FROM records WHERE kind=?', [kind]);
    update = (kind, id, payload) => db.query('UPDATE records SET payload=? WHERE kind=? AND id=?', [payload, kind, id]);
    remove = (kind, id) => db.query('DELETE FROM records WHERE kind=? AND id=?', [kind, id]);
    close = () => db.end();
  } else if (driver === 'mongodb') {
    const { MongoClient } = await import('mongodb');
    const client = await new MongoClient(config.DATABASE_URL).connect();
    const db = client.db();
    const rows = db.collection('records');
    await rows.createIndex({ kind: 1, id: 1 }, { unique: true });
    insert = async (kind, payload) => {
      const counter = await db.collection('counters').findOneAndUpdate({ _id: 'records' }, { $inc: { value: 1 } }, { upsert: true, returnDocument: 'after' });
      await rows.insertOne({ kind, id: counter.value, payload });
      return counter.value;
    };
    select = kind => rows.find({ kind }).toArray();
    update = (kind, id, payload) => rows.updateOne({ kind, id }, { $set: { payload } });
    remove = (kind, id) => rows.deleteOne({ kind, id });
    close = () => client.close();
  } else throw new Error('지원하지 않는 DB_DRIVER');
  // 외부 API에는 저장 엔진이나 드라이버 객체를 노출하지 않는다.
  const repo = {
    list: async kind => (await select(kind)).map(row => ({ ...JSON.parse(row.payload), id: Number(row.id) })),
    get: async (kind, id) => (await repo.list(kind)).find(row => row.id === id),
    create: async (kind, value) => ({ ...value, id: await insert(kind, JSON.stringify(value)) }),
    put: async (kind, id, value) => { await update(kind, id, JSON.stringify(value)); return { ...value, id }; },
    delete: remove,
    close,
  };
  return repo;
}
