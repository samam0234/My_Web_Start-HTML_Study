# study12 · HTML·CSS·JavaScript — 프론트·UI·상태·폼 연동

## ① 목표 한 줄

Vanilla JS에서 네이티브 UI와 상태 저장소·폼 도우미·검증 라이브러리를 연결한다.

## ② 📖 이론

브라우저 자체의 dialog는 모달 UI, Constraint Validation은 required/type/length 검사를 제공한다. 이 과정의 UI 계층은 네이티브 요소와 공통 CSS다. 프레임워크용 UI 라이브러리를 추가하지 않고 CSS 변수·flex·grid로 기존 문서의 표현을 유지한다. 외부 UI 패키지를 쓸 때도 DOM 생성·이벤트 해제·접근성 책임을 확인해야 한다.

store는 현재 상태를 보관하고 구독자에게 변경을 전달하는 작은 라이브러리다. get은 복제본을 주어 외부에서 몰래 원본을 바꾸지 못하게 한다. subscribe는 해제 함수를 반환한다. 상태 관리가 DOM 렌더링을 자동으로 수행하는 것은 아니므로 구독 콜백에서 화면을 갱신한다.

폼은 자체 forms.js 도우미와 서버의 Zod 라이브러리를 연결한다. bindForm은 submit 가로채기·유효성 검사·중복 제출 잠금·오류 처리·버튼 복구를 맡고 실제 API 작업은 콜백으로 받는다. 모든 폼을 하나의 거대한 함수로 합치지 않고 공통 수명만 재사용한다. UI 메시지에는 role=status를 사용한다.

독립 실행 예제 /lessons/study12/은 Bootstrap CSS(UI), Nano Stores atom(상태), JustValidate(폼)를 실제로 연결한다. UI 패키지는 HTML에 스타일을 제공하며 화면 구조와 이벤트는 계속 Vanilla JS로 작성한다. npm의 bare import와 process.env 분기는 esbuild가 브라우저 번들로 처리한다. CDN을 사용하지 않아 같은 출처 CSP를 유지한다. JustValidate의 사용자 친화적 검사 뒤에도 /api/validate와 Zod의 서버 검증을 유지한다.

### 비유로 이해하기

UI 라이브러리는 완성된 가구, 상태 저장소는 공용 장부, 폼 라이브러리는 접수 절차다.

## ③ 🛠️ 실기: 전체 코드와 줄별 설명

1. npm run vendor로 lockfile 버전의 라이브러리를 브라우저 번들로 만든다.
2. npm run dev 후 /lessons/study12/에서 제목을 제출하고 성공 횟수가 바뀌는지 확인한다.
3. 빈 값·200자 초과·공백 입력으로 클라이언트/서버 검증의 차이를 확인한다.
4. workbook의 자체 store/forms 도우미가 같은 경계를 어떻게 구현하는지 읽는다.
5. Bootstrap CSS 클래스·Nano Stores 구독·JustValidate 규칙을 각각 하나씩 바꾸어 본다.

라이브러리 공식 근거: [Bootstrap](https://getbootstrap.com/docs/5.3/getting-started/introduction/), [Nano Stores](https://github.com/nanostores/nanostores), [JustValidate](https://just-validate.dev/docs/intro). 버전과 라이선스는 package-lock.json과 lessons/study12/vendor/에 보존한다. 라이브러리 배포 파일은 직접 작성하는 전체 코드에서 제외하고 재현 스크립트를 제공한다.

### 단계별 실행 위치

`npm run dev` 후 `/lessons/study12/`에서 이 단계의 실습을 연다. [실습 HTML](lessons/study12/index.html)과 [전체 실습 목차](lessons/index.html)를 사용한다. 기초 중간 프로젝트 전체 화면은 `npm run midpoint` 후 `/midpoint/`에서 실행한다. 터미널 전용 DB·Docker·MCP 명령은 해당 문서의 실행 순서를 따른다.

### `lessons/study12/index.html` 전체 코드

```html
<!doctype html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>UI·상태·폼 라이브러리</title><link rel="stylesheet" href="vendor/bootstrap.min.css"></head>
<body><main class="container py-4">
  <h1>Vanilla JS 라이브러리 연결</h1>
  <p>Bootstrap CSS · Nano Stores · JustValidate</p>
  <form id="demo-form" novalidate>
    <label class="form-label" for="demo-title">제목 (1~200자)</label>
    <input class="form-control mb-3" id="demo-title" name="title">
    <button class="btn btn-primary" type="submit">서버 검사</button>
  </form>
  <p id="demo-status" class="mt-3" role="status"></p>
  <output id="demo-count" aria-live="polite"></output>
</main><script type="module" src="vendor/demo.bundle.js"></script></body>
</html>
```

원본: [lessons/study12/index.html](lessons/study12/index.html) · SHA-256(LF 정규화): `7082ff9d359648ebab3645e3a258853c28e0e9abd2fcf34f5ec78d610cc9ee1d`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | HTML 표준 모드로 문서를 해석하도록 선언한다. |
| 2 | 문서 언어/루트를 정의한다. |
| 3 | 메타정보 / 문자 인코딩·화면 배율·설명 / 브라우저 탭 제목 / 공통 CSS 연결를 정의한다. |
| 4 | body 요소 / 본문를 정의한다. |
| 5 | 최상위 제목를 정의한다. |
| 6 | 설명·상태 메시지를 정의한다. |
| 7 | 입력 제출 단위를 정의한다. |
| 8 | 입력의 접근 가능한 이름를 정의한다. |
| 9 | 사용자 입력를 정의한다. |
| 10 | 키보드 가능한 동작를 정의한다. |
| 11 | 현재 HTML 요소를 닫는다. |
| 12 | 설명·상태 메시지를 정의한다. |
| 13 | output 요소를 정의한다. |
| 14 | ESM 진입점 연결를 정의한다. |
| 15 | 현재 HTML 요소를 닫는다. |


### `lessons/study12/demo.js` 전체 코드

```javascript
import { atom } from 'nanostores';
import JustValidate from 'just-validate';

// npm 라이브러리의 bare import는 esbuild로 브라우저용 한 파일로 묶는다.
const submitted = atom(0);
const status = document.getElementById('demo-status');
const stop = submitted.subscribe(count => { document.getElementById('demo-count').textContent = `서버 검사 성공 ${count}회`; });
const validator = new JustValidate('#demo-form', { lockForm: true, focusInvalidField: true, validateBeforeSubmitting: true });
validator.addField('#demo-title', [{ rule: 'required', errorMessage: '제목을 입력하세요.' }, { rule: 'maxLength', value: 200, errorMessage: '200자 이하로 입력하세요.' }]);
let busy = false;
validator.onSuccess(async event => {
  event?.preventDefault();
  if (busy) return;
  busy = true;
  const button = document.querySelector('#demo-form button');
  button.disabled = true;
  try {
    const title = document.getElementById('demo-title').value.trim();
    const response = await fetch('/api/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
    const value = await response.json();
    if (!response.ok) throw new Error(value.error.message);
    status.textContent = value.data.message;
    submitted.set(submitted.get() + 1);
  } catch (error) { status.textContent = error.message; }
  finally { busy = false; button.disabled = false; }
});
window.addEventListener('pagehide', () => { stop(); validator.destroy(); }, { once: true });
```

원본: [lessons/study12/demo.js](lessons/study12/demo.js) · SHA-256(LF 정규화): `18f52cc6a33c12e2ce68bd2d3b60af6f07a6d626797d2bdf01a25d0854bbc572`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 2 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 4 | npm 라이브러리의 bare import는 esbuild로 브라우저용 한 파일로 묶는다. |
| 5 | `submitted`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 6 | `status`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 7 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 8 | `validator`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 9 | 현재 처리의 설정·호출·상태를 연결한다: `validator.addField('#demo-title', [{ rule: 'required', errorMessage: '제목을 입력하세요.' }, { rule: 'maxLength', value: 200, er` |
| 10 | `busy`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 11 | 현재 처리의 설정·호출·상태를 연결한다: `validator.onSuccess(async event => {` |
| 12 | 현재 처리의 설정·호출·상태를 연결한다: `event?.preventDefault();` |
| 13 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (busy) return; |
| 14 | 현재 처리의 설정·호출·상태를 연결한다: `busy = true;` |
| 15 | `button`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 16 | 현재 처리의 설정·호출·상태를 연결한다: `button.disabled = true;` |
| 17 | 현재 처리의 설정·호출·상태를 연결한다: `try {` |
| 18 | `title`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 19 | 약속한 URL·메소드·본문으로 요청하고 응답을 기다린다. |
| 20 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const value = await response.json(); |
| 21 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!response.ok) throw new Error(value.error.message); |
| 22 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 23 | 현재 처리의 설정·호출·상태를 연결한다: `submitted.set(submitted.get() + 1);` |
| 24 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 25 | 성공·실패와 관계없이 버튼·연결·자원을 정리한다. |
| 26 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 27 | 사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다. |


### `scripts/vendor.js` 전체 코드

```javascript
import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';

// 라이브러리는 lockfile 버전을 사용하며 CDN·전역 Node 변수 없이 브라우저에서 실행한다.
await mkdir('lessons/study12/vendor', { recursive: true });
await build({ entryPoints: ['lessons/study12/demo.js'], outfile: 'lessons/study12/vendor/demo.bundle.js', bundle: true, format: 'esm', minify: true, define: { 'process.env.NODE_ENV': '"production"' }, legalComments: 'inline' });
await copyFile('node_modules/bootstrap/dist/css/bootstrap.min.css', 'lessons/study12/vendor/bootstrap.min.css');
for (const name of ['bootstrap', 'nanostores']) await copyFile(`node_modules/${name}/LICENSE`, `lessons/study12/vendor/${name}.LICENSE.txt`);
await copyFile('node_modules/just-validate/LICENSE.md', 'lessons/study12/vendor/just-validate.LICENSE.txt');
console.log('study12 라이브러리 번들 생성 완료');
```

원본: [scripts/vendor.js](scripts/vendor.js) · SHA-256(LF 정규화): `9f7abf3bb1887bef3bd2afdab80cc695135bfdef01d10fcdac81ceae76c6db32`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 2 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 4 | 라이브러리는 lockfile 버전을 사용하며 CDN·전역 Node 변수 없이 브라우저에서 실행한다. |
| 5 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await mkdir('lessons/study12/vendor', { recursive: true }); |
| 6 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await build({ entryPoints: ['lessons/study12/demo.js'], outfile: 'lessons/study12/vendor/demo.bundle |
| 7 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await copyFile('node_modules/bootstrap/dist/css/bootstrap.min.css', 'lessons/study12/vendor/bootstra |
| 8 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: for (const name of ['bootstrap', 'nanostores']) await copyFile(`node_modules/${name}/LICENSE`, `less |
| 9 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await copyFile('node_modules/just-validate/LICENSE.md', 'lessons/study12/vendor/just-validate.LICENS |
| 10 | 개발·운영에서 관찰할 실행 결과를 콘솔에 남긴다. |


### `workbook/js/store.js` 전체 코드

```javascript
// 상태 변경을 구독하는 14줄짜리 작은 저장소다.
export function createStore(initial) {
  let state = structuredClone(initial);
  const listeners = new Set();
  return {
    get: () => structuredClone(state),
    set(patch) {
      state = { ...state, ...patch };
      for (const listener of listeners) listener(structuredClone(state));
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}
```

원본: [workbook/js/store.js](workbook/js/store.js) · SHA-256(LF 정규화): `b9ad78ebae34fadbe19e649d497dfdddd6ffd826e6c9b9e743c4f4b42abe94b0`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 상태 변경을 구독하는 14줄짜리 작은 저장소다. |
| 2 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 3 | `state`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 4 | `listeners`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 5 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 6 | 현재 처리의 설정·호출·상태를 연결한다: `get: () => structuredClone(state),` |
| 7 | 현재 처리의 설정·호출·상태를 연결한다: `set(patch) {` |
| 8 | 현재 처리의 설정·호출·상태를 연결한다: `state = { ...state, ...patch };` |
| 9 | 목록 또는 스트림의 각 항목을 반복 처리한다. |
| 10 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 11 | 현재 처리의 설정·호출·상태를 연결한다: `subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },` |
| 12 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 13 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `workbook/js/forms.js` 전체 코드

```javascript
// 폼 제어를 한곳에 모으고 실패해도 finally에서 버튼을 복구한다.
export function bindForm(form, action, onError) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (form.dataset.busy === 'true' || !form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const buttonValue = event.submitter?.value;
    form.dataset.busy = 'true';
    const buttons = [...form.querySelectorAll('button')];
    buttons.forEach(button => { button.disabled = true; });
    try { await action(data, buttonValue); }
    catch (error) { onError(error); }
    finally { form.dataset.busy = 'false'; buttons.forEach(button => { button.disabled = false; }); }
  });
}
```

원본: [workbook/js/forms.js](workbook/js/forms.js) · SHA-256(LF 정규화): `31671c33083af2965ed5d75d2b04f5de81a616f2831f2b027a02c8b11aa5a10a`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 폼 제어를 한곳에 모으고 실패해도 finally에서 버튼을 복구한다. |
| 2 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 3 | 사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다. |
| 4 | 현재 처리의 설정·호출·상태를 연결한다: `event.preventDefault();` |
| 5 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (form.dataset.busy === 'true' // !form.reportValidity()) return; |
| 6 | `data`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 7 | `buttonValue`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 8 | 현재 처리의 설정·호출·상태를 연결한다: `form.dataset.busy = 'true';` |
| 9 | `buttons`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 10 | 현재 처리의 설정·호출·상태를 연결한다: `buttons.forEach(button => { button.disabled = true; });` |
| 11 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: try { await action(data, buttonValue); } |
| 12 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 13 | 성공·실패와 관계없이 버튼·연결·자원을 정리한다. |
| 14 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 15 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `server/validation.js` 전체 코드

```javascript
import { z } from 'zod';
import { fail } from './errors.js';

// 브라우저의 required와 별개로 서버가 입력을 다시 검사한다.
export const signupSchema = z.object({ email: z.email().max(200).transform(v => v.toLowerCase()), password: z.string().min(12).max(128), nickname: z.string().trim().min(1).max(40) }).strict();
export const loginSchema = signupSchema.pick({ email: true, password: true });
export const postSchema = z.object({ title: z.string().trim().min(1).max(200), body: z.string().trim().min(1).max(10000), tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]) }).strict();
export const patchSchema = postSchema.omit({ tags: true }).partial().extend({ tags: postSchema.shape.tags.removeDefault().optional() });
export const commentSchema = z.object({ body: z.string().trim().min(1).max(2000) }).strict();
export function validate(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    const fields = {};
    for (const issue of result.error.issues) (fields[issue.path.join('.') || 'body'] ??= []).push(issue.message);
    fail(400, 'VALIDATION_ERROR', '입력값을 확인하세요.', fields);
  }
  return result.data;
}
export function numericId(value) {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) fail(400, 'BAD_REQUEST', 'id는 양의 정수입니다.');
  return Number(value);
}
```

원본: [server/validation.js](server/validation.js) · SHA-256(LF 정규화): `b1b7d5e2c6c655f23770b94fd8cb3bbd57bea4c6062d79419270d11b38933cde`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 2 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 4 | 브라우저의 required와 별개로 서버가 입력을 다시 검사한다. |
| 5 | 다른 모듈이 사용할 인터페이스를 공개한다. `signupSchema`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 6 | 다른 모듈이 사용할 인터페이스를 공개한다. `loginSchema`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 7 | 다른 모듈이 사용할 인터페이스를 공개한다. `postSchema`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 8 | 다른 모듈이 사용할 인터페이스를 공개한다. `patchSchema`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 9 | 다른 모듈이 사용할 인터페이스를 공개한다. `commentSchema`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 10 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 11 | `result`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 12 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!result.success) { |
| 13 | `fields`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 14 | 목록 또는 스트림의 각 항목을 반복 처리한다. |
| 15 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 16 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 17 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 18 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 19 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 20 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 21 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 22 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `workbook/style.css` 전체 코드

```css
:root { color-scheme: light; --bg: #f5f7fb; --ink: #17233b; --surface: #fff; --accent: #254bc0; --border: #b6c3dc; }
[data-theme="dark"] { color-scheme: dark; --bg: #131b2c; --ink: #edf2ff; --surface: #202c43; --accent: #a6bcff; --border: #667799; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 1rem/1.65 system-ui, sans-serif; }
a { color: var(--accent); }
button, input, select, textarea { font: inherit; padding: .6rem; border: 1px solid var(--border); border-radius: .4rem; background: var(--surface); color: var(--ink); }
button { cursor: pointer; }
button:disabled { opacity: .5; cursor: wait; }
input, textarea, select { width: 100%; }
textarea { min-height: 8rem; }
label { display: block; margin-top: .7rem; }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
.container { width: min(64rem, 94%); margin: 2rem auto; }
.bar, .actions { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem; }
.bar { padding: 1rem 3%; background: var(--surface); justify-content: space-between; }
nav { display: flex; flex-wrap: wrap; gap: 1rem; }
section, article { padding: 1rem; margin-block: 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: .7rem; }
.actions { margin-top: 1rem; }
.card-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; }
[hidden] { display: none !important; }
.skip { position: absolute; top: -5rem; background: var(--surface); padding: 1rem; }
.skip:focus { top: 0; }
#message { min-height: 2rem; font-weight: bold; }
@media (max-width: 640px) { .card-grid { grid-template-columns: 1fr; } .bar { align-items: flex-start; } }
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto; } }
@media print { .bar, form, button, #message { display: none; } section { break-inside: avoid; } }
```

원본: [workbook/style.css](workbook/style.css) · SHA-256(LF 정규화): `a242d512c99ea03a44d26f6a3ecef33952d7ed569faa7baf8f9a9bb918c72401`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | CSS 사용자 속성·색상·테마 규칙을 이 선택자에 적용한다. |
| 2 | CSS 사용자 속성·색상·테마 규칙을 이 선택자에 적용한다. |
| 3 | 박스 폭 계산 규칙을 이 선택자에 적용한다. |
| 4 | CSS 사용자 속성·색상·테마·외부 여백·글자 표현 규칙을 이 선택자에 적용한다. |
| 5 | CSS 사용자 속성·색상·테마 규칙을 이 선택자에 적용한다. |
| 6 | CSS 사용자 속성·색상·테마·내부 여백·글자 표현 규칙을 이 선택자에 적용한다. |
| 7 |  규칙을 이 선택자에 적용한다. |
| 8 | 요청 중 버튼 상태 규칙을 이 선택자에 적용한다. |
| 9 | 폭 제한 규칙을 이 선택자에 적용한다. |
| 10 |  규칙을 이 선택자에 적용한다. |
| 11 | 외부 여백 규칙을 이 선택자에 적용한다. |
| 12 | CSS 사용자 속성·키보드 포커스 표시 규칙을 이 선택자에 적용한다. |
| 13 | 외부 여백·폭 제한 규칙을 이 선택자에 적용한다. |
| 14 | 한 축 배치 규칙을 이 선택자에 적용한다. |
| 15 | CSS 사용자 속성·내부 여백 규칙을 이 선택자에 적용한다. |
| 16 | 한 축 배치 규칙을 이 선택자에 적용한다. |
| 17 | CSS 사용자 속성·내부 여백·외부 여백 규칙을 이 선택자에 적용한다. |
| 18 | 외부 여백 규칙을 이 선택자에 적용한다. |
| 19 | 격자 배치 규칙을 이 선택자에 적용한다. |
| 20 | 출력 텍스트 줄바꿈 규칙을 이 선택자에 적용한다. |
| 21 | 숨김 상태 규칙을 이 선택자에 적용한다. |
| 22 | CSS 사용자 속성·내부 여백 규칙을 이 선택자에 적용한다. |
| 23 | 키보드 포커스 표시 규칙을 이 선택자에 적용한다. |
| 24 | 글자 표현 규칙을 이 선택자에 적용한다. |
| 25 | 한 축 배치·격자 배치·화면/사용자 환경별 조건·폭 제한 규칙을 이 선택자에 적용한다. |
| 26 | 화면/사용자 환경별 조건 규칙을 이 선택자에 적용한다. |
| 27 | 화면/사용자 환경별 조건 규칙을 이 선택자에 적용한다. |


## ④ 🔗 연동 포인트

DOM 입력 → 폼 도우미 → API → store.set → 구독 UI로 연결한다. 서버 Zod는 최종 검증 경계이고 네이티브 UI와 CSS는 결과를 표시한다. 다음 단계는 같은 API 경계에 메일·결제·OAuth를 붙인다.

## ⑤ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| 상태는 바뀌었는데 화면 그대로 | 구독에서 렌더링하지 않음 | subscribe 콜백에 필요한 DOM 갱신 |
| 버튼 값이 사라짐 | disabled 후 submitter 값을 읽음 | 값을 먼저 캡처 |
| 모달 뒤 화면으로 포커스 이동 | 일반 div로 모달 흉내 | dialog.showModal과 닫기 처리 |

## ⑥ 직접 해보기

1. 구독 해제 후 더 이상 UI가 변하지 않는지 확인한다.
2. 필드별 오류 메시지를 폼 도우미에 추가한다.
3. 네이티브 dialog에 제목과 설명 연결을 추가한다.

## ⑦ ☐ 체크리스트

학습자 수행 확인용이다. 문서·코드 작성 완료와 본인의 실습 완료는 다르므로 직접 확인한 뒤 체크한다. 원문 항목 배치는 [반영표](docs/coverage.md)를 따른다.

- [ ] CSS 변수로 색을 한 곳에 모으면 다크모드는 [data-theme="dark"]에서 변수만 다시 정의하면 끝난다.
- [ ] 헤더처럼 한 줄 배치는 flex, 카드 목록처럼 격자는 grid. 640px 이하에서는 미디어쿼리로 1열 + 햄버거 메뉴.
- [ ] UI·상태·폼 모듈의 역할을 구분한다
- [ ] Zod 스키마와 HTML 유효성 검사를 연결한다
- [ ] Bootstrap CSS·Nano Stores·JustValidate 실제 예제를 실행했다

## ⑧ 다음 단계 연결

[study13.md](study13.md)에서 외부 서비스: 메일·결제·업로드·OAuth로 이어간다.

출처: [지정 노션](https://app.notion.com/p/3d6d7dec5e2e8147b212f0a23b93dfc1) · [공통 API v1](https://app.notion.com/p/3d6d7dec5e2e8139adbfd36dd506c65e) · [반영표](docs/coverage.md) · [검증 기록](docs/verification.md). 기술 근거: [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [Node 24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html). 설치 버전 API는 package-lock.json과 node_modules의 버전별 공식 문서를 기준으로 확인한다.
