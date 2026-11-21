# study6 · HTML·CSS·JavaScript — DB·API 연동과 CRUD

## ① 목표 한 줄

공통 API v1 계약에 맞춰 브라우저와 SQLite 저장소를 연결한다.

## ② 📖 이론

fetch는 HTTP 통신을 Promise로 표현한다. async/await는 작업이 끝난 뒤 다음 처리를 이어 쓰는 문법이고 try/catch는 실패 경로를 처리한다. HTTP 400·404는 네트워크 자체의 실패가 아니므로 response.ok를 확인해야 한다. 삭제 성공 204에는 본문이 없으므로 json()을 호출하지 않는다.

SQLite는 서버 디스크의 파일 DB다. 브라우저는 /api 경로만 호출하고 DB 파일을 직접 열지 않는다. records 테이블의 id는 자동 증가 정수, kind는 자료 종류, payload는 도메인 객체를 직렬화한 JSON이다. 이 학습 모델은 저장소 교체를 짧게 보여주기 위한 Data Mapper다. 조회 시 종류 전체를 읽으므로 큰 운영 데이터에는 정규화·인덱스·DB 페이지네이션이 추가로 필요하다.

도메인 모델은 User(email,nickname,passwordHash), Post(title,body,tags,authorId,createdAt,updatedAt), Comment(postId,authorId,body)다. API는 authorId 대신 author{id,nickname}을 조립하고 commentCount를 계산한다. SQL의 ? 바인딩으로 입력과 쿼리 구조를 분리한다.

공통 API 스펙 v1의 v1은 계약 버전 이름이다. 경로는 /api이고 /api/v1로 바꾸지 않는다. 목록 응답은 data와 meta(page,limit,total,totalPages,q), 단건은 data, 오류는 error(code,message,fields,requestId)다. 등록은 201+Location, 수정은 PATCH 200, 삭제는 204다.

### 비유로 이해하기

API는 주문서 양식, 서버는 주문 처리자, DB는 원본 창고다. 브라우저가 창고 비밀번호를 가질 필요는 없다.

## ③ 🛠️ 실기: 전체 코드와 줄별 설명

1. .env에서 DB_DRIVER=sqlite와 SQLITE_PATH=data/study.sqlite를 확인한다.
2. npm run dev를 켜면 폴더와 records 테이블이 생성된다.
3. 목록 GET /api/posts → 상세 GET /api/posts/{id} 순서로 읽는다.
4. 다음 study7에서 계정을 만든 뒤 POST → PATCH → DELETE를 실행한다. 아래 요청 예제는 로그인 토큰을 사용한다.
5. /practice/site/about.html에서 정적 JSON fetch 예제도 확인한다.

### 공통 API v1 요청 예제 (서버 실행 후 PowerShell)

```powershell
$base = 'http://localhost:3000'
$account = @{ email='mina@example.com'; password='study-password-123'; nickname='mina' }
Invoke-RestMethod "$base/api/auth/signup" -Method Post -ContentType 'application/json' -Body ($account | ConvertTo-Json)
$login = Invoke-RestMethod "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body (@{email=$account.email;password=$account.password} | ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($login.data.accessToken)" }
$post = Invoke-RestMethod "$base/api/posts" -Method Post -Headers $headers -ContentType 'application/json' -Body (@{title='첫 글';body='안녕하세요';tags=@('intro')} | ConvertTo-Json)
Invoke-RestMethod "$base/api/posts?q=첫&page=1&limit=10"
Invoke-RestMethod "$base/api/posts/$($post.data.id)"
Invoke-RestMethod "$base/api/posts/$($post.data.id)" -Method Patch -Headers $headers -ContentType 'application/json' -Body (@{title='수정'} | ConvertTo-Json)
Invoke-RestMethod "$base/api/posts/$($post.data.id)" -Method Delete -Headers $headers
```

상태 코드: 읽기 200, 등록 201, 수정 200, 삭제 204, 입력 400, 미인증 401, 다른 작성자 403, 없음 404. `sort=createdAt`, `-createdAt`, `-commentCount`만 허용한다. limit 기본 10·최대 50, page는 1부터 시작한다.


### `workbook/js/api.js` 전체 코드

```javascript
// 토큰은 영구 저장소에 쓰지 않아 새로고침하면 로그인이 풀린다.
let token = '';
export const setToken = value => { token = value; };
export async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  if (options.raw && response.ok) return response;
  const value = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const error = new Error(value.error?.message || '요청 실패');
    Object.assign(error, { status: response.status, fields: value.error?.fields || {} });
    throw error;
  }
  return value;
}
export const json = (method, value) => ({ method, ...(value === undefined ? {} : { body: JSON.stringify(value) }) });
```

원본: [workbook/js/api.js](workbook/js/api.js) · SHA-256(LF 정규화): `8409bc90b72405dad723d8a391ea05462836a442bb7663b59a04b2eeef94ed59`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 토큰은 영구 저장소에 쓰지 않아 새로고침하면 로그인이 풀린다. |
| 2 | `token`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 3 | 다른 모듈이 사용할 인터페이스를 공개한다. `setToken`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 4 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 5 | 약속한 URL·메소드·본문으로 요청하고 응답을 기다린다. |
| 6 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (options.raw && response.ok) return response; |
| 7 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const value = response.status === 204 ? null : await response.json(); |
| 8 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!response.ok) { |
| 9 | `error`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 10 | 현재 처리의 설정·호출·상태를 연결한다: `Object.assign(error, { status: response.status, fields: value.error?.fields // {} });` |
| 11 | 현재 처리의 설정·호출·상태를 연결한다: `throw error;` |
| 12 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 13 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 14 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 15 | 다른 모듈이 사용할 인터페이스를 공개한다. 객체를 JSON 문자열로 바꿔 저장·전송·관찰한다. |


### `server/sqlite.js` 전체 코드

```javascript
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// 기초 구간에서 사용할 SQLite 전용 저장소다. 심화 드라이버를 불러오지 않는다.
export function createSQLite(path = 'data/study.sqlite') {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS records (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, payload TEXT NOT NULL); CREATE INDEX IF NOT EXISTS records_kind ON records(kind);');
  const repo = {
    list: async kind => db.prepare('SELECT id,payload FROM records WHERE kind=?').all(kind).map(row => ({ ...JSON.parse(row.payload), id: Number(row.id) })),
    get: async (kind, id) => (await repo.list(kind)).find(row => row.id === id),
    create: async (kind, value) => ({ ...value, id: Number(db.prepare('INSERT INTO records(kind,payload) VALUES(?,?)').run(kind, JSON.stringify(value)).lastInsertRowid) }),
    put: async (kind, id, value) => { db.prepare('UPDATE records SET payload=? WHERE kind=? AND id=?').run(JSON.stringify(value), kind, id); return { ...value, id }; },
    delete: async (kind, id) => db.prepare('DELETE FROM records WHERE kind=? AND id=?').run(kind, id),
    close: async () => db.close(),
  };
  return repo;
}
```

원본: [server/sqlite.js](server/sqlite.js) · SHA-256(LF 정규화): `26b625a25b0e90fa67b41daaed24b2e75ec2775e83da80c590a5b3f23469f82c`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 2 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 3 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 5 | 기초 구간에서 사용할 SQLite 전용 저장소다. 심화 드라이버를 불러오지 않는다. |
| 6 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 7 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true }); |
| 8 | `db`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 9 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 10 | `repo`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 11 | 직렬화된 문자열을 객체로 복구한다. 잘못된 형식은 예외 경로로 보낸다. |
| 12 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 13 | 객체를 JSON 문자열로 바꿔 저장·전송·관찰한다. |
| 14 | 객체를 JSON 문자열로 바꿔 저장·전송·관찰한다. |
| 15 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 16 | 선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다. |
| 17 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 18 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 19 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `server/board.js` 전체 코드

```javascript
import { fail } from './errors.js';
const authorView = user => ({ id: user.id, nickname: user.nickname });

// 요청 처리와 저장소를 나누어 같은 규칙을 네 가지 DB에 적용한다.
export function createBoard(repo) {
  const mustGet = async (kind, id) => {
    const row = await repo.get(kind, id);
    if (!row) fail(404, 'NOT_FOUND', '자료가 없습니다.');
    return row;
  };
  const own = (row, user) => { if (row.authorId !== user.id) fail(403, 'FORBIDDEN', '작성자만 변경할 수 있습니다.'); };
  const present = async post => {
    const { authorId, ...data } = post;
    return { ...data, author: authorView(await mustGet('users', authorId)), commentCount: (await repo.list('comments')).filter(c => c.postId === post.id).length };
  };
  return {
    async list(query) {
      const page = Math.max(1, Number.parseInt(query.get('page') || '1', 10) || 1);
      const limit = Math.min(50, Math.max(1, Number.parseInt(query.get('limit') || '10', 10) || 10));
      const q = (query.get('q') || '').slice(0, 200);
      const sort = query.get('sort') || '-createdAt';
      if (!['createdAt', '-createdAt', '-commentCount'].includes(sort)) fail(400, 'BAD_REQUEST', '지원하지 않는 정렬입니다.');
      const posts = await Promise.all((await repo.list('posts')).filter(p => `${p.title} ${p.body}`.toLowerCase().includes(q.toLowerCase())).map(present));
      posts.sort((a, b) => sort === '-commentCount' ? b.commentCount - a.commentCount || b.id - a.id : sort === 'createdAt' ? a.createdAt.localeCompare(b.createdAt) || a.id - b.id : b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
      return { data: posts.slice((page - 1) * limit, page * limit), meta: { page, limit, total: posts.length, totalPages: Math.ceil(posts.length / limit), q } };
    },
    get: async id => present(await mustGet('posts', id)),
    async create(value, user) {
      const now = new Date().toISOString();
      return present(await repo.create('posts', { ...value, authorId: user.id, createdAt: now, updatedAt: now }));
    },
    async patch(id, value, user) {
      const post = await mustGet('posts', id);
      own(post, user);
      return present(await repo.put('posts', id, { ...post, ...value, updatedAt: new Date().toISOString() }));
    },
    async delete(id, user) {
      own(await mustGet('posts', id), user);
      for (const row of await repo.list('comments')) if (row.postId === id) await repo.delete('comments', row.id);
      await repo.delete('posts', id);
    },
    async comments(id) {
      await mustGet('posts', id);
      return Promise.all((await repo.list('comments')).filter(c => c.postId === id).map(async ({ authorId, ...c }) => ({ ...c, author: authorView(await mustGet('users', authorId)) })));
    },
    async comment(id, value, user) {
      await mustGet('posts', id);
      const row = await repo.create('comments', { ...value, postId: id, authorId: user.id, createdAt: new Date().toISOString() });
      const { authorId, ...data } = row;
      return { ...data, author: authorView(user) };
    },
    async deleteComment(id, user) {
      own(await mustGet('comments', id), user);
      await repo.delete('comments', id);
    },
  };
}
```

원본: [server/board.js](server/board.js) · SHA-256(LF 정규화): `d3061f95095c31033f0f54deba2be74cade184b38647be7c585bc58a85412064`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 2 | `authorView`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 4 | 요청 처리와 저장소를 나누어 같은 규칙을 네 가지 DB에 적용한다. |
| 5 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 6 | `mustGet`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 7 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 8 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 9 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 10 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 11 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 12 | `present`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 13 | `{ authorId, ...data }`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 14 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 15 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 16 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 17 | 현재 처리의 설정·호출·상태를 연결한다: `async list(query) {` |
| 18 | `page`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 19 | `limit`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 20 | `q`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 21 | `sort`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 22 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 23 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 24 | 현재 처리의 설정·호출·상태를 연결한다: `posts.sort((a, b) => sort === '-commentCount' ? b.commentCount - a.commentCount // b.id - a.id : sort === 'createdAt' ? ` |
| 25 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 26 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 27 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: get: async id => present(await mustGet('posts', id)), |
| 28 | 현재 처리의 설정·호출·상태를 연결한다: `async create(value, user) {` |
| 29 | `now`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 30 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 31 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 32 | 현재 처리의 설정·호출·상태를 연결한다: `async patch(id, value, user) {` |
| 33 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const post = await mustGet('posts', id); |
| 34 | 현재 처리의 설정·호출·상태를 연결한다: `own(post, user);` |
| 35 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 36 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 37 | 현재 처리의 설정·호출·상태를 연결한다: `async delete(id, user) {` |
| 38 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: own(await mustGet('posts', id), user); |
| 39 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 40 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 41 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 42 | 현재 처리의 설정·호출·상태를 연결한다: `async comments(id) {` |
| 43 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await mustGet('posts', id); |
| 44 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 45 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 46 | 현재 처리의 설정·호출·상태를 연결한다: `async comment(id, value, user) {` |
| 47 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await mustGet('posts', id); |
| 48 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 49 | `{ authorId, ...data }`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 50 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 51 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 52 | 현재 처리의 설정·호출·상태를 연결한다: `async deleteComment(id, user) {` |
| 53 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: own(await mustGet('comments', id), user); |
| 54 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 55 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 56 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 57 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `practice/site/js/data.js` 전체 코드

```javascript
export async function renderSkills() {
  const list = document.getElementById("skills-list");
  if (!list) return;

  try {
    const response = await fetch("data/skills.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const skills = await response.json();
    if (!Array.isArray(skills)) throw new Error("관심 기술 목록 형식이 올바르지 않습니다.");

    list.innerHTML = "";
    skills.forEach((skill) => {
      const li = document.createElement("li");
      li.textContent = `${skill.name} · ${skill.level}`;
      list.appendChild(li);
    });
  } catch (error) {
    list.innerHTML = "<li>목록을 불러오지 못했습니다.</li>";
    console.error(error);
  }
}
```

원본: [practice/site/js/data.js](practice/site/js/data.js) · SHA-256(LF 정규화): `3d21d88e92c150545476057bf0862893664c4dc4605bd34bae89bb05353a0591`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 2 | `list`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 3 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!list) return; |
| 5 | 현재 처리의 설정·호출·상태를 연결한다: `try {` |
| 6 | 약속한 URL·메소드·본문으로 요청하고 응답을 기다린다. |
| 7 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!response.ok) throw new Error(`HTTP ${response.status}`); |
| 8 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const skills = await response.json(); |
| 9 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!Array.isArray(skills)) throw new Error("관심 기술 목록 형식이 올바르지 않습니다."); |
| 11 | 현재 처리의 설정·호출·상태를 연결한다: `list.innerHTML = "";` |
| 12 | 현재 처리의 설정·호출·상태를 연결한다: `skills.forEach((skill) => {` |
| 13 | `li`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 14 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 15 | 데이터로 만든 DOM 요소를 부모에 삽입하거나 기존 화면을 교체한다. |
| 16 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 17 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 18 | 현재 처리의 설정·호출·상태를 연결한다: `list.innerHTML = "<li>목록을 불러오지 못했습니다.</li>";` |
| 19 | 개발·운영에서 관찰할 실행 결과를 콘솔에 남긴다. |
| 20 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 21 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `practice/site/data/skills.json` 전체 코드

```json
[
  { "name": "HTML", "level": "연습 중" },
  { "name": "CSS", "level": "연습 중" },
  { "name": "JavaScript", "level": "기초" }
]
```

원본: [practice/site/data/skills.json](practice/site/data/skills.json) · SHA-256(LF 정규화): `36eb48a2479b3345fba17ba99f8f0fdf3c17998037d66ff777e29ea4fd590742`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 설정/데이터 필드 [의 값을 정의한다. |
| 2 | 설정/데이터 필드 { "name의 값을 정의한다. |
| 3 | 설정/데이터 필드 { "name의 값을 정의한다. |
| 4 | 설정/데이터 필드 { "name의 값을 정의한다. |
| 5 | 설정/데이터 필드 ]의 값을 정의한다. |


## ④ 🔗 연동 포인트

브라우저 api() → /api/posts → board → SQLite prepared statement → data/meta → DOM이다. 연결 파일은 .env로 분리한다. DB 파일의 data/는 정적 서버와 Git 모두에서 제외한다. 다음 단계에서 쓰기 요청에 인증을 붙인다.

## ⑤ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| Unexpected end of JSON input | 204 응답에 json() 사용 | 204는 null 반환 |
| fetch가 file://에서 실패 | 로컬 파일 보안 정책·ESM 제한 | Live Server 또는 npm run dev로 HTTP 접속 |
| 연결 파일이 새로 생김 | 상대경로 기준 작업 폴더가 바뀜 | 저장소 루트에서 실행하고 SQLITE_PATH 확인 |

## ⑥ 직접 해보기

1. 정적 skills.json의 name을 바꾸고 화면을 다시 읽는다.
2. 로그인 후 POST·PATCH·DELETE 응답 코드와 Location 헤더를 기록한다.
3. q·page·limit·sort를 바꾸어 목록 meta가 일치하는지 계산한다.

## ⑦ ☐ 체크리스트

학습자 수행 확인용이다. 문서·코드 작성 완료와 본인의 실습 완료는 다르므로 직접 확인한 뒤 체크한다. 원문 항목 배치는 [반영표](docs/coverage.md)를 따른다.

- [ ] fetch, Promise, async/await
- [ ] fetch + async/await + try/catch
- [ ] file:// 대신 HTTP 서버로 ESM과 fetch를 실행한다
- [ ] 목록·상세·등록·수정·삭제와 오류 응답을 확인한다
- [ ] fetch("data/skills.json")는 HTML을 더블클릭(file://)으로 열면 브라우저가 막는다. Live Server 같은 로컬 서버로 열어야 한다 (study6.md). ESM import도 같은 이유로 서버가 필요하다.

## ⑧ 다음 단계 연결

[study7.md](study7.md)에서 인증·보안 기초로 이어간다.

출처: [지정 노션](https://app.notion.com/p/3d6d7dec5e2e8147b212f0a23b93dfc1) · [공통 API v1](https://app.notion.com/p/3d6d7dec5e2e8139adbfd36dd506c65e) · [반영표](docs/coverage.md) · [검증 기록](docs/verification.md). 기술 근거: [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [Node 24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html). 설치 버전 API는 package-lock.json과 node_modules의 버전별 공식 문서를 기준으로 확인한다.
