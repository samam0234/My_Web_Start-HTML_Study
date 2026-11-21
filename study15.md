# study15 · HTML·CSS·JavaScript — 성능·캐시·비동기·백그라운드

## ① 목표 한 줄

측정값을 기준으로 정적 캐시와 작업 분리를 적용하고 한계를 확인한다.

## ② 📖 이론

최적화는 느린 경계를 측정하는 데서 시작한다. 브라우저 Network는 요청 시간과 전송량, Performance는 긴 메인 스레드 작업, 서버 JSON 로그는 요청 지연을 보여준다. 한 번의 수치보다 반복 측정의 중앙값·p95를 비교한다. DevTools Lighthouse 수치는 실행 환경과 상태를 함께 기록한다.

정적 파일은 ETag를 반환한다. 브라우저가 If-None-Match를 보내고 내용이 같으면 304로 본문을 재전송하지 않는다. Cache-Control:no-cache는 저장 금지가 아니라 사용 전 재검증이다. 인증·개인 문서 API는 no-store로 저장을 막는다. 공개 게시글 캐시를 추가하려면 작성·수정·삭제 시 무효화와 사용자별 데이터 혼합을 설계해야 한다.

async/await는 I/O 대기를 표현하지만 CPU 작업을 자동으로 다른 스레드에 보내지 않는다. 파일 UTF-8 검사와 읽기는 Web Worker로 옮겨 UI와 분리한다. 메일 작업은 jobs에 접수 후 비동기 처리한다. 이 학습용 작업 큐는 재시작 복구가 없으므로 운영 큐와 구분한다.

현재 repository.get과 게시판 검색은 종류 전체를 읽는다. 작은 자료에서 구조를 익히는 실습이며 대량 데이터에서는 WHERE·LIMIT/OFFSET·JOIN·적절한 인덱스를 DB에 내려야 한다. WebSocket 알림 후 목록 조회도 잦으면 debounce·공개 캐시를 검토한다.

### 비유로 이해하기

캐시는 자주 쓰는 자료의 임시 책상이고, 백그라운드 큐는 시간이 걸리는 업무의 접수함이다.

## ③ 🛠️ 실기: 전체 코드와 줄별 설명

1. 서버를 켜고 node lessons/study15/measure.js로 20회 응답 시간을 측정한다.
2. 브라우저에서 같은 CSS를 다시 읽고 ETag·304를 확인한다.
3. 문서 파일 업로드 중 입력 UI가 응답하는지 Performance에서 관찰한다.
4. 메일 접수 응답과 jobs 완료 시간을 나누어 기록한다.

### `server/static.js` 전체 코드

```javascript
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fail } from './errors.js';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
export async function serveStatic(req, res, pathname) {
  const prefix = ['/midpoint/', '/workbook/', '/lessons/', '/practice/site/', '/final-project/'].find(p => pathname.startsWith(p));
  if (!prefix) fail(404, 'NOT_FOUND', '페이지가 없습니다.');
  const base = resolve('.' + prefix);
  let file;
  try { file = resolve('.' + decodeURIComponent(pathname)); } catch { fail(400, 'BAD_REQUEST', '잘못된 URL'); }
  if (!file.startsWith(base + sep) && file !== base) fail(403, 'FORBIDDEN', '허용하지 않는 경로');
  if (pathname.endsWith('/')) file = resolve(file, 'index.html');
  const type = types[extname(file)];
  if (!type || file.split(/[\\/]/).some(p => p.startsWith('.'))) fail(404, 'NOT_FOUND', '파일이 없습니다.');
  let body, info;
  try { [body, info] = await Promise.all([readFile(file), stat(file)]); } catch { fail(404, 'NOT_FOUND', '파일이 없습니다.'); }
  const etag = `"${info.size}-${Math.trunc(info.mtimeMs)}"`;
  const headers = { 'Content-Type': type, ETag: etag, 'Cache-Control': 'no-cache' };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }
  res.writeHead(200, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}
```

원본: [server/static.js](server/static.js) · SHA-256(LF 정규화): `4742e4341456938c8c875001bb89d7ab244aea6b748e715ba47dc7c91b922134`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 2 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 3 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 5 | `types`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 6 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 7 | `prefix`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 8 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 9 | `base`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 10 | `file;`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 11 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 12 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 13 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (pathname.endsWith('/')) file = resolve(file, 'index.html'); |
| 14 | `type`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 15 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 16 | `body, info;`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 17 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 18 | `etag`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 19 | `headers`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 20 | HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 21 | HTTP 상태·헤더·data/error 본문을 구성해 클라이언트에 응답한다. |
| 22 | 응답 본문 또는 스트림을 끝내 연결 수명을 정리한다. |
| 23 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `lessons/study15/measure.js` 전체 코드

```javascript
// 여러 번 측정하여 한 번의 우연한 지연을 줄인다.
const samples = [];
for (let index = 0; index < 20; index++) {
  const start = performance.now();
  const response = await fetch(`${process.env.MEASURE_URL || 'http://localhost:3000'}/api/posts?limit=10`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  await response.arrayBuffer(); // 본문 수신까지 포함한다.
  samples.push(performance.now() - start);
}
samples.sort((a, b) => a - b);
console.log(JSON.stringify({ requests: samples.length, medianMs: samples[9], p95Ms: samples[18] }));
```

원본: [lessons/study15/measure.js](lessons/study15/measure.js) · SHA-256(LF 정규화): `4cbba1e4d9ceb4b3aa5cb5913d07b846f62535128971fbdd2dff939ce3c23fb2`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 여러 번 측정하여 한 번의 우연한 지연을 줄인다. |
| 2 | `samples`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 3 | 목록 또는 스트림의 각 항목을 반복 처리한다. |
| 4 | `start`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 5 | 약속한 URL·메소드·본문으로 요청하고 응답을 기다린다. |
| 6 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!response.ok) throw new Error(`HTTP ${response.status}`); |
| 7 | 본문 수신까지 포함한다. |
| 8 | 현재 처리의 설정·호출·상태를 연결한다: `samples.push(performance.now() - start);` |
| 9 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 10 | 현재 처리의 설정·호출·상태를 연결한다: `samples.sort((a, b) => a - b);` |
| 11 | 객체를 JSON 문자열로 바꿔 저장·전송·관찰한다. |


### `server/integrations.js` 전체 코드

```javascript
import { randomBytes } from 'node:crypto';
import nodemailer from 'nodemailer';
import Stripe from 'stripe';
import { fail } from './errors.js';

// 모의 모드는 외부 요금·메일 발송 없이 연결 경계를 연습한다.
export function createIntegrations(config, repo) {
  const mock = config.INTEGRATIONS_MODE !== 'live';
  const states = new Map();
  let mailer, stripe;
  return {
    async mail(user) {
      const job = await repo.create('jobs', { type: 'mail', userId: user.id, status: 'queued', createdAt: new Date().toISOString() });
      // 학습용 단일 프로세스 작업. 운영에서는 외부 큐와 재시도/중복 제거가 필요하다.
      setImmediate(async () => {
        try {
          if (!mock) {
            if (!config.SMTP_HOST) throw new Error('SMTP 설정 필요');
            mailer ??= nodemailer.createTransport({ host: config.SMTP_HOST, port: Number(config.SMTP_PORT || 587), secure: Number(config.SMTP_PORT) === 465, auth: { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } });
            await mailer.sendMail({ from: config.MAIL_FROM, to: user.email, subject: '학습 알림', text: 'HTML·CSS·JavaScript 실습 메일입니다.' });
          }
          await repo.put('jobs', job.id, { ...job, status: 'done', mock });
        } catch { await repo.put('jobs', job.id, { ...job, status: 'failed' }); }
      });
      return { jobId: job.id, status: 'queued', mock };
    },
    async checkout(user) {
      if (mock) return { mock: true, url: null, message: '모의 결제입니다. 실제 결제는 발생하지 않습니다.' };
      if (!config.STRIPE_SECRET_KEY?.startsWith('sk_test_') || !config.STRIPE_PRICE_ID) fail(503, 'PAYMENT_UNAVAILABLE', 'Stripe 테스트 키와 가격을 설정하세요.');
      stripe ??= new Stripe(config.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.create({ mode: 'payment', line_items: [{ price: config.STRIPE_PRICE_ID, quantity: 1 }], client_reference_id: String(user.id), success_url: `${config.PUBLIC_ORIGIN}/workbook/?payment=success`, cancel_url: `${config.PUBLIC_ORIGIN}/workbook/?payment=cancel` });
      return { mock: false, url: session.url };
    },
    async webhook(raw, signature) {
      if (mock) fail(503, 'PAYMENT_UNAVAILABLE', '모의 모드에는 결제 웹훅이 없습니다.');
      stripe ??= new Stripe(config.STRIPE_SECRET_KEY);
      let event;
      try { event = stripe.webhooks.constructEvent(raw, signature, config.STRIPE_WEBHOOK_SECRET); }
      catch { fail(400, 'BAD_REQUEST', '웹훅 서명이 올바르지 않습니다.'); }
      const prior = (await repo.list('payments')).find(p => p.eventId === event.id);
      if (!prior) await repo.create('payments', { eventId: event.id, type: event.type, status: event.type === 'checkout.session.completed' ? 'paid' : 'received' });
      return { received: true };
    },
    oauthStart() {
      if (mock) return { mock: true, message: 'OAuth는 GitHub 앱 설정 후 live 모드에서 실행합니다.' };
      if (!config.GITHUB_CLIENT_ID || !config.GITHUB_CLIENT_SECRET) fail(503, 'OAUTH_UNAVAILABLE', 'GitHub OAuth 앱을 설정하세요.');
      for (const [key, value] of states) if (value < Date.now()) states.delete(key);
      const state = randomBytes(32).toString('hex');
      states.set(state, Date.now() + 300000);
      const query = new URLSearchParams({ client_id: config.GITHUB_CLIENT_ID, redirect_uri: `${config.PUBLIC_ORIGIN}/api/auth/github/callback`, scope: 'user:email', state });
      return { url: `https://github.com/login/oauth/authorize?${query}`, state };
    },
    async oauthFinish(query, cookieState) {
      const state = query.get('state');
      const expires = states.get(state);
      states.delete(state);
      if (!state || state !== cookieState || !expires || expires < Date.now() || !query.get('code')) fail(400, 'BAD_REQUEST', 'OAuth state가 만료되었거나 다릅니다.');
      const response = await fetch('https://github.com/login/oauth/access_token', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: config.GITHUB_CLIENT_ID, client_secret: config.GITHUB_CLIENT_SECRET, code: query.get('code'), redirect_uri: `${config.PUBLIC_ORIGIN}/api/auth/github/callback` }), signal: AbortSignal.timeout(15000) });
      const token = await response.json();
      if (!response.ok || !token.access_token) fail(502, 'OAUTH_UNAVAILABLE', 'OAuth 토큰 교환 실패');
      const headers = { Authorization: `Bearer ${token.access_token}`, Accept: 'application/vnd.github+json' };
      const profileResponse = await fetch('https://api.github.com/user', { headers, signal: AbortSignal.timeout(15000) });
      const profile = await profileResponse.json();
      if (!profileResponse.ok || !profile.id) fail(502, 'OAUTH_UNAVAILABLE', 'GitHub 프로필 확인 실패');
      // 기존 비밀번호 계정에 이메일만으로 자동 연결하지 않는다.
      let user = (await repo.list('users')).find(u => u.githubId === profile.id);
      if (!user) user = await repo.create('users', { githubId: profile.id, email: `${profile.id}@github.invalid`, nickname: String(profile.login).slice(0, 40) });
      return user;
    },
  };
}
```

원본: [server/integrations.js](server/integrations.js) · SHA-256(LF 정규화): `85863888206f0ebefc83ebfbe5aa1ff101cc0391e6e31afa58adf7d6cc2a7b4a`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 2 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 3 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 4 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 6 | 모의 모드는 외부 요금·메일 발송 없이 연결 경계를 연습한다. |
| 7 | 다른 모듈이 사용할 인터페이스를 공개한다. 이름 있는 처리 함수를 정의하고 인자로 필요한 값을 받는다. |
| 8 | `mock`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 9 | `states`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 10 | `mailer, stripe;`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 11 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 12 | 현재 처리의 설정·호출·상태를 연결한다: `async mail(user) {` |
| 13 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 14 | 학습용 단일 프로세스 작업. 운영에서는 외부 큐와 재시도/중복 제거가 필요하다. |
| 15 | 현재 처리의 설정·호출·상태를 연결한다: `setImmediate(async () => {` |
| 16 | 현재 처리의 설정·호출·상태를 연결한다: `try {` |
| 17 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!mock) { |
| 18 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!config.SMTP_HOST) throw new Error('SMTP 설정 필요'); |
| 19 | 현재 처리의 설정·호출·상태를 연결한다: `mailer ??= nodemailer.createTransport({ host: config.SMTP_HOST, port: Number(config.SMTP_PORT // 587), secure: Number(co` |
| 20 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: await mailer.sendMail({ from: config.MAIL_FROM, to: user.email, subject: '학습 알림', text: 'HTML·CSS·Ja |
| 21 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 22 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 23 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 24 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 25 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 26 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 27 | 현재 처리의 설정·호출·상태를 연결한다: `async checkout(user) {` |
| 28 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (mock) return { mock: true, url: null, message: '모의 결제입니다. 실제 결제는 발생하지 않습니다.' }; |
| 29 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 30 | 현재 처리의 설정·호출·상태를 연결한다: `stripe ??= new Stripe(config.STRIPE_SECRET_KEY);` |
| 31 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const session = await stripe.checkout.sessions.create({ mode: 'payment', line_items: [{ price: confi |
| 32 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 33 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 34 | 현재 처리의 설정·호출·상태를 연결한다: `async webhook(raw, signature) {` |
| 35 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 36 | 현재 처리의 설정·호출·상태를 연결한다: `stripe ??= new Stripe(config.STRIPE_SECRET_KEY);` |
| 37 | `event;`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 38 | 현재 처리의 설정·호출·상태를 연결한다: `try { event = stripe.webhooks.constructEvent(raw, signature, config.STRIPE_WEBHOOK_SECRET); }` |
| 39 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 40 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 41 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 42 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 43 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 44 | 현재 처리의 설정·호출·상태를 연결한다: `oauthStart() {` |
| 45 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (mock) return { mock: true, message: 'OAuth는 GitHub 앱 설정 후 live 모드에서 실행합니다.' }; |
| 46 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 47 | 목록 또는 스트림의 각 항목을 반복 처리한다. |
| 48 | `state`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 49 | 현재 처리의 설정·호출·상태를 연결한다: `states.set(state, Date.now() + 300000);` |
| 50 | `query`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 51 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 52 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 53 | 현재 처리의 설정·호출·상태를 연결한다: `async oauthFinish(query, cookieState) {` |
| 54 | `state`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 55 | `expires`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 56 | 현재 처리의 설정·호출·상태를 연결한다: `states.delete(state);` |
| 57 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 58 | 약속한 URL·메소드·본문으로 요청하고 응답을 기다린다. |
| 59 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const token = await response.json(); |
| 60 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 61 | `headers`에 계산값·상태·함수·의존성을 묶어 이후 처리에서 사용한다. |
| 62 | 약속한 URL·메소드·본문으로 요청하고 응답을 기다린다. |
| 63 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const profile = await profileResponse.json(); |
| 64 | 조건을 만족하지 않는 요청을 지정 HTTP 상태와 오류 코드로 거절한다. |
| 65 | 기존 비밀번호 계정에 이메일만으로 자동 연결하지 않는다. |
| 66 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 67 | 공통 저장소 계약을 통해 도메인 자료를 읽거나 변경하고 후속 처리로 연결한다. |
| 68 | 계산·선택한 결과를 호출한 쪽에 돌려주고 현재 함수를 끝낸다. |
| 69 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 70 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 71 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


## ④ 🔗 연동 포인트

정적 파일 → ETag 재검증, 개인 API → no-store, 파일 → Worker, 메일 → jobs로 연결한다. 다음 단계는 이 관찰값을 배포·로그·모니터링·백업 운영 절차로 고정한다.

## ⑤ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| 캐시 때문에 남의 정보 노출 | 인증 응답을 공용 캐시 | 개인 API no-store와 권한 확인 |
| await를 썼는데 UI 멈춤 | CPU 작업이 메인 스레드 | Worker 분리·입력 크기 제한 |
| 재시작 후 작업이 queued | 메모리 스케줄러 소실 | 운영 외부 큐·재시도·중복 제거 설계 |

## ⑥ 직접 해보기

1. 캐시 미사용/재검증 때 전송량과 시간을 기록한다.
2. 게시글 수를 늘려 p95가 변하는지 확인한다.
3. 목록 질의를 DB 페이지네이션으로 옮길 설계를 작성한다.

## ⑦ ☐ 체크리스트

학습자 수행 확인용이다. 문서·코드 작성 완료와 본인의 실습 완료는 다르므로 직접 확인한 뒤 체크한다. 원문 항목 배치는 [반영표](docs/coverage.md)를 따른다.

- [ ] 정적 ETag·304와 개인 API no-store를 구분한다
- [ ] 중앙값·p95·전송량을 측정한다
- [ ] 비동기 I/O·Worker·백그라운드 큐 차이를 설명한다
- [ ] 대량 데이터와 작업 복구 한계를 기록한다

## ⑧ 다음 단계 연결

[study16.md](study16.md)에서 운영·Docker·CI/CD·백업로 이어간다.

출처: [지정 노션](https://app.notion.com/p/3d6d7dec5e2e8147b212f0a23b93dfc1) · [공통 API v1](https://app.notion.com/p/3d6d7dec5e2e8139adbfd36dd506c65e) · [반영표](docs/coverage.md) · [검증 기록](docs/verification.md). 기술 근거: [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [Node 24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html). 설치 버전 API는 package-lock.json과 node_modules의 버전별 공식 문서를 기준으로 확인한다.
