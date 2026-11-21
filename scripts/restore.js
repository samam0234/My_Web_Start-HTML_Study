import { DatabaseSync } from 'node:sqlite';
import { copyFile, mkdir, access, constants } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

// 실행 중인 DB에 덮어쓰지 않는다. 새 경로로 복원하고 환경변수를 바꾼다.
const source = process.argv[2];
const target = process.argv[3];
if (!source || !target || resolve(source) === resolve(target)) throw new Error('사용법: npm run restore -- backups/원본.sqlite data/복원.sqlite');
try { await access(target); throw new Error('대상 파일이 이미 있습니다. 새 경로를 사용하세요.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const db = new DatabaseSync(source, { readOnly: true });
try { if (db.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') throw new Error('백업 파일 무결성 실패'); }
finally { db.close(); }
await mkdir(dirname(target), { recursive: true });
await copyFile(source, target, constants.COPYFILE_EXCL);
console.log(`복원 완료: SQLITE_PATH=${target} 로 변경한 뒤 서버를 재시작하세요.`);
