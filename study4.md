# Study 4. CSS 기초 및 실습 1

> 목표: study2~3에서 만든 3페이지 사이트를 CSS로 꾸민다. 완성 파일: [practice/site/css/style.css](practice/site/css/style.css).

## 4.1 CSS를 적용하는 3가지 방법

```html
<!-- 1. 인라인 (비권장: 재사용 불가, 우선순위 문제) -->
<p style="color: red;">...</p>

<!-- 2. 내부 스타일시트 -->
<head><style>p { color: red; }</style></head>

<!-- 3. 외부 스타일시트 (권장: 여러 페이지가 같은 css 파일을 공유) -->
<head><link rel="stylesheet" href="css/style.css"></head>
```

세 페이지(`index.html`, `about.html`, `contact.html`)가 똑같은 디자인을 공유해야 하므로 **외부 스타일시트 1개**를 만들어 세 파일 모두에서 `<link>`로 불러온다.

## 4.2 선택자(Selector)

```css
p { }              /* 태그 선택자: 모든 <p> */
.card { }          /* 클래스 선택자: class="card"인 모든 요소 */
#nav-toggle { }     /* id 선택자: id="nav-toggle"인 요소 1개 */
.site-nav ul { }    /* 자손 선택자: .site-nav 안의 모든 ul */
a:hover { }         /* 가상 클래스: 마우스를 올렸을 때 */
.nav-link.active { } /* 클래스 두 개를 동시에 만족 */
```

- id는 문서에서 한 번만 써야 하고, 클래스는 여러 요소에 재사용한다. 디자인은 보통 **클래스 기준**으로 작성한다.
- 클래스 이름은 의미가 드러나게 짓는다: `.card`, `.button`, `.form-field`처럼 "이게 뭔지"를 나타내는 이름. (`BEM`처럼 `block__element--modifier` 규칙을 쓰는 팀도 있지만, 지금은 `card`, `card-grid`처럼 간단한 이름으로 충분하다.)

## 4.3 박스 모델(Box Model)

모든 HTML 요소는 사각형 박스로 취급된다.

```
┌─────────────── margin ───────────────┐
│ ┌─────────── border ───────────┐     │
│ │ ┌──────── padding ────────┐  │     │
│ │ │        content           │  │     │
│ │ └──────────────────────────┘  │     │
│ └────────────────────────────────┘     │
└──────────────────────────────────────┘
```

- `content`: 실제 텍스트/이미지 영역. `width`/`height`로 조절.
- `padding`: 내용과 테두리 사이 여백.
- `border`: 테두리.
- `margin`: 이 박스와 다른 박스 사이의 바깥 여백.
- `box-sizing: border-box;`를 `*`(전체 선택자)에 걸어두면, `width`에 padding/border가 포함되어 계산이 훨씬 편해진다 — 실무에서 거의 항상 쓰는 설정.

```css
* { box-sizing: border-box; }
```

## 4.4 Flexbox 기초 — 가로 한 줄 배치

내비게이션 메뉴처럼 "가로로 나열"할 때 쓴다.

```css
.header-inner {
  display: flex;
  align-items: center;        /* 세로 중앙 정렬 */
  justify-content: space-between; /* 로고는 왼쪽, 메뉴는 오른쪽 끝으로 */
  gap: 1rem;                  /* 자식 요소 사이 간격 */
}
```

## 4.5 Grid 기초 — 카드 여러 개를 격자로

"이 사이트에서 연습한 것" 카드 3개처럼, 가로/세로 모두 격자로 배치할 때 쓴다.

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 똑같은 폭 3칸 */
  gap: 1rem;
}
```

> **Flex vs Grid 한 줄 요약**: 한 줄(방향 하나)을 배치하면 Flex, 격자(행과 열 둘 다)를 배치하면 Grid.

## 4.6 반응형 기초

```css
@media (max-width: 640px) {
  .card-grid { grid-template-columns: 1fr; } /* 화면이 좁으면 1칸으로 */
  .nav-toggle { display: inline-block; }     /* 좁을 때만 메뉴 버튼 보이기 */
}
```

- study1에서 넣은 `<meta name="viewport">`가 없으면 미디어쿼리가 제대로 동작하지 않는다 — 꼭 확인.
- 단위: `px`(고정), `%`(부모 기준 비율), `rem`(루트 글자 크기 기준, 접근성에 유리) — 이 과정에서는 주로 `rem`과 `%`를 섞어 쓴다.

## 4.7 실습: 3페이지 꾸미기

1. `practice/site/css/style.css`를 만들고 `<link rel="stylesheet" href="css/style.css">`를 세 HTML 파일 `<head>`에 모두 추가한다.
2. `:root { --color-primary: ...; }`처럼 CSS 변수로 색을 몇 개 정의해둔다 (study6에서 다크모드에 활용할 준비).
3. `.container` 클래스로 본문 폭을 제한하고 가운데 정렬한다 (`max-width` + `margin: 0 auto`).
4. `.header-inner`를 flex로 배치한다 (4.4 참고).
5. `.card-grid`를 grid로 배치한다 (4.5 참고).
6. `.button` 클래스로 링크/버튼 모양을 통일한다.
7. `contact.html`의 폼에 `.form-field` 같은 클래스를 줘서 input들을 세로로 정돈한다.
8. 미디어쿼리 하나를 추가해서 화면이 좁을 때 카드가 1줄로 쌓이게 한다.

완성본은 [practice/site/css/style.css](practice/site/css/style.css)에 있다 — 색상 변수, flex, grid, 미디어쿼리, 폼 스타일이 모두 포함되어 있으니 직접 해본 뒤 비교한다. 이 파일의 `[data-theme="dark"]` 부분은 study6에서 다룬다.

## 4.8 셀프 체크리스트

- [ ] 외부 css 파일 1개를 세 페이지에서 공유한다
- [ ] `box-sizing: border-box`를 적용했다
- [ ] flex로 가로 배치(`.header-inner`), grid로 격자 배치(`.card-grid`)를 각각 한 번씩 써봤다
- [ ] 미디어쿼리로 좁은 화면에서 레이아웃이 바뀌는 걸 확인했다 (개발자 도구의 반응형 보기로 테스트)

다음: [study5.md](study5.md) — JS 기초 및 실습 1 (상호작용 추가하기).
