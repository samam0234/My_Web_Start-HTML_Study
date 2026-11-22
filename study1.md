# study1 · HTML·CSS·JavaScript — Hello World와 기본 문법

## ① 목표 한 줄

시맨틱 HTML과 CSS로 첫 화면을 만들고 JavaScript 함수로 인사를 바꾼다.

## ② 📖 이론

HTML 요소는 여는 태그·속성·내용·닫는 태그로 구성된다. header/nav/main/section/footer는 문서의 의미를 나타내므로 검색 엔진과 보조기술이 구조를 읽을 수 있다. 제목은 h1부터 계층을 지키고, 이미지에는 의미 있는 alt, 폼에는 for/id가 맞는 label을 둔다. 표는 caption과 th의 scope로 행·열 관계를 전달한다.

CSS는 선택자로 요소를 골라 속성을 적용한다. 클래스는 역할을 기준으로 이름 짓고 id는 문서에서 유일하게 쓴다. 박스는 content·padding·border·margin으로 구성된다. border-box는 폭 계산에 padding과 border를 포함한다. 한 줄 배치는 flex, 행·열 배치는 grid를 사용한다. viewport와 640px 미디어쿼리로 좁은 화면에서 배치를 바꾼다.

const는 재할당하지 않는 변수이고 let은 재할당 가능한 변수다. 문자열·숫자·불리언·null과 배열·객체를 구분한다. 배열은 순서가 있는 서랍, 객체는 이름표가 있는 서랍장이다. 함수는 입력을 결과로 바꾼다. `${name}`은 JS 템플릿 리터럴이며 HTML 자체가 이 표현을 자동 평가하지 않는다.

DOM을 찾아 textContent에 결과를 넣으면 화면이 바뀐다. 모듈 스크립트는 import를 쓸 수 있고 문서 파싱 이후 실행된다. 브라우저 DevTools는 원본 파일과 실제 DOM을 함께 비교하는 관찰 도구다.

### 비유로 이해하기

HTML 태그는 문서의 뼈대, CSS 선택자는 꾸밀 대상을 가리키는 이름표, 함수는 입력을 결과로 바꾸는 작은 기계다.

## ③ 🛠️ 실기: 전체 코드와 줄별 설명

1. npm run dev 후 /lessons/study1/을 연다.
2. 이름을 입력하고 인사 버튼을 누른다.
3. Elements에서 h1·label·표 헤더를 확인하고 Console에서 skills 같은 모듈 내부 변수는 전역이 아님을 확인한다.
4. Live Server로 이 정적 폴더를 별도로 열어 파일 저장 후 자동 새로고침을 본다. Node 개발 서버에서는 직접 새로고침한다.



### 단계별 실행 위치

`npm run dev` 후 `/lessons/study1/`에서 이 단계의 실습을 연다. [실습 HTML](lessons/study1/index.html)과 [전체 실습 목차](lessons/index.html)를 사용한다. 기초 중간 프로젝트 전체 화면은 `npm run midpoint` 후 `/midpoint/`에서 실행한다. 터미널 전용 DB·Docker·MCP 명령은 해당 문서의 실행 순서를 따른다.

### `lessons/study1/index.html` 전체 코드

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Hello Web</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header><h1>나의 첫 웹 페이지</h1><nav aria-label="주 메뉴"><a href="/practice/site/about.html">소개</a></nav></header>
  <main>
    <section aria-labelledby="hello"><h2 id="hello">Hello World</h2><p id="greeting"></p></section>
    <figure><img src="avatar.svg" width="80" height="80" alt="파란 원 안에 JS라고 적힌 학습 로고"><figcaption>학습 로고</figcaption></figure>
    <table><caption>기술별 역할</caption><thead><tr><th scope="col">기술</th><th scope="col">역할</th></tr></thead><tbody><tr><th scope="row">HTML</th><td>구조</td></tr><tr><th scope="row">CSS</th><td>표현</td></tr><tr><th scope="row">JS</th><td>동작</td></tr></tbody></table>
    <form id="hello-form"><label for="name">이름</label><input id="name" name="name" required><button>인사</button></form>
  </main>
  <footer>HTML · CSS · JavaScript</footer>
  <script type="module" src="hello.js"></script>
</body>
</html>
```

원본: [lessons/study1/index.html](lessons/study1/index.html) · SHA-256(LF 정규화): `8cd7d0fa19edae8953ac8b6bac9bc3c1cddb6870dcdf95a5d53e09202c567715`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | HTML 표준 모드로 문서를 해석하도록 선언한다. |
| 2 | 문서 언어/루트를 정의한다. |
| 3 | 메타정보를 정의한다. |
| 4 | 문자 인코딩·화면 배율·설명를 정의한다. |
| 5 | 문자 인코딩·화면 배율·설명를 정의한다. |
| 6 | 브라우저 탭 제목를 정의한다. |
| 7 | 공통 CSS 연결를 정의한다. |
| 8 | 현재 HTML 요소를 닫는다. |
| 9 | body 요소를 정의한다. |
| 10 | 머리말 / 최상위 제목 / 탐색 링크 / URL·해시 이동를 정의한다. |
| 11 | 본문를 정의한다. |
| 12 | 주제 구역 / 구역 제목 / 설명·상태 메시지를 정의한다. |
| 13 | figure 요소 / 대체 텍스트를 가진 이미지 / figcaption 요소를 정의한다. |
| 14 | 행·열 자료 / caption 요소 / thead 요소 / tr 요소 / th 요소 / tbody 요소 / td 요소를 정의한다. |
| 15 | 입력 제출 단위 / 입력의 접근 가능한 이름 / 사용자 입력 / 키보드 가능한 동작를 정의한다. |
| 16 | 현재 HTML 요소를 닫는다. |
| 17 | footer 요소를 정의한다. |
| 18 | ESM 진입점 연결를 정의한다. |
| 19 | 현재 HTML 요소를 닫는다. |
| 20 | 현재 HTML 요소를 닫는다. |


### `lessons/study1/style.css` 전체 코드

```css
:root { --accent: #2353bc; } /* 디자인 값을 한곳에 둔다. */
* { box-sizing: border-box; } /* width에 padding과 border를 포함한다. */
body { max-width: 50rem; padding: 1rem; margin: auto; font: 1rem/1.6 system-ui; }
header { display: flex; align-items: center; justify-content: space-between; } /* 한 줄 배치다. */
main { display: grid; gap: 1rem; } /* 행과 열을 제어하는 격자다. */
th, td { border: 1px solid #888; padding: .5rem; }
button { color: white; background: var(--accent); padding: .5rem; }
@media (max-width: 640px) { header { display: block; } } /* 좁은 화면에서는 세로로 배치한다. */
```

원본: [lessons/study1/style.css](lessons/study1/style.css) · SHA-256(LF 정규화): `390f1e4ba23955cd834e1c1f2a82b40719296562a52bac475410552b395e90df`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | CSS 사용자 속성 규칙을 이 선택자에 적용한다. |
| 2 | 박스 폭 계산·내부 여백·폭 제한 규칙을 이 선택자에 적용한다. |
| 3 | 내부 여백·외부 여백·폭 제한·글자 표현 규칙을 이 선택자에 적용한다. |
| 4 | 한 축 배치 규칙을 이 선택자에 적용한다. |
| 5 | 격자 배치 규칙을 이 선택자에 적용한다. |
| 6 | 내부 여백 규칙을 이 선택자에 적용한다. |
| 7 | CSS 사용자 속성·색상·테마·내부 여백 규칙을 이 선택자에 적용한다. |
| 8 | 화면/사용자 환경별 조건·폭 제한 규칙을 이 선택자에 적용한다. |


### `lessons/study1/hello.js` 전체 코드

```javascript
const skills = ['HTML', 'CSS', 'JavaScript']; // 배열은 순서 있는 목록이다.
const learner = { name: '학습자', count: skills.length }; // 객체는 이름 있는 값을 묶는다.
function greet(name) { return `${name}님, ${learner.count}가지 기술을 배웁니다.`; } // 템플릿 리터럴이다.
const output = document.getElementById('greeting'); // HTML 요소를 DOM 객체로 찾는다.
output.textContent = greet(learner.name); // 문자열을 안전하게 화면에 표시한다.
document.getElementById('hello-form').addEventListener('submit', event => {
  event.preventDefault(); // 기본 폼 탐색을 막는다.
  const name = new FormData(event.currentTarget).get('name').trim(); // 이름으로 입력값을 읽는다.
  output.textContent = greet(name); // 함수 결과를 다시 화면에 반영한다.
});
```

원본: [lessons/study1/hello.js](lessons/study1/hello.js) · SHA-256(LF 정규화): `610b62cba20708ab8b77dee4d38fd29a81a474766eeab1af408324b230e54e16`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 배열은 순서 있는 목록이다. |
| 2 | 객체는 이름 있는 값을 묶는다. |
| 3 | 템플릿 리터럴이다. |
| 4 | `output`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 5 | 문자열을 안전하게 화면에 표시한다. |
| 6 | 사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다. |
| 7 | 기본 폼 탐색을 막는다. |
| 8 | 이름으로 입력값을 읽는다. |
| 9 | 함수 결과를 다시 화면에 반영한다. |
| 10 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `lessons/study1/avatar.svg` 전체 코드

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="38" fill="#2353bc"/><text x="40" y="49" text-anchor="middle" font-size="26" fill="white">JS</text></svg>
```

원본: [lessons/study1/avatar.svg](lessons/study1/avatar.svg) · SHA-256(LF 정규화): `b14eec72da292d3a569c8ec9dfbac015d9f366d49a6d6623082efcee865b4c09`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | svg 요소 / circle 요소 / text 요소를 정의한다. |


## ④ 🔗 연동 포인트

첫 HTML → DOM 선택 → 함수 결과 출력으로 연결한다. 다음 단계에서는 함수 하나를 별도 파일로 옮겨 다른 화면에서도 호출한다.

## ⑤ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| ${name}이 그대로 보임 | HTML에 JS 표현을 직접 씀 | JS 템플릿 리터럴 결과를 textContent에 넣기 |
| 스타일이 적용 안 됨 | link 상대경로가 틀림 | Network에서 style.css 200 확인 |
| 폼 제출 시 새로고침 | 기본 submit 동작 | event.preventDefault() |

## ⑥ 직접 해보기

1. 인사 함수에 시간대를 받아 오전/오후 인사를 추가한다.
2. 표에 DOM 행을 추가하고 th/td 관계를 확인한다.
3. 개발자도구에서 390px로 바꾸어 flex 배치 변화를 확인한다.

## ⑦ ☐ 체크리스트

학습자 수행 확인용이다. 문서·코드 작성 완료와 본인의 실습 완료는 다르므로 직접 확인한 뒤 체크한다. 원문 항목 배치는 [반영표](docs/coverage.md)를 따른다.

- [ ] 시맨틱 태그, 폼, 테이블, 링크
- [ ] 접근성 기본 (label, alt)
- [ ] 박스 모델, flex, grid
- [ ] 반응형 기초
- [ ] 클래스를 의미 있게 나누는 법
- [ ] 변수, 함수, 배열/객체
- [ ] Hello World가 HTTP로 표시된다
- [ ] CSS 변수 + grid + 반응형

## ⑧ 다음 단계 연결

[study2.md](study2.md)에서 핵심 구조: 함수·ESM 모듈로 이어간다.

출처: [지정 노션](https://app.notion.com/p/3d6d7dec5e2e8147b212f0a23b93dfc1) · [공통 API v1](https://app.notion.com/p/3d6d7dec5e2e8139adbfd36dd506c65e) · [반영표](docs/coverage.md) · [검증 기록](docs/verification.md). 기술 근거: [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [Node 24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html). 설치 버전 API는 package-lock.json과 node_modules의 버전별 공식 문서를 기준으로 확인한다.
