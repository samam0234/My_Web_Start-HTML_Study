import { cp, mkdir, writeFile } from 'node:fs/promises';

// 번들러 없이 정적 파일을 복사한다. 서버와 비밀 설정은 산출물에서 제외한다.
await mkdir('dist', { recursive: true });
for (const folder of ['workbook', 'midpoint', 'lessons', 'practice/site', 'final-project']) await cp(folder, `dist/${folder}`, { recursive: true, filter: path => !/lessons[\\/]study(0|11|15)([\\/]|$)/.test(path) });
await writeFile('dist/index.html', '<!doctype html><html lang="ko"><meta charset="utf-8"><title>학습 실습</title><a href="workbook/">게시판 실습 열기 (API 서버 필요)</a><a href="practice/site/">정적 기초 사이트</a><a href="final-project/">정적 Todo</a></html>');
console.log('dist 생성 완료 · API 기능은 npm start 서버가 필요합니다.');
