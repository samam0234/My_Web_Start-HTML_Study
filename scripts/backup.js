import { backup, DatabaseSync } from 'node:sqlite';
import { mkdir } from 'node:fs/promises';

if ((process.env.DB_DRIVER || 'sqlite') !== 'sqlite') throw new Error('외부 DB는 전용 백업 명령을 사용하세요.');
await mkdir('backups', { recursive: true });
const db = new DatabaseSync(process.env.SQLITE_PATH || 'data/study.sqlite');
const path = `backups/study-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`;
try { await backup(db, path); console.log(`백업: ${path}`); }
finally { db.close(); }
