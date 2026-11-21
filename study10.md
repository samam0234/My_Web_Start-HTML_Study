# study10 · HTML·CSS·JavaScript — 빌드·배포·기초 정리

## ① 목표 한 줄

정적 산출물과 API 서버 배포를 구분하고 환경변수·DB·HTTPS를 점검한다.

## ② 📖 이론

브라우저가 실행하는 HTML·CSS·JS는 이 과정에서 별도 컴파일이 필요하지 않다. npm run build는 정적 파일을 dist로 복사한다. .env·DB·서버 소스는 정적 산출물에 넣지 않는다. 정적 사이트 호스팅만으로는 Node API가 실행되지 않는다. 게시판은 Node 프로세스와 영속 DB가 필요하다.

도메인은 사람이 읽는 주소이고 DNS는 그 주소를 서버 IP에 연결한다. HTTPS는 TLS로 통신을 암호화하고 서버의 도메인을 검증한다. TLS 종료 프록시가 외부 HTTPS를 받아 내부 127.0.0.1:3000 HTTP로 전달할 수 있다. 클라이언트의 /api 상대경로와 WebSocket 경로도 같은 호스트로 보낸다.

배포는 파일 업로드만으로 끝나지 않는다. 환경변수·DB 경로·파일 권한·재시작·로그·백업을 함께 확인한다. 기초 정적 예제는 /practice/site와 /final-project에서 실행되고, 로그인·CRUD는 /midpoint에 모인다.

### 비유로 이해하기

정적 산출물은 배송할 인쇄물이고 API 프로세스는 계속 열려 있어야 하는 상담 창구다.

## ③ 🛠️ 실기: 전체 코드와 줄별 설명

1. npm run check → npm test → npm run build 순서로 실행한다.
2. dist 안에 .env나 data 폴더가 없는지 확인한다.
3. 정적 부분만 시험하려면 python -m http.server 8080 --directory dist로 연다. API 기능은 npm start 또는 npm run midpoint가 필요하다.
4. 서버에 저장소·Node를 준비하고 npm ci --omit=dev 후 환경변수를 설정한다.
5. 실제 보유 도메인의 DNS와 Caddyfile 주소를 맞추고 80·443 포트를 연결한다.
6. /health → 로그인 → 작성 → 수정 → 삭제 → 서버 재시작 후 DB 유지 순으로 점검한다.

### 배포 후 점검표

- [ ] DNS·HTTPS 인증서·만료 갱신을 확인했다.
- [ ] /health가 200이고 실제 로그인·CRUD가 동작한다.
- [ ] .env·DB 파일·서버 소스 URL이 공개되지 않는다.
- [ ] PUBLIC_ORIGIN·CORS_ORIGIN이 배포 주소와 같다.
- [ ] 서버 재시작 후 자료가 남고 백업 파일을 별도 위치에 보관한다.
- [ ] 모바일 폭·키보드 포커스·오류 메시지·Console을 확인했다.
- [ ] 이 저장소의 외부 배포는 별도 계정·도메인 설정 후 수행한다. 문서 작성만으로 배포 완료 처리하지 않는다.


### `scripts/build.js` 전체 코드

```javascript
import { cp, mkdir, writeFile } from 'node:fs/promises';

// 번들러 없이 정적 파일을 복사한다. 서버와 비밀 설정은 산출물에서 제외한다.
await mkdir('dist', { recursive: true });
for (const folder of ['workbook', 'midpoint', 'lessons', 'practice/site', 'final-project']) await cp(folder, `dist/${folder}`, { recursive: true, filter: path => !/lessons[\\/]study(0|11|15)([\\/]|$)/.test(path) });
await writeFile('dist/index.html', '<!doctype html><html lang="ko"><meta charset="utf-8"><title>학습 실습</title><a href="workbook/">게시판 실습 열기 (API 서버 필요)</a><a href="practice/site/">정적 기초 사이트</a><a href="final-project/">정적 Todo</a></html>');
console.log('dist 생성 완료 · API 기능은 npm start 서버가 필요합니다.');
```

원본: [scripts/build.js](scripts/build.js) · SHA-256(LF 정규화): `38dadf6840e83057b4e86d5daaec6ba1572711244ca8ca13b6ec75c20406b10e`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 3 | 번들러 없이 정적 파일을 복사한다. 서버와 비밀 설정은 산출물에서 제외한다. |
| 4 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await mkdir('dist', { recursive: true }); |
| 5 | 독립적으로 재현할 동작과 기대 결과를 하나의 테스트로 등록한다. |
| 6 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await writeFile('dist/index.html', '<!doctype html><html lang="ko"><meta charset="utf-8"><title>학습 실 |
| 7 | 개발·운영에서 관찰할 실행 결과를 콘솔에 남긴다. |


### `ops/Caddyfile` 전체 코드

```text
# 실제 보유 도메인으로 바꾸고 DNS A/AAAA를 서버로 연결한다.
study.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

원본: [ops/Caddyfile](ops/Caddyfile) · SHA-256(LF 정규화): `6fdef320d605b6d15d6f1a3c73c299a7003778f52dd8405e19f49c30b7ebb76f`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 현재 처리의 설정·호출·상태를 연결한다: `# 실제 보유 도메인으로 바꾸고 DNS A/AAAA를 서버로 연결한다.` |
| 2 | 현재 처리의 설정·호출·상태를 연결한다: `study.example.com {` |
| 3 | 현재 처리의 설정·호출·상태를 연결한다: `reverse_proxy 127.0.0.1:3000` |
| 4 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `scripts/backup.js` 전체 코드

```javascript
import { backup, DatabaseSync } from 'node:sqlite';
import { mkdir } from 'node:fs/promises';

if ((process.env.DB_DRIVER || 'sqlite') !== 'sqlite') throw new Error('외부 DB는 전용 백업 명령을 사용하세요.');
await mkdir('backups', { recursive: true });
const db = new DatabaseSync(process.env.SQLITE_PATH || 'data/study.sqlite');
const path = `backups/study-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`;
try { await backup(db, path); console.log(`백업: ${path}`); }
finally { db.close(); }
```

원본: [scripts/backup.js](scripts/backup.js) · SHA-256(LF 정규화): `10a75c4b7215c793ff021e6de6bd53d61b69659bbac9a0d9fa2a137c5ad7a62a`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 2 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 4 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if ((process.env.DB_DRIVER // 'sqlite') !== 'sqlite') throw new Error('외부 DB는 전용 백업 명령을 사용하세요.'); |
| 5 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await mkdir('backups', { recursive: true }); |
| 6 | `db`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 7 | `path`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 8 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: try { await backup(db, path); console.log(`백업: ${path}`); } |
| 9 | 성공·실패와 관계없이 버튼·연결·자원을 정리한다. |


## ④ 🔗 연동 포인트

정적 파일은 브라우저로, /api는 Node로, SQLite는 영속 경로로 연결한다. Caddy가 HTTPS와 동일 출처를 제공한다. 다음 중간 프로젝트에서 기초 기능만 묶어 1차 서비스를 완성한다.

## ⑤ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| 정적 호스팅에서 로그인 404 | API 프로세스가 없음 | Node 서버 배포 또는 API 프록시 구성 |
| 배포 후 DB 초기화 | 임시 디스크 사용 | 영속 볼륨·외부 DB |
| HTTPS 화면에서 연결 차단 | HTTP API 혼합 콘텐츠 | 동일 HTTPS 출처 /api |

## ⑥ 직접 해보기

1. dist로 기초 사이트를 열고 API가 필요한 화면과 구분한다.
2. 새 DB 파일 경로로 재시작해 빈 목록이 보이는 이유를 설명한다.
3. 서버를 재시작하고 기존 DB의 게시글이 유지되는지 확인한다.

## ⑦ ☐ 체크리스트

학습자 수행 확인용이다. 문서·코드 작성 완료와 본인의 실습 완료는 다르므로 직접 확인한 뒤 체크한다. 원문 항목 배치는 [반영표](docs/coverage.md)를 따른다.

- [ ] 빌드 산출물에서 비밀 설정과 DB를 제외한다
- [ ] 도메인·DNS·HTTPS와 API 프록시를 설명한다
- [ ] 배포 환경변수·DB 경로·파일 권한을 점검한다
- [ ] 기초 HTML·CSS·JS와 인증·CRUD를 복습한다

## ⑧ 다음 단계 연결

[studyMidpoint.md](studyMidpoint.md)에서 중간 응용: 기초 게시판로 이어간다.

출처: [지정 노션](https://app.notion.com/p/3d6d7dec5e2e8147b212f0a23b93dfc1) · [공통 API v1](https://app.notion.com/p/3d6d7dec5e2e8139adbfd36dd506c65e) · [반영표](docs/coverage.md) · [검증 기록](docs/verification.md). 기술 근거: [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [Node 24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html). 설치 버전 API는 package-lock.json과 node_modules의 버전별 공식 문서를 기준으로 확인한다.
