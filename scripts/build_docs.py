"""실행 파일 전문과 줄별 해설을 학습 문서에 재현한다. 외부 요청/파일 삭제는 없다."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'https://app.notion.com/p/3d6d7dec5e2e8147b212f0a23b93dfc1'
API_SOURCE = 'https://app.notion.com/p/3d6d7dec5e2e8139adbfd36dd506c65e'
DOC_SOURCE = 'https://app.notion.com/p/40bd7dec5e2e818d9c91c6fb26dccc4c'
CHAPTERS = []

def chapter(number, title, goal, theory, files, steps, links, errors, exercises, checks, extra=''):
    CHAPTERS.append(dict(number=str(number), title=title, goal=goal, theory=theory, files=files, steps=steps, links=links, errors=errors, exercises=exercises, checks=checks, extra=extra))

chapter(0, '환경 설정', '브라우저와 Node 실행 환경을 구분하고 같은 저장소에서 실습 서버를 시작한다.', '''HTML은 문서 구조, CSS는 표현, JavaScript는 동작을 맡는다. HTML·CSS·JS는 별도 프레임워크 설치 대상이 아니다. 브라우저가 문서를 해석하고, Node는 브라우저 밖에서 JavaScript를 실행한다. 식당에 비유하면 HTML은 공간 배치, CSS는 인테리어, JS는 주문을 처리하는 동작이다.

웹 페이지는 HTML 한 장, 사이트는 연결된 페이지들의 집합이다. 브라우저는 클라이언트이고 서버는 HTTP 요청에 응답한다. URL은 프로토콜·호스트·포트·경로·쿼리·fragment로 나뉜다. DNS로 서버를 찾고 HTTPS로 HTML을 받은 뒤 DOM과 CSSOM을 만들고 레이아웃·페인트를 진행한다. module 스크립트는 문서 파싱 후 실행된다.

정적 서버는 이미 있는 파일을 전달한다. API 서버는 요청에 따라 JSON을 만들고 저장소를 변경한다. 이 과정은 같은 JavaScript를 Node 기본 HTTP 모듈에서 실행하며 다른 웹 프레임워크를 추가하지 않는다. 브라우저는 DB 암호를 가져서는 안 되므로 DB·메일·모델 호출은 서버에 둔다.

ESM은 import/export로 파일 범위를 나누는 규칙이다. DOM은 화면 요소의 객체 트리이고, state는 화면을 결정하는 데이터다. Promise는 나중에 완료될 작업, await는 그 결과를 이어서 사용하는 문법이다. origin은 프로토콜·호스트·포트가 모두 같은 범위다.''', ['lessons/study0/hello.js', '.env.example', '.gitignore', 'package.json'], '''1. Node 24.14.0 이상, Git, VS Code와 최신 브라우저를 설치한다. 설치 후 터미널을 다시 열어 PATH를 갱신한다.
2. 기존 저장소에서는 루트 폴더를 연다. 새 복제라면 아래 clone 명령을 실행한다. 이미 Git 저장소인 이 폴더에서 git init을 다시 할 필요는 없다.
3. npm ci로 lockfile에 고정된 패키지를 설치한다. 빈 새 프로젝트라면 mkdir html-study → cd html-study → npm init -y 순서로 만든 뒤 package.json의 type을 module로 설정한다.
4. .env.example을 .env로 복사한다. .env는 서버가 읽는 비공개 설정이고 브라우저는 자동으로 읽지 않는다. API URL 같은 공개 값만 프론트에 전달한다.
5. npm run dev를 실행하고 http://localhost:3000/lessons/study1/ 을 연다. Node --watch는 서버를 재시작한다. 브라우저 자동 새로고침은 VS Code Live Server를 기초 정적 예제에 사용할 때 제공된다.
6. VS Code 확장 Live Server, Prettier, ESLint를 설치한다. 현재 코드는 npm run check로 문법을 검사하므로 확장 설치는 실행 필수 조건이 아니다.
7. F12에서 Elements, Console, Network, Application을 각각 열고 문서·로그·요청·저장소 위치를 확인한다.''', '설정 파일 → 서버 process.env → 저장소/외부 API로 연결한다. 비밀을 HTML·JS·Git에 넣지 않는다. 다음 단계에서는 이 서버가 전달하는 HTML을 수정한다.', [('node 명령을 찾지 못함', '설치 전 터미널의 PATH', '터미널을 다시 열고 node --version'), ('EADDRINUSE', '3000 포트가 이미 사용 중', '기존 서버 종료 또는 PORT·PUBLIC_ORIGIN·CORS_ORIGIN을 함께 변경'), ('설정이 프론트에 없음', '.env를 브라우저가 자동으로 읽는다고 가정', '서버에서만 사용하고 공개 설정은 명시적으로 전달')], ['.env를 수정한 뒤 git status --ignored에서 제외 여부를 확인한다.', '기초 HTML을 Live Server로 열고 저장 시 자동 새로고침을 확인한다.', 'Network에서 HTML과 module JS 요청을 하나씩 찾아 역할을 설명한다.'], ['node --version, npm --version, git --version을 실행했다', 'HTTP 서버로 HTML을 열고 file://와 차이를 설명한다', '.env와 data/가 Git에서 제외된다', 'HTML/CSS/JS·DOM·HTTP·origin·ESM을 내 말로 설명한다'], '''### 설치·버전·Git 명령 (PowerShell)

```powershell
node --version
npm --version
git --version
git clone https://github.com/samam0234/My_Web_Start-HTML_Study.git
cd My_Web_Start-HTML_Study
npm ci
Copy-Item .env.example .env
node lessons/study0/hello.js
npm run dev
```

빈 프로젝트를 별도로 만들 때만 `git init` → `.gitignore` 작성 → `git add .` → `git commit -m "chore: 학습 프로젝트 초기화"` 순서다. `.env.example`에는 키 이름과 가짜 값만 남긴다. 실제 키·DB 파일은 커밋하지 않는다.

### 폴더 구조

```text
study0.md ... study10.md, studyMidpoint.md, study11.md ... study18.md, studyFinal.md
lessons/       단계별 독립 예제
practice/site/ 기존 3페이지 정적 실습
final-project/ 기존 정적 Todo
midpoint/      기초 게시판 UI
workbook/      심화 게시판·문서 AI UI
server/        순수 Node HTTP·저장소·인증·외부 연동
mcp/           로컬 MCP 서버·클라이언트
tests/         단위·요청·모델 경계 검사
scripts/       문서·빌드·브라우저·백업 도구
ops/           운영 설정
docs/          요구사항 추적·검증 기록·노션 원문
```
''')

chapter(1, 'Hello World와 기본 문법', '시맨틱 HTML과 CSS로 첫 화면을 만들고 JavaScript 함수로 인사를 바꾼다.', '''HTML 요소는 여는 태그·속성·내용·닫는 태그로 구성된다. header/nav/main/section/footer는 문서의 의미를 나타내므로 검색 엔진과 보조기술이 구조를 읽을 수 있다. 제목은 h1부터 계층을 지키고, 이미지에는 의미 있는 alt, 폼에는 for/id가 맞는 label을 둔다. 표는 caption과 th의 scope로 행·열 관계를 전달한다.

CSS는 선택자로 요소를 골라 속성을 적용한다. 클래스는 역할을 기준으로 이름 짓고 id는 문서에서 유일하게 쓴다. 박스는 content·padding·border·margin으로 구성된다. border-box는 폭 계산에 padding과 border를 포함한다. 한 줄 배치는 flex, 행·열 배치는 grid를 사용한다. viewport와 640px 미디어쿼리로 좁은 화면에서 배치를 바꾼다.

const는 재할당하지 않는 변수이고 let은 재할당 가능한 변수다. 문자열·숫자·불리언·null과 배열·객체를 구분한다. 배열은 순서가 있는 서랍, 객체는 이름표가 있는 서랍장이다. 함수는 입력을 결과로 바꾼다. `${name}`은 JS 템플릿 리터럴이며 HTML 자체가 이 표현을 자동 평가하지 않는다.

DOM을 찾아 textContent에 결과를 넣으면 화면이 바뀐다. 모듈 스크립트는 import를 쓸 수 있고 문서 파싱 이후 실행된다. 브라우저 DevTools는 원본 파일과 실제 DOM을 함께 비교하는 관찰 도구다.''', ['lessons/study1/index.html', 'lessons/study1/style.css', 'lessons/study1/hello.js', 'lessons/study1/avatar.svg'], '1. npm run dev 후 /lessons/study1/을 연다.\n2. 이름을 입력하고 인사 버튼을 누른다.\n3. Elements에서 h1·label·표 헤더를 확인하고 Console에서 skills 같은 모듈 내부 변수는 전역이 아님을 확인한다.\n4. Live Server로 이 정적 폴더를 별도로 열어 파일 저장 후 자동 새로고침을 본다. Node 개발 서버에서는 직접 새로고침한다.', '첫 HTML → DOM 선택 → 함수 결과 출력으로 연결한다. 다음 단계에서는 함수 하나를 별도 파일로 옮겨 다른 화면에서도 호출한다.', [('${name}이 그대로 보임', 'HTML에 JS 표현을 직접 씀', 'JS 템플릿 리터럴 결과를 textContent에 넣기'), ('스타일이 적용 안 됨', 'link 상대경로가 틀림', 'Network에서 style.css 200 확인'), ('폼 제출 시 새로고침', '기본 submit 동작', 'event.preventDefault()')], ['인사 함수에 시간대를 받아 오전/오후 인사를 추가한다.', '표에 DOM 행을 추가하고 th/td 관계를 확인한다.', '개발자도구에서 390px로 바꾸어 flex 배치 변화를 확인한다.'], ['시맨틱 태그, 폼, 테이블, 링크', '접근성 기본 (label, alt)', '박스 모델, flex, grid', '반응형 기초', '클래스를 의미 있게 나누는 법', '변수, 함수, 배열/객체', 'Hello World가 HTTP로 표시된다'])

chapter(2, '핵심 구조: 함수·ESM 모듈', '기능을 함수와 파일로 나누고 인자와 콜백으로 데이터를 주고받는다.', '''이 과정의 기본 단위는 함수와 ESM 모듈이다. 파일 안의 변수는 그 모듈 범위에 머문다. export로 공개한 함수만 import하여 재사용한다. app.js는 실행 순서를 조립하는 진입점이고 card.js는 목록 항목을 만드는 부품이다.

함수 인자는 부모가 부품에 주는 주문서다. createCard(post, onSelect)는 게시글 객체를 받고 DOM을 돌려준다. 버튼을 누르면 콜백 onSelect(id)를 호출하여 선택 정보를 부모에 돌려준다. DOM CustomEvent를 사용할 수도 있지만 여기서는 함수 인자만으로 데이터의 이동 방향을 명확하게 만든다.

모듈끼리 서로 import하는 순환 의존을 만들지 않는다. 화면 부품이 저장소를 직접 변경하기보다 변경 의도를 콜백으로 전달하면 테스트가 쉬워진다. ESM 경로에는 .js 확장자를 넣고 HTML에는 type="module"을 적는다.''', ['lessons/study2/card.js', 'lessons/study2/app.js', 'lessons/study2/index.html', 'practice/site/js/main.js'], '1. /lessons/study2/을 연다.\n2. 첫 번째 버튼과 두 번째 버튼을 누르고 선택 id가 달라지는지 확인한다.\n3. card.js에서 텍스트 표현을 바꾼 뒤 모든 카드에 같은 변화가 적용되는지 확인한다.\n4. 기존 practice/site/js/main.js의 네 초기화 함수가 페이지별 없는 요소를 어떻게 처리하는지 읽는다.', '데이터 객체 → createCard 인자 → DOM 반환 → 사용자 클릭 → onSelect 콜백 순서다. 다음 단계는 전달되는 데이터가 바뀔 때 저장하고 다시 그리는 상태 관리다.', [('import 문법 오류', '일반 script로 읽힘', 'type="module" 확인'), ('모듈 404', '파일명 대소문자·확장자 오류', '정확한 상대경로와 .js 사용'), ('선택 시 undefined', '객체 필드명 불일치', 'post.id와 콜백 인자를 함께 확인')], ['카드에 body 문단을 추가한다.', '선택된 카드를 색으로 표시하되 콜백으로 id만 전달한다.', '선택 콜백을 console.log 함수로 바꿔 UI와 분리해서 관찰한다.'], ['모듈(ESM) 개념', 'DOM 이벤트', '함수 인자로 데이터를 전달하고 콜백으로 결과를 돌려준다', 'theme.js·nav.js·validate.js·data.js·main.js의 역할을 구분한다'])

chapter(3, '데이터·바인딩·로컬 저장', '상태 변경 → 저장 → 다시 그리기 흐름으로 새로고침에 견디는 화면을 만든다.', '''state는 현재 화면을 결정하는 데이터다. DOM에 있는 숫자를 다시 읽어 상태로 삼기보다 count라는 변수 하나를 진실의 원천으로 삼는다. render 함수는 상태를 읽어 DOM에 반영한다. 이 과정에서는 데이터 바인딩을 직접 작성한다.

localStorage는 동일 origin에 속한 문자열 저장소다. 객체·배열은 JSON.stringify로 저장하고 JSON.parse로 복구한다. 파싱 성공과 자료형 검증은 별개다. '{}'는 올바른 JSON이지만 Todo 배열이 아니다. 따라서 배열인지, 각 항목에 text·done·id가 있는지도 확인해야 한다.

비밀번호·로그인 토큰·개인 문서를 localStorage에 넣지 않는다. 테마·연습용 Todo처럼 민감하지 않은 설정에 사용한다. 저장 공간 부족이나 브라우저 정책으로 getItem/setItem도 실패할 수 있으므로 try/catch로 화면은 계속 동작하게 한다. 저장소는 공용 DB가 아니며 다른 기기와 자동으로 동기화되지 않는다.''', ['lessons/study3/index.html', 'lessons/study3/state.js', 'final-project/js/todo.js', 'final-project/js/theme.js'], '1. /lessons/study3/에서 1 증가를 누르고 새로고침한다.\n2. Application → Local Storage에서 study3-count를 확인한다.\n3. 값을 잘못된 JSON으로 바꾼 후 새로고침하여 복구 문구를 본다.\n4. /final-project/에서 Todo를 추가·완료·삭제하고 새로고침한다.', '로컬 state → JSON 문자열 → localStorage → 초기 state → render로 연결된다. 서버와 공유할 자료는 다음 CRUD 단계에서 API와 DB로 옮긴다. 테마는 CSS 변수와 data-theme 속성으로 연결한다.', [('JSON.parse 예외', '저장 문자열 손상', 'try/catch 후 기본 상태'), ('todos.forEach is not a function', 'JSON이 배열이 아님', 'Array.isArray와 항목 스키마 검증'), ('다른 포트에서 목록이 안 보임', 'origin별 저장소가 다름', '같은 프로토콜·호스트·포트로 접속')], ['감소 버튼을 추가하고 0 아래로 내려가지 않게 한다.', 'localStorage에 []·{}·깨진 JSON을 각각 넣어 결과를 기록한다.', '테마 토글 후 다른 페이지에서도 같은 키를 사용하도록 연결한다.'], ['localStorage 저장 + 다시 그리기', '다크모드 토글', 'localStorage 값이 깨지면 JSON.parse가 예외를 던진다 → try/catch로 복구', '상태·저장·렌더링을 구분한다'])

chapter(4, '라우팅과 요청·응답', '화면 경로와 서버 API 경로를 구분하고 동적 id·쿼리·404를 처리한다.', '''서버는 요청 메소드와 pathname을 함께 보고 처리 함수를 고른다. GET /api/posts는 목록을 조회하고 POST /api/posts는 새 자료를 만든다. 브라우저 해시 라우팅의 # 뒤 값은 HTTP 요청에 포함되지 않는다. 따라서 정적 서버에서도 #/posts/1 같은 화면 경로를 새로고침할 수 있다.

동적 경로는 패턴의 일부분을 값으로 뽑는 방식이다. 정규식으로 양의 정수 id만 받으면 /posts/abc 같은 경로를 구분할 수 있다. URLSearchParams는 쿼리를 직접 문자열로 붙일 때 생기는 인코딩 실수를 줄인다. '#' 화면 경로의 404는 화면 상태이고, API의 404는 HTTP 상태 코드다.

우편 주소에 비유하면 URL 경로는 받는 부서이고 메소드는 조회·등록 같은 요청 종류다. 화면은 #/posts/1을 표시하면서 실제 데이터는 GET /api/posts/1에서 받는다. 이 경로 계약을 문서와 코드 양쪽에 고정한다.''', ['lessons/study4/index.html', 'lessons/study4/router.js', 'server/errors.js', 'server/static.js'], '1. /lessons/study4/의 홈·상세·오류 링크를 차례로 누른다.\n2. 상세 링크의 q를 HTML CSS로 바꾸고 URLSearchParams 해독을 본다.\n3. 뒤로 가기와 앞으로 가기를 실행한다.\n4. curl.exe -i http://localhost:3000/api/posts/999999 로 실제 HTTP 404를 확인한다.', '화면 hash → id 추출 → /api/posts/{id} 호출 → JSON → DOM 순서로 연결한다. 다음 단계에서는 사용자가 입력한 값을 POST 요청 본문으로 보낸다.', [('상세 새로고침이 404', '서버가 history 경로를 모름', '이 과정에서는 hash 경로를 쓰고 파일 경로와 분리'), ('한글 쿼리가 깨짐', '문자열 수동 결합', 'URLSearchParams 사용'), ('오류인데 화면이 성공 처리', 'fetch가 404에서 reject한다고 가정', 'response.ok와 status 검사')], ['#/posts/2?q=CSS 링크를 추가한다.', 'id가 0·음수·문자인 주소의 오류 화면을 확인한다.', 'Network에서 fragment가 서버 요청에 포함되지 않음을 확인한다.'], ['URL·동적 경로·쿼리를 구분한다', '화면 404와 API 404를 구분한다', '프론트 #/posts/{id}와 백엔드 /api/posts/{id}를 연결한다'])

chapter(5, '폼·입력·검증', '클라이언트와 서버에서 입력을 검사하고 상태 코드별 메시지와 중복 제출 방지를 구현한다.', '''폼의 submit 이벤트는 기본적으로 문서를 이동시킨다. preventDefault로 기본 동작을 막고 fetch를 호출하면 같은 화면에서 결과를 표시할 수 있다. required·type·maxlength는 브라우저의 첫 검사이며 서버 검증을 대신하지 않는다. 공백만 있는 문자열도 trim으로 검사한다.

pending 플래그와 disabled 버튼은 요청 중 같은 제출을 다시 보내지 않게 한다. 예외가 발생하더라도 finally에서 복구한다. 200은 검증 성공, 400은 잘못된 요청, 422는 형식은 읽었지만 의미 조건에 맞지 않는 입력을 뜻하는 실습이다. 게시판 공통 API v1의 검증 실패는 400으로 통일되어 있으므로 422를 강제로 섞지 않는다.

서버는 Zod 스키마로 자료형·길이·허용 필드를 확인한다. strict는 알 수 없는 필드를 거부한다. PATCH는 일부 필드만 바꾸므로 생성 시 기본값이 누락 필드를 덮어쓰지 않게 별도 patchSchema를 사용한다. 오류 fields는 입력 칸 옆 표시를 붙일 때 쓰는 지도다.''', ['lessons/study5/index.html', 'lessons/study5/form.js', 'server/validation.js'], '1. npm run dev로 서버를 켜고 /lessons/study5/을 연다.\n2. 빈 값·공백·정상 제목을 각각 제출한다.\n3. Network의 요청 본문과 200 응답을 읽는다.\n4. 아래 명령으로 브라우저 제한을 우회한 서버 검증과 422 응답을 확인한다.', 'FormData → trim/브라우저 검사 → JSON POST → 서버 스키마 → data/error.fields → role=status로 연결한다. 다음 단계에서는 검사한 자료를 DB에 보관하고 목록으로 읽는다.', [('두 번 저장됨', '버튼만 막고 Enter 제출을 허용', 'pending 플래그도 검사'), ('버튼이 영원히 비활성', '오류 경로에서 복구 누락', 'finally에서 활성화'), ('수정 시 태그가 사라짐', 'PATCH에 생성 기본값 적용', '기본값 없는 patchSchema 사용')], ['제목별 오류를 input의 aria-describedby와 연결한다.', 'Network 속도를 낮추고 저장 버튼을 연속으로 눌러 요청 수를 센다.', '서버에 201자 제목을 보내 422를 확인한다.'], ['폼 submit은 기본으로 페이지를 새로고침한다 → event.preventDefault()', '200·400·422 응답별 메시지를 확인한다', '브라우저 검증과 서버 검증을 모두 수행한다', '중복 제출 후 성공·실패 모두 버튼이 복구된다'], '''```powershell
$payload = @{ title = ('x' * 201) } | ConvertTo-Json -Compress
try { Invoke-RestMethod http://localhost:3000/api/validate -Method Post -ContentType 'application/json' -Body $payload }
catch { $_.ErrorDetails.Message }
```

`/api/validate`는 study5용 별도 검증 엔드포인트다. 기본 게시판의 필수 필드·길이 오류는 노션 공통 스펙에 맞춰 400으로 응답한다.
''')

chapter(6, 'DB·API 연동과 CRUD', '공통 API v1 계약에 맞춰 브라우저와 SQLite 저장소를 연결한다.', '''fetch는 HTTP 통신을 Promise로 표현한다. async/await는 작업이 끝난 뒤 다음 처리를 이어 쓰는 문법이고 try/catch는 실패 경로를 처리한다. HTTP 400·404는 네트워크 자체의 실패가 아니므로 response.ok를 확인해야 한다. 삭제 성공 204에는 본문이 없으므로 json()을 호출하지 않는다.

SQLite는 서버 디스크의 파일 DB다. 브라우저는 /api 경로만 호출하고 DB 파일을 직접 열지 않는다. records 테이블의 id는 자동 증가 정수, kind는 자료 종류, payload는 도메인 객체를 직렬화한 JSON이다. 이 학습 모델은 저장소 교체를 짧게 보여주기 위한 Data Mapper다. 조회 시 종류 전체를 읽으므로 큰 운영 데이터에는 정규화·인덱스·DB 페이지네이션이 추가로 필요하다.

도메인 모델은 User(email,nickname,passwordHash), Post(title,body,tags,authorId,createdAt,updatedAt), Comment(postId,authorId,body)다. API는 authorId 대신 author{id,nickname}을 조립하고 commentCount를 계산한다. SQL의 ? 바인딩으로 입력과 쿼리 구조를 분리한다.

공통 API 스펙 v1의 v1은 계약 버전 이름이다. 경로는 /api이고 /api/v1로 바꾸지 않는다. 목록 응답은 data와 meta(page,limit,total,totalPages,q), 단건은 data, 오류는 error(code,message,fields,requestId)다. 등록은 201+Location, 수정은 PATCH 200, 삭제는 204다.''', ['workbook/js/api.js', 'server/sqlite.js', 'server/board.js', 'practice/site/js/data.js', 'practice/site/data/skills.json'], '1. .env에서 DB_DRIVER=sqlite와 SQLITE_PATH=data/study.sqlite를 확인한다.\n2. npm run dev를 켜면 폴더와 records 테이블이 생성된다.\n3. 목록 GET /api/posts → 상세 GET /api/posts/{id} 순서로 읽는다.\n4. 다음 study7에서 계정을 만든 뒤 POST → PATCH → DELETE를 실행한다. 아래 요청 예제는 로그인 토큰을 사용한다.\n5. /practice/site/about.html에서 정적 JSON fetch 예제도 확인한다.', '브라우저 api() → /api/posts → board → SQLite prepared statement → data/meta → DOM이다. 연결 파일은 .env로 분리한다. DB 파일의 data/는 정적 서버와 Git 모두에서 제외한다. 다음 단계에서 쓰기 요청에 인증을 붙인다.', [('Unexpected end of JSON input', '204 응답에 json() 사용', '204는 null 반환'), ('fetch가 file://에서 실패', '로컬 파일 보안 정책·ESM 제한', 'Live Server 또는 npm run dev로 HTTP 접속'), ('연결 파일이 새로 생김', '상대경로 기준 작업 폴더가 바뀜', '저장소 루트에서 실행하고 SQLITE_PATH 확인')], ['정적 skills.json의 name을 바꾸고 화면을 다시 읽는다.', '로그인 후 POST·PATCH·DELETE 응답 코드와 Location 헤더를 기록한다.', 'q·page·limit·sort를 바꾸어 목록 meta가 일치하는지 계산한다.'], ['fetch, Promise, async/await', 'fetch + async/await + try/catch', 'file:// 대신 HTTP 서버로 ESM과 fetch를 실행한다', '목록·상세·등록·수정·삭제와 오류 응답을 확인한다'], '''### 공통 API v1 요청 예제 (서버 실행 후 PowerShell)

```powershell
$base = 'http://localhost:3000'
$account = @{ email='mina@example.com'; password='study-password-123'; nickname='mina' }
Invoke-RestMethod "$base/api/auth/signup" -Method Post -ContentType 'application/json' -Body ($account | ConvertTo-Json)
$login = Invoke-RestMethod "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body (@{email=$account.email;password=$account.password} | ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($login.data.accessToken)" }
$post = Invoke-RestMethod "$base/api/posts" -Method Post -Headers $headers -ContentType 'application/json' -Body (@{title='첫 글';body='안녕하세요';tags=@('intro')} | ConvertTo-Json)
Invoke-RestMethod "$base/api/posts?q=첫&page=1&limit=10"
Invoke-RestMethod "$base/api/posts/$($post.data.id)"
Invoke-RestMethod "$base/api/posts/$($post.data.id)" -Method Patch -Headers $headers -ContentType 'application/json' -Body (@{title='수정'} | ConvertTo-Json)
Invoke-RestMethod "$base/api/posts/$($post.data.id)" -Method Delete -Headers $headers
```

상태 코드: 읽기 200, 등록 201, 수정 200, 삭제 204, 입력 400, 미인증 401, 다른 작성자 403, 없음 404. `sort=createdAt`, `-createdAt`, `-commentCount`만 허용한다. limit 기본 10·최대 50, page는 1부터 시작한다.
''')

chapter(7, '인증·보안 기초', '회원가입·로그인·만료·로그아웃과 작성자 권한을 서버에서 검증한다.', '''인증은 누구인지 확인하고 인가는 무엇을 할 수 있는지 확인한다. 회원가입은 비밀번호를 salt+scrypt 해시로 바꾸어 저장한다. salt는 사용자마다 다른 난수이고 같은 비밀번호도 다른 해시가 된다. 로그인 비교는 timingSafeEqual로 수행한다.

이 과정은 JWT 대신 32바이트 난수 opaque Bearer 토큰을 사용한다. 서버는 토큰의 SHA-256 해시와 사용자 id·1시간 만료를 세션 records에 저장한다. 응답 모양은 공통 스펙의 data.user/accessToken을 유지한다. 토큰 원문은 브라우저 메모리에만 두고 새로고침하면 다시 로그인한다. 로그아웃은 세션을 삭제해 토큰을 즉시 무효화한다.

목록·상세는 공개, 작성·댓글은 인증 필요, 수정·삭제는 작성자만 가능하다. 버튼 숨김은 편의 기능이며 서버 board의 own 검사가 최종 권한 경계다. 회원정보 응답에는 passwordHash가 없다. 공개 작성자에는 id와 nickname만 전달한다.

XSS는 외부 문자열이 스크립트로 실행되는 문제다. textContent로 출력하고 CSP로 스크립트 출처를 제한한다. CORS는 브라우저의 교차 출처 접근 규칙이며 인증의 대체물이 아니다. CSRF는 자동 전송되는 쿠키를 악용한다. Bearer를 JS 헤더로 보내는 현재 방식은 자동 쿠키 인증을 쓰지 않는다. 나중에 로그인 쿠키를 쓰면 Secure·HttpOnly·SameSite와 CSRF 토큰/Origin 검사를 함께 설계해야 한다.

기초 서버는 동일 출처만 받고, 심화 서버는 CORS_ORIGIN 한 곳을 추가 허용한다. 심화 로그인에는 IP별 15분 30회 제한이 있다. 운영에서는 역방향 프록시 신뢰 설정·공유 rate limit·계정 잠금·만료 세션 정리를 보강한다.''', ['server/auth.js', 'server/validation.js', 'server/basic.js'], '1. 다른 개발 서버를 끄고 npm run midpoint로 /midpoint/을 연다.\n2. 12자 이상 비밀번호로 가입하고 로그인한다.\n3. 글을 작성한 뒤 다른 이메일로 가입하여 같은 글 수정·삭제를 요청한다.\n4. 로그아웃 후 이전 토큰으로 /api/auth/me를 호출해 401을 확인한다.', '브라우저 메모리 토큰 → Authorization 헤더 → 세션 해시/만료 조회 → user → 작성자 검사로 이어진다. 연결된 토큰을 다음 단계 공통 API 모듈에 모아 각 화면이 같은 규칙을 사용하게 한다.', [('가입은 됐지만 로그인 실패', '잘못된 이메일·비밀번호 또는 OAuth 전용 계정', 'INVALID_CREDENTIALS로 통일해 표시'), ('버튼은 숨겼는데 수정 가능', '서버 권한 검사 누락', '서버에서 authorId와 user.id 비교'), ('CORS 허용 후 누구나 쓰기 가능', 'CORS를 인증으로 오해', '쓰기 경로에 Bearer 검증 유지')], ['서로 다른 두 사용자로 401·403 차이를 재현한다.', 'DB를 읽어 비밀번호와 토큰 원문이 없는지 확인한다.', '글 제목에 <script>alert(1)</script>를 넣어 문자열로 보이는지 확인한다.'], ['회원가입·로그인·내 정보·로그아웃을 확인한다', '비밀번호와 토큰 원문을 DB·로그·localStorage에 남기지 않는다', '작성자 권한과 1시간 토큰 만료를 서버에서 검사한다', 'CORS·XSS·CSRF의 역할을 설명한다'])

chapter(8, '구조화·재사용·설정', '화면·요청·도메인·저장소 책임을 나누고 개발·운영 설정을 분리한다.', '''파일 분리는 줄 수를 줄이는 일이 아니라 변경 이유를 분리하는 일이다. HTML은 입력·출력 자리, api.js는 전송, forms.js는 제출 수명, board.js는 게시판 규칙, repository는 저장 방법을 맡는다. 진입점은 모듈을 조립하므로 모듈이 역으로 진입점을 import하지 않는다.

설정은 실행 환경에서 주입한다. 개발에서는 .env 파일을 Node CLI가 읽고 운영에서는 컨테이너 env_file 또는 배포 시크릿으로 넣는다. NODE_ENV=production은 기능을 자동으로 안전하게 만들지 않으므로 PUBLIC_ORIGIN·CORS_ORIGIN·DB 경로·비밀 키를 각각 확인한다. 브라우저 코드는 상대경로 /api를 사용하여 서버 주소를 중복 하드코딩하지 않는다.

도서관에 비유하면 화면은 안내대, API 모듈은 운송 창구, 도메인은 대출 규칙, 저장소는 서고다. 서고를 바꾸어도 안내대의 질문 형식은 유지할 수 있다. 공통 함수는 부작용과 반환값을 드러내어 테스트에서 바꿔 넣을 수 있게 만든다.''', ['workbook/js/api.js', 'workbook/js/forms.js', 'server/index.js', '.env.example'], '1. api.js에서 공통 헤더·204·오류 처리를 확인한다.\n2. forms.js의 try/catch/finally를 확인하고 폼마다 중복하던 코드를 비교한다.\n3. .env에서 PUBLIC_ORIGIN과 CORS_ORIGIN을 동일한 개발 주소로 설정한다.\n4. 운영에서는 HTTPS 주소와 별도 DB·SMTP·AI 시크릿을 넣는다.', 'UI → api → route → board → repository 방향으로 의존한다. 테스트에서는 createBoard(mockRepo)처럼 저장소만 바꿔 넣는다. 다음 단계는 이 경계를 직접 검증하는 테스트다.', [('설정 변경이 반영 안 됨', '서버가 예전 환경을 사용', '서버 재시작'), ('운영에서 localhost API 호출', '프론트 주소 하드코딩', '상대경로 /api와 동일 출처 프록시'), ('순환 import로 초기화 오류', '하위 모듈이 진입점 import', '값을 인자·콜백으로 주입')], ['UI 파일에서 fetch 호출을 api 모듈 한곳으로 모은다.', '없는 설정을 주었을 때 어떤 오류가 필요한지 기록한다.', '같은 API 모듈로 GET과 본문 없는 DELETE를 실행한다.'], ['역할별 폴더와 공통 유틸을 구분한다', '개발·운영 환경변수와 공개/비밀 값을 나눈다', '테마·메뉴·폼·데이터 초기화를 진입점에서 조립한다'])

chapter(9, '테스트·디버깅', '단위·요청 테스트와 가짜 DB/API로 실패 경계를 재현한다.', '''단위 테스트는 작은 규칙 하나를 빠르게 확인한다. 요청 테스트는 HTTP 요청을 실제 서버에 보내 상태·본문·헤더·영속성을 확인한다. 브라우저 테스트는 사용자가 클릭하는 DOM에서 시작해 DB를 거쳐 다시 DOM으로 돌아오는 흐름을 확인한다. 서로 다른 경계의 증거가 필요하다.

mock은 의존하는 외부 시스템을 테스트용 구현으로 바꾸는 것이다. createBoard에 Map 기반 repo를 넣으면 DB 설치 없이 권한·검색 규칙을 시험할 수 있다. AI는 기본 mock provider로 과금 없이 SSE·사용량 제한을 검증한다. 실제 모델 품질과 네트워크 연결 검증을 대체하지는 않는다.

DevTools Sources에서 중단점을 걸고 입력→요청→응답→화면 순서로 본다. Network에서 메소드·경로·상태·본문을 확인하고 Console에서 예외를 본다. 서버 로그의 requestId와 오류 응답 requestId를 맞추면 어느 요청이 실패했는지 찾을 수 있다. 비밀번호·토큰·문서 본문을 로그에 넣지 않는다.''', ['tests/core.test.js', 'tests/api.test.js'], '1. npm test로 단위·요청 검사를 실행한다. 테스트는 임시 SQLite를 쓰고 종료 후 지운다.\n2. tests/core.test.js의 mock 저장소와 실제 SQLite 테스트를 구분해 읽는다.\n3. npx playwright install chromium 후 npm run test:browser를 실행한다.\n4. npm run dev 서버에서 한 요청을 실패시키고 X-Request-Id와 로그를 대조한다.', 'mock 저장소 → 도메인 규칙 검증, 임시 SQLite → HTTP 계약 검증, Chromium → 사용자 흐름 검증을 연결한다. 다음 단계는 검증한 파일을 빌드하고 배포 환경을 점검하는 일이다.', [('테스트가 내 DB를 변경', '운영 경로 재사용', '임시 폴더·:memory: 사용'), ('브라우저 실행 파일 없음', 'Playwright 브라우저 미설치', 'npx playwright install chromium'), ('테스트만 통과하고 UI 실패', 'HTTP와 DOM 계약이 다름', '브라우저 흐름까지 실행')], ['PATCH에서 태그를 지우는 버그를 일부러 만들고 요청 테스트 실패를 확인한다.', '가짜 저장소의 list가 예외를 던지게 해 실패 경로를 관찰한다.', 'DevTools에서 Offline으로 바꾸고 폼 버튼 복구를 확인한다.'], ['단위 테스트와 요청 테스트를 실행한다', '가짜 DB와 mock AI의 범위를 설명한다', 'requestId로 프론트와 서버 오류를 연결한다', '자주 나는 오류 TOP 10을 재현·해결한다'], '''### 자주 나는 오류 TOP 10

| 증상 | 원인 | 해결 |
|---|---|---|
| EADDRINUSE | 포트 중복 | 기존 서버 종료 또는 주소 설정 일괄 변경 |
| import 실패 | type=module·확장자 누락 | module과 .js 확인 |
| fetch 차단 | file:// 또는 CORS | HTTP·허용 origin 확인 |
| 404 | 경로·대소문자 오류 | Network와 서버 라우트 대조 |
| 400 | 필드명·JSON·스키마 오류 | error.fields와 본문 확인 |
| 401 | 토큰 없음·만료·로그아웃 | 로그인 후 메모리 토큰 갱신 |
| 403 | 다른 작성자·출처 | 권한과 Origin 확인 |
| JSON 파싱 실패 | 204 또는 저장값 손상 | 본문 유무·try/catch 확인 |
| 버튼 중복/잠김 | pending/finally 누락 | 제출 잠금과 복구 동시 적용 |
| DB 자료 사라짐 | 다른 파일·볼륨 미연결 | SQLITE_PATH·작업 폴더·볼륨 확인 |
''')

chapter(10, '빌드·배포·기초 정리', '정적 산출물과 API 서버 배포를 구분하고 환경변수·DB·HTTPS를 점검한다.', '''브라우저가 실행하는 HTML·CSS·JS는 이 과정에서 별도 컴파일이 필요하지 않다. npm run build는 정적 파일을 dist로 복사한다. .env·DB·서버 소스는 정적 산출물에 넣지 않는다. 정적 사이트 호스팅만으로는 Node API가 실행되지 않는다. 게시판은 Node 프로세스와 영속 DB가 필요하다.

도메인은 사람이 읽는 주소이고 DNS는 그 주소를 서버 IP에 연결한다. HTTPS는 TLS로 통신을 암호화하고 서버의 도메인을 검증한다. TLS 종료 프록시가 외부 HTTPS를 받아 내부 127.0.0.1:3000 HTTP로 전달할 수 있다. 클라이언트의 /api 상대경로와 WebSocket 경로도 같은 호스트로 보낸다.

배포는 파일 업로드만으로 끝나지 않는다. 환경변수·DB 경로·파일 권한·재시작·로그·백업을 함께 확인한다. 기초 정적 예제는 /practice/site와 /final-project에서 실행되고, 로그인·CRUD는 /midpoint에 모인다.''', ['scripts/build.js', 'ops/Caddyfile', 'scripts/backup.js'], '1. npm run check → npm test → npm run build 순서로 실행한다.\n2. dist 안에 .env나 data 폴더가 없는지 확인한다.\n3. 정적 부분만 시험하려면 python -m http.server 8080 --directory dist로 연다. API 기능은 npm start 또는 npm run midpoint가 필요하다.\n4. 서버에 저장소·Node를 준비하고 npm ci --omit=dev 후 환경변수를 설정한다.\n5. 실제 보유 도메인의 DNS와 Caddyfile 주소를 맞추고 80·443 포트를 연결한다.\n6. /health → 로그인 → 작성 → 수정 → 삭제 → 서버 재시작 후 DB 유지 순으로 점검한다.', '정적 파일은 브라우저로, /api는 Node로, SQLite는 영속 경로로 연결한다. Caddy가 HTTPS와 동일 출처를 제공한다. 다음 중간 프로젝트에서 기초 기능만 묶어 1차 서비스를 완성한다.', [('정적 호스팅에서 로그인 404', 'API 프로세스가 없음', 'Node 서버 배포 또는 API 프록시 구성'), ('배포 후 DB 초기화', '임시 디스크 사용', '영속 볼륨·외부 DB'), ('HTTPS 화면에서 연결 차단', 'HTTP API 혼합 콘텐츠', '동일 HTTPS 출처 /api')], ['dist로 기초 사이트를 열고 API가 필요한 화면과 구분한다.', '새 DB 파일 경로로 재시작해 빈 목록이 보이는 이유를 설명한다.', '서버를 재시작하고 기존 DB의 게시글이 유지되는지 확인한다.'], ['빌드 산출물에서 비밀 설정과 DB를 제외한다', '도메인·DNS·HTTPS와 API 프록시를 설명한다', '배포 환경변수·DB 경로·파일 권한을 점검한다', '기초 HTML·CSS·JS와 인증·CRUD를 복습한다'], '''### 배포 후 점검표

- [ ] DNS·HTTPS 인증서·만료 갱신을 확인했다.
- [ ] /health가 200이고 실제 로그인·CRUD가 동작한다.
- [ ] .env·DB 파일·서버 소스 URL이 공개되지 않는다.
- [ ] PUBLIC_ORIGIN·CORS_ORIGIN이 배포 주소와 같다.
- [ ] 서버 재시작 후 자료가 남고 백업 파일을 별도 위치에 보관한다.
- [ ] 모바일 폭·키보드 포커스·오류 메시지·Console을 확인했다.
- [ ] 이 저장소의 외부 배포는 별도 계정·도메인 설정 후 수행한다. 문서 작성만으로 배포 완료 처리하지 않는다.
''')

chapter('Midpoint', '중간 응용: 기초 게시판', 'study0~10의 지식만으로 회원가입·로그인·게시글 CRUD가 있는 서비스를 실행한다.', '''이 프로젝트는 함수·ESM·상태·DOM·hash 라우팅·폼·fetch·SQLite·인증만 사용한다. 심화 UI 저장소, 외부 DB 드라이버, 결제, AI, WebSocket은 사용하지 않는다. midpoint/app.js는 단순 변수와 함수로 화면을 만들고 server/basic.js는 Node 기본 HTTP로 요청을 분기한다.

기능 목록은 회원가입·로그인·로그아웃, 공개 글 목록·검색·페이지 이동·상세, 인증된 작성, 작성자 수정·삭제다. 서버는 공통 v1 댓글 경로도 제공한다. 별도 정적 Todo는 기초 로컬 상태 복습용으로 유지한다.

폴더는 midpoint/(화면), server/basic.js(라우트), auth.js(인증), validation.js(검증), board.js(규칙), sqlite.js(저장), errors.js(응답), static.js(파일 전달)다. UI가 서버 세부 저장 구조를 모르도록 API 계약을 경계로 둔다.''', ['midpoint/index.html', 'midpoint/app.js', 'server/basic.js', 'server/sqlite.js', 'server/auth.js', 'server/validation.js', 'server/board.js', 'server/errors.js', 'server/static.js'], '1. 목표와 기능 목록을 읽고 페이지의 입력·출력 영역부터 작성한다.\n2. SQLite 저장소 → 도메인 board → 인증 auth → HTTP 라우트 순으로 구현한다.\n3. 계정 폼 → 목록 → 상세 → 작성 → 수정 → 삭제 순서로 UI를 연결한다.\n4. 실행 중인 심화 서버를 종료하고 npm run midpoint로 기초 서버를 켠다. /midpoint/에 접속한다.\n5. 서로 다른 계정으로 작성자 권한을 확인하고 npm test로 공통 모듈도 검사한다.\n6. 1차 배포 전 환경·파일 공개·DB 영속성·HTTPS를 점검하고 회고를 쓴다.', '브라우저 HTML/DOM → fetch /api → basic HTTP → auth/board → SQLite records → data/meta/error → DOM이다. 이 결과의 API 계약을 유지하면서 study11부터 저장소와 외부 기능을 확장한다.', [('같은 포트의 화면이 다름', '기초/심화 서버 동시 실행', '한 서버를 종료한 뒤 npm run midpoint'), ('삭제 후 상세가 남음', '해시·selected 상태 정리 누락', '삭제 후 #/ 이동과 상세 다시 그리기'), ('수정 권한 실패', '다른 계정의 글', '서버 403을 정상 오류로 표시')], ['게시판을 처음부터 다시 만들되 코드 전문은 막힌 뒤 확인한다.', '댓글 UI를 기존 공통 API에 연결한다.', '제일 어려웠던 경계 하나와 다음에 바꿀 구조 하나를 회고로 쓴다.'], ['Vanilla JS로 Todo 한 개 만든 뒤 같은 것을 Vue로 옮기기 — 이 중 Vanilla JS Todo 구현', '목표·기능 목록·폴더 구조·구현 순서를 확인했다', '회원가입→로그인→목록→상세→등록→수정→삭제를 수행한다', '1차 배포 점검과 회고를 남긴다'], '''### DB·API 연동 구성도

```mermaid
flowchart LR
  UI[HTML CSS DOM] -->|fetch /api| HTTP[Node 기본 HTTP]
  HTTP --> Auth[Bearer 세션 검증]
  HTTP --> Board[게시글 규칙]
  Board --> SQLite[(SQLite records)]
  Auth --> SQLite
  SQLite -->|data meta error| UI
```

### 1차 배포 체크리스트

- [ ] Node 버전과 npm ci 결과를 기록했다.
- [ ] 별도 SQLITE_PATH에 쓰기 권한·영속 디스크가 있다.
- [ ] /health와 계정·게시글 API가 동작한다.
- [ ] 남의 글 수정 403·로그아웃 후 401을 확인했다.
- [ ] HTTPS·동일 출처·.env 비공개를 점검했다.
- [ ] 운영 전 로그인 rate limit과 공유 세션 정책을 심화 서버 수준으로 보강한다.

### 회고

1. 직접 만든 기능과 실행 결과를 적는다.
2. 증상→원인→해결을 요청 경계별로 정리한다.
3. localStorage Todo와 서버 DB 게시글의 저장 수명을 설명한다.
4. 다음 확장 전에 유지할 API 계약을 적는다. 학습자 자신의 수행 여부는 직접 체크한다.
''')

chapter(11, 'DB 교체와 ORM 설정', '같은 저장소 계약으로 MariaDB·PostgreSQL·MongoDB를 연결하고 ORM 매핑 차이를 읽는다.', '''저장소 계약 list/get/create/put/delete가 같으면 화면과 게시판 규칙을 유지한 채 DB 드라이버를 교체할 수 있다. SQL DB는 테이블·정수 PK·매개변수 쿼리, MongoDB는 collection·문서·update 연산자를 사용한다. 이 실습은 외부 API의 숫자 id를 지키기 위해 MongoDB의 별도 counters에서 원자적 증가 값을 받는다.

SQLite의 ?와 MariaDB의 ?는 바인딩 자리고 PostgreSQL은 $1,$2를 쓴다. PostgreSQL은 INSERT RETURNING id, MariaDB는 insertId를 반환한다. BIGINT 값은 Number 안전 범위를 고려해야 한다. 운영 규모에서는 외부 id를 문자열로 바꾸는 새 API 계약도 검토한다.

ORM은 객체/스키마 선언을 DB 질의로 연결한다. 기본 서버는 직접 드라이버를 사용하는 Data Mapper이며 별도 Drizzle 예제가 PostgreSQL records 모델을 선언하고 읽는다. Drizzle의 pgTable/bigserial은 PostgreSQL용이다. MariaDB를 ORM으로 연결하려면 mysqlTable/bigint(autoIncrement)와 drizzle-orm/mysql2·mysql2 드라이버 설정으로 변경한다. MongoDB는 SQL ORM 설정을 그대로 사용할 수 없고 공식 MongoClient 또는 별도 문서 ODM 모델을 쓴다.

DB_DRIVER 변경은 연결 대상 변경이다. 기존 SQLite 자료가 자동 이관되지는 않는다. 이관하려면 서비스 쓰기를 중지하고 종류별 id·참조·payload를 export/import한 뒤 행 수와 참조 무결성을 확인하고 각 DB sequence/counter를 최대 id보다 크게 맞춘다. 복사 전 백업과 읽기 검증이 먼저다.''', ['server/repository.js', 'lessons/study11/orm.js', 'scripts/check-databases.js', 'compose.yaml'], '1. Docker Desktop을 실행하고 docker compose --profile databases up -d postgres mariadb mongodb로 로컬 DB를 켠다.\n2. 컨테이너가 준비되면 npm run test:databases로 세 드라이버 CRUD를 확인한다.\n3. .env의 DB_DRIVER와 DATABASE_URL을 아래 표대로 바꾸고 서버를 재시작한다.\n4. 같은 브라우저에서 다시 가입·작성·수정·삭제한다. 데이터는 DB마다 별개다.\n5. PostgreSQL을 선택한 뒤 node --env-file=.env lessons/study11/orm.js로 ORM 조회를 실행한다.', '환경변수 → createRepository의 드라이버 분기 → 공통 repo 계약 → 기존 board/API/UI로 연결한다. 컨테이너 안에서 app을 실행하면 localhost 대신 postgres/mariadb/mongodb 서비스 이름을 쓴다. 다음 단계는 이 API 위 UI의 공통 상태·폼을 다듬는 작업이다.', [('ECONNREFUSED', 'DB 미실행·아직 초기화 중·잘못된 호스트', 'docker compose ps/logs와 포트 확인'), ('비밀번호 인증 실패', 'DATABASE_URL 또는 기존 볼륨 계정 불일치', '실제 DB 사용자와 URL 확인'), ('DB 교체 후 데이터 없음', '새 DB에 이관하지 않음', '새 자료 등록 또는 백업 기반 이관')], ['세 DB에서 같은 CRUD 계약 검사를 수행하고 결과를 기록한다.', 'ORM으로 records의 kind 조건 조회를 추가한다.', 'DB 교체와 데이터 마이그레이션이 다른 이유를 설명한다.'], ['DB_DRIVER·DATABASE_URL을 분리했다', 'MariaDB·PostgreSQL·MongoDB 연결 코드를 읽었다', 'ORM과 드라이버·SQL/문서 모델의 차이를 설명한다', '외부 DB 실행 검증 여부를 사실대로 기록한다'], '''| DB_DRIVER | 로컬 DATABASE_URL | ORM/모델 설정 |
|---|---|---|
| sqlite | 미사용, SQLITE_PATH 지정 | 기본 node:sqlite Data Mapper |
| postgres | postgresql://study:study@localhost:5432/study | pgTable + bigserial + drizzle(node-postgres) |
| mariadb | mariadb://study:study@localhost:3306/study | 기본 mariadb 드라이버; ORM 전환 시 mysqlTable + mysql2 |
| mongodb | mongodb://localhost:27017/study | MongoClient records collection + counters; SQL ORM 없음 |

compose의 계정은 루프백 로컬 실습 전용이다. 운영에서는 별도 비밀·TLS·접근 정책을 사용한다. 현재 머신에서 Docker 엔진이 꺼져 있으면 이 단계를 실제 연결 완료로 체크하지 않는다.
''')

chapter(12, '프론트·UI·상태·폼 연동', 'Vanilla JS에서 네이티브 UI와 상태 저장소·폼 도우미·검증 라이브러리를 연결한다.', '''브라우저 자체의 dialog는 모달 UI, Constraint Validation은 required/type/length 검사를 제공한다. 이 과정의 UI 계층은 네이티브 요소와 공통 CSS다. 프레임워크용 UI 라이브러리를 추가하지 않고 CSS 변수·flex·grid로 기존 문서의 표현을 유지한다. 외부 UI 패키지를 쓸 때도 DOM 생성·이벤트 해제·접근성 책임을 확인해야 한다.

store는 현재 상태를 보관하고 구독자에게 변경을 전달하는 작은 라이브러리다. get은 복제본을 주어 외부에서 몰래 원본을 바꾸지 못하게 한다. subscribe는 해제 함수를 반환한다. 상태 관리가 DOM 렌더링을 자동으로 수행하는 것은 아니므로 구독 콜백에서 화면을 갱신한다.

폼은 자체 forms.js 도우미와 서버의 Zod 라이브러리를 연결한다. bindForm은 submit 가로채기·유효성 검사·중복 제출 잠금·오류 처리·버튼 복구를 맡고 실제 API 작업은 콜백으로 받는다. 모든 폼을 하나의 거대한 함수로 합치지 않고 공통 수명만 재사용한다. UI 메시지에는 role=status를 사용한다.''', ['workbook/js/store.js', 'workbook/js/forms.js', 'server/validation.js', 'workbook/style.css'], '1. store.js를 읽고 subscribe에서 identity 텍스트를 바꾸는 흐름을 찾는다.\n2. forms.js를 계정·글·문서·질문 폼에 바인딩한다.\n3. 테스트 결제 버튼의 dialog를 키보드로 열고 Escape·닫기 버튼으로 닫는다.\n4. 1280px와 390px에서 grid·헤더·포커스 표시를 확인한다.', 'DOM 입력 → 폼 도우미 → API → store.set → 구독 UI로 연결한다. 서버 Zod는 최종 검증 경계이고 네이티브 UI와 CSS는 결과를 표시한다. 다음 단계는 같은 API 경계에 메일·결제·OAuth를 붙인다.', [('상태는 바뀌었는데 화면 그대로', '구독에서 렌더링하지 않음', 'subscribe 콜백에 필요한 DOM 갱신'), ('버튼 값이 사라짐', 'disabled 후 submitter 값을 읽음', '값을 먼저 캡처'), ('모달 뒤 화면으로 포커스 이동', '일반 div로 모달 흉내', 'dialog.showModal과 닫기 처리')], ['구독 해제 후 더 이상 UI가 변하지 않는지 확인한다.', '필드별 오류 메시지를 폼 도우미에 추가한다.', '네이티브 dialog에 제목과 설명 연결을 추가한다.'], ['CSS 변수로 색을 한 곳에 모으면 다크모드는 [data-theme="dark"]에서 변수만 다시 정의하면 끝난다.', '헤더처럼 한 줄 배치는 flex, 카드 목록처럼 격자는 grid. 640px 이하에서는 미디어쿼리로 1열 + 햄버거 메뉴.', 'UI·상태·폼 모듈의 역할을 구분한다', 'Zod 스키마와 HTML 유효성 검사를 연결한다'])

chapter(13, '외부 서비스: 메일·결제·업로드·OAuth', '외부 서비스 호출을 서버 모듈에 모으고 모의 응답과 실제 연결을 구분한다.', '''외부 서비스는 실패·지연·중복 응답이 있는 시스템이다. 브라우저는 내 API만 호출하고 공급자 비밀은 서버에 둔다. INTEGRATIONS_MODE=mock은 실제 메일·결제를 발생시키지 않는다. live 설정은 SMTP와 Stripe 테스트 키·GitHub OAuth 앱을 사용한다. 결제는 sk_test_ 키만 허용하여 학습 범위를 유지한다.

메일은 jobs에 queued를 저장한 뒤 setImmediate에서 처리한다. 응답 202는 발송 완료가 아니라 접수다. 작업 상태는 /api/jobs에서 확인한다. 이 큐는 단일 프로세스 학습용으로 프로세스 종료 시 queued 복구·재시도가 없다. 운영에서는 내구성 있는 외부 큐와 idempotency 키를 설계한다.

Stripe Checkout은 서버가 고정한 가격 id로 세션을 만들고 브라우저를 공급자 화면으로 보낸다. success URL 방문만으로 결제 완료를 믿지 않는다. 웹훅 원문과 서명을 Stripe SDK로 검증하고 eventId를 기록하여 단일 프로세스에서 중복 처리를 피한다. 여러 인스턴스에서는 eventId DB UNIQUE와 트랜잭션이 필요하다.

OAuth는 비밀번호를 받는 대신 공급자가 확인한 계정을 연결한다. state 난수·5분 만료·HttpOnly SameSite 쿠키를 서로 맞추고 일회성으로 소비한다. 기존 비밀번호 계정에 같은 이메일이라는 이유만으로 자동 연결하지 않는다. 코드 교환과 프로필 조회는 서버에서 수행한다.

업로드는 TXT·MD를 UTF-8 텍스트로 읽어 내 서버 JSON API에 보낸다. 파일명을 디스크 경로로 사용하지 않는다. 브라우저 Worker 검사 외에도 서버가 확장자·문자 수·본문 바이트 한도를 다시 검사한다. PDF·DOCX·PPTX 추출은 별도 구현 대상이다.''', ['server/integrations.js', 'workbook/js/file-worker.js'], '1. 기본 mock 모드에서 로그인 후 메일·결제·GitHub 버튼을 눌러 모의 표시를 확인한다.\n2. /api/jobs에서 queued→done을 확인한다.\n3. 실제 연동 시 .env의 SMTP_*·STRIPE_*·GITHUB_*를 채우고 INTEGRATIONS_MODE=live로 바꾼다.\n4. GitHub 앱 callback을 PUBLIC_ORIGIN/api/auth/github/callback으로 등록한다.\n5. Stripe 테스트 웹훅 주소를 /api/payments/webhook으로 연결하고 서명 비밀을 설정한다.\n6. TXT·MD 업로드의 서버 거부 조건을 확인한다.', '브라우저 → 내 /api/mail·checkout·auth/github·documents → 외부 서비스/DB → 상태 응답으로 이어진다. 외부 성공을 확인할 책임은 서버에 있다. 다음 단계에서 이 경로와 응답을 OpenAPI에 명시한다.', [('메일 접수 후 도착 안 함', '202를 완료로 오해·SMTP 실패', 'jobs.status와 SMTP 설정 확인'), ('결제 성공 URL 위조', 'redirect를 결제 근거로 사용', '서명 검증 웹훅만 근거로 사용'), ('OAuth state 불일치', '쿠키 차단·만료·호스트 다름', '같은 PUBLIC_ORIGIN으로 다시 시작')], ['모의와 live 표시가 혼동되지 않게 UI 문구를 확인한다.', 'OAuth callback에 잘못된 state를 보내 400을 확인한다.', '확장자와 내용이 다른 파일·60KB 초과 파일을 업로드한다.'], ['외부 서비스 비밀을 서버 환경변수에만 둔다', '메일 202와 실제 발송 완료를 구분한다', '결제 웹훅 서명·중복 이벤트를 검사한다', 'OAuth state·만료·공급자 id와 서버 업로드 검증을 확인한다'])

chapter(14, 'REST·OpenAPI·버전·페이지네이션', '노션 공통 API v1을 문서화하고 리소스·상태·오류·페이지 규칙을 고정한다.', '''REST 경로는 복수 명사 리소스로 작성한다. /api/posts와 /api/posts/{id}를 사용하고 /api/getPosts 같은 동사 경로를 만들지 않는다. GET은 읽기, POST는 생성, PATCH는 부분 변경, DELETE는 삭제다. 이 계약의 버전은 v1이지만 기본 경로는 /api다.

호환성을 깨는 필드·의미 변경이 필요할 때만 새 버전 계약을 별도로 설계한다. 기존 경로를 조용히 /api/v1로 바꾸지 않는다. 목록은 q·page·limit·sort를 받고 페이지는 1부터 시작한다. totalPages는 ceil(total/limit)이며 빈 목록은 0이다. UI에서 보이는 1/1은 빈 상태 표시용이다.

OpenAPI는 경로·입력·응답을 기계가 읽는 계약이다. /api-docs에서 OpenAPI 3 JSON을 반환한다. Swagger UI를 번들에 포함하지 않으며 Swagger Editor나 UI에 이 JSON을 가져와 시각화할 수 있다. API 문서가 실제 라우트와 다르면 오히려 오류를 만들므로 요청 테스트와 함께 검증한다.

모든 오류는 error.code/message/fields/requestId를 가지며 X-Request-Id와 본문 id가 같다. 500에는 예외 원문을 노출하지 않는다. 게시판 검증은 400이고 study5의 별도 학습 경로만 422를 시연한다. 클라이언트는 상태 코드와 error.code를 기준으로 다음 행동을 결정한다.''', ['server/openapi.js', 'server/errors.js'], '1. npm run dev 후 /api-docs의 JSON을 연다.\n2. Swagger Editor에 가져와 경로·Bearer·id 파라미터를 확인한다.\n3. /api/posts?page=1&limit=2&sort=-createdAt&q=HTML을 요청한다.\n4. 400·401·403·404·409·413·429 응답을 테스트와 대조한다.', '노션 v1 → OpenAPI → 서버 라우트 → 요청 테스트 → 브라우저 API 모듈로 연결한다. 다음 단계에서 같은 계약의 지연·캐시·처리량을 측정한다.', [('문서 경로는 있는데 서버 404', '계약 문서와 라우트 불일치', '실제 app.js 경로와 테스트 대조'), ('페이지 수가 하나 많음', '0/1 기준 혼동', 'page=1 시작·ceil(total/limit)'), ('오류 추적 id가 다름', '본문/헤더에서 별도 생성', '요청당 requestId 하나 공유')], ['OpenAPI에 새 응답 예시를 추가하고 문서와 테스트를 동시에 고친다.', 'limit=100 요청이 50으로 제한되는지 확인한다.', '빈 목록·마지막 페이지·범위 밖 페이지의 meta를 기록한다.'], ['공통 API 스펙 v1의 /api 경로를 유지한다', 'REST 메소드와 200·201·204·4xx 규칙을 설명한다', 'OpenAPI와 실제 응답을 대조한다', 'page·limit·total·totalPages·q와 공통 오류 형식을 확인한다'])

chapter(15, '성능·캐시·비동기·백그라운드', '측정값을 기준으로 정적 캐시와 작업 분리를 적용하고 한계를 확인한다.', '''최적화는 느린 경계를 측정하는 데서 시작한다. 브라우저 Network는 요청 시간과 전송량, Performance는 긴 메인 스레드 작업, 서버 JSON 로그는 요청 지연을 보여준다. 한 번의 수치보다 반복 측정의 중앙값·p95를 비교한다. DevTools Lighthouse 수치는 실행 환경과 상태를 함께 기록한다.

정적 파일은 ETag를 반환한다. 브라우저가 If-None-Match를 보내고 내용이 같으면 304로 본문을 재전송하지 않는다. Cache-Control:no-cache는 저장 금지가 아니라 사용 전 재검증이다. 인증·개인 문서 API는 no-store로 저장을 막는다. 공개 게시글 캐시를 추가하려면 작성·수정·삭제 시 무효화와 사용자별 데이터 혼합을 설계해야 한다.

async/await는 I/O 대기를 표현하지만 CPU 작업을 자동으로 다른 스레드에 보내지 않는다. 파일 UTF-8 검사와 읽기는 Web Worker로 옮겨 UI와 분리한다. 메일 작업은 jobs에 접수 후 비동기 처리한다. 이 학습용 작업 큐는 재시작 복구가 없으므로 운영 큐와 구분한다.

현재 repository.get과 게시판 검색은 종류 전체를 읽는다. 작은 자료에서 구조를 익히는 실습이며 대량 데이터에서는 WHERE·LIMIT/OFFSET·JOIN·적절한 인덱스를 DB에 내려야 한다. WebSocket 알림 후 목록 조회도 잦으면 debounce·공개 캐시를 검토한다.''', ['server/static.js', 'lessons/study15/measure.js', 'server/integrations.js'], '1. 서버를 켜고 node lessons/study15/measure.js로 20회 응답 시간을 측정한다.\n2. 브라우저에서 같은 CSS를 다시 읽고 ETag·304를 확인한다.\n3. 문서 파일 업로드 중 입력 UI가 응답하는지 Performance에서 관찰한다.\n4. 메일 접수 응답과 jobs 완료 시간을 나누어 기록한다.', '정적 파일 → ETag 재검증, 개인 API → no-store, 파일 → Worker, 메일 → jobs로 연결한다. 다음 단계는 이 관찰값을 배포·로그·모니터링·백업 운영 절차로 고정한다.', [('캐시 때문에 남의 정보 노출', '인증 응답을 공용 캐시', '개인 API no-store와 권한 확인'), ('await를 썼는데 UI 멈춤', 'CPU 작업이 메인 스레드', 'Worker 분리·입력 크기 제한'), ('재시작 후 작업이 queued', '메모리 스케줄러 소실', '운영 외부 큐·재시도·중복 제거 설계')], ['캐시 미사용/재검증 때 전송량과 시간을 기록한다.', '게시글 수를 늘려 p95가 변하는지 확인한다.', '목록 질의를 DB 페이지네이션으로 옮길 설계를 작성한다.'], ['정적 ETag·304와 개인 API no-store를 구분한다', '중앙값·p95·전송량을 측정한다', '비동기 I/O·Worker·백그라운드 큐 차이를 설명한다', '대량 데이터와 작업 복구 한계를 기록한다'])

chapter(16, '운영·Docker·CI/CD·백업', '검증·이미지 빌드·선택 자동 배포·로그·백업·복원 점검표를 만든다.', '''Docker 이미지는 실행 코드와 의존성을 고정하고 컨테이너 환경변수와 볼륨은 운영 설정과 데이터를 공급한다. 이미지 안에 .env와 DB를 넣지 않는다. node 사용자는 root가 아니며 /app/data만 쓰기 가능한 볼륨으로 연결한다. HOST=0.0.0.0은 컨테이너 안에서만 모든 인터페이스를 수신하고 호스트 포트는 루프백에 묶는다.

GitHub Actions는 push/PR에서 npm ci→check→test→Chromium→build→Docker build를 실행한다. 배포는 DEPLOY_ENABLED=true일 때만 GHCR에 커밋 SHA 이미지 태그를 올리고 SSH로 compose up을 수행한다. production 환경 승인·시크릿·known_hosts를 구성한 후 활성화한다. 기본 푸시는 검증 작업만 실행한다.

로그는 requestId·메소드·경로·상태·ms를 JSON으로 남긴다. /health는 생존, /api/metrics는 프로세스 uptime·메모리의 기초 관찰 지점이다. 운영 readiness에는 DB 조회·외부 의존성·포화 상태를 별도로 점검한다. 비밀·문서·비밀번호를 로그에 넣지 않는다.

SQLite 온라인 백업 API는 WAL과 일관성을 고려하여 사본을 만든다. 파일을 단순 복사하는 것보다 실행 중 DB 백업에 적합하다. 복원은 기존 DB에 덮어쓰지 않고 새 경로로 수행한 뒤 무결성을 검사하고 설정을 변경한다. 백업 완료와 복원 가능 여부는 다른 기준이다.''', ['Dockerfile', '.dockerignore', 'compose.yaml', '.github/workflows/ci.yml', 'ops/compose.production.yaml', 'scripts/backup.js', 'scripts/restore.js'], '1. .env를 만들고 docker compose up -d --build로 실행한다. Docker 엔진이 먼저 실행되어 있어야 한다.\n2. docker compose ps와 docker compose logs app을 확인한다.\n3. npm run backup 후 생성된 파일을 다른 위치에 보관한다.\n4. npm run restore -- backups/선택파일.sqlite data/restored.sqlite로 새 경로에 복원한다.\n5. 서버를 멈추고 SQLITE_PATH를 restored.sqlite로 바꾼 뒤 자료를 확인한다.\n6. CI 시크릿과 원격 서버를 준비한 뒤에만 DEPLOY_ENABLED를 활성화한다.', 'Git push → CI 검사 → 이미지 SHA 태그 → 선택 GHCR/SSH 배포 → reverse proxy HTTPS → 영속 볼륨 → 백업·복원으로 이어진다. 다음 단계에서는 연결을 유지하는 실시간 알림과 파일 작업을 운영 조건 안에서 확장한다.', [('Docker named pipe 없음', 'Docker Desktop 엔진 미실행', 'Docker Desktop 시작 후 docker info'), ('이미지 pull 권한 없음', '원격 GHCR 로그인 누락', '배포 서버에서 읽기 권한 계정 로그인'), ('복원 대상이 존재함', '기존 DB 덮어쓰기 방지', '새 대상 경로로 복원')], ['백업을 새 경로로 복원하고 실제 게시글을 조회한다.', '잘못된 DB 설정으로 /health와 실제 API 차이를 기록한다.', '이전 SHA 이미지로 롤백하는 명령과 DB 호환성 조건을 적는다.'], ['Docker·Actions·로그·모니터링·백업 체크리스트를 수행한다', '운영 시크릿·known_hosts·영속 볼륨을 분리한다', '백업 사본의 무결성과 새 경로 복원을 확인한다', '실제 배포·컨테이너 실행 여부를 검증 기록에 구분한다'], '''### 운영·자동 배포 체크리스트

- [ ] Docker 엔진·이미지 빌드·비root 사용자·healthcheck를 확인했다.
- [ ] PUBLIC_ORIGIN·CORS_ORIGIN·DB·AI·SMTP 비밀을 서버에만 설정했다.
- [ ] 원격 `/opt/html-study`와 `.env`, Docker Compose, 영속 볼륨, HTTPS 프록시를 준비했다.
- [ ] GHCR 비공개 이미지라면 원격 서버에 pull 권한 로그인을 구성했다.
- [ ] Actions production 환경에 DEPLOY_HOST·DEPLOY_USER·DEPLOY_SSH_KEY·DEPLOY_KNOWN_HOSTS 시크릿을 설정했다.
- [ ] DEPLOY_ENABLED=true를 켜기 전에 이전 이미지 태그와 DB 백업·롤백 절차를 준비했다.
- [ ] 5xx 비율·p95·메모리·디스크·인증서 만료·백업 실패에 알림 기준을 세웠다.
- [ ] 실제 이미지 배포 후 /health와 로그인·CRUD·DB 유지 여부를 확인했다.

외부 DB 백업: PostgreSQL `pg_dump`/`pg_restore`, MariaDB `mariadb-dump`, MongoDB `mongodump`/`mongorestore`를 해당 버전 공식 문서에 맞춰 사용한다. 비밀번호를 명령 문자열·로그에 직접 적지 않는다.
''')

chapter(17, '실시간 알림·파일 처리·확장', 'WebSocket 공개 변경 알림과 Worker 파일 검사를 화면에 붙인다.', '''WebSocket은 연결을 유지하며 양방향 메시지를 주고받는 통로다. 이 실습은 공개 게시글의 변경 id만 서버에서 브라우저로 보낸다. 비공개 문서·토큰·메일 주소는 전달하지 않는다. 메시지를 받으면 목록을 다시 읽어 API를 진실의 원천으로 삼는다.

서버는 /ws 경로와 Origin을 검사하고 연결 수·메시지 크기를 제한한다. 클라이언트가 보내는 임의 메시지는 거절한다. ping/pong으로 끊어진 연결을 정리하고 브라우저는 3초 뒤 재연결한다. 여러 서버 인스턴스로 늘리면 인스턴스 사이 알림은 Redis 같은 pub/sub로 공유해야 한다.

Web Worker는 별도 실행 맥락에서 파일을 해독·검사한다. DOM은 직접 만지지 않고 postMessage로 파일 정보와 텍스트를 돌려준다. Worker 종료를 finally에서 수행해 자원을 정리한다. 허용 확장자는 콘텐츠 안전 보장의 전부가 아니므로 서버에서도 다시 입력을 검사하고 텍스트로 출력한다.

WebSocket과 SSE는 목적이 다르다. 게시글 변경 통지는 WebSocket으로, POST와 인증 헤더가 필요한 모델 응답은 fetch+SSE로 받는다. HTTPS 페이지는 wss를 사용하여 혼합 콘텐츠를 피한다.''', ['server/realtime.js', 'workbook/js/realtime.js', 'workbook/js/file-worker.js'], '1. 같은 게시판을 탭 두 개로 열고 한쪽에서 글을 작성한다.\n2. 다른 탭의 목록이 알림 후 갱신되는지 확인한다.\n3. Network → WS에서 posts.changed 메시지와 id만 전달되는지 본다.\n4. 서버를 재시작해 재연결을 확인한다.\n5. UTF-8 TXT·MD와 잘못된 인코딩·큰 파일을 업로드한다.', 'DB 변경 완료 → realtime.notify → WebSocket 이벤트 → 기존 목록 GET → DOM 갱신이다. Worker의 파일 텍스트는 /api/documents로 보내고 다음 단계 AI 질의의 근거로 쓴다.', [('HTTPS에서 WS 실패', 'ws:// 하드코딩', 'location.protocol에 맞춰 wss 선택'), ('연결 후 알림 없음', 'upgrade 콜백에서 connection 초기화 누락', 'connection 이벤트와 clients 등록 확인'), ('Worker는 통과했는데 서버 거절', '서버 한도·문자수·스키마 불일치', '서버 기준 오류를 표시하고 파일 크기 조정')], ['다른 출처의 WebSocket 연결이 거절되는지 확인한다.', '탭을 닫고 서버 연결이 정리되는지 관찰한다.', '파일 확장자만 바꾼 비 UTF-8 데이터를 보내 오류를 확인한다.'], ['WebSocket 공개 알림·Origin·크기·연결 수·정리를 확인한다', '두 탭의 글 변경 알림을 확인한다', 'Worker 입력·응답·종료와 서버 재검증을 연결한다'])

chapter(18, 'AI API·프롬프트·스트리밍·MCP', '문서 근거 기반 AI 응답과 읽기 전용 MCP 서버·클라이언트를 JavaScript로 연결한다.', '''내 서비스가 모델을 호출하는 흐름은 브라우저→내 서버→모델이다. 반대로 MCP는 AI 앱이 내 서비스의 도구를 호출하는 표준 통로다. 이 실습의 MCP 서버는 공개 게시글 검색만 제공하고 로컬 stdio로 실행된다. 원격 인증 서버를 구현했다고 주장하지 않는다.

DocuForge 노션에서 문서 업로드→요약→문서 근거 질문→발췌 번호 인용이라는 기능 아이디어를 가져온다. 원래 프로젝트의 여러 프레임워크를 이 저장소에 통합하지 않는다. 이 미니 예제는 UTF-8 TXT·MD, 고정 600자 청크, 질문 단어 포함 점수 상위 3개 검색으로 줄인다. PDF·DOCX·PPTX·임베딩·OCR은 구현 범위 밖으로 기록한다.

AI_PROVIDER=mock은 발췌를 잘라서 모의 표시로 반환한다. compatible은 AI SDK의 OpenAI 호환 provider로 Ollama /v1 또는 서버 운영자가 지정한 호환 모델 API에 연결한다. AI_MODEL은 실제 설치·공급자 목록에서 확인한 id를 넣는다. 브라우저 사용자 토큰과 AI_API_KEY는 서로 다른 비밀이다.

프롬프트는 문서 발췌만 근거로 답하고 번호를 인용하며 근거가 없으면 찾을 수 없다고 지시한다. 문서 안의 명령도 불신 데이터다. 지시문만으로 프롬프트 인젝션을 완전히 방지할 수 없으므로 모델에 도구 실행 권한을 주지 않고 출력도 textContent로 렌더링한다. 입력 1000자·문서 20000자·출력 토큰·90초 timeout·사용자별 일일 요청 수를 제한한다.

SSE는 data: JSON과 빈 줄로 이벤트를 구분한다. 네트워크 청크는 이벤트 경계와 다르므로 미완성 프레임과 UTF-8 디코더 상태를 보관한다. fetch는 POST·Bearer 헤더·AbortController를 지원한다. 연결 종료 시 모델 호출도 취소하고 DB에 질문 기록·provider·사용량/실패를 남긴다.

MCP client는 initialize 후 tools/list와 tools/call을 수행한다. SDK가 핸드셰이크를 처리한다. 서버의 stdout은 JSON-RPC 전용이며 로그는 stderr로 쓴다. 실행 명령은 process.execPath와 고정 스크립트 경로이며 사용자 입력을 셸 명령으로 실행하지 않는다.''', ['server/ai.js', 'workbook/js/sse.js', 'mcp/server.js', 'mcp/client.js'], '1. npm run dev 후 로그인하고 문서 AI에서 TXT·MD를 업로드한다.\n2. 문서에 있는 단어로 질문하고 모의 표시·근거 번호·질문 기록을 확인한다.\n3. 실제 모델 연결은 아래 환경 설정 후 서버를 재시작한다.\n4. Network의 text/event-stream과 응답 중단 버튼을 확인한다.\n5. 별도 터미널에서 npm run mcp:client로 도구 목록과 공개 검색 결과를 확인한다.\n6. 모델을 끄고 502 또는 SSE 오류가 화면에 표시되는지 확인한다.', 'Worker 문서 → /api/documents DB → 소유자 확인 → 발췌 검색 → 서버 모델 API → SSE → textContent → 질문/사용량 DB로 연결한다. MCP client → stdio server → 기존 /api/posts 검색은 별도 읽기 전용 연결이다. 최종 프로젝트는 이 흐름과 DB·운영 점검을 묶는다.', [('모델 이름 없음·404', 'AI_MODEL 미설정·미설치', 'ollama list 또는 공급자 모델 목록에서 확인'), ('스트리밍 JSON 파싱 실패', '청크 경계를 이벤트 경계로 오해', 'UTF-8 decoder와 프레임 buffer 사용'), ('MCP 초기화 실패', '서버 stdout에 일반 로그 출력', 'JSON-RPC 외 로그를 stderr로 이동')], ['근거가 있는 질문과 없는 질문의 sources·답변을 비교한다.', '응답 중단·모델 서버 중지·일일 한도를 각각 시험한다.', 'MCP 검색 도구가 쓰기·비공개 문서 접근을 제공하지 않는지 확인한다.'], ['API 키를 서버 환경 변수로만 다루고, 브라우저에는 절대 노출하지 않기', '스트리밍(SSE)으로 글자가 흘러나오게 하기 + 프론트에서 받기', '프롬프트 인젝션·비용 폭주·키 유출 점검', 'DocuForge의 문서 근거·발췌 인용 아이디어를 독립 JavaScript 예제로 연결한다', 'MCP 서버·클라이언트의 도구 목록·호출을 확인한다'], '''### 실제 모델 설정

```dotenv
AI_PROVIDER=compatible
AI_BASE_URL=http://localhost:11434/v1
AI_MODEL=실제로_설치한_모델_ID
AI_API_KEY=
AI_DAILY_REQUEST_LIMIT=20
AI_MAX_OUTPUT_TOKENS=512
```

Ollama를 설치·실행한 뒤 `ollama --version`과 `ollama list`로 확인한다. 필요한 모델을 공식 라이브러리에서 선택해 `ollama pull 모델ID`로 설치한다. 모델 이름·하드웨어 요구량을 추측해 고정하지 않는다. 외부 호환 API는 서버 전용 AI_API_KEY와 HTTPS base URL을 사용한다.

### DocuForge와의 연결 범위

기능 아이디어 출처: [DocuForge 노션](https://app.notion.com/p/40bd7dec5e2e818d9c91c6fb26dccc4c). 원본 API는 /api/documents, /api/documents/:id, /api/documents/:id/questions이다. 이 실습은 문서 목록·등록·상세·질문 기록을 유지하고 모델 생성은 /api/ai/chat(/stream)으로 분리한다. 요약은 질문 칸에 "문서의 핵심 내용을 요약해 줘"처럼 입력하되 현재 단어 기반 검색 특성상 문서의 주제어를 포함해야 한다.

노션 AI 학습 목표 중 JWT 지정, 일일 **토큰** 총량 제한, 자동 tool-use, 원격 MCP/Claude 앱 연결은 이 구현에서 완료 처리하지 않는다. opaque Bearer, 요청 횟수 제한, 읽기 전용 로컬 MCP만 구현했다. 토큰 사용량은 공급자가 반환할 때 기록하고, 강제 비용 상한은 요청 수×출력 토큰 상한으로 제한한다.
''')

FINAL_FILES = ['workbook/index.html', 'workbook/style.css', 'workbook/js/app.js', 'workbook/js/api.js', 'workbook/js/forms.js', 'workbook/js/store.js', 'workbook/js/sse.js', 'workbook/js/realtime.js', 'workbook/js/file-worker.js', 'server/index.js', 'server/app.js', 'server/repository.js', 'server/board.js', 'server/auth.js', 'server/validation.js', 'server/errors.js', 'server/static.js', 'server/integrations.js', 'server/ai.js', 'server/realtime.js', 'server/openapi.js', 'mcp/server.js', 'mcp/client.js', 'Dockerfile', 'ops/compose.production.yaml', '.github/workflows/ci.yml']
chapter('Final', '심화 응용: 게시판 + 문서 AI', '기초 게시판에 DB 교체·외부 연동·AI·실시간·Docker·자동 배포 경계를 더한 독립 JavaScript 서비스를 완성한다.', '''목표는 순수 HTML·CSS·JavaScript를 유지한 채 서비스의 전체 데이터 흐름을 설명하고 실행하는 것이다. 기본 SQLite로 즉시 학습할 수 있고 외부 DB·모델·메일·결제·OAuth는 설정을 주입해 확장한다. 다른 프레임워크와 비교하거나 하나의 앱에 통합하지 않는다.

기능 목록은 회원가입·로그인·로그아웃·작성자 권한, 게시글·댓글 CRUD, 검색·정렬·페이지네이션, 테마·반응형·키보드 접근, 문서 TXT·MD 업로드·근거 질문·SSE·질문 기록, 공개 변경 알림, 모의/실제 외부 서비스 경계, 네 DB 드라이버, OpenAPI, 테스트·Docker·선택 CI 배포·백업이다.

폴더 구조는 workbook/(UI), server/(요청/도메인/인증/저장소/외부), mcp/(읽기 전용 도구), tests/(규칙·요청), scripts/(빌드·검증·백업), ops/(운영)로 나뉜다. midpoint의 API·도메인·인증 규칙을 유지하고 심화 UI와 실행 진입점을 사용한다.

완료 기준은 구현·문서·검증 증거를 구분하는 것이다. 로컬 SQLite·모의 AI와 브라우저 검사는 실제로 실행할 수 있다. 외부 DB·실제 모델·결제·메일·OAuth·Docker·원격 배포는 해당 서비스 설정과 실행 결과가 있어야 검증 완료로 표시한다. 이 저장소가 운영 규모의 정규화 DB·다중 인스턴스 큐·전체 RAG를 구현했다고 간주하지 않는다.''', FINAL_FILES, '1. 목표·기능 목록·구성도를 먼저 읽고 midpoint의 계정/게시글 흐름을 복습한다.\n2. npm ci → .env 생성 → npm run dev → /workbook/을 연다.\n3. 계정 두 개로 게시글·댓글 CRUD·권한을 확인한다.\n4. DB_DRIVER를 바꾸어 저장소 계약을 확인하고 자료 이관은 별도 백업·검증 절차로 수행한다.\n5. 모의 메일·결제·OAuth 경계를 확인한 뒤 필요한 실제 테스트 서비스를 설정한다.\n6. TXT·MD 업로드 → 근거 질문 → SSE·중단 → 기록 → MCP 검색을 연결한다.\n7. npm run check·npm test·npm run test:browser·npm run build를 실행한다.\n8. Docker·Actions 시크릿·HTTPS·영속 볼륨·백업·복원·롤백 점검을 수행하고 최종 회고를 쓴다.', '중간 프로젝트의 /api 계약 → 교체 가능한 DB → 외부 서비스 → 문서 AI/SSE/MCP → CI·이미지·HTTPS·영속 데이터 운영을 연결한다. 다음 학습은 이 서비스 안에서 정규화·DB 쿼리 최적화·내구 큐·토큰 총량 제한을 실제 데이터와 측정으로 보강하는 일이다.', [('모의 응답을 실제 성공으로 오인', '환경과 결과 표시 없음', 'mock·live 표시와 검증 범위 기록'), ('서버 여러 개에서 중복 계정·이벤트', '프로세스 내 직렬 큐만 사용', 'DB UNIQUE·트랜잭션·공유 rate limit·pub/sub 도입'), ('운영 배포 후 외부 연동 실패', '시크릿·DNS·네트워크·권한 누락', '배포 후 경계별 smoke test와 로그 requestId 확인')], ['새 계정으로 전체 사용자 흐름을 문서만 보고 재현한다.', 'DB·AI 서버가 각각 꺼진 상황에서 오류와 복구 절차를 기록한다.', '최종 회고에 직접 확인한 것·아직 검증하지 못한 것·다음 개선 하나씩을 적는다.'], ['기초 게시판과 study11~18을 연결했다', 'DB 교체·외부 서비스·AI·Docker·자동 배포 코드를 확인했다', '단위·요청·브라우저 테스트와 보안 점검을 수행한다', '실제 외부 서비스·배포 검증 상태를 구분한다', '미반영 원문 항목과 이유를 docs/coverage.md에서 확인한다'], '''### 연동 구성도

```mermaid
flowchart TD
  UI[HTML CSS Vanilla JS] -->|Bearer JSON| API[Node 기본 HTTP /api]
  API --> Domain[auth board validation]
  Domain --> Repo[공통 저장소 계약]
  Repo --> DB[(SQLite / PostgreSQL / MariaDB / MongoDB 중 하나)]
  API --> External[SMTP / Stripe 테스트 / GitHub OAuth]
  API --> AI[소유자 검사 → 발췌 검색 → AI SDK]
  AI --> Model[Ollama 또는 호환 모델 API]
  AI -->|SSE| UI
  API -->|공개 id 알림 WebSocket| UI
  Client[MCP client] -->|stdio| MCP[읽기 전용 MCP server]
  MCP -->|공개 게시글 검색| API
  Git[GitHub Actions] --> Image[Docker 이미지 SHA 태그]
  Image --> Host[서버 HTTPS 프록시 + 영속 볼륨]
```

### 배포·테스트·보안 체크리스트

- [ ] 회원가입·로그인·만료·로그아웃·남의 글 403을 확인했다.
- [ ] XSS 문자열 출력·입력 한도·SQL 바인딩·Origin·비밀 비공개를 점검했다.
- [ ] DB 변경 시 새 연결·이관·백업·id 참조·카운터를 확인했다.
- [ ] 결제는 테스트 키·서명 검증·eventId, OAuth는 state·만료·공급자 id를 확인했다.
- [ ] 문서는 소유자만 조회·질의하고 모델은 서버에서만 호출한다.
- [ ] AI 키·입력/출력 상한·요청 한도·timeout·중단·사용량·근거를 점검했다.
- [ ] MCP는 로컬 읽기 전용이고 원격 인증 MCP를 완료로 표시하지 않았다.
- [ ] 테스트·빌드·컨테이너·HTTPS·환경변수·볼륨·로그·복원을 실제 환경에서 확인했다.
- [ ] 다중 인스턴스 전환 전에 DB 제약·트랜잭션·큐·pub/sub를 보강한다.

### 최종 회고

1. 실제 실행한 사용자 흐름과 테스트 결과를 적는다. 자동 검증 결과는 [검증 기록](docs/verification.md)에 남긴다.
2. 가장 크게 바뀐 경계와 그 이유를 설명한다. 저장소와 UI 계약을 예로 든다.
3. 오류 하나를 증상·원인·해결·재발 방지 순서로 적는다.
4. 모의 기능과 실제 외부 연결, 로컬 실행과 원격 배포를 구분한다.
5. 다음 개선은 측정한 병목이나 확인한 운영 위험에서 하나를 고른다.
''')

def line_explanation(line, filename):
    """코드의 실제 연산과 선언을 줄 번호별로 설명한다. 내용은 수동 본문 설명과 함께 읽는다."""
    s = line.strip()
    if not s: return '가독성을 위해 처리 단계를 구분한다.'
    comment = re.search(r'(?<!:)//\s*([가-힣].*)', s)
    if comment: return comment.group(1)
    if s.startswith('//'): return s[2:].strip()
    if s.startswith('/*'): return s.strip('/* ')
    if s.startswith('import '): return '필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다.'
    if s.startswith('export '): return '다른 모듈이 사용할 인터페이스를 공개한다. ' + explain_operation(s[7:])
    if s.startswith('<!'): return 'HTML 표준 모드로 문서를 해석하도록 선언한다.'
    if filename.endswith(('.html', '.svg')):
        tags = re.findall(r'<([a-z][\w-]*)\b', s)
        meanings = {'html':'문서 언어/루트', 'head':'메타정보', 'meta':'문자 인코딩·화면 배율·설명', 'title':'브라우저 탭 제목', 'link':'공통 CSS 연결', 'header':'머리말', 'nav':'탐색 링크', 'main':'본문', 'section':'주제 구역', 'h1':'최상위 제목', 'h2':'구역 제목', 'h3':'하위 제목', 'p':'설명·상태 메시지', 'form':'입력 제출 단위', 'label':'입력의 접근 가능한 이름', 'input':'사용자 입력', 'textarea':'여러 줄 입력', 'button':'키보드 가능한 동작', 'script':'ESM 진입점 연결', 'a':'URL·해시 이동', 'table':'행·열 자료', 'img':'대체 텍스트를 가진 이미지', 'dialog':'네이티브 모달', 'select':'문서 선택', 'pre':'줄바꿈을 보존한 텍스트 출력'}
        return ' / '.join(dict.fromkeys(meanings.get(t, t+' 요소') for t in tags)) + ('를 정의한다.' if tags else '현재 HTML 요소를 닫는다.')
    if filename.endswith('.css'):
        concepts = {'--':'CSS 사용자 속성', 'box-sizing':'박스 폭 계산', 'flex':'한 축 배치', 'grid':'격자 배치', '@media':'화면/사용자 환경별 조건', 'focus':'키보드 포커스 표시', 'hidden':'숨김 상태', 'color':'색상·테마', 'padding':'내부 여백', 'margin':'외부 여백', 'width':'폭 제한', 'font':'글자 표현', 'white-space':'출력 텍스트 줄바꿈', 'disabled':'요청 중 버튼 상태'}
        return '·'.join(v for k,v in concepts.items() if k in s) + ' 규칙을 이 선택자에 적용한다.'
    if filename.endswith(('.yaml', '.yml')): return 'YAML 설정에서 ' + s.split(':',1)[0].lstrip('- ') + ' 항목의 실행 조건·값·하위 단계를 선언한다.'
    if filename.endswith('.json'): return '설정/데이터 필드 ' + s.split(':',1)[0].strip(' ,"') + '의 값을 정의한다.'
    if filename == '.env.example': return '서버 설정 ' + s.split('=',1)[0] + '의 예시 값이며 실제 비밀은 .env에만 넣는다.'
    if filename == '.gitignore' or filename == '.dockerignore': return '이 경로 패턴이 Git 또는 이미지에 포함되지 않도록 제외한다.'
    if filename == 'Dockerfile':
        return {'FROM':'실행할 Node 기본 이미지를 고정한다.', 'WORKDIR':'컨테이너 작업 경로를 설정한다.', 'COPY':'필요한 코드·lockfile만 이미지로 복사한다.', 'RUN':'의존성 설치와 실행 디렉터리 권한을 준비한다.', 'USER':'root 대신 node 계정으로 실행한다.', 'ENV':'운영 실행 설정을 주입한다.', 'EXPOSE':'서비스 포트를 문서화한다.', 'HEALTHCHECK':'주기적으로 /health를 검사한다.', 'CMD':'컨테이너 시작 시 Node 서버를 실행한다.'}.get(s.split()[0], '이미지 설정을 이어 정의한다.')
    return explain_operation(s)

def explain_operation(s):
    if re.fullmatch(r'[}\]);,\s]+', s): return '현재 함수·콜백·객체·조건 블록을 닫는다.'
    if s.startswith('catch') or '} catch' in s: return '실패를 잡아 공통 오류 또는 복구 상태로 바꾼다.'
    if 'finally' in s: return '성공·실패와 관계없이 버튼·연결·자원을 정리한다.'
    if 'fail(' in s: return '조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다.'
    if 'send(' in s or 'res.writeHead' in s: return 'HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다.'
    if 'addEventListener' in s or '.on(' in s or '.onclick' in s: return '사용자/연결 이벤트가 발생할 때 실행할 콜백을 등록한다.'
    if 'repo.' in s: return '공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다.'
    if 'fetch(' in s or 'await api(' in s: return '약속한 URL·메소드·본문으로 요청하고 응답을 기다린다.'
    if 'textContent' in s: return '외부 문자열을 HTML로 해석하지 않고 화면의 텍스트로 반영한다.'
    if 'JSON.parse' in s: return '직렬화된 문자열을 객체로 복구한다. 잘못된 형식은 예외 경로로 보낸다.'
    if 'JSON.stringify' in s: return '객체를 JSON 문자열로 바꿔 저장·전송·관찰한다.'
    if 'assert.' in s: return '실제 결과를 기대하는 값·오류·계약과 비교하고 불일치하면 검사를 실패시킨다.'
    if 'test(' in s: return '독립적으로 재현할 동작과 기대 결과를 하나의 테스트로 등록한다.'
    if 'db.' in s or 'pool.' in s or 'rows.' in s: return '선택한 DB 드라이버로 스키마·매개변수 질의·연결 수명을 처리한다.'
    if 'await ' in s: return '비동기 작업 완료를 기다린 후 다음 단계로 진행한다: ' + s[:100].replace('|','/')
    if s.startswith('return'): return '계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다.'
    if s.startswith('if ') or s.startswith('if('): return '입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: ' + s[:110].replace('|','/')
    if s.startswith('for ') or s.startswith('while '): return '목록 또는 스트림의 각 항목을 반복 처리한다.'
    if re.match(r'(async )?function\b', s): return '이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다.'
    if s.startswith(('const ', 'let ')):
        name = s.split('=',1)[0].replace('const ','').replace('let ','').strip()
        return f'`{name}`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다.'
    if 'res.end' in s: return '응답 본문 또는 스트림을 끝내 연결 수명을 정리한다.'
    if 'append' in s or 'replaceChildren' in s: return '데이터로 만든 DOM 요소를 부모에 삽입하거나 기존 화면을 교체한다.'
    if 'console.' in s: return '개발·운영에서 관찰할 실행 결과를 콘솔에 남긴다.'
    return '현재 처리의 설정·호출·상태를 연결한다: `' + s[:120].replace('`','').replace('|','/') + '`'

def code_section(filename):
    source = (ROOT / filename).read_text(encoding='utf-8').rstrip('\n')
    language = {'.js':'javascript','.html':'html','.css':'css','.svg':'xml','.json':'json','.yml':'yaml','.yaml':'yaml'}.get(Path(filename).suffix, 'text')
    rows = []
    for index,line in enumerate(source.splitlines(),1):
        if line.strip(): rows.append(f'| {index} | {line_explanation(line, filename).replace(chr(10), " ").replace("|", "&#124;")} |')
    sha = hashlib.sha256((ROOT / filename).read_bytes().replace(b'\r\n', b'\n')).hexdigest()
    return f'### `{filename}` 전체 코드\n\n```{language}\n{source}\n```\n\n원본: [{filename}]({filename}) · SHA-256(LF 정규화): `{sha}`\n\n줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.\n\n| 줄 | 설명 |\n|---|---|\n' + '\n'.join(rows) + '\n'

def filename(number): return f'study{number}.md'

def render(item, index):
    n = item['number']
    metaphors = {
        '0':'HTML은 공간 배치, CSS는 인테리어, JavaScript는 공간 안에서 실제로 움직이는 일이다.',
        '1':'HTML 태그는 문서의 뼈대, CSS 선택자는 꾸밀 대상을 가리키는 이름표, 함수는 입력을 결과로 바꾸는 작은 기계다.',
        '2':'모듈은 각자의 공구함이고 export는 빌려줄 공구 목록, 인자는 주문서, 콜백은 결과를 알려 주는 전화다.',
        '3':'상태는 원본 장부, DOM은 장부를 보고 쓴 게시판, localStorage는 장부를 보관하는 개인 서랍이다.',
        '4':'URL은 우편 주소, 메소드는 요청 종류, 동적 id는 각 자료의 우편함 번호다.',
        '5':'브라우저 검사는 안내 데스크의 확인이고 서버 검사는 실제 입구의 확인이다. 하나만으로는 잘못된 입력을 막지 못한다.',
        '6':'API는 주문서 양식, 서버는 주문 처리자, DB는 원본 창고다. 브라우저가 창고 비밀번호를 가질 필요는 없다.',
        '7':'인증은 신분증 확인, 인가는 그 신분으로 들어갈 수 있는 방을 확인하는 일이다. 토큰은 만료되는 출입증이다.',
        '8':'화면은 안내대, API 모듈은 운송 창구, 도메인은 규칙집, 저장소는 서고다.',
        '9':'단위 테스트는 부품 검사, 요청 테스트는 조립 검사, 브라우저 검사는 사용자가 직접 운전하는 시운전이다.',
        '10':'정적 산출물은 배송할 인쇄물이고 API 프로세스는 계속 열려 있어야 하는 상담 창구다.',
        'Midpoint':'기초에서 만든 부품으로 작은 가게를 열고 주문·직원 출입·장부 저장이 함께 맞는지 확인하는 단계다.',
        '11':'공통 저장소 계약은 같은 규격의 플러그다. 창고를 바꾸어도 주문서 규격을 유지한다.',
        '12':'UI 라이브러리는 완성된 가구, 상태 저장소는 공용 장부, 폼 라이브러리는 접수 절차다.',
        '13':'외부 서비스 호출은 다른 회사에 업무를 맡기는 일이다. 접수증과 실제 완료 통지를 구분해야 한다.',
        '14':'OpenAPI는 양쪽이 함께 읽는 주문서 사전이고 버전은 그 사전의 개정판이다.',
        '15':'캐시는 자주 쓰는 자료의 임시 책상이고, 백그라운드 큐는 시간이 걸리는 업무의 접수함이다.',
        '16':'이미지는 같은 물건을 담는 상자, 환경변수는 배송지 안내, 볼륨은 상자를 교체해도 남는 창고다.',
        '17':'일반 요청이 전화 한 통이라면 WebSocket은 계속 열린 통화이고 Worker는 별도 작업실이다.',
        '18':'발췌 검색은 답에 필요한 책 쪽을 고르는 일이고 MCP 도구는 AI가 사용할 수 있는 읽기 전용 창구다.',
        'Final':'각 기능이 제 역할을 하는 가게를 만든 뒤 배송·장부·출입·복구까지 같은 운영 절차로 묶는 단계다.'
    }
    theory = item['theory'] + '\n\n### 비유로 이해하기\n\n' + metaphors[n]
    parts = [f'# study{n} · HTML·CSS·JavaScript — {item["title"]}', f'## ① 목표 한 줄\n\n{item["goal"]}', f'## ② 📖 이론\n\n{theory}', f'## ③ 🛠️ 실기: 전체 코드와 줄별 설명\n\n{item["steps"]}']
    if item['extra']: parts.append(item['extra'])
    parts += [code_section(path) for path in item['files']]
    parts.append('## ④ 🔗 연동 포인트\n\n' + item['links'])
    parts.append('## ⑤ 오류 노트\n\n| 증상 | 원인 | 해결 |\n|---|---|---|\n' + '\n'.join('| ' + ' | '.join(row) + ' |' for row in item['errors']))
    parts.append('## ⑥ 직접 해보기\n\n' + '\n'.join(f'{i+1}. {text}' for i,text in enumerate(item['exercises'])))
    parts.append('## ⑦ ☐ 체크리스트\n\n학습자 수행 확인용이다. 문서·코드 작성 완료와 본인의 실습 완료는 다르므로 직접 확인한 뒤 체크한다. 원문 항목 배치는 [반영표](docs/coverage.md)를 따른다.\n\n' + '\n'.join('- [ ] ' + text for text in item['checks']))
    next_item = CHAPTERS[index+1] if index+1 < len(CHAPTERS) else None
    next_line = f'[{filename(next_item["number"])}]({filename(next_item["number"])})에서 {next_item["title"]}로 이어간다.' if next_item else '이 서비스의 데이터와 측정 결과를 바탕으로 DB 정규화·내구성 있는 큐·비용 상한을 보강한다.'
    parts.append('## ⑧ 다음 단계 연결\n\n' + next_line)
    parts.append(f'출처: [지정 노션]({SOURCE}) · [공통 API v1]({API_SOURCE}) · [반영표](docs/coverage.md) · [검증 기록](docs/verification.md). 기술 근거: [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [Node 24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html). 설치 버전 API는 package-lock.json과 node_modules의 버전별 공식 문서를 기준으로 확인한다.')
    return '\n\n'.join(parts) + '\n'

def main():
    ui = next(item for item in CHAPTERS if item['number'] == '12')
    ui['theory'] += '\n\n독립 실행 예제 /lessons/study12/은 Bootstrap CSS(UI), Nano Stores atom(상태), JustValidate(폼)를 실제로 연결한다. UI 패키지는 HTML에 스타일을 제공하며 화면 구조와 이벤트는 계속 Vanilla JS로 작성한다. npm의 bare import와 process.env 분기는 esbuild가 브라우저 번들로 처리한다. CDN을 사용하지 않아 같은 출처 CSP를 유지한다. JustValidate의 사용자 친화적 검사 뒤에도 /api/validate와 Zod의 서버 검증을 유지한다.'
    ui['files'] = ['lessons/study12/index.html', 'lessons/study12/demo.js', 'scripts/vendor.js'] + ui['files']
    ui['steps'] = '1. npm run vendor로 lockfile 버전의 라이브러리를 브라우저 번들로 만든다.\n2. npm run dev 후 /lessons/study12/에서 제목을 제출하고 성공 횟수가 바뀌는지 확인한다.\n3. 빈 값·200자 초과·공백 입력으로 클라이언트/서버 검증의 차이를 확인한다.\n4. workbook의 자체 store/forms 도우미가 같은 경계를 어떻게 구현하는지 읽는다.\n5. Bootstrap CSS 클래스·Nano Stores 구독·JustValidate 규칙을 각각 하나씩 바꾸어 본다.'
    ui['checks'].append('Bootstrap CSS·Nano Stores·JustValidate 실제 예제를 실행했다')
    ui['extra'] = '라이브러리 공식 근거: [Bootstrap](https://getbootstrap.com/docs/5.3/getting-started/introduction/), [Nano Stores](https://github.com/nanostores/nanostores), [JustValidate](https://just-validate.dev/docs/intro). 버전과 라이선스는 package-lock.json과 lessons/study12/vendor/에 보존한다. 라이브러리 배포 파일은 직접 작성하는 전체 코드에서 제외하고 재현 스크립트를 제공한다.'
    midpoint = next(item for item in CHAPTERS if item['number'] == 'Midpoint')
    midpoint['checks'][0] = 'Vanilla JS로 Todo 한 개 만들기 (원문 중 이 과정에 해당하는 부분)'
    state = next(item for item in CHAPTERS if item['number'] == '3')
    state['files'].append('final-project/js/app.js')
    additions = {
        '1': ['CSS 변수 + grid + 반응형'],
        '2': ['햄버거 메뉴 + 현재 페이지 표시', 'JS는 ESM 모듈로 나눠 theme.js · todo.js · app.js(진입점)처럼 역할별 파일을 둔다. HTML에서는 `<script type="module">`.'],
        '3': ['Vanilla JS Todo: localStorage 저장 + 다시 그리기', '상태(Todo, 테마)는 localStorage에 JSON 문자열로 저장하고, 바뀔 때마다 render()로 목록을 다시 그린다.', 'localStorage 값이 깨져 있으면 JSON.parse가 예외를 던진다 → loadTodos를 try/catch로 감싸 빈 배열로 복구.'],
        '5': ['폼 submit은 기본으로 페이지를 새로고침한다 → event.preventDefault().'],
        '6': ['fetch("data/skills.json")는 HTML을 더블클릭(file://)으로 열면 브라우저가 막는다. Live Server 같은 로컬 서버로 열어야 한다 (study6.md). ESM import도 같은 이유로 서버가 필요하다.'],
    }
    for item in CHAPTERS: item['checks'].extend(additions.get(item['number'], []))
    for item in CHAPTERS:
        if item['number'] == '18':
            item['extra'] += '\n\n공식 기술 근거: [Ollama Chat API](https://docs.ollama.com/api/chat), [MCP 서버](https://modelcontextprotocol.io/docs/develop/build-server), [AI SDK](https://ai-sdk.dev/docs/ai-sdk-core/generating-text). 현재 설치된 AI SDK 7.0.179의 node_modules 문서를 확인하여 textStream과 usage를 사용한다. MCP SDK 1.32.2의 stdio 서버·클라이언트를 실제 핸드셰이크 테스트했다.'
        if item['number'] == '11':
            item['extra'] += '\n\n공식 기술 근거: [node-postgres 매개변수 질의](https://node-postgres.com/features/queries), [MariaDB Promise API](https://mariadb.com/docs/connectors/mariadb-connector-nodejs/connector-nodejs-promise-api).'
    manifest = []
    for index,item in enumerate(CHAPTERS):
        (ROOT / filename(item['number'])).write_text(render(item,index),encoding='utf-8')
        manifest.append({ 'file':filename(item['number']), 'title':item['title'], 'sources':item['files'] })
    (ROOT / 'docs/chapter-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(f'{len(manifest)}개 학습 문서 생성 완료')

if __name__ == '__main__': main()
