import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { fail } from './errors.js';

const scrypt = promisify(scryptCallback);
const digest = value => createHash('sha256').update(value).digest('hex');
export const publicUser = user => ({ id: user.id, email: user.email, nickname: user.nickname });
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
}
export async function verifyPassword(password, stored = '') {
  const [salt, encoded] = stored.split(':');
  if (!salt || !encoded) return false;
  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(encoded, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function createAuth(repo) {
  return {
    async issue(user) {
      const token = randomBytes(32).toString('hex');
      await repo.create('sessions', { userId: user.id, hash: digest(token), expiresAt: Date.now() + 3600000 });
      return { user: publicUser(user), accessToken: token };
    },
    async require(req) {
      const token = req.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
      if (!token) fail(401, 'UNAUTHORIZED', '로그인이 필요합니다.');
      const session = (await repo.list('sessions')).find(row => row.hash === digest(token) && row.expiresAt > Date.now());
      const user = session && await repo.get('users', session.userId);
      if (!user) fail(401, 'UNAUTHORIZED', '로그인이 만료되었습니다.');
      return { user, session };
    },
  };
}
