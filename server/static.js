import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fail } from './errors.js';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
export async function serveStatic(req, res, pathname) {
  const prefix = ['/midpoint/', '/workbook/', '/lessons/', '/practice/site/', '/final-project/'].find(p => pathname.startsWith(p));
  if (!prefix) fail(404, 'NOT_FOUND', '페이지가 없습니다.');
  const base = resolve('.' + prefix);
  let file;
  try { file = resolve('.' + decodeURIComponent(pathname)); } catch { fail(400, 'BAD_REQUEST', '잘못된 URL'); }
  if (!file.startsWith(base + sep) && file !== base) fail(403, 'FORBIDDEN', '허용하지 않는 경로');
  if (pathname.endsWith('/')) file = resolve(file, 'index.html');
  const type = types[extname(file)];
  if (!type || file.split(/[\\/]/).some(p => p.startsWith('.'))) fail(404, 'NOT_FOUND', '파일이 없습니다.');
  let body, info;
  try { [body, info] = await Promise.all([readFile(file), stat(file)]); } catch { fail(404, 'NOT_FOUND', '파일이 없습니다.'); }
  const etag = `"${info.size}-${Math.trunc(info.mtimeMs)}"`;
  const headers = { 'Content-Type': type, ETag: etag, 'Cache-Control': 'no-cache' };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }
  res.writeHead(200, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}
