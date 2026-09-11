# Study 6. CSS · JS 실습 2 — 다크모드, fetch, 모듈

> 목표: CSS 변수로 다크모드를 만들고, `fetch`로 외부 데이터를 불러와 화면을 채우고, JS 파일들을 ESM 모듈로 정리한다. 완성 파일: [practice/site/js/](practice/site/js/), [practice/site/data/skills.json](practice/site/data/skills.json).

## 6.1 CSS 변수로 다크모드 만들기

study4에서 만든 색상들을 `:root`의 CSS 변수로 두고, `data-theme="dark"`일 때 값만 바꿔치기한다.

```css
:root {
  --color-bg: #ffffff;
  --color-text: #1b1f23;
  --color-primary: #3b6fd6;
}

[data-theme="dark"] {
  --color-bg: #14161a;
  --color-text: #edf0f3;
  --color-primary: #6c9bf0;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
}
```

`<html data-theme="dark">`처럼 최상위 요소에 속성 하나만 바꾸면, 이 속성을 참조하는 모든 CSS 변수가 한 번에 바뀐다 — 색상을 하나씩 바꾸는 것보다 훨씬 적은 코드로 테마 전체를 바꿀 수 있다.

## 6.2 JS로 테마 토글 + localStorage에 저장

```js
const STORAGE_KEY = "site-theme";

export function initTheme() {
  const toggle = document.getElementById("theme-toggle");
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }

  toggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem(STORAGE_KEY, "light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem(STORAGE_KEY, "dark");
    }
  });
}
```

- `localStorage`는 브라우저에 키-값을 영구 저장하는 저장소다 (탭을 닫아도, 새로고침해도 유지된다). `localStorage.setItem(key, value)`로 저장, `localStorage.getItem(key)`로 읽는다. **문자열만** 저장할 수 있다 (객체/배열은 `JSON.stringify`/`JSON.parse`가 필요 — 6.5의 Todo에서 다시 나온다).
- 전체 코드: [practice/site/js/theme.js](practice/site/js/theme.js).

## 6.3 Promise와 async/await

```js
// Promise: "나중에 끝날 작업"을 표현하는 객체
fetch("data/skills.json")
  .then((response) => response.json())
  .then((skills) => console.log(skills))
  .catch((error) => console.error(error));

// 같은 내용을 async/await로 (더 읽기 쉬움)
async function loadSkills() {
  try {
    const response = await fetch("data/skills.json");
    const skills = await response.json();
    console.log(skills);
  } catch (error) {
    console.error(error);
  }
}
```

- `fetch(주소)`는 네트워크(또는 로컬 서버)에 요청을 보내고 `Promise`를 돌려준다.
- `await`는 "이 Promise가 끝날 때까지 기다렸다가 다음 줄로 진행"을 의미한다. `await`는 `async` 함수 안에서만 쓸 수 있다.
- `try/catch`로 요청이 실패했을 때(파일 없음, 네트워크 오류 등)를 대비한다.

> **주의**: `fetch("data/skills.json")`처럼 로컬 파일을 불러오는 코드는 HTML 파일을 `file://`로 더블클릭해서 열면 브라우저가 막을 수 있다. study0에서 언급한 대로 **Live Server 같은 로컬 서버로 열어야** 정상 동작한다.

## 6.4 실습 — `about.html`의 "관심 기술"을 fetch로 채우기

1. [practice/site/data/skills.json](practice/site/data/skills.json)처럼 간단한 JSON 배열 파일을 만든다.

   ```json
   [
     { "name": "HTML", "level": "연습 중" },
     { "name": "CSS", "level": "연습 중" }
   ]
   ```

2. `about.html`의 스킬 목록을 `<ul id="skills-list"><li>불러오는 중...</li></ul>`처럼 비워둔다.
3. JS에서 fetch로 불러와 `<li>`를 직접 만들어 채운다.

   ```js
   export async function renderSkills() {
     const list = document.getElementById("skills-list");

     try {
       const response = await fetch("data/skills.json");
       const skills = await response.json();

       list.innerHTML = "";
       skills.forEach((skill) => {
         const li = document.createElement("li");
         li.textContent = `${skill.name} · ${skill.level}`;
         list.appendChild(li);
       });
     } catch (error) {
       list.innerHTML = "<li>목록을 불러오지 못했습니다.</li>";
     }
   }
   ```

   전체 코드: [practice/site/js/data.js](practice/site/js/data.js).

이 패턴 — "데이터를 fetch로 받아서, 그 데이터로 DOM을 다시 그린다" — 이 바로 Vue/React 같은 프레임워크가 자동화해주는 일이다. 지금은 그 아래 깔린 원리를 직접 손으로 해보는 것이다.

## 6.5 ESM 모듈로 JS 파일 나누기

study5에서 한 파일에 다 몰아넣었던 코드를, 역할별 파일로 나눈다.

```
js/
├── theme.js    export function initTheme() { ... }
├── nav.js      export function initNav() { ... }
├── validate.js export function initContactForm() { ... }
├── data.js     export async function renderSkills() { ... }
└── main.js     (진입점)
```

```js
// main.js
import { initTheme } from "./theme.js";
import { initNav } from "./nav.js";
import { initContactForm } from "./validate.js";
import { renderSkills } from "./data.js";

initTheme();
initNav();
initContactForm();
renderSkills();
```

```html
<script type="module" src="js/main.js"></script>
```

- `type="module"`을 쓰면 파일마다 독립된 범위(scope)를 가져서 변수 이름이 겹쳐도 충돌하지 않고, `import`/`export`로 필요한 것만 정확히 주고받는다.
- 각 함수(`initTheme`, `initNav`, `initContactForm`, `renderSkills`)는 필요한 요소(`#theme-toggle`, `#contact-form` 등)가 그 페이지에 없으면 조용히 아무것도 안 하게 만들어두면(`if (!el) return;`), **같은 `main.js` 하나를 세 페이지 모두에서 공유**할 수 있다 — `index.html`엔 폼이 없고 `contact.html`엔 스킬 목록이 없어도 에러 없이 동작하는 이유.

전체 구조는 [practice/site/js/main.js](practice/site/js/main.js)를 참고.

## 6.6 셀프 체크리스트

- [ ] 다크모드 버튼을 누르면 색이 바뀌고, 새로고침해도(또는 다른 페이지로 이동해도) 다크모드가 유지된다 (`localStorage` 확인)
- [ ] `about.html`을 열면 스킬 목록이 "불러오는 중..."에서 실제 목록으로 바뀐다
- [ ] Live Server로 열었을 때와 파일을 직접 더블클릭해서 열었을 때 `fetch` 동작이 다른 이유를 설명할 수 있다
- [ ] JS 파일을 역할별로 나누고 `import`/`export`로 연결했다

다음: [studyFinal.md](studyFinal.md) — HTML+CSS+JS 종합, Vanilla JS 웹 사이트 완성.
