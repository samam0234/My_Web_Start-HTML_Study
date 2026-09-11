# Study 2. HTML 실습 1 — `index.html` 만들기

> 목표: study1의 이론을 가지고, 실제로 동작하는 첫 페이지를 만든다. 완성 파일은 [practice/site/index.html](practice/site/index.html)에 있다 — 먼저 스스로 타이핑해보고, 막히면 참고한다.

## 2.1 실습 목표

`practice/site/index.html` — 소개(hero) + 메뉴(nav)가 있는 메인 페이지를 만든다.

## 2.2 단계별로 직접 만들어보기

1. `practice/site/index.html` 파일을 만들고 기본 골격을 쓴다.

   ```html
   <!DOCTYPE html>
   <html lang="ko">
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>Jinheng's Site — Home</title>
   </head>
   <body>
   </body>
   </html>
   ```

2. `<body>` 안에 `<header>`와 그 안에 로고, `<nav>`를 넣는다. 아직 about.html / contact.html이 없어도 링크는 미리 적어둔다.

   ```html
   <header>
     <a href="index.html">JH.log</a>
     <nav>
       <ul>
         <li><a href="index.html">Home</a></li>
         <li><a href="about.html">About</a></li>
         <li><a href="contact.html">Contact</a></li>
       </ul>
     </nav>
   </header>
   ```

3. `<main>` 안에 소개 영역(`<section>`)을 만들고 제목, 설명, 버튼 역할의 링크를 넣는다.

   ```html
   <main>
     <section>
       <h1>안녕하세요, 웹을 공부하는 중입니다 👋</h1>
       <p>이 페이지는 HTML → CSS → JavaScript 순서로 한 단계씩 쌓아 올린 실습 사이트입니다.</p>
       <a href="about.html">더 알아보기</a>
     </section>
   </main>
   ```

4. "이 사이트에서 연습한 것"을 `<ul>` 목록(HTML/CSS/JavaScript 각 1개 항목)으로 추가한다.
5. `<footer>`에 저작권 문구를 넣는다.
6. Live Server(또는 더블클릭)로 브라우저에서 열어 확인한다. 지금은 CSS가 없어서 못생긴 게 정상이다 — study4에서 꾸민다.

## 2.3 완성본과 비교하기

직접 만든 뒤 [practice/site/index.html](practice/site/index.html)을 열어 비교해본다. 이 완성본에는 `nav-toggle`, `theme-toggle` 버튼과 `<script type="module" src="js/main.js">` 같은, **아직 배우지 않은 study5~6 내용도 미리 들어가 있다** — 지금은 그 부분은 무시하고 `<header>`, `<nav>`, `<main>`, `<footer>` 구조만 비교하면 된다.

## 2.4 셀프 체크리스트

- [ ] `index.html`을 브라우저에서 열면 제목, 설명, 메뉴 3개(Home/About/Contact)가 보인다
- [ ] `<header>`, `<nav>`, `<main>`, `<footer>`를 구분해서 썼다
- [ ] `about.html`, `contact.html` 링크를 눌러도 아직 페이지가 없어서 에러가 나는 게 정상이라는 걸 이해했다 (study3에서 만든다)
- [ ] 개발자 도구(F12) → Elements 탭에서 내가 쓴 태그들이 트리 구조로 보이는 걸 확인했다

다음: [study3.md](study3.md) — HTML 실습 2 (`about.html`, `contact.html` 만들고 연결하기).
