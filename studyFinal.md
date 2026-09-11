# Study Final. HTML + CSS + JS 종합 — Vanilla JS 웹 사이트 만들기

> study0~6에서 배운 모든 것을 모아 하나의 실제 웹 사이트를 완성한다. 완성 프로젝트: [final-project/](final-project/) — `index.html`을 Live Server로 열면 바로 동작한다.

## F.1 지금까지 배운 것 정리

| 단계 | 배운 것 | 이 프로젝트에서 쓰인 곳 |
|---|---|---|
| study1~3 | 시맨틱 태그, 폼, 페이지 연결 | `header/nav/main/section/footer`, Contact 폼 |
| study4 | 박스 모델, flex, grid, 반응형, 클래스 네이밍 | `.header-inner`(flex), `.card-grid`(grid), 미디어쿼리 |
| study5 | 변수/함수, DOM, 이벤트, 폼 검사 | Todo 추가/삭제, Contact 폼 검사 |
| study6 | CSS 변수 다크모드, localStorage, ESM 모듈 | 다크모드 토글, Todo 저장, `theme.js`/`todo.js`/`app.js` |

이번엔 별도의 새 폴더 [final-project/](final-project/)에 **한 페이지(single page) 개인 사이트 + 할 일 관리 위젯**을 새로 만든다. `practice/site/`의 여러 페이지 구조와는 다르게, 이번엔 앵커 링크(`#home`, `#about` ...)로 한 페이지 안에서 이동하는 방식을 쓴다 — SPA의 가장 단순한 형태를 경험해보는 것이다.

## F.2 구조 한눈에 보기

```
final-project/
├── index.html        header(nav) + home/about/projects/todo/contact 섹션 + footer
├── css/style.css      CSS 변수 기반 라이트/다크 테마, flex/grid, 반응형
└── js/
    ├── theme.js       다크모드 토글 + localStorage
    ├── todo.js        할 일 추가/완료/삭제 + localStorage
    └── app.js         진입점 (theme, todo, contact-form 초기화)
```

## F.3 HTML — 한 페이지, 여러 섹션

```html
<nav>
  <ul>
    <li><a href="#home">Home</a></li>
    <li><a href="#about">About</a></li>
    <li><a href="#projects">Projects</a></li>
    <li><a href="#todo">Todo</a></li>
    <li><a href="#contact">Contact</a></li>
  </ul>
</nav>

<main>
  <section id="home">...</section>
  <section id="about">...</section>
  <section id="projects">...</section>
  <section id="todo">...</section>
  <section id="contact">...</section>
</main>
```

여러 `.html` 파일로 나누는 대신, `id`를 가진 `<section>`들을 한 파일에 쌓고 `<a href="#todo">`로 이동한다. CSS에서 `html { scroll-behavior: smooth; }`를 주면 점프 대신 부드럽게 스크롤된다. 전체 마크업은 [final-project/index.html](final-project/index.html) 참고.

## F.4 CSS — 변수, 레이아웃, 다크모드

study4~6의 패턴을 그대로 재사용한다:

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

.card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.todo-form { display: flex; gap: 0.5rem; }

@media (max-width: 640px) {
  .card-grid { grid-template-columns: 1fr; }
}
```

전체 스타일: [final-project/css/style.css](final-project/css/style.css).

## F.5 JS — Todo 위젯 직접 분석하기

이 프로젝트에서 가장 핵심적인 코드는 [final-project/js/todo.js](final-project/js/todo.js)다. 직접 열어서 아래 흐름을 따라가 본다:

1. **상태(state)**: `let todos = loadTodos();` — 할 일 목록을 배열로 메모리에 들고 있는다. 배열의 각 항목은 `{ id, text, done }` 객체.
2. **저장/불러오기**: `localStorage`에는 문자열만 저장되므로, 저장할 땐 `JSON.stringify(todos)`, 불러올 땐 `JSON.parse(...)`를 쓴다 (study6의 `localStorage` + 배열/객체를 합친 부분).
3. **렌더링(`render` 함수)**: `todos` 배열을 `forEach`로 돌면서, 매번 `<li>`를 `document.createElement`로 새로 만들어 화면에 다시 그린다. "데이터가 바뀌면 화면을 처음부터 다시 그린다"는 이 방식을 훨씬 효율적으로 자동화해주는 것이 바로 React/Vue다.
4. **이벤트 3종**:
   - 폼 `submit` → 새 할 일 추가
   - 체크박스 `change` → 완료 표시 토글
   - 삭제 버튼 `click` → 배열에서 제거 (`filter`로 해당 id만 빼고 새 배열 만들기)
5. 상태가 바뀔 때마다 `saveTodos(todos)`로 저장하고 `render()`로 화면을 다시 그리는 패턴이 반복된다 — **"상태를 바꾼다 → 저장한다 → 다시 그린다"**가 이 위젯 전체의 핵심 규칙이다.

`js/app.js`는 `theme.js`, `todo.js`를 `import`해서 실행하고, Contact 폼 검사 로직(study5와 동일한 패턴)도 함께 초기화한다.

## F.6 직접 실행하고 확인하기

1. VS Code에서 `final-project/index.html`을 Live Server로 연다 (또는 더블클릭으로 직접 열어도 이 프로젝트는 외부 JSON을 쓰지 않으므로 대부분 동작한다).
2. 상단 메뉴의 각 링크를 눌러 섹션으로 부드럽게 스크롤되는지 확인한다.
3. 🌙 버튼으로 다크모드를 켜고, 새로고침해도 유지되는지 확인한다.
4. Todo 섹션에서 할 일을 2~3개 추가하고, 체크하고, 하나를 삭제해본다. 새로고침해도 남아있는지 확인한다 (`localStorage` 확인).
5. Contact 폼에 빈 칸으로 제출 → 에러 메시지, 다 채우고 제출 → 성공 메시지를 확인한다.
6. F12 Console에 에러가 없는지 마지막으로 확인한다.

## F.7 확장 아이디어 (선택)

- Todo 항목에 "수정" 기능 추가하기 (`prompt()` 또는 인라인 `input`으로)
- `projects` 섹션 카드를 `data.json` + `fetch`로 불러오도록 study6 패턴 재사용하기
- 지금의 `final-project`를 그대로 Vue로 옮겨서, DOM을 직접 만들던 코드가 `v-for`, `v-model` 등으로 얼마나 짧아지는지 비교해보기 (다음 학습 단계 예고)
- 실제 폼 전송이 되도록 간단한 백엔드(Node/Express 등)를 붙여보기 (이 과정 범위 밖, 다음 단계)

## F.8 최종 체크리스트

- [ ] 프레임워크 없이 한 페이지짜리 사이트를 완성했다
- [ ] 시맨틱 태그 + flex/grid + 반응형으로 레이아웃을 구성했다
- [ ] localStorage로 "새로고침해도 유지되는" 상태(다크모드, Todo)를 만들었다
- [ ] JS 파일을 역할별 모듈로 나누고 `import`/`export`로 연결했다
- [ ] "상태를 바꾼다 → 저장한다 → 다시 그린다" 패턴을 내 말로 설명할 수 있다

여기까지가 study0 ~ studyFinal 과정이다. 다음 단계는 이 `final-project`와 같은 결과물을 Vue(또는 React)로 다시 만들어보며, 프레임워크가 정확히 무엇을 대신 해주는지 비교하는 것이다.
