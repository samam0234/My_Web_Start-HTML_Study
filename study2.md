# study2 · HTML·CSS·JavaScript — 핵심 구조: 함수·ESM 모듈

## ① 목표 한 줄

기능을 함수와 파일로 나누고 인자와 콜백으로 데이터를 주고받는다.

## ② 📖 이론

이 과정의 기본 단위는 함수와 ESM 모듈이다. 파일 안의 변수는 그 모듈 범위에 머문다. export로 공개한 함수만 import하여 재사용한다. app.js는 실행 순서를 조립하는 진입점이고 card.js는 목록 항목을 만드는 부품이다.

함수 인자는 부모가 부품에 주는 주문서다. createCard(post, onSelect)는 게시글 객체를 받고 DOM을 돌려준다. 버튼을 누르면 콜백 onSelect(id)를 호출하여 선택 정보를 부모에 돌려준다. DOM CustomEvent를 사용할 수도 있지만 여기서는 함수 인자만으로 데이터의 이동 방향을 명확하게 만든다.

모듈끼리 서로 import하는 순환 의존을 만들지 않는다. 화면 부품이 저장소를 직접 변경하기보다 변경 의도를 콜백으로 전달하면 테스트가 쉬워진다. ESM 경로에는 .js 확장자를 넣고 HTML에는 type="module"을 적는다.

### 비유로 이해하기

모듈은 각자의 공구함이고 export는 빌려줄 공구 목록, 인자는 주문서, 콜백은 결과를 알려 주는 전화다.

## ③ 🛠️ 실기: 전체 코드와 줄별 설명

1. /lessons/study2/을 연다.
2. 첫 번째 버튼과 두 번째 버튼을 누르고 선택 id가 달라지는지 확인한다.
3. card.js에서 텍스트 표현을 바꾼 뒤 모든 카드에 같은 변화가 적용되는지 확인한다.
4. 기존 practice/site/js/main.js의 네 초기화 함수가 페이지별 없는 요소를 어떻게 처리하는지 읽는다.

### `lessons/study2/card.js` 전체 코드

```javascript
export function createCard(post, onSelect) { // 객체와 콜백을 인자로 받는다.
  const item = document.createElement('li'); // 목록 한 항목을 만든다.
  const button = document.createElement('button'); // 키보드로도 조작할 수 있는 버튼이다.
  button.textContent = post.title; // 외부 문자열을 HTML로 해석하지 않는다.
  button.addEventListener('click', () => onSelect(post.id)); // 부모가 준 콜백으로 선택 정보를 돌려준다.
  item.append(button); // 부모 DOM에 자식을 연결한다.
  return item; // 진입점이 실제 삽입 위치를 결정한다.
}
```

원본: [lessons/study2/card.js](lessons/study2/card.js) · SHA-256(LF 정규화): `0b8d5540353150c545b51b32a159d3e76708dd06f2ba82a7a98220d2c435dc36`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 객체와 콜백을 인자로 받는다. |
| 2 | 목록 한 항목을 만든다. |
| 3 | 키보드로도 조작할 수 있는 버튼이다. |
| 4 | 외부 문자열을 HTML로 해석하지 않는다. |
| 5 | 부모가 준 콜백으로 선택 정보를 돌려준다. |
| 6 | 부모 DOM에 자식을 연결한다. |
| 7 | 진입점이 실제 삽입 위치를 결정한다. |
| 8 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `lessons/study2/app.js` 전체 코드

```javascript
import { createCard } from './card.js'; // 확장자를 포함한 상대경로로 가져온다.
const posts = [{ id: 1, title: '모듈 첫 글' }, { id: 2, title: '함수로 나누기' }];
const selected = id => { document.getElementById('selected').textContent = `선택: ${id}`; };
document.getElementById('list').append(...posts.map(post => createCard(post, selected)));
```

원본: [lessons/study2/app.js](lessons/study2/app.js) · SHA-256(LF 정규화): `7129f91e6a8a8fea3b33fc50c42003996f286f0dad0e2b55578a33d46f67efc6`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 확장자를 포함한 상대경로로 가져온다. |
| 2 | `posts`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 3 | 외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다. |
| 4 | 데이터로 만든 DOM 요소를 부모에 삽입하거나 기존 화면을 교체한다. |


### `lessons/study2/index.html` 전체 코드

```html
<!doctype html>
<html lang="ko"><meta charset="utf-8"><title>모듈 실습</title><main><h1>모듈로 목록 만들기</h1><ul id="list"></ul><p id="selected" role="status"></p></main><script type="module" src="app.js"></script></html>
```

원본: [lessons/study2/index.html](lessons/study2/index.html) · SHA-256(LF 정규화): `f4054af95d072c5522377ea0db7ff0bc8c817f827fc5cc3d7e811f7ee1ca95d0`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | HTML 표준 모드로 문서를 해석하도록 선언한다. |
| 2 | 문서 언어/루트 / 문자 인코딩·화면 배율·설명 / 브라우저 탭 제목 / 본문 / 최상위 제목 / ul 요소 / 설명·상태 메시지 / ESM 진입점 연결를 정의한다. |


### `practice/site/js/main.js` 전체 코드

```javascript
import { initTheme } from "./theme.js";
import { initNav } from "./nav.js";
import { initContactForm } from "./validate.js";
import { renderSkills } from "./data.js";

initTheme();
initNav();
initContactForm();
renderSkills();
```

원본: [practice/site/js/main.js](practice/site/js/main.js) · SHA-256(LF 정규화): `1538ab274a8f8903dc274847db1b57faffc1432ea4a46045db88b161c1e52487`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 2 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 3 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 4 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 6 | 현재 처리의 설정·호출·상태를 연결한다: `initTheme();` |
| 7 | 현재 처리의 설정·호출·상태를 연결한다: `initNav();` |
| 8 | 현재 처리의 설정·호출·상태를 연결한다: `initContactForm();` |
| 9 | 현재 처리의 설정·호출·상태를 연결한다: `renderSkills();` |


## ④ 🔗 연동 포인트

데이터 객체 → createCard 인자 → DOM 반환 → 사용자 클릭 → onSelect 콜백 순서다. 다음 단계는 전달되는 데이터가 바뀔 때 저장하고 다시 그리는 상태 관리다.

## ⑤ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| import 문법 오류 | 일반 script로 읽힘 | type="module" 확인 |
| 모듈 404 | 파일명 대소문자·확장자 오류 | 정확한 상대경로와 .js 사용 |
| 선택 시 undefined | 객체 필드명 불일치 | post.id와 콜백 인자를 함께 확인 |

## ⑥ 직접 해보기

1. 카드에 body 문단을 추가한다.
2. 선택된 카드를 색으로 표시하되 콜백으로 id만 전달한다.
3. 선택 콜백을 console.log 함수로 바꿔 UI와 분리해서 관찰한다.

## ⑦ ☐ 체크리스트

학습자 수행 확인용이다. 문서·코드 작성 완료와 본인의 실습 완료는 다르므로 직접 확인한 뒤 체크한다. 원문 항목 배치는 [반영표](docs/coverage.md)를 따른다.

- [ ] 모듈(ESM) 개념
- [ ] DOM 이벤트
- [ ] 함수 인자로 데이터를 전달하고 콜백으로 결과를 돌려준다
- [ ] theme.js·nav.js·validate.js·data.js·main.js의 역할을 구분한다
- [ ] 햄버거 메뉴 + 현재 페이지 표시
- [ ] JS는 ESM 모듈로 나눠 theme.js · todo.js · app.js(진입점)처럼 역할별 파일을 둔다. HTML에서는 `<script type="module">`.

## ⑧ 다음 단계 연결

[study3.md](study3.md)에서 데이터·바인딩·로컬 저장로 이어간다.

출처: [지정 노션](https://app.notion.com/p/3d6d7dec5e2e8147b212f0a23b93dfc1) · [공통 API v1](https://app.notion.com/p/3d6d7dec5e2e8139adbfd36dd506c65e) · [반영표](docs/coverage.md) · [검증 기록](docs/verification.md). 기술 근거: [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [Node 24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html). 설치 버전 API는 package-lock.json과 node_modules의 버전별 공식 문서를 기준으로 확인한다.
