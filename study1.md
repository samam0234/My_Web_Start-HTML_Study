# Study 1. HTML 기초

> 목표: 프레임워크 없이 HTML만으로 페이지 구조를 직접 쓸 수 있게 된다. 이 문서는 이론 중심이고, 실제로 손으로 치는 실습은 [study2.md](study2.md)부터 시작한다.

## 1.1 HTML 문서의 기본 골격

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>페이지 제목</title>
</head>
<body>
  <!-- 화면에 보이는 내용 -->
</body>
</html>
```

- `<!DOCTYPE html>`: "이 문서는 최신 HTML(HTML5) 문서다"라고 브라우저에게 알려줌. 항상 맨 위에 한 번만.
- `<html lang="ko">`: 문서 전체를 감싸는 태그. `lang`은 문서의 언어(검색엔진·스크린리더가 참고).
- `<head>`: 화면에 직접 보이지 않는 메타 정보 모음.
  - `<meta charset="UTF-8">`: 문자 인코딩. 한글이 깨지지 않게 하는 필수 설정.
  - `<meta name="viewport" ...>`: 모바일 화면 크기에 맞춰 레이아웃을 잡아줌 (반응형의 전제 조건).
  - `<title>`: 브라우저 탭에 표시되는 제목.
- `<body>`: 실제로 화면에 보이는 모든 내용이 들어가는 곳.

## 1.2 태그 / 요소 / 속성

- **태그(tag)**: `<p>`, `<img>` 처럼 꺾쇠로 감싼 표시.
- **요소(element)**: 여는 태그 + 내용 + 닫는 태그 전체. 예: `<p>안녕</p>`.
- **속성(attribute)**: 태그 안에 `이름="값"` 형태로 추가 정보를 주는 것. 예: `<a href="about.html">`의 `href`.
- `<img>`, `<input>`, `<br>`처럼 닫는 태그가 없는 "빈 요소(void element)"도 있다.

## 1.3 텍스트 관련 태그

```html
<h1>가장 중요한 제목</h1>
<h2>다음 수준 제목</h2>
<!-- h1~h6, 숫자가 클수록 덜 중요한 제목. 순서를 건너뛰지 않는 게 좋다 -->

<p>단락 하나. 문단을 나눌 때 사용한다.</p>

<p>이 단어는 <strong>중요</strong>하고, 이 단어는 <em>강조</em>한다.</p>

<hr> <!-- 구분선 -->
<br> <!-- 줄바꿈 (문단 안에서만 최소한으로 사용) -->
```

`<strong>`/`<em>`은 단순히 굵게/기울임 "모양"이 아니라 "의미상 중요/강조"를 뜻한다. 모양만 바꾸고 싶다면 CSS를 쓰는 게 맞다(study4).

## 1.4 목록

```html
<ul> <!-- 순서 없는 목록 -->
  <li>HTML</li>
  <li>CSS</li>
</ul>

<ol> <!-- 순서 있는 목록 -->
  <li>구조 먼저</li>
  <li>그 다음 표현</li>
</ol>
```

## 1.5 링크와 이미지

```html
<a href="about.html">소개 페이지로</a>
<a href="https://example.com" target="_blank" rel="noopener">외부 링크 (새 탭)</a>

<img src="logo.png" alt="회사 로고">
```

- `href`: 이동할 주소. 같은 폴더 안의 파일이면 `about.html`처럼 **상대 경로**로 쓰면 된다.
- `target="_blank"`: 새 탭에서 열기. 보안상 `rel="noopener"`를 함께 쓰는 것이 권장된다.
- `alt`: 이미지가 안 보일 때(로딩 실패, 스크린리더 사용자) 대신 읽히는 설명 텍스트. **접근성의 기본**이며, 장식용이 아닌 이미지엔 꼭 넣어야 한다.

## 1.6 표(Table)

```html
<table>
  <thead>
    <tr><th>이름</th><th>역할</th></tr>
  </thead>
  <tbody>
    <tr><td>HTML</td><td>구조</td></tr>
    <tr><td>CSS</td><td>표현</td></tr>
  </tbody>
</table>
```

표는 "표 형태의 데이터"에만 쓴다. 레이아웃(화면 배치)을 잡으려고 table을 쓰는 것은 옛날 방식이며, 지금은 CSS의 flex/grid를 쓴다(study4).

## 1.7 시맨틱 태그 — 왜 `<div>`만 쓰면 안 되는가

`<div>`는 아무 의미 없는 "그냥 상자"다. 대신 역할을 알려주는 태그를 쓰면:

```html
<header>상단 영역 (로고, 내비게이션)</header>
<nav>메뉴 링크 모음</nav>
<main>이 페이지의 핵심 내용 (문서당 보통 1개)</main>
<section>주제별로 묶은 구역</section>
<article>독립적으로 의미 있는 콘텐츠 (글 1개 등)</article>
<aside>본문과 별개인 부가 정보</aside>
<footer>하단 영역 (저작권, 연락처)</footer>
```

- 검색엔진이 문서 구조를 더 잘 이해한다 (SEO).
- 스크린리더 사용자가 "내비게이션으로 건너뛰기" 같은 탐색을 할 수 있다 (접근성).
- 코드를 읽는 사람(미래의 나 포함)이 구조를 바로 파악한다.

## 1.8 폼(Form) 요소

```html
<form>
  <div>
    <label for="email">이메일</label>
    <input type="email" id="email" name="email" required>
  </div>
  <div>
    <label for="message">메시지</label>
    <textarea id="message" name="message"></textarea>
  </div>
  <button type="submit">보내기</button>
</form>
```

- `<label for="email">` + `<input id="email">`: `for`와 `id`를 똑같이 맞춰야 레이블을 클릭해도 입력창이 포커스된다. 접근성의 핵심.
- `type="email"`, `type="text"`, `type="checkbox"` 등 `input`의 종류를 정한다.
- `required`: 브라우저 기본 필수 입력 검사 (study5에서 JS로 직접 검사하는 법도 다룬다).
- `<button type="submit">`: 폼을 제출하는 버튼. `type="button"`이면 제출하지 않고 그냥 클릭 이벤트만 발생.

## 1.9 여러 문서를 링크로 연결해 "사이트"처럼 만들기

같은 폴더에 `index.html`, `about.html`, `contact.html`이 있다면:

```html
<nav>
  <a href="index.html">Home</a>
  <a href="about.html">About</a>
  <a href="contact.html">Contact</a>
</nav>
```

이 `<nav>`를 세 파일 모두에 똑같이 넣어두면, 사용자가 어느 페이지에서든 다른 페이지로 이동할 수 있는 "사이트"가 완성된다. study2~3에서 이것을 직접 만든다.

## 1.10 체크리스트

- [ ] `<!DOCTYPE html>`, `html`, `head`, `body`의 역할을 설명할 수 있다
- [ ] 제목(`h1~h6`)·단락·목록·링크·이미지·표를 직접 쓸 수 있다
- [ ] `header`, `nav`, `main`, `section`, `footer` 같은 시맨틱 태그를 쓰는 이유를 설명할 수 있다
- [ ] `input`, `label`, `button`으로 간단한 폼을 만들 수 있다
- [ ] 여러 HTML 파일을 링크로 이어서 사이트처럼 만들 수 있다

다음: [study2.md](study2.md) — HTML 실습 1 (`index.html` 만들기).
