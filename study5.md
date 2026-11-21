# study5 · HTML·CSS·JavaScript — 폼·입력·검증

## ① 목표 한 줄

클라이언트와 서버에서 입력을 검사하고 상태 코드별 메시지와 중복 제출 방지를 구현한다.

## ② 📖 이론

폼의 submit 이벤트는 기본적으로 문서를 이동시킨다. preventDefault로 기본 동작을 막고 fetch를 호출하면 같은 화면에서 결과를 표시할 수 있다. required·type·maxlength는 브라우저의 첫 검사이며 서버 검증을 대신하지 않는다. 공백만 있는 문자열도 trim으로 검사한다.

pending 플래그와 disabled 버튼은 요청 중 같은 제출을 다시 보내지 않게 한다. 예외가 발생하더라도 finally에서 복구한다. 200은 검증 성공, 400은 잘못된 요청, 422는 형식은 읽었지만 의미 조건에 맞지 않는 입력을 뜻하는 실습이다. 게시판 공통 API v1의 검증 실패는 400으로 통일되어 있으므로 422를 강제로 섞지 않는다.

서버는 Zod 스키마로 자료형·길이·허용 필드를 확인한다. strict는 알 수 없는 필드를 거부한다. PATCH는 일부 필드만 바꾸므로 생성 시 기본값이 누락 필드를 덮어쓰지 않게 별도 patchSchema를 사용한다. 오류 fields는 입력 칸 옆 표시를 붙일 때 쓰는 지도다.

### 비유로 이해하기

브라우저 검사는 안내 데스크의 확인이고 서버 검사는 실제 입구의 확인이다. 하나만으로는 잘못된 입력을 막지 못한다.

## ③ 🛠️ 실기: 전체 코드와 줄별 설명

1. npm run dev로 서버를 켜고 /lessons/study5/을 연다.
2. 빈 값·공백·정상 제목을 각각 제출한다.
3. Network의 요청 본문과 200 응답을 읽는다.
4. 아래 명령으로 브라우저 제한을 우회한 서버 검증과 422 응답을 확인한다.

```powershell
$payload = @{ title = ('x' * 201) } | ConvertTo-Json -Compress
try { Invoke-RestMethod http://localhost:3000/api/validate -Method Post -ContentType 'application/json' -Body $payload }
catch { $_.ErrorDetails.Message }
```

`/api/validate`는 study5용 별도 검증 엔드포인트다. 기본 게시판의 필수 필드·길이 오류는 노션 공통 스펙에 맞춰 400으로 응답한다.


### `lessons/study5/index.html` 전체 코드

```html
<!doctype html>
<html lang="ko"><meta charset="utf-8"><title>폼 검증</title><main><h1>서버에 입력 보내기</h1><form id="form"><label for="title">제목</label><input id="title" name="title" required maxlength="200"><button>검사 요청</button></form><p id="result" role="status"></p></main><script type="module" src="form.js"></script></html>
```

원본: [lessons/study5/index.html](lessons/study5/index.html) · SHA-256(LF 정규화): `b823e56b2d260c98e722692133f0485758bfb0891f9d2aa08b5dce0df9c6b81a`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | HTML 표준 모드로 문서를 해석하도록 선언한다. |
| 2 | 문서 언어/루트 / 문자 인코딩·화면 배율·설명 / 브라우저 탭 제목 / 본문 / 최상위 제목 / 입력 제출 단위 / 입력의 접근 가능한 이름 / 사용자 입력 / 키보드 가능한 동작 / 설명·상태 메시지 / ESM 진입점 연결를 정의한다. |


### `lessons/study5/form.js` 전체 코드

```javascript
const form = document.getElementById('form');
const output = document.getElementById('result');
let pending = false; // 클릭과 Enter가 겹쳐도 중복 요청을 막는다.
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (pending || !form.reportValidity()) return;
  const title = new FormData(form).get('title').trim();
  if (!title) { output.textContent = '공백만 입력할 수 없습니다.'; return; }
  pending = true; form.querySelector('button').disabled = true;
  try {
    const response = await fetch('/api/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
    const body = await response.json();
    output.textContent = response.status === 200 ? body.data.message : [400, 422].includes(response.status) ? body.error.message : '예상하지 못한 응답입니다.';
  } catch { output.textContent = '네트워크 연결을 확인하세요.'; }
  finally { pending = false; form.querySelector('button').disabled = false; }
});
```

원본: [lessons/study5/form.js](lessons/study5/form.js) · SHA-256(LF 정규화): `bd93cb1272404e42f38dc5adccd48b2aa5c3d3fb0c84c5712c5660c301cbc08c`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | `form`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 2 | `output`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 3 | 클릭과 Enter가 겹쳐도 중복 요청을 막는다. |
| 4 | 사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다. |
| 5 | 현재 처리의 설정·호출·상태를 연결한다: `event.preventDefault();` |
| 6 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (pending // !form.reportValidity()) return; |
| 7 | `title`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 8 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 9 | 현재 처리의 설정·호출·상태를 연결한다: `pending = true; form.querySelector('button').disabled = true;` |
| 10 | 현재 처리의 설정·호출·상태를 연결한다: `try {` |
| 11 | 약속한 URL·메소드·본문으로 요청하고 응답을 기다린다. |
| 12 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const body = await response.json(); |
| 13 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 14 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 15 | 성공·실패와 관계없이 버튼·연결·자원을 정리한다. |
| 16 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


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


## ④ 🔗 연동 포인트

FormData → trim/브라우저 검사 → JSON POST → 서버 스키마 → data/error.fields → role=status로 연결한다. 다음 단계에서는 검사한 자료를 DB에 보관하고 목록으로 읽는다.

## ⑤ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| 두 번 저장됨 | 버튼만 막고 Enter 제출을 허용 | pending 플래그도 검사 |
| 버튼이 영원히 비활성 | 오류 경로에서 복구 누락 | finally에서 활성화 |
| 수정 시 태그가 사라짐 | PATCH에 생성 기본값 적용 | 기본값 없는 patchSchema 사용 |

## ⑥ 직접 해보기

1. 제목별 오류를 input의 aria-describedby와 연결한다.
2. Network 속도를 낮추고 저장 버튼을 연속으로 눌러 요청 수를 센다.
3. 서버에 201자 제목을 보내 422를 확인한다.

## ⑦ ☐ 체크리스트

학습자 수행 확인용이다. 문서·코드 작성 완료와 본인의 실습 완료는 다르므로 직접 확인한 뒤 체크한다. 원문 항목 배치는 [반영표](docs/coverage.md)를 따른다.

- [ ] 폼 submit은 기본으로 페이지를 새로고침한다 → event.preventDefault()
- [ ] 200·400·422 응답별 메시지를 확인한다
- [ ] 브라우저 검증과 서버 검증을 모두 수행한다
- [ ] 중복 제출 후 성공·실패 모두 버튼이 복구된다
- [ ] 폼 submit은 기본으로 페이지를 새로고침한다 → event.preventDefault().

## ⑧ 다음 단계 연결

[study6.md](study6.md)에서 DB·API 연동과 CRUD로 이어간다.

출처: [지정 노션](https://app.notion.com/p/3d6d7dec5e2e8147b212f0a23b93dfc1) · [공통 API v1](https://app.notion.com/p/3d6d7dec5e2e8139adbfd36dd506c65e) · [반영표](docs/coverage.md) · [검증 기록](docs/verification.md). 기술 근거: [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [Node 24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html). 설치 버전 API는 package-lock.json과 node_modules의 버전별 공식 문서를 기준으로 확인한다.
