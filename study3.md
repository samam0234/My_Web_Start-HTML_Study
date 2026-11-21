# study3 · HTML·CSS·JavaScript — 데이터·바인딩·로컬 저장

## ① 목표 한 줄

상태 변경 → 저장 → 다시 그리기 흐름으로 새로고침에 견디는 화면을 만든다.

## ② 📖 이론

state는 현재 화면을 결정하는 데이터다. DOM에 있는 숫자를 다시 읽어 상태로 삼기보다 count라는 변수 하나를 진실의 원천으로 삼는다. render 함수는 상태를 읽어 DOM에 반영한다. 이 과정에서는 데이터 바인딩을 직접 작성한다.

localStorage는 동일 origin에 속한 문자열 저장소다. 객체·배열은 JSON.stringify로 저장하고 JSON.parse로 복구한다. 파싱 성공과 자료형 검증은 별개다. '{}'는 올바른 JSON이지만 Todo 배열이 아니다. 따라서 배열인지, 각 항목에 text·done·id가 있는지도 확인해야 한다.

비밀번호·로그인 토큰·개인 문서를 localStorage에 넣지 않는다. 테마·연습용 Todo처럼 민감하지 않은 설정에 사용한다. 저장 공간 부족이나 브라우저 정책으로 getItem/setItem도 실패할 수 있으므로 try/catch로 화면은 계속 동작하게 한다. 저장소는 공용 DB가 아니며 다른 기기와 자동으로 동기화되지 않는다.

### 비유로 이해하기

상태는 원본 장부, DOM은 장부를 보고 쓴 게시판, localStorage는 장부를 보관하는 개인 서랍이다.

## ③ 🛠️ 실기: 전체 코드와 줄별 설명

1. /lessons/study3/에서 1 증가를 누르고 새로고침한다.
2. Application → Local Storage에서 study3-count를 확인한다.
3. 값을 잘못된 JSON으로 바꾼 후 새로고침하여 복구 문구를 본다.
4. /final-project/에서 Todo를 추가·완료·삭제하고 새로고침한다.

### `lessons/study3/index.html` 전체 코드

```html
<!doctype html>
<html lang="ko"><meta charset="utf-8"><title>상태와 저장</title><main><h1>저장되는 상태</h1><button id="add">1 증가</button><output id="count" aria-live="polite"></output><p id="error" role="status"></p></main><script type="module" src="state.js"></script></html>
```

원본: [lessons/study3/index.html](lessons/study3/index.html) · SHA-256(LF 정규화): `007e54c5fbdd7d82f14f609ae28d3a86928cc1351fdb72000532df9a38a6a2b1`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | HTML 표준 모드로 문서를 해석하도록 선언한다. |
| 2 | 문서 언어/루트 / 문자 인코딩·화면 배율·설명 / 브라우저 탭 제목 / 본문 / 최상위 제목 / 키보드 가능한 동작 / output 요소 / 설명·상태 메시지 / ESM 진입점 연결를 정의한다. |


### `lessons/study3/state.js` 전체 코드

```javascript
const key = 'study3-count'; // origin별 저장 키다.
let count = 0; // 메모리에서 변하는 상태다.
try { const saved = JSON.parse(localStorage.getItem(key)); if (Number.isSafeInteger(saved) && saved >= 0) count = saved; }
catch { document.getElementById('error').textContent = '저장값이 손상되어 0부터 시작합니다.'; }
const render = () => { document.getElementById('count').textContent = String(count); }; // 수동 바인딩이다.
document.getElementById('add').addEventListener('click', () => {
  count += 1; // 먼저 상태를 바꾼다.
  try { localStorage.setItem(key, JSON.stringify(count)); } // 문자열로 저장한다.
  catch { document.getElementById('error').textContent = '저장이 차단되었습니다. 현재 탭에서만 유지됩니다.'; }
  render(); // 바뀐 상태로 화면을 그린다.
});
render(); // 초기 표시다.
```

원본: [lessons/study3/state.js](lessons/study3/state.js) · SHA-256(LF 정규화): `91ab8126b4f03976cc66b1c3e36ad2eb829bccf62b802aba2339277ac7dc4bf7`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | `key`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 2 | 메모리에서 변하는 상태다. |
| 3 | 직렬화된 문자열을 객체로 복구한다. 잘못된 형식은 예외 경로로 보낸다. |
| 4 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 5 | 수동 바인딩이다. |
| 6 | 사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다. |
| 7 | 먼저 상태를 바꾼다. |
| 8 | 문자열로 저장한다. |
| 9 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 10 | 바뀐 상태로 화면을 그린다. |
| 11 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 12 | 초기 표시다. |


### `final-project/js/todo.js` 전체 코드

```javascript
const STORAGE_KEY = "final-project-todos";

function loadTodos() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(value) ? value.filter(todo => todo && typeof todo.text === 'string' && typeof todo.done === 'boolean' && Number.isFinite(todo.id)) : [];
  } catch {
    return [];
  }
}

function saveTodos(todos) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)); }
  catch { console.warn('Todo 저장이 차단되어 현재 탭에서만 유지됩니다.'); }
}

export function initTodo() {
  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const list = document.getElementById("todo-list");
  const emptyMsg = document.getElementById("todo-empty");
  if (!form || !list) return;

  let todos = loadTodos();

  function render() {
    list.innerHTML = "";
    emptyMsg.classList.toggle("is-hidden", todos.length > 0);

    todos.forEach((todo) => {
      const li = document.createElement("li");
      li.className = "todo-item" + (todo.done ? " is-done" : "");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = todo.done;
      checkbox.setAttribute('aria-label', `${todo.text} 완료`);
      checkbox.addEventListener("change", () => {
        todo.done = checkbox.checked;
        saveTodos(todos);
        render();
      });

      const span = document.createElement("span");
      span.className = "todo-text";
      span.textContent = todo.text;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "todo-delete";
      deleteBtn.textContent = "✕";
      deleteBtn.setAttribute("aria-label", "삭제");
      deleteBtn.addEventListener("click", () => {
        todos = todos.filter((t) => t.id !== todo.id);
        saveTodos(todos);
        render();
      });

      li.append(checkbox, span, deleteBtn);
      list.appendChild(li);
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    todos.push({ id: Date.now(), text, done: false });
    saveTodos(todos);
    input.value = "";
    render();
  });

  render();
}
```

원본: [final-project/js/todo.js](final-project/js/todo.js) · SHA-256(LF 정규화): `d01b44f78770dd0c9c49fa1e3244b81fbf281cd5d28120b864d83b9434f7ff8a`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | `STORAGE_KEY`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 3 | 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 4 | 현재 처리의 설정·호출·상태를 연결한다: `try {` |
| 5 | 직렬화된 문자열을 객체로 복구한다. 잘못된 형식은 예외 경로로 보낸다. |
| 6 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 7 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 8 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 9 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 10 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 12 | 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 13 | 객체를 JSON 문자열로 바꿔 저장·전송·관찰한다. |
| 14 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 15 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 17 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 18 | `form`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 19 | `input`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 20 | `list`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 21 | `emptyMsg`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 22 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!form // !list) return; |
| 24 | `todos`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 26 | 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 27 | 현재 처리의 설정·호출·상태를 연결한다: `list.innerHTML = "";` |
| 28 | 현재 처리의 설정·호출·상태를 연결한다: `emptyMsg.classList.toggle("is-hidden", todos.length > 0);` |
| 30 | 현재 처리의 설정·호출·상태를 연결한다: `todos.forEach((todo) => {` |
| 31 | `li`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 32 | 현재 처리의 설정·호출·상태를 연결한다: `li.className = "todo-item" + (todo.done ? " is-done" : "");` |
| 34 | `checkbox`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 35 | 현재 처리의 설정·호출·상태를 연결한다: `checkbox.type = "checkbox";` |
| 36 | 현재 처리의 설정·호출·상태를 연결한다: `checkbox.checked = todo.done;` |
| 37 | 현재 처리의 설정·호출·상태를 연결한다: `checkbox.setAttribute('aria-label', ${todo.text} 완료);` |
| 38 | 사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다. |
| 39 | 현재 처리의 설정·호출·상태를 연결한다: `todo.done = checkbox.checked;` |
| 40 | 현재 처리의 설정·호출·상태를 연결한다: `saveTodos(todos);` |
| 41 | 현재 처리의 설정·호출·상태를 연결한다: `render();` |
| 42 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 44 | `span`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 45 | 현재 처리의 설정·호출·상태를 연결한다: `span.className = "todo-text";` |
| 46 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 48 | `deleteBtn`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 49 | 현재 처리의 설정·호출·상태를 연결한다: `deleteBtn.className = "todo-delete";` |
| 50 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 51 | 현재 처리의 설정·호출·상태를 연결한다: `deleteBtn.setAttribute("aria-label", "삭제");` |
| 52 | 사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다. |
| 53 | 현재 처리의 설정·호출·상태를 연결한다: `todos = todos.filter((t) => t.id !== todo.id);` |
| 54 | 현재 처리의 설정·호출·상태를 연결한다: `saveTodos(todos);` |
| 55 | 현재 처리의 설정·호출·상태를 연결한다: `render();` |
| 56 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 58 | 데이터로 만든 DOM 요소를 부모에 삽입하거나 기존 화면을 교체한다. |
| 59 | 데이터로 만든 DOM 요소를 부모에 삽입하거나 기존 화면을 교체한다. |
| 60 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 61 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 63 | 사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다. |
| 64 | 현재 처리의 설정·호출·상태를 연결한다: `event.preventDefault();` |
| 65 | `text`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 66 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!text) return; |
| 68 | 현재 처리의 설정·호출·상태를 연결한다: `todos.push({ id: Date.now(), text, done: false });` |
| 69 | 현재 처리의 설정·호출·상태를 연결한다: `saveTodos(todos);` |
| 70 | 현재 처리의 설정·호출·상태를 연결한다: `input.value = "";` |
| 71 | 현재 처리의 설정·호출·상태를 연결한다: `render();` |
| 72 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 74 | 현재 처리의 설정·호출·상태를 연결한다: `render();` |
| 75 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `final-project/js/theme.js` 전체 코드

```javascript
const STORAGE_KEY = "final-project-theme";

export function initTheme() {
  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    toggle.textContent = "☀️";
  }

  toggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem(STORAGE_KEY, "light");
      toggle.textContent = "🌙";
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem(STORAGE_KEY, "dark");
      toggle.textContent = "☀️";
    }
  });
}
```

원본: [final-project/js/theme.js](final-project/js/theme.js) · SHA-256(LF 정규화): `7ac8f6c55876b8a6cfb273f202733ff44772bbcb9c029ad71445f1a6c0d19e6d`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | `STORAGE_KEY`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 3 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 4 | `toggle`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 5 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!toggle) return; |
| 7 | `saved`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 8 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (saved === "dark") { |
| 9 | 현재 처리의 설정·호출·상태를 연결한다: `document.documentElement.setAttribute("data-theme", "dark");` |
| 10 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 11 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 13 | 사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다. |
| 14 | `isDark`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 15 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (isDark) { |
| 16 | 현재 처리의 설정·호출·상태를 연결한다: `document.documentElement.removeAttribute("data-theme");` |
| 17 | 현재 처리의 설정·호출·상태를 연결한다: `localStorage.setItem(STORAGE_KEY, "light");` |
| 18 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 19 | 현재 처리의 설정·호출·상태를 연결한다: `} else {` |
| 20 | 현재 처리의 설정·호출·상태를 연결한다: `document.documentElement.setAttribute("data-theme", "dark");` |
| 21 | 현재 처리의 설정·호출·상태를 연결한다: `localStorage.setItem(STORAGE_KEY, "dark");` |
| 22 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 23 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 24 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 25 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `final-project/js/app.js` 전체 코드

```javascript
import { initTheme } from "./theme.js";
import { initTodo } from "./todo.js";

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const messageEl = document.getElementById("form-message");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();

    if (!name || !email) {
      messageEl.textContent = "이름과 이메일을 입력해주세요.";
      messageEl.className = "form-message error";
      return;
    }

    messageEl.textContent = `${name}님, 메시지가 접수되었습니다 (데모용, 실제 전송 없음).`;
    messageEl.className = "form-message success";
    form.reset();
  });
}

initTheme();
initTodo();
initContactForm();
```

원본: [final-project/js/app.js](final-project/js/app.js) · SHA-256(LF 정규화): `1d4816e544af9e34c13c73ede7c612d7b36a9abc2ed531780bd193c8455f562c`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 2 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 4 | 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 5 | `form`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 6 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!form) return; |
| 7 | `messageEl`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 9 | 사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다. |
| 10 | 현재 처리의 설정·호출·상태를 연결한다: `event.preventDefault();` |
| 11 | `name`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 12 | `email`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 14 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!name // !email) { |
| 15 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 16 | 현재 처리의 설정·호출·상태를 연결한다: `messageEl.className = "form-message error";` |
| 17 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 18 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 20 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 21 | 현재 처리의 설정·호출·상태를 연결한다: `messageEl.className = "form-message success";` |
| 22 | 현재 처리의 설정·호출·상태를 연결한다: `form.reset();` |
| 23 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 24 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 26 | 현재 처리의 설정·호출·상태를 연결한다: `initTheme();` |
| 27 | 현재 처리의 설정·호출·상태를 연결한다: `initTodo();` |
| 28 | 현재 처리의 설정·호출·상태를 연결한다: `initContactForm();` |


## ④ 🔗 연동 포인트

로컬 state → JSON 문자열 → localStorage → 초기 state → render로 연결된다. 서버와 공유할 자료는 다음 CRUD 단계에서 API와 DB로 옮긴다. 테마는 CSS 변수와 data-theme 속성으로 연결한다.

## ⑤ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| JSON.parse 예외 | 저장 문자열 손상 | try/catch 후 기본 상태 |
| todos.forEach is not a function | JSON이 배열이 아님 | Array.isArray와 항목 스키마 검증 |
| 다른 포트에서 목록이 안 보임 | origin별 저장소가 다름 | 같은 프로토콜·호스트·포트로 접속 |

## ⑥ 직접 해보기

1. 감소 버튼을 추가하고 0 아래로 내려가지 않게 한다.
2. localStorage에 []·{}·깨진 JSON을 각각 넣어 결과를 기록한다.
3. 테마 토글 후 다른 페이지에서도 같은 키를 사용하도록 연결한다.

## ⑦ ☐ 체크리스트

학습자 수행 확인용이다. 문서·코드 작성 완료와 본인의 실습 완료는 다르므로 직접 확인한 뒤 체크한다. 원문 항목 배치는 [반영표](docs/coverage.md)를 따른다.

- [ ] localStorage 저장 + 다시 그리기
- [ ] 다크모드 토글
- [ ] localStorage 값이 깨지면 JSON.parse가 예외를 던진다 → try/catch로 복구
- [ ] 상태·저장·렌더링을 구분한다
- [ ] Vanilla JS Todo: localStorage 저장 + 다시 그리기
- [ ] 상태(Todo, 테마)는 localStorage에 JSON 문자열로 저장하고, 바뀔 때마다 render()로 목록을 다시 그린다.
- [ ] localStorage 값이 깨져 있으면 JSON.parse가 예외를 던진다 → loadTodos를 try/catch로 감싸 빈 배열로 복구.

## ⑧ 다음 단계 연결

[study4.md](study4.md)에서 라우팅과 요청·응답로 이어간다.

출처: [지정 노션](https://app.notion.com/p/3d6d7dec5e2e8147b212f0a23b93dfc1) · [공통 API v1](https://app.notion.com/p/3d6d7dec5e2e8139adbfd36dd506c65e) · [반영표](docs/coverage.md) · [검증 기록](docs/verification.md). 기술 근거: [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [Node 24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html). 설치 버전 API는 package-lock.json과 node_modules의 버전별 공식 문서를 기준으로 확인한다.
