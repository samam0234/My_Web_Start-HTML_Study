import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';

// 라이브러리는 lockfile 버전을 사용하며 CDN·전역 Node 변수 없이 브라우저에서 실행한다.
await mkdir('lessons/study12/vendor', { recursive: true });
await build({ entryPoints: ['lessons/study12/demo.js'], outfile: 'lessons/study12/vendor/demo.bundle.js', bundle: true, format: 'esm', minify: true, define: { 'process.env.NODE_ENV': '"production"' }, legalComments: 'inline' });
await copyFile('node_modules/bootstrap/dist/css/bootstrap.min.css', 'lessons/study12/vendor/bootstrap.min.css');
for (const name of ['bootstrap', 'nanostores']) await copyFile(`node_modules/${name}/LICENSE`, `lessons/study12/vendor/${name}.LICENSE.txt`);
await copyFile('node_modules/just-validate/LICENSE.md', 'lessons/study12/vendor/just-validate.LICENSE.txt');
console.log('study12 라이브러리 번들 생성 완료');
