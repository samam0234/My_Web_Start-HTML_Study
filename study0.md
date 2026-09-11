# Study 0. 웹 사이트란 무엇인가 — 실습 전 이론

> 프레임워크(Vue, React) 전에 거치는 가장 기초 단계. "웹 사이트가 무엇인지"를 정의하고, 이후 study1 ~ studyFinal에서 HTML/CSS/JS로 직접 화면을 만들어본다.

## 0.1 이 과정의 전체 로드맵

| 파일 | 내용 |
|---|---|
| `study0.md` | (이 문서) 실습 전 정의·이론 |
| `study1.md` | HTML 기초 이론 |
| `study2.md` | HTML 실습 1 — `index.html` 만들기 |
| `study3.md` | HTML 실습 2 — `about.html`, `contact.html` 연결 |
| `study4.md` | CSS 기초 + 실습 1 — 꾸미기 |
| `study5.md` | JS 기초 + 실습 1 — 상호작용 추가 |
| `study6.md` | CSS·JS 실습 2 — 다크모드, fetch, 모듈 |
| `studyFinal.md` | HTML+CSS+JS 종합 — Vanilla JS 웹 사이트 완성 |

실습 코드는 `practice/site/`(study2~6)와 `final-project/`(studyFinal) 폴더에 실제로 동작하는 파일로 쌓인다. 각 study 문서는 "무엇을, 왜" 설명하고, 실제 코드는 해당 폴더에서 직접 열어 확인한다.

## 0.2 핵심 용어 정리

- **웹 페이지(Web Page)**: 한 장, 즉 하나의 HTML 문서. 예: `about.html` 한 개.
- **웹 사이트(Web Site)**: 여러 웹 페이지가 메뉴·링크(하이퍼링크)로 연결된 전체. 예: `index.html` + `about.html` + `contact.html`.
- **HTML(HyperText Markup Language)**: 페이지의 **구조**를 정의하는 언어 — 제목, 단락, 목록, 이미지, 폼, 링크.
- **CSS(Cascading Style Sheets)**: 페이지의 **표현**(색, 레이아웃, 반응형)을 정의하는 언어.
- **JavaScript**: 페이지의 **동작**(클릭, 입력, 데이터 불러오기)을 담당하는 언어.
- **브라우저(Browser)**: HTML/CSS/JS를 읽어서 화면으로 그려주는 프로그램 (Chrome, Edge 등).
- **서버(Server)**: 문서(HTML, 이미지, 데이터 등)를 보관하고, 요청이 오면 응답해주는 컴퓨터/프로그램.
- **클라이언트(Client)**: 요청을 보내는 쪽. 웹에서는 보통 브라우저가 클라이언트 역할.

> Vue / React 같은 프레임워크는 이 HTML 구조 **위에** 올라가는 도구다. "문서 하나 = 화면 하나"라는 기본 동작을 이해하지 못하면 프레임워크가 왜 필요한지도 이해하기 어렵다. 그래서 프레임워크 전에 순수 HTML/CSS/JS로 먼저 사이트를 만들어본다.

## 0.3 브라우저가 화면을 그리기까지 (요청 → 렌더링)

실제로 `index.html`을 더블클릭해서 열 때와, "서버에 올린 사이트"를 열 때는 과정이 조금 다르다. 둘 다 이해해두면 좋다.

```
[내가 주소를 입력하거나 파일을 연다]
        │
        ▼
  (서버가 있는 경우) DNS로 주소 찾기 → 서버에 HTTP 요청
  (로컬 파일인 경우) 브라우저가 파일을 직접 읽음
        │
        ▼
      HTML 문서를 받음/읽음
        │
        ▼
  HTML 파싱 → DOM 트리 생성
  CSS 파싱 → CSSOM 생성
        │
        ▼
  DOM + CSSOM → 렌더 트리 생성 → 레이아웃 계산 → 화면에 페인트
        │
        ▼
  <script> 태그를 만나면 JS 실행 → DOM을 다시 조작할 수 있음 (화면이 또 바뀜)
```

- **DOM(Document Object Model)**: 브라우저가 HTML을 읽고 메모리에 만든 "문서 나무(tree)". JS가 화면을 바꿀 때 실제로는 이 DOM을 조작한다.
- **HTTP 요청/응답**: 브라우저(클라이언트)가 "이 주소의 문서를 달라" 요청하면, 서버가 HTML/CSS/JS/이미지 등을 응답으로 돌려준다.
- **URL 구조**: `https://example.com/about.html` → `프로토콜 :// 도메인 / 경로`

## 0.4 정적 사이트 vs 동적 사이트 (맛보기)

- **정적(static) 사이트**: 미리 만들어둔 HTML 파일을 그대로 보여준다. 이 과정(study1~studyFinal)은 전부 정적 사이트다.
- **동적(dynamic) 사이트**: 서버가 요청마다 데이터를 조합해서 HTML을 만들어 준다 (백엔드 영역, 이 과정 밖).
- **SPA(Single Page Application)**: 페이지 전체를 다시 불러오지 않고, JS가 화면 일부만 바꿔 끼운다. Vue/React가 이 방식을 프레임워크로 도와준다. `study6`에서 `fetch`로 데이터를 불러와 화면 일부만 바꾸는 실습을 하면서 SPA의 맛을 미리 본다.

## 0.5 개발 환경 준비

- **에디터**: VS Code (이미 사용 중).
- **미리보기**: VS Code 확장 **Live Server** (또는 유사 확장) 설치 후 HTML 파일에서 우클릭 → "Open with Live Server". 파일을 저장하면 브라우저가 자동 새로고침되어 편하다.
  - 확장 없이도 HTML 파일을 더블클릭해서 브라우저로 직접 열어도 대부분 실습은 가능하다. 다만 `study6`, `studyFinal`에서 쓰는 `fetch("data/skills.json")`처럼 로컬 파일을 불러오는 코드는 브라우저 보안 정책(CORS) 때문에 `file://`로 직접 열면 막힐 수 있다 — 이때는 Live Server 같은 간단한 로컬 서버로 열어야 한다.
- **브라우저 개발자 도구 (F12)**:
  - **Elements**: 지금 화면의 DOM/CSS를 실시간으로 확인·수정.
  - **Console**: JS 에러 확인, `console.log()` 출력 확인.
  - **Network**: 어떤 파일이 요청되고 응답되는지 확인 (HTML, CSS, JS, JSON 등).

## 0.6 앞으로 만들 폴더 구조 미리보기

```
web_start_HTML_Study/
├── study0.md ~ study6.md, studyFinal.md   ← 이론/가이드 문서
├── practice/site/                          ← study2~6에서 단계적으로 완성
│   ├── index.html / about.html / contact.html
│   ├── css/style.css
│   ├── js/ (main.js, theme.js, nav.js, validate.js, data.js)
│   └── data/skills.json
└── final-project/                          ← studyFinal 종합 프로젝트
    ├── index.html
    ├── css/style.css
    └── js/ (app.js, theme.js, todo.js)
```

## 0.7 학습 체크리스트

- [ ] 웹 페이지 / 웹 사이트 / 브라우저 / 서버를 내 말로 구분해서 설명할 수 있다
- [ ] HTML / CSS / JS가 각각 담당하는 역할(구조/표현/동작)을 구분할 수 있다
- [ ] 브라우저가 문서를 받아 화면을 그리는 대략적인 순서를 설명할 수 있다
- [ ] Live Server로 HTML 파일을 열어 미리보기할 수 있다
- [ ] F12 개발자 도구에서 Elements / Console 탭을 열어볼 수 있다

다음: [study1.md](study1.md) — HTML 기초 이론.
