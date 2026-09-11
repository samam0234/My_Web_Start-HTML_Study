# Study 5. JS 기초 및 실습 1

> 목표: 지금까지 만든 사이트에 첫 상호작용(모바일 메뉴 토글, 현재 페이지 강조, 폼 유효성 검사)을 추가한다. 완성 파일: [practice/site/js/nav.js](practice/site/js/nav.js), [practice/site/js/validate.js](practice/site/js/validate.js).

## 5.1 `<script>`는 어디에, 어떻게 넣나

```html
<body>
  ...
  <script src="js/script.js" defer></script>
</body>
```

- `</body>` 바로 앞에 두거나, `<head>`에 `defer` 속성을 붙여서 둔다 — 둘 다 "HTML을 다 읽은 뒤에 JS를 실행"하기 위함이다. HTML을 다 읽기 전에 JS가 실행되면 아직 존재하지 않는 요소를 찾다가 에러가 난다.
- 이 과정에서는 `type="module"`을 써서 여러 JS 파일을 `import`/`export`로 나눈다 (자세한 건 study6에서).

## 5.2 변수와 자료형

```js
let count = 0;       // 바뀔 수 있는 값
const name = "지헌";  // 바뀌지 않는 값 (기본적으로 const를 우선 사용)

const age = 20;             // number
const isStudent = true;     // boolean
const hobby = "coding";     // string
const empty = null;         // 값이 없음을 의도적으로 표시
```

## 5.3 함수

```js
function add(a, b) {       // 함수 선언식
  return a + b;
}

const add2 = (a, b) => a + b; // 화살표 함수 (짧게)

const greet = (name) => {
  console.log(`안녕, ${name}`); // 템플릿 리터럴 (백틱 + ${})
};
```

## 5.4 배열과 객체

```js
const skills = ["HTML", "CSS", "JS"];
skills.forEach((skill) => console.log(skill));

const user = { name: "지헌", level: "초급" };
console.log(user.name); // 점 표기법으로 접근
```

`forEach`는 배열의 각 항목에 대해 함수를 한 번씩 실행한다. study6에서 `fetch`로 받아온 배열을 화면에 그릴 때도 이 패턴을 그대로 쓴다.

## 5.5 DOM 선택과 조작

```js
const button = document.querySelector("#nav-toggle"); // CSS 선택자와 똑같은 문법
const links = document.querySelectorAll(".nav-link");  // 여러 개 선택

button.classList.add("is-open");     // 클래스 추가
button.classList.remove("is-open");  // 클래스 제거
button.classList.toggle("is-open");  // 있으면 빼고, 없으면 추가 (토글)

button.textContent = "닫기"; // 텍스트 변경
```

CSS로 미리 `.is-open { display: block; }` 같은 규칙을 만들어두고, JS는 그 **클래스를 붙이고 떼는 역할만** 한다 — "JS가 직접 스타일을 바꾼다"보다 "JS가 클래스를 토글하고, CSS가 실제 모양을 정한다"가 더 관리하기 쉬운 패턴이다.

## 5.6 이벤트

```js
button.addEventListener("click", () => {
  console.log("클릭됨!");
});

form.addEventListener("submit", (event) => {
  event.preventDefault(); // 폼의 기본 동작(페이지 새로고침/전송)을 막음
  // 여기서 직접 검사하거나 처리한다
});
```

## 5.7 실습 1 — 모바일 메뉴 토글 + 현재 페이지 강조

`practice/site/js/nav.js`에 있는 로직을 직접 따라 작성해본다.

```js
export function initNav() {
  const toggleBtn = document.getElementById("nav-toggle");
  const nav = document.getElementById("site-nav");

  toggleBtn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggleBtn.setAttribute("aria-expanded", String(isOpen));
  });

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
}
```

- `window.location.pathname`으로 "지금 이 주소가 어떤 파일인지" 알아내고, 같은 이름의 `href`를 가진 링크에 `.active` 클래스를 붙인다 — CSS의 `.nav-link.active`(study4에서 이미 정의됨)가 실제 강조 스타일을 담당한다.
- `export function`으로 만든 이유는 study6에서 여러 JS 파일을 모듈로 나누기 때문이다. 지금 단계에서는 "함수 하나를 만들고 실행한다"는 흐름만 이해하면 된다.

## 5.8 실습 2 — 폼 유효성 검사

`practice/site/js/validate.js`를 참고해서 `contact.html`의 폼 제출을 가로채 빈 칸을 검사한다.

```js
export function initContactForm() {
  const form = document.getElementById("contact-form");
  const messageEl = document.getElementById("form-message");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      messageEl.textContent = "모든 칸을 채워주세요.";
      messageEl.className = "form-message error";
      return;
    }

    messageEl.textContent = `${name}님, 감사합니다! (실제로 전송되지는 않았어요)`;
    messageEl.className = "form-message success";
    form.reset();
  });
}
```

- `form.name`, `form.email`, `form.message`처럼 `input`/`textarea`의 `name` 속성으로 바로 접근할 수 있다 (폼 안에서는 편의 문법).
- `.trim()`으로 앞뒤 공백만 입력한 경우도 "빈 값"으로 처리한다.
- 결과에 따라 `.form-message`에 `error`/`success` 클래스를 바꿔 붙이고, CSS(study4의 `.form-message.error`/`.success`)가 색을 정한다.

## 5.9 적용하기

두 함수를 실제로 실행하려면 `<script>`에서 불러와 호출해야 한다. 지금 단계에서는 간단히 한 파일(`script.js`)에 두 함수를 합쳐서 작성하고, 세 HTML 파일 끝에 `<script src="js/script.js" defer></script>`를 추가해 테스트해도 좋다. study6에서 이 코드를 `theme.js`/`nav.js`/`validate.js`/`data.js`/`main.js`로 나누는 "모듈" 구조로 정리한다.

## 5.10 셀프 체크리스트

- [ ] 브라우저를 좁게 만들면(또는 F12 반응형 보기) 메뉴 버튼이 나타나고, 클릭하면 메뉴가 열리고 닫힌다
- [ ] 지금 보고 있는 페이지의 메뉴 링크에 강조(active) 표시가 된다
- [ ] `contact.html`에서 빈 칸으로 제출하면 에러 메시지가, 다 채우고 제출하면 성공 메시지가 뜬다 (페이지가 새로고침되지 않아야 한다 — `preventDefault` 확인)
- [ ] F12 Console 탭에 에러가 없다

다음: [study6.md](study6.md) — CSS·JS 실습 2 (다크모드, fetch, 모듈로 정리).
