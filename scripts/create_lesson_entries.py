"""누락 단계의 실제 브라우저 실습 진입점을 생성한다. 기존 기초 예제는 보존한다."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def action(label, path=None, method=None, fields=None, kind=None, **extra):
    return {k:v for k,v in dict(label=label,path=path,method=method,fields=fields,kind=kind,**extra).items() if v is not None}
account = dict(email='lesson@example.com',password='lesson-password-123',nickname='학습자')
signup = action('회원가입','/auth/signup','POST',['email','password','nickname'])
login = action('로그인','/auth/login','POST',['email','password'])
read = action('목록 조회','/posts')
crud = [read,action('등록','/posts','POST',['title','body','tags']),action('상세','/posts/{id}'),action('수정','/posts/{id}','PATCH',['title','body','tags']),action('삭제','/posts/{id}','DELETE')]
specs = {
'0': ('환경 확인', 'npm run dev로 실행한 서버의 /health를 확인합니다. Node 버전은 터미널에서 node lessons/study0/hello.js로 확인하세요.', {}, [action('서버 상태',kind='health')]),
'6': ('DB·API CRUD', '가입·로그인 후 등록→상세→JSON 변경→수정→삭제를 순서대로 실행하세요. 생성 id는 이 탭에 보관합니다.', {**account,'title':'첫 글','body':'SQLite에 저장합니다.','tags':['study6']},[signup,login]+crud),
'7': ('인증·권한', '로그인 전 내 정보 401, 가입·로그인 후 200, 로그아웃 후 401을 확인하세요. 비밀번호는 학습용 새 계정에만 사용하세요.',account,[action('내 정보','/auth/me'),signup,login,action('로그아웃','/auth/logout','POST')]),
'8': ('공통 모듈 재사용', '이 화면은 공통 api.js와 store.js를 import합니다. app.js는 설정, runner.js는 제출·오류·출력 수명을 맡습니다.',{},[action('상태 모듈 호출',kind='state'),read]),
'9': ('브라우저 단위 검사', '실제 상태 모듈의 구독·구독 해제·복제 격리를 검사합니다. 요청·서버 검사는 루트에서 npm test를 실행하세요.',{},[action('단위 검사 실행',kind='tests'),action('요청 상태 확인',kind='health')]),
'10': ('배포 후 점검', 'npm run build 후 정적 파일을 확인하세요. API 서버 배포에서는 /health와 실제 목록 조회를 둘 다 확인해야 합니다.',{},[action('서버 상태',kind='health'),read,action('정적 캐시 헤더',kind='cache')]),
'11': ('DB 교체 확인', '서버를 중지하고 .env의 DB_DRIVER·DATABASE_URL을 바꾼 뒤 다시 시작하세요. 이 화면은 같은 API 계약으로 자료를 읽습니다. ORM 예제는 터미널에서 실행합니다.',{},[read]),
'13': ('외부 서비스 연결', '가입·로그인 후 메일·결제·OAuth·문서 저장을 호출합니다. 기본 mock 응답은 실제 발송·결제 성공이 아닙니다.',{**account,'filename':'lesson.md','text':'HTML은 문서의 구조입니다.'},[signup,login,action('메일 접수','/mail','POST'),action('작업 상태','/jobs'),action('테스트 결제','/checkout','POST'),action('OAuth 시작','/auth/github'),action('문서 저장','/documents','POST',['filename','text'])]),
'14': ('OpenAPI·페이지네이션', 'OpenAPI 3 문서와 page=1·limit=2 목록의 meta를 대조하세요. 잘못된 정렬은 400 오류를 반환합니다.',{},[action('OpenAPI 읽기',kind='schema'),action('2개씩 목록','/posts?page=1&limit=2'),action('잘못된 정렬','/posts?sort=invalid')]),
'15': ('성능·캐시 관찰', '정적 CSS의 ETag·Cache-Control을 확인하세요. 20회 중앙값·p95 측정은 node lessons/study15/measure.js로 실행합니다.',{},[action('캐시 헤더 관찰',kind='cache'),read]),
'16': ('운영 점검', 'Docker 엔진 기동 후 docker compose up -d --build, 로그·영속 볼륨·백업을 문서 순서대로 확인하세요. 아래는 배포 서버의 HTTP 상태 점검이며 Docker 실행을 대신하지 않습니다.',{},[action('서버 상태',kind='health'),action('프로세스 지표','/metrics')]),
'17': ('실시간 알림', '알림 연결 후 다른 탭 /workbook/에서 글을 변경하세요. 개인 문서가 아닌 공개 변경 id만 받습니다.',{},[action('알림 연결',kind='socket')]),
'18': ('문서 AI·SSE', '가입·로그인→문서 저장→질문 순서로 실행하세요. 기본값은 mock입니다. MCP 실습은 npm run mcp:client로 실행합니다.',{**account,'filename':'lesson.md','text':'HTML은 문서의 구조입니다. CSS는 표현입니다.','question':'HTML'},[signup,login,action('문서 저장','/documents','POST',['filename','text']),action('스트리밍 질문','/ai/chat/stream',stream=True)]),
'Midpoint': ('중간 응용 실행', '기초 서버는 npm run midpoint로 실행하고 아래 기초 게시판에서 전체 화면 흐름을 실습하세요. 이 화면에서도 공통 목록 요청을 실행할 수 있습니다.',{},[read]),
'Final': ('최종 서비스 점검', 'npm run dev로 심화 서버를 실행하세요. 아래 전체 서비스에서 가입·CRUD·문서 AI를 순서대로 확인하고 이 화면의 서버·API 검사를 함께 수행합니다.',{},[action('서버 상태',kind='health'),read,action('API 계약',kind='schema')]),
}
for number,(title,intro,inputs,actions) in specs.items():
    folder=ROOT/'lessons'/f'study{number}'
    folder.mkdir(parents=True,exist_ok=True)
    links=[('전체 게시판·문서 AI','/workbook/')]
    if number=='Midpoint': links=[('기초 게시판 열기','/midpoint/')]
    config=dict(title=f'study{number} · {title}',intro=intro,input=inputs,actions=actions,links=links)
    (folder/'app.js').write_text("import { mountLesson } from '../runner.js';\n\n// 이 단계의 요청·입력·실행 순서를 선언한다.\nmountLesson("+json.dumps(config,ensure_ascii=False,indent=2)+");\n",encoding='utf-8')
    (folder/'index.html').write_text(f'<!doctype html>\n<html lang="ko">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>study{number} 실습</title><link rel="stylesheet" href="/workbook/style.css"></head>\n<body><main class="container"></main><script type="module" src="app.js"></script></body>\n</html>\n',encoding='utf-8')
numbers=[*map(str,range(11)),'Midpoint',*map(str,range(11,19)),'Final']
(ROOT/'lessons/index.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>전체 실습 목차</title><link rel="stylesheet" href="/workbook/style.css"><main class="container"><h1>21개 단계별 실습</h1><p>npm run dev 후 단계 순서대로 실행하세요. DB·외부 서비스는 서버 설정이 필요합니다.</p><ol>'+''.join(f'<li><a href="study{n}/">study{n}</a></li>' for n in numbers)+'</ol></main></html>\n',encoding='utf-8')
print('단계별 실습 진입점 생성 완료')
