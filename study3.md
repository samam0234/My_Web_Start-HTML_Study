# Study 3. HTML 실습 2 — `about.html`, `contact.html`과 폼

> 목표: 페이지를 2개 더 만들고 서로 링크로 연결해서, 진짜 "여러 장짜리 웹 사이트"를 완성한다. 완성 파일: [practice/site/about.html](practice/site/about.html), [practice/site/contact.html](practice/site/contact.html).

## 3.1 `about.html` 만들기

1. `index.html`의 `<header>`(로고+nav)를 그대로 복사해서 `about.html`에 붙여넣는다. — 사이트의 모든 페이지는 같은 메뉴를 가져야 사용자가 길을 잃지 않는다.
2. `<main>`에 "About" 제목과 자기소개 문단을 추가한다.
3. "관심 기술" 같은 `<section>`을 추가하고, 일단은 `<ul><li>HTML</li>...</ul>`처럼 직접 목록을 적는다.
   - 참고로 완성본([practice/site/about.html](practice/site/about.html))에서는 이 목록을 `id="skills-list"`로 비워두고 JS(`fetch`)로 채운다 — 그건 study6에서 할 내용이니 지금은 그냥 `<li>`를 직접 적어도 된다.
4. `<footer>`도 동일하게 복사한다.

## 3.2 `contact.html`과 폼 만들기

study1의 폼 이론을 적용해서 문의 폼을 만든다.

```html
<h1>Contact</h1>
<form>
  <div>
    <label for="name">이름</label>
    <input type="text" id="name" name="name" required>
  </div>
  <div>
    <label for="email">이메일</label>
    <input type="email" id="email" name="email" required>
  </div>
  <div>
    <label for="message">메시지</label>
    <textarea id="message" name="message" rows="4" required></textarea>
  </div>
  <button type="submit">보내기</button>
</form>
```

포인트:
- `label for`와 `input id`를 정확히 맞췄는지 확인한다 (레이블 클릭 시 입력창 포커스 여부로 테스트).
- `required`를 넣고, 빈 칸으로 "보내기"를 눌러서 브라우저가 기본으로 막아주는지 확인한다.
- 지금은 폼을 제출해도 어디로도 전송되지 않는다 (실제 서버가 없으니까 당연하다). study5에서 JS로 제출을 가로채 직접 검사하는 법을 배운다.

## 3.3 세 페이지를 서로 연결하기

- `index.html`, `about.html`, `contact.html` **세 파일 모두**의 `<nav>`가 동일한 3개 링크(Home/About/Contact)를 가지고 있는지 확인한다.
- 각 페이지를 열어서 메뉴의 모든 링크를 한 번씩 클릭해보며 이동이 되는지 확인한다. 이게 되면 "웹 사이트"가 완성된 것이다 — study0에서 정의한 "페이지 여러 장이 메뉴·링크로 연결된 전체".

## 3.4 완성본과 비교

[practice/site/](practice/site/) 폴더의 세 HTML 파일을 열어 비교한다. `nav-toggle`, `theme-toggle` 버튼, `<script type="module">`은 study5~6에서 추가되는 부분이니 지금은 무시하고, `<main>` 안의 구조와 `<form>` 구성만 비교한다.

## 3.5 셀프 체크리스트

- [ ] `index.html` → `about.html` → `contact.html` → `index.html` 순서로 메뉴만 눌러서 한 바퀴 돌 수 있다
- [ ] `contact.html`의 폼에서 `label`과 `input`의 `for`/`id`가 정확히 매칭된다
- [ ] 빈 칸으로 제출 시 브라우저 기본 유효성 검사 메시지가 뜬다
- [ ] 세 페이지 모두 같은 구조(header/nav/main/footer)로 통일되어 있다

다음: [study4.md](study4.md) — CSS 기초 및 실습 1 (이 3페이지를 꾸미기).
