import { randomUUID } from 'node:crypto';

// 모든 계층에서 같은 오류 객체를 사용한다.
export class HttpError extends Error {
  constructor(status, code, message, fields = {}) {
    super(message);
    Object.assign(this, { status, code, fields });
  }
}
export const fail = (status, code, message, fields) => { throw new HttpError(status, code, message, fields); };
export function send(res, status, data, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(status === 204 ? undefined : JSON.stringify(data));
}
export function sendError(res, error, requestId = randomUUID()) {
  if (res.headersSent) return res.end();
  const known = error instanceof HttpError;
  send(res, known ? error.status : 500, { error: {
    code: known ? error.code : 'INTERNAL',
    message: known ? error.message : '서버 오류가 발생했습니다.',
    fields: known ? error.fields : {}, requestId,
  } }, { 'X-Request-Id': requestId });
}
export async function readJson(req, limit = 64 * 1024) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) fail(413, 'PAYLOAD_TOO_LARGE', '요청이 너무 큽니다.');
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { fail(400, 'BAD_REQUEST', 'JSON 객체를 보내세요.'); }
}
