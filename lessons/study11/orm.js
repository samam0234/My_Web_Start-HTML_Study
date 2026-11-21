import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, bigserial, varchar, text } from 'drizzle-orm/pg-core';
import pg from 'pg';

// PostgreSQL용 ORM 매핑이다. API 서버의 동일한 records 테이블을 읽는다.
const records = pgTable('records', { id: bigserial('id', { mode: 'number' }).primaryKey(), kind: varchar('kind', { length: 32 }).notNull(), payload: text('payload').notNull() });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);
try { console.log(await db.select().from(records).limit(5)); }
finally { await pool.end(); }
