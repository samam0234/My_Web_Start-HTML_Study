# study11 · HTML·CSS·JavaScript — DB 교체와 ORM 설정

## ① 목표 한 줄

같은 저장소 계약으로 MariaDB·PostgreSQL·MongoDB를 연결하고 ORM 매핑 차이를 읽는다.

## ② 📖 이론

저장소 계약 list/get/create/put/delete가 같으면 화면과 게시판 규칙을 유지한 채 DB 드라이버를 교체할 수 있다. SQL DB는 테이블·정수 PK·매개변수 쿼리, MongoDB는 collection·문서·update 연산자를 사용한다. 이 실습은 외부 API의 숫자 id를 지키기 위해 MongoDB의 별도 counters에서 원자적 증가 값을 받는다.

SQLite의 ?와 MariaDB의 ?는 바인딩 자리고 PostgreSQL은 $1,$2를 쓴다. PostgreSQL은 INSERT RETURNING id, MariaDB는 insertId를 반환한다. BIGINT 값은 Number 안전 범위를 고려해야 한다. 운영 규모에서는 외부 id를 문자열로 바꾸는 새 API 계약도 검토한다.

ORM은 객체/스키마 선언을 DB 질의로 연결한다. 기본 서버는 직접 드라이버를 사용하는 Data Mapper이며 별도 Drizzle 예제가 PostgreSQL records 모델을 선언하고 읽는다. Drizzle의 pgTable/bigserial은 PostgreSQL용이다. MariaDB를 ORM으로 연결하려면 mysqlTable/bigint(autoIncrement)와 drizzle-orm/mysql2·mysql2 드라이버 설정으로 변경한다. MongoDB는 SQL ORM 설정을 그대로 사용할 수 없고 공식 MongoClient 또는 별도 문서 ODM 모델을 쓴다.

DB_DRIVER 변경은 연결 대상 변경이다. 기존 SQLite 자료가 자동 이관되지는 않는다. 이관하려면 서비스 쓰기를 중지하고 종류별 id·참조·payload를 export/import한 뒤 행 수와 참조 무결성을 확인하고 각 DB sequence/counter를 최대 id보다 크게 맞춘다. 복사 전 백업과 읽기 검증이 먼저다.

### 비유로 이해하기

공통 저장소 계약은 같은 규격의 플러그다. 창고를 바꾸어도 주문서 규격을 유지한다.

## ③ 🛠️ 실기: 전체 코드와 줄별 설명

1. Docker Desktop을 실행하고 docker compose --profile databases up -d postgres mariadb mongodb로 로컬 DB를 켠다.
2. 컨테이너가 준비되면 npm run test:databases로 세 드라이버 CRUD를 확인한다.
3. .env의 DB_DRIVER와 DATABASE_URL을 아래 표대로 바꾸고 서버를 재시작한다.
4. 같은 브라우저에서 다시 가입·작성·수정·삭제한다. 데이터는 DB마다 별개다.
5. PostgreSQL을 선택한 뒤 node --env-file=.env lessons/study11/orm.js로 ORM 조회를 실행한다.

| DB_DRIVER | 로컬 DATABASE_URL | ORM/모델 설정 |
|---|---|---|
| sqlite | 미사용, SQLITE_PATH 지정 | 기본 node:sqlite Data Mapper |
| postgres | postgresql://study:study@localhost:5432/study | pgTable + bigserial + drizzle(node-postgres) |
| mariadb | mariadb://study:study@localhost:3306/study | 기본 mariadb 드라이버; ORM 전환 시 mysqlTable + mysql2 |
| mongodb | mongodb://localhost:27017/study | MongoClient records collection + counters; SQL ORM 없음 |

compose의 계정은 루프백 로컬 실습 전용이다. 운영에서는 별도 비밀·TLS·접근 정책을 사용한다. 현재 머신에서 Docker 엔진이 꺼져 있으면 이 단계를 실제 연결 완료로 체크하지 않는다.


공식 기술 근거: [node-postgres 매개변수 질의](https://node-postgres.com/features/queries), [MariaDB Promise API](https://mariadb.com/docs/connectors/mariadb-connector-nodejs/connector-nodejs-promise-api).

### 단계별 실행 위치

`npm run dev` 후 `/lessons/study11/`에서 이 단계의 실습을 연다. [실습 HTML](lessons/study11/index.html)과 [전체 실습 목차](lessons/index.html)를 사용한다. 기초 중간 프로젝트 전체 화면은 `npm run midpoint` 후 `/midpoint/`에서 실행한다. 터미널 전용 DB·Docker·MCP 명령은 해당 문서의 실행 순서를 따른다.

### `server/repository.js` 전체 코드

```javascript
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
```

원본: [server/repository.js](server/repository.js) · SHA-256(LF 정규화): `16062799ad438fc0a227f440977eb6a27bec00247c89a74c2f4bec448a8aed73`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 2 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 3 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 5 | 도메인 객체를 records 테이블에 보관하는 작은 Data Mapper다. |
| 6 | kind는 users/posts/comments/documents/usage/jobs, payload는 JSON이다. |
| 7 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 8 | `driver`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 9 | `insert, select, update, remove, close;`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 10 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (driver === 'sqlite') { |
| 11 | `path`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 12 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true }); |
| 13 | `db`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 14 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 15 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 16 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 17 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 18 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 19 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 20 | 현재 처리의 설정·호출·상태를 연결한다: `} else if (driver === 'postgres') {` |
| 21 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const { Pool } = await import('pg'); |
| 22 | `db`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 23 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 24 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 25 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 26 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 27 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 28 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 29 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 30 | 현재 처리의 설정·호출·상태를 연결한다: `} else if (driver === 'mariadb') {` |
| 31 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const { default: mariadb } = await import('mariadb'); |
| 32 | `url`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 33 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 34 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 35 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 36 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 37 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 38 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 39 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 40 | 현재 처리의 설정·호출·상태를 연결한다: `} else if (driver === 'mongodb') {` |
| 41 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const { MongoClient } = await import('mongodb'); |
| 42 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const client = await new MongoClient(config.DATABASE_URL).connect(); |
| 43 | `db`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 44 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 45 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 46 | 현재 처리의 설정·호출·상태를 연결한다: `insert = async (kind, payload) => {` |
| 47 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 48 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 49 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 50 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 51 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 52 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 53 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 54 | 현재 처리의 설정·호출·상태를 연결한다: `close = () => client.close();` |
| 55 | 현재 처리의 설정·호출·상태를 연결한다: `} else throw new Error('지원하지 않는 DB_DRIVER');` |
| 56 | 외부 API에는 저장 엔진이나 드라이버 객체를 노출하지 않는다. |
| 57 | `repo`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 58 | 직렬화된 문자열을 객체로 복구한다. 잘못된 형식은 예외 경로로 보낸다. |
| 59 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 60 | 객체를 JSON 문자열로 바꿔 저장·전송·관찰한다. |
| 61 | 객체를 JSON 문자열로 바꿔 저장·전송·관찰한다. |
| 62 | 현재 처리의 설정·호출·상태를 연결한다: `delete: remove,` |
| 63 | 현재 처리의 설정·호출·상태를 연결한다: `close,` |
| 64 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 65 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 66 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `lessons/study11/orm.js` 전체 코드

```javascript
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, bigserial, varchar, text } from 'drizzle-orm/pg-core';
import pg from 'pg';

// PostgreSQL용 ORM 매핑이다. API 서버의 동일한 records 테이블을 읽는다.
const records = pgTable('records', { id: bigserial('id', { mode: 'number' }).primaryKey(), kind: varchar('kind', { length: 32 }).notNull(), payload: text('payload').notNull() });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);
try { console.log(await db.select().from(records).limit(5)); }
finally { await pool.end(); }
```

원본: [lessons/study11/orm.js](lessons/study11/orm.js) · SHA-256(LF 정규화): `20243ae1a885c8f732e9e8c0e5155490d56757196befc19a66229b3ed86358c4`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 2 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 3 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 5 | PostgreSQL용 ORM 매핑이다. API 서버의 동일한 records 테이블을 읽는다. |
| 6 | `records`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 7 | `pool`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 8 | `db`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 9 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 10 | 성공·실패와 관계없이 버튼·연결·자원을 정리한다. |


### `scripts/check-databases.js` 전체 코드

```javascript
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
```

원본: [scripts/check-databases.js](scripts/check-databases.js) · SHA-256(LF 정규화): `9e18de5e071f1550b35418dad4de955af5040366a0f1ef212ae5ee75b429c4a0`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 3 | Docker DB 컨테이너가 준비된 뒤 실행하는 실제 드라이버 계약 검사다. |
| 4 | 목록 또는 스트림의 각 항목을 반복 처리한다. |
| 5 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const repo = await createRepository({ DB_DRIVER: driver, DATABASE_URL: url }); |
| 6 | 현재 처리의 설정·호출·상태를 연결한다: `try {` |
| 7 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 8 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 9 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 10 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 11 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 12 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 13 | 개발·운영에서 관찰할 실행 결과를 콘솔에 남긴다. |
| 14 | 성공·실패와 관계없이 버튼·연결·자원을 정리한다. |
| 15 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `compose.yaml` 전체 코드

```yaml
services:
  app:
    build: .
    ports: ["127.0.0.1:3000:3000"]
    env_file: .env
    environment:
      HOST: 0.0.0.0
    volumes: ["study-data:/app/data"]
    restart: unless-stopped
  postgres:
    image: postgres:17
    profiles: [databases]
    environment:
      POSTGRES_USER: study
      POSTGRES_PASSWORD: study
      POSTGRES_DB: study
    ports: ["127.0.0.1:5432:5432"]
    volumes: ["postgres-data:/var/lib/postgresql/data"]
  mariadb:
    image: mariadb:11.4
    profiles: [databases]
    environment:
      MARIADB_ROOT_PASSWORD: local-study-only
      MARIADB_USER: study
      MARIADB_PASSWORD: study
      MARIADB_DATABASE: study
    ports: ["127.0.0.1:3306:3306"]
    volumes: ["mariadb-data:/var/lib/mysql"]
  mongodb:
    image: mongo:8
    profiles: [databases]
    ports: ["127.0.0.1:27017:27017"]
    volumes: ["mongo-data:/data/db"]
volumes:
  study-data:
  postgres-data:
  mariadb-data:
  mongo-data:
```

원본: [compose.yaml](compose.yaml) · SHA-256(LF 정규화): `f0f8555c91d19ac89efd4af2ac782820bdfe6c097460b2ba276af4fe32d4f996`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | YAML 설정에서 services 항목의 실행 조건·값·하위 단계를 선언한다. |
| 2 | YAML 설정에서 app 항목의 실행 조건·값·하위 단계를 선언한다. |
| 3 | YAML 설정에서 build 항목의 실행 조건·값·하위 단계를 선언한다. |
| 4 | YAML 설정에서 ports 항목의 실행 조건·값·하위 단계를 선언한다. |
| 5 | YAML 설정에서 env_file 항목의 실행 조건·값·하위 단계를 선언한다. |
| 6 | YAML 설정에서 environment 항목의 실행 조건·값·하위 단계를 선언한다. |
| 7 | YAML 설정에서 HOST 항목의 실행 조건·값·하위 단계를 선언한다. |
| 8 | YAML 설정에서 volumes 항목의 실행 조건·값·하위 단계를 선언한다. |
| 9 | YAML 설정에서 restart 항목의 실행 조건·값·하위 단계를 선언한다. |
| 10 | YAML 설정에서 postgres 항목의 실행 조건·값·하위 단계를 선언한다. |
| 11 | YAML 설정에서 image 항목의 실행 조건·값·하위 단계를 선언한다. |
| 12 | YAML 설정에서 profiles 항목의 실행 조건·값·하위 단계를 선언한다. |
| 13 | YAML 설정에서 environment 항목의 실행 조건·값·하위 단계를 선언한다. |
| 14 | YAML 설정에서 POSTGRES_USER 항목의 실행 조건·값·하위 단계를 선언한다. |
| 15 | YAML 설정에서 POSTGRES_PASSWORD 항목의 실행 조건·값·하위 단계를 선언한다. |
| 16 | YAML 설정에서 POSTGRES_DB 항목의 실행 조건·값·하위 단계를 선언한다. |
| 17 | YAML 설정에서 ports 항목의 실행 조건·값·하위 단계를 선언한다. |
| 18 | YAML 설정에서 volumes 항목의 실행 조건·값·하위 단계를 선언한다. |
| 19 | YAML 설정에서 mariadb 항목의 실행 조건·값·하위 단계를 선언한다. |
| 20 | YAML 설정에서 image 항목의 실행 조건·값·하위 단계를 선언한다. |
| 21 | YAML 설정에서 profiles 항목의 실행 조건·값·하위 단계를 선언한다. |
| 22 | YAML 설정에서 environment 항목의 실행 조건·값·하위 단계를 선언한다. |
| 23 | YAML 설정에서 MARIADB_ROOT_PASSWORD 항목의 실행 조건·값·하위 단계를 선언한다. |
| 24 | YAML 설정에서 MARIADB_USER 항목의 실행 조건·값·하위 단계를 선언한다. |
| 25 | YAML 설정에서 MARIADB_PASSWORD 항목의 실행 조건·값·하위 단계를 선언한다. |
| 26 | YAML 설정에서 MARIADB_DATABASE 항목의 실행 조건·값·하위 단계를 선언한다. |
| 27 | YAML 설정에서 ports 항목의 실행 조건·값·하위 단계를 선언한다. |
| 28 | YAML 설정에서 volumes 항목의 실행 조건·값·하위 단계를 선언한다. |
| 29 | YAML 설정에서 mongodb 항목의 실행 조건·값·하위 단계를 선언한다. |
| 30 | YAML 설정에서 image 항목의 실행 조건·값·하위 단계를 선언한다. |
| 31 | YAML 설정에서 profiles 항목의 실행 조건·값·하위 단계를 선언한다. |
| 32 | YAML 설정에서 ports 항목의 실행 조건·값·하위 단계를 선언한다. |
| 33 | YAML 설정에서 volumes 항목의 실행 조건·값·하위 단계를 선언한다. |
| 34 | YAML 설정에서 volumes 항목의 실행 조건·값·하위 단계를 선언한다. |
| 35 | YAML 설정에서 study-data 항목의 실행 조건·값·하위 단계를 선언한다. |
| 36 | YAML 설정에서 postgres-data 항목의 실행 조건·값·하위 단계를 선언한다. |
| 37 | YAML 설정에서 mariadb-data 항목의 실행 조건·값·하위 단계를 선언한다. |
| 38 | YAML 설정에서 mongo-data 항목의 실행 조건·값·하위 단계를 선언한다. |


### `lessons/study11/index.html` 전체 코드

```html
<!doctype html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>study11 실습</title><link rel="stylesheet" href="/workbook/style.css"></head>
<body><main class="container"></main><script type="module" src="app.js"></script></body>
</html>
```

원본: [lessons/study11/index.html](lessons/study11/index.html) · SHA-256(LF 정규화): `68ea09f1c96b86de0567981243ce8431db9085d1c39fb92cca7eda56e3e21c3a`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | HTML 표준 모드로 문서를 해석하도록 선언한다. |
| 2 | 문서 언어/루트를 정의한다. |
| 3 | 메타정보 / 문자 인코딩·화면 배율·설명 / 브라우저 탭 제목 / 공통 CSS 연결를 정의한다. |
| 4 | body 요소 / 본문 / ESM 진입점 연결를 정의한다. |
| 5 | 현재 HTML 요소를 닫는다. |


### `lessons/study11/app.js` 전체 코드

```javascript
import { mountLesson } from '../runner.js';

// 이 단계의 요청·입력·실행 순서를 선언한다.
mountLesson({
  "title": "study11 · DB 교체 확인",
  "intro": "서버를 중지하고 .env의 DB_DRIVER·DATABASE_URL을 바꾼 뒤 다시 시작하세요. 이 화면은 같은 API 계약으로 자료를 읽습니다. ORM 예제는 터미널에서 실행합니다.",
  "input": {},
  "actions": [
    {
      "label": "목록 조회",
      "path": "/posts"
    }
  ],
  "links": [
    [
      "전체 게시판·문서 AI",
      "/workbook/"
    ]
  ]
});
```

원본: [lessons/study11/app.js](lessons/study11/app.js) · SHA-256(LF 정규화): `ea8bf50ea9b39ffc554aa29814cbd513aca69a42a30c55f0dc022c5f758ea1db`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 3 | 이 단계의 요청·입력·실행 순서를 선언한다. |
| 4 | 현재 처리의 설정·호출·상태를 연결한다: `mountLesson({` |
| 5 | 현재 처리의 설정·호출·상태를 연결한다: `"title": "study11 · DB 교체 확인",` |
| 6 | 현재 처리의 설정·호출·상태를 연결한다: `"intro": "서버를 중지하고 .env의 DB_DRIVER·DATABASE_URL을 바꾼 뒤 다시 시작하세요. 이 화면은 같은 API 계약으로 자료를 읽습니다. ORM 예제는 터미널에서 실행합니다.",` |
| 7 | 현재 처리의 설정·호출·상태를 연결한다: `"input": {},` |
| 8 | 현재 처리의 설정·호출·상태를 연결한다: `"actions": [` |
| 9 | 현재 처리의 설정·호출·상태를 연결한다: `{` |
| 10 | 현재 처리의 설정·호출·상태를 연결한다: `"label": "목록 조회",` |
| 11 | 현재 처리의 설정·호출·상태를 연결한다: `"path": "/posts"` |
| 12 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 13 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 14 | 현재 처리의 설정·호출·상태를 연결한다: `"links": [` |
| 15 | 현재 처리의 설정·호출·상태를 연결한다: `[` |
| 16 | 현재 처리의 설정·호출·상태를 연결한다: `"전체 게시판·문서 AI",` |
| 17 | 현재 처리의 설정·호출·상태를 연결한다: `"/workbook/"` |
| 18 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 19 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 20 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


## ④ 🔗 연동 포인트

환경변수 → createRepository의 드라이버 분기 → 공통 repo 계약 → 기존 board/API/UI로 연결한다. 컨테이너 안에서 app을 실행하면 localhost 대신 postgres/mariadb/mongodb 서비스 이름을 쓴다. 다음 단계는 이 API 위 UI의 공통 상태·폼을 다듬는 작업이다.

## ⑤ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| ECONNREFUSED | DB 미실행·아직 초기화 중·잘못된 호스트 | docker compose ps/logs와 포트 확인 |
| 비밀번호 인증 실패 | DATABASE_URL 또는 기존 볼륨 계정 불일치 | 실제 DB 사용자와 URL 확인 |
| DB 교체 후 데이터 없음 | 새 DB에 이관하지 않음 | 새 자료 등록 또는 백업 기반 이관 |

## ⑥ 직접 해보기

1. 세 DB에서 같은 CRUD 계약 검사를 수행하고 결과를 기록한다.
2. ORM으로 records의 kind 조건 조회를 추가한다.
3. DB 교체와 데이터 마이그레이션이 다른 이유를 설명한다.

## ⑦ ☐ 체크리스트

학습자 수행 확인용이다. 문서·코드 작성 완료와 본인의 실습 완료는 다르므로 직접 확인한 뒤 체크한다. 원문 항목 배치는 [반영표](docs/coverage.md)를 따른다.

- [ ] DB_DRIVER·DATABASE_URL을 분리했다
- [ ] MariaDB·PostgreSQL·MongoDB 연결 코드를 읽었다
- [ ] ORM과 드라이버·SQL/문서 모델의 차이를 설명한다
- [ ] 외부 DB 실행 검증 여부를 사실대로 기록한다

## ⑧ 다음 단계 연결

[study12.md](study12.md)에서 프론트·UI·상태·폼 연동로 이어간다.

출처: [지정 노션](https://app.notion.com/p/3d6d7dec5e2e8147b212f0a23b93dfc1) · [공통 API v1](https://app.notion.com/p/3d6d7dec5e2e8139adbfd36dd506c65e) · [반영표](docs/coverage.md) · [검증 기록](docs/verification.md). 기술 근거: [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [Node 24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html). 설치 버전 API는 package-lock.json과 node_modules의 버전별 공식 문서를 기준으로 확인한다.
