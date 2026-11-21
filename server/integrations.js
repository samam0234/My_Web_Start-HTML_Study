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
