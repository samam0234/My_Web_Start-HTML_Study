import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { openapi } from '../server/openapi.js';

const skip = new Set(['.git', 'node_modules', 'dist', 'data', 'backups', 'artifacts', '__pycache__']);
async function files(path = '.') {
  const result = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = join(path, entry.name);
    if (entry.isDirectory()) result.push(...await files(full));
    else result.push(full);
  }
  return result;
}
const all = await files();
for (const file of all.filter(p => p.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  assert.equal(result.status, 0, `${file}: ${result.stderr}`);
}
const manifest = JSON.parse(await readFile('docs/chapter-manifest.json', 'utf8'));
assert.equal(manifest.length, 21);
const expected = [...Array.from({ length: 19 }, (_, i) => `study${i}.md`), 'studyMidpoint.md', 'studyFinal.md'].sort();
assert.deepEqual(manifest.map(chapter => chapter.file).sort(), expected);
for (const chapter of manifest) {
  const markdown = (await readFile(chapter.file, 'utf8')).replace(/\r\n/g, '\n');
  for (const heading of ['① 목표 한 줄', '② 📖 이론', '③ 🛠️ 실기', '④ 🔗 연동 포인트', '⑤ 오류 노트', '⑥ 직접 해보기', '⑦ ☐ 체크리스트', '⑧ 다음 단계 연결']) assert.ok(markdown.includes(`## ${heading}`), `${chapter.file}: ${heading} 누락`);
  assert.ok(markdown.includes('### 비유로 이해하기'));
  const exercises = markdown.split('## ⑥ 직접 해보기')[1].split('## ⑦')[0].match(/^\d+\. /gm) || [];
  assert.ok(exercises.length >= 2 && exercises.length <= 3);
  for (const source of chapter.sources) {
    const bytes = await readFile(source);
    const normalized = bytes.toString('utf8').replace(/\r\n/g, '\n');
    const digest = createHash('sha256').update(normalized).digest('hex');
    assert.ok(markdown.includes(digest), `${chapter.file}: ${source} 코드/문서 해시 불일치. npm run docs 실행`);
    assert.ok(markdown.includes(normalized.replace(/\n$/, '')), `${chapter.file}: ${source} 코드 전문 누락`);
    const section = markdown.split(`### \`${source}\` 전체 코드`)[1]?.split('\n### ')[0];
    const explained = [...(section || '').matchAll(/^\| (\d+) \| /gm)].map(match => Number(match[1]));
    const lines = normalized.replace(/\n+$/, '').split('\n').flatMap((line, index) => line.trim() ? [index + 1] : []);
    assert.deepEqual(explained, lines, `${chapter.file}: ${source} 줄별 해설 누락`);
  }
}
for (const file of all.filter(p => p.endsWith('.md'))) {
  if (file.includes('vendor')) continue;
  const content = await readFile(file, 'utf8');
  // 코드 블록 내부의 마크업 예시는 실제 문서 링크가 아니므로 검사에서 제외한다.
  const prose = content.replace(/```[\s\S]*?```/g, '');
  for (const match of prose.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const link = match[1];
    if (/^(https?:|mailto:|#|plugin:)/.test(link)) continue;
    const target = link.split('#')[0];
    if (!target) continue;
    await readFile(resolve(dirname(file), target)).catch(error => { throw new Error(`${file}: 로컬 링크 ${link}: ${error.code}`); });
  }
}
assert.equal(openapi.openapi, '3.0.3');
for (const [path, methods] of Object.entries(openapi.paths)) {
  if (path.includes('{id}')) assert.ok(methods.parameters?.some(p => p.name === 'id' && p.required));
  for (const method of ['get', 'post', 'patch', 'delete']) if (methods[method]) assert.ok(Object.keys(methods[method].responses).length);
}
console.log('JavaScript 문법·21개 문서 8개 구성·전체 코드/해시·줄별 해설·로컬 링크·OpenAPI 확인 완료');
