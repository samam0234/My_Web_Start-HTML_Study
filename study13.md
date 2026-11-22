# study13 · HTML·CSS·JavaScript — 외부 서비스: 메일·결제·업로드·OAuth

## ① 목표 한 줄

외부 서비스 호출을 서버 모듈에 모으고 모의 응답과 실제 연결을 구분한다.

## ② 📖 이론

외부 서비스는 실패·지연·중복 응답이 있는 시스템이다. 브라우저는 내 API만 호출하고 공급자 비밀은 서버에 둔다. INTEGRATIONS_MODE=mock은 실제 메일·결제를 발생시키지 않는다. live 설정은 SMTP와 Stripe 테스트 키·GitHub OAuth 앱을 사용한다. 결제는 sk_test_ 키만 허용하여 학습 범위를 유지한다.

메일은 jobs에 queued를 저장한 뒤 setImmediate에서 처리한다. 응답 202는 발송 완료가 아니라 접수다. 작업 상태는 /api/jobs에서 확인한다. 이 큐는 단일 프로세스 학습용으로 프로세스 종료 시 queued 복구·재시도가 없다. 운영에서는 내구성 있는 외부 큐와 idempotency 키를 설계한다.

Stripe Checkout은 서버가 고정한 가격 id로 세션을 만들고 브라우저를 공급자 화면으로 보낸다. success URL 방문만으로 결제 완료를 믿지 않는다. 웹훅 원문과 서명을 Stripe SDK로 검증하고 eventId를 기록하여 단일 프로세스에서 중복 처리를 피한다. 여러 인스턴스에서는 eventId DB UNIQUE와 트랜잭션이 필요하다.

OAuth는 비밀번호를 받는 대신 공급자가 확인한 계정을 연결한다. state 난수·5분 만료·HttpOnly SameSite 쿠키를 서로 맞추고 일회성으로 소비한다. 기존 비밀번호 계정에 같은 이메일이라는 이유만으로 자동 연결하지 않는다. 코드 교환과 프로필 조회는 서버에서 수행한다.

업로드는 TXT·MD를 UTF-8 텍스트로 읽어 내 서버 JSON API에 보낸다. 파일명을 디스크 경로로 사용하지 않는다. 브라우저 Worker 검사 외에도 서버가 확장자·문자 수·본문 바이트 한도를 다시 검사한다. PDF·DOCX·PPTX 추출은 별도 구현 대상이다.

### 비유로 이해하기

외부 서비스 호출은 다른 회사에 업무를 맡기는 일이다. 접수증과 실제 완료 통지를 구분해야 한다.

## ③ 🛠️ 실기: 전체 코드와 줄별 설명

1. 기본 mock 모드에서 로그인 후 메일·결제·GitHub 버튼을 눌러 모의 표시를 확인한다.
2. /api/jobs에서 queued→done을 확인한다.
3. 실제 연동 시 .env의 SMTP_*·STRIPE_*·GITHUB_*를 채우고 INTEGRATIONS_MODE=live로 바꾼다.
4. GitHub 앱 callback을 PUBLIC_ORIGIN/api/auth/github/callback으로 등록한다.
5. Stripe 테스트 웹훅 주소를 /api/payments/webhook으로 연결하고 서명 비밀을 설정한다.
6. TXT·MD 업로드의 서버 거부 조건을 확인한다.



### 단계별 실행 위치

`npm run dev` 후 `/lessons/study13/`에서 이 단계의 실습을 연다. [실습 HTML](lessons/study13/index.html)과 [전체 실습 목차](lessons/index.html)를 사용한다. 기초 중간 프로젝트 전체 화면은 `npm run midpoint` 후 `/midpoint/`에서 실행한다. 터미널 전용 DB·Docker·MCP 명령은 해당 문서의 실행 순서를 따른다.

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


### `workbook/js/file-worker.js` 전체 코드

```javascript
// 큰 파일의 검사/해독을 메인 UI 스레드에서 분리한다.
self.onmessage = async ({ data: file }) => {
  try {
    if (!/\.(txt|md)$/i.test(file.name) || file.size > 60000) throw new Error('TXT·MD 60KB 이하만 허용합니다.');
    const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
    if (!text.trim() || text.length > 20000) throw new Error('문서는 1~20000자여야 합니다.');
    self.postMessage({ filename: file.name, text });
  } catch (error) { self.postMessage({ error: error.message }); }
};
```

원본: [workbook/js/file-worker.js](workbook/js/file-worker.js) · SHA-256(LF 정규화): `cb87200440f7172eee4c4510f70d68f38f9e2c20da388ee46eea43ba7af07c6f`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 큰 파일의 검사/해독을 메인 UI 스레드에서 분리한다. |
| 2 | 현재 처리의 설정·호출·상태를 연결한다: `self.onmessage = async ({ data: file }) => {` |
| 3 | 현재 처리의 설정·호출·상태를 연결한다: `try {` |
| 4 | 독립적으로 재현할 동작과 기대 결과를 하나의 테스트로 등록한다. |
| 5 | 비동기 작업 완료를 기다린 후 다음 단계로 진행한다: const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer()); |
| 6 | 입력·상태·경로 조건을 검사하여 해당 처리만 실행한다: if (!text.trim() // text.length > 20000) throw new Error('문서는 1~20000자여야 합니다.'); |
| 7 | 현재 처리의 설정·호출·상태를 연결한다: `self.postMessage({ filename: file.name, text });` |
| 8 | 실패를 잡아 공통 오류 또는 복구 상태로 바꾼다. |
| 9 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


### `lessons/study13/index.html` 전체 코드

```html
<!doctype html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>study13 실습</title><link rel="stylesheet" href="/workbook/style.css"></head>
<body><main class="container"></main><script type="module" src="app.js"></script></body>
</html>
```

원본: [lessons/study13/index.html](lessons/study13/index.html) · SHA-256(LF 정규화): `6df11ab6483fe3274d265eb18b832dbf42aaea9c5b88f10b6a1da6a4690ae4c1`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | HTML 표준 모드로 문서를 해석하도록 선언한다. |
| 2 | 문서 언어/루트를 정의한다. |
| 3 | 메타정보 / 문자 인코딩·화면 배율·설명 / 브라우저 탭 제목 / 공통 CSS 연결를 정의한다. |
| 4 | body 요소 / 본문 / ESM 진입점 연결를 정의한다. |
| 5 | 현재 HTML 요소를 닫는다. |


### `lessons/study13/app.js` 전체 코드

```javascript
import { mountLesson } from '../runner.js';

// 이 단계의 요청·입력·실행 순서를 선언한다.
mountLesson({
  "title": "study13 · 외부 서비스 연결",
  "intro": "가입·로그인 후 메일·결제·OAuth·문서 저장을 호출합니다. 기본 mock 응답은 실제 발송·결제 성공이 아닙니다.",
  "input": {
    "email": "lesson@example.com",
    "password": "lesson-password-123",
    "nickname": "학습자",
    "filename": "lesson.md",
    "text": "HTML은 문서의 구조입니다."
  },
  "actions": [
    {
      "label": "회원가입",
      "path": "/auth/signup",
      "method": "POST",
      "fields": [
        "email",
        "password",
        "nickname"
      ]
    },
    {
      "label": "로그인",
      "path": "/auth/login",
      "method": "POST",
      "fields": [
        "email",
        "password"
      ]
    },
    {
      "label": "메일 접수",
      "path": "/mail",
      "method": "POST"
    },
    {
      "label": "작업 상태",
      "path": "/jobs"
    },
    {
      "label": "테스트 결제",
      "path": "/checkout",
      "method": "POST"
    },
    {
      "label": "OAuth 시작",
      "path": "/auth/github"
    },
    {
      "label": "문서 저장",
      "path": "/documents",
      "method": "POST",
      "fields": [
        "filename",
        "text"
      ]
    }
  ],
  "links": [
    [
      "전체 게시판·문서 AI",
      "/workbook/"
    ]
  ]
});
```

원본: [lessons/study13/app.js](lessons/study13/app.js) · SHA-256(LF 정규화): `befe8f7dbc6f4df9912d1af939aa56be37cc242e0e9fd55d665d6ab3342c1512`

줄 번호는 위 코드의 첫 줄을 1로 센다. 빈 줄은 설명에서 생략한다.

| 줄 | 설명 |
|---|---|
| 1 | 필요한 함수·클래스만 모듈에서 가져와 이 파일의 의존성을 선언한다. |
| 3 | 이 단계의 요청·입력·실행 순서를 선언한다. |
| 4 | 현재 처리의 설정·호출·상태를 연결한다: `mountLesson({` |
| 5 | 현재 처리의 설정·호출·상태를 연결한다: `"title": "study13 · 외부 서비스 연결",` |
| 6 | 현재 처리의 설정·호출·상태를 연결한다: `"intro": "가입·로그인 후 메일·결제·OAuth·문서 저장을 호출합니다. 기본 mock 응답은 실제 발송·결제 성공이 아닙니다.",` |
| 7 | 현재 처리의 설정·호출·상태를 연결한다: `"input": {` |
| 8 | 현재 처리의 설정·호출·상태를 연결한다: `"email": "lesson@example.com",` |
| 9 | 현재 처리의 설정·호출·상태를 연결한다: `"password": "lesson-password-123",` |
| 10 | 현재 처리의 설정·호출·상태를 연결한다: `"nickname": "학습자",` |
| 11 | 현재 처리의 설정·호출·상태를 연결한다: `"filename": "lesson.md",` |
| 12 | 현재 처리의 설정·호출·상태를 연결한다: `"text": "HTML은 문서의 구조입니다."` |
| 13 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 14 | 현재 처리의 설정·호출·상태를 연결한다: `"actions": [` |
| 15 | 현재 처리의 설정·호출·상태를 연결한다: `{` |
| 16 | 현재 처리의 설정·호출·상태를 연결한다: `"label": "회원가입",` |
| 17 | 현재 처리의 설정·호출·상태를 연결한다: `"path": "/auth/signup",` |
| 18 | 현재 처리의 설정·호출·상태를 연결한다: `"method": "POST",` |
| 19 | 현재 처리의 설정·호출·상태를 연결한다: `"fields": [` |
| 20 | 현재 처리의 설정·호출·상태를 연결한다: `"email",` |
| 21 | 현재 처리의 설정·호출·상태를 연결한다: `"password",` |
| 22 | 현재 처리의 설정·호출·상태를 연결한다: `"nickname"` |
| 23 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 24 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 25 | 현재 처리의 설정·호출·상태를 연결한다: `{` |
| 26 | 현재 처리의 설정·호출·상태를 연결한다: `"label": "로그인",` |
| 27 | 현재 처리의 설정·호출·상태를 연결한다: `"path": "/auth/login",` |
| 28 | 현재 처리의 설정·호출·상태를 연결한다: `"method": "POST",` |
| 29 | 현재 처리의 설정·호출·상태를 연결한다: `"fields": [` |
| 30 | 현재 처리의 설정·호출·상태를 연결한다: `"email",` |
| 31 | 현재 처리의 설정·호출·상태를 연결한다: `"password"` |
| 32 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 33 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 34 | 현재 처리의 설정·호출·상태를 연결한다: `{` |
| 35 | 현재 처리의 설정·호출·상태를 연결한다: `"label": "메일 접수",` |
| 36 | 현재 처리의 설정·호출·상태를 연결한다: `"path": "/mail",` |
| 37 | 현재 처리의 설정·호출·상태를 연결한다: `"method": "POST"` |
| 38 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 39 | 현재 처리의 설정·호출·상태를 연결한다: `{` |
| 40 | 현재 처리의 설정·호출·상태를 연결한다: `"label": "작업 상태",` |
| 41 | 현재 처리의 설정·호출·상태를 연결한다: `"path": "/jobs"` |
| 42 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 43 | 현재 처리의 설정·호출·상태를 연결한다: `{` |
| 44 | 현재 처리의 설정·호출·상태를 연결한다: `"label": "테스트 결제",` |
| 45 | 현재 처리의 설정·호출·상태를 연결한다: `"path": "/checkout",` |
| 46 | 현재 처리의 설정·호출·상태를 연결한다: `"method": "POST"` |
| 47 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 48 | 현재 처리의 설정·호출·상태를 연결한다: `{` |
| 49 | 현재 처리의 설정·호출·상태를 연결한다: `"label": "OAuth 시작",` |
| 50 | 현재 처리의 설정·호출·상태를 연결한다: `"path": "/auth/github"` |
| 51 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 52 | 현재 처리의 설정·호출·상태를 연결한다: `{` |
| 53 | 현재 처리의 설정·호출·상태를 연결한다: `"label": "문서 저장",` |
| 54 | 현재 처리의 설정·호출·상태를 연결한다: `"path": "/documents",` |
| 55 | 현재 처리의 설정·호출·상태를 연결한다: `"method": "POST",` |
| 56 | 현재 처리의 설정·호출·상태를 연결한다: `"fields": [` |
| 57 | 현재 처리의 설정·호출·상태를 연결한다: `"filename",` |
| 58 | 현재 처리의 설정·호출·상태를 연결한다: `"text"` |
| 59 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 60 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 61 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 62 | 현재 처리의 설정·호출·상태를 연결한다: `"links": [` |
| 63 | 현재 처리의 설정·호출·상태를 연결한다: `[` |
| 64 | 현재 처리의 설정·호출·상태를 연결한다: `"전체 게시판·문서 AI",` |
| 65 | 현재 처리의 설정·호출·상태를 연결한다: `"/workbook/"` |
| 66 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 67 | 현재 함수·콜백·객체·조건 블록을 닫는다. |
| 68 | 현재 함수·콜백·객체·조건 블록을 닫는다. |


## ④ 🔗 연동 포인트

브라우저 → 내 /api/mail·checkout·auth/github·documents → 외부 서비스/DB → 상태 응답으로 이어진다. 외부 성공을 확인할 책임은 서버에 있다. 다음 단계에서 이 경로와 응답을 OpenAPI에 명시한다.

## ⑤ 오류 노트

| 증상 | 원인 | 해결 |
|---|---|---|
| 메일 접수 후 도착 안 함 | 202를 완료로 오해·SMTP 실패 | jobs.status와 SMTP 설정 확인 |
| 결제 성공 URL 위조 | redirect를 결제 근거로 사용 | 서명 검증 웹훅만 근거로 사용 |
| OAuth state 불일치 | 쿠키 차단·만료·호스트 다름 | 같은 PUBLIC_ORIGIN으로 다시 시작 |

## ⑥ 직접 해보기

1. 모의와 live 표시가 혼동되지 않게 UI 문구를 확인한다.
2. OAuth callback에 잘못된 state를 보내 400을 확인한다.
3. 확장자와 내용이 다른 파일·60KB 초과 파일을 업로드한다.

## ⑦ ☐ 체크리스트

학습자 수행 확인용이다. 문서·코드 작성 완료와 본인의 실습 완료는 다르므로 직접 확인한 뒤 체크한다. 원문 항목 배치는 [반영표](docs/coverage.md)를 따른다.

- [ ] 외부 서비스 비밀을 서버 환경변수에만 둔다
- [ ] 메일 202와 실제 발송 완료를 구분한다
- [ ] 결제 웹훅 서명·중복 이벤트를 검사한다
- [ ] OAuth state·만료·공급자 id와 서버 업로드 검증을 확인한다

## ⑧ 다음 단계 연결

[study14.md](study14.md)에서 REST·OpenAPI·버전·페이지네이션로 이어간다.

출처: [지정 노션](https://app.notion.com/p/3d6d7dec5e2e8147b212f0a23b93dfc1) · [공통 API v1](https://app.notion.com/p/3d6d7dec5e2e8139adbfd36dd506c65e) · [반영표](docs/coverage.md) · [검증 기록](docs/verification.md). 기술 근거: [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [Node 24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html). 설치 버전 API는 package-lock.json과 node_modules의 버전별 공식 문서를 기준으로 확인한다.
