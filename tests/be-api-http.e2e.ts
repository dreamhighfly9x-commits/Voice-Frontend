import { test, expect } from 'e2e';
import { z } from 'zod';

// Pure HTTP suite (fetch + expect, no browser, no model) against the running
// Go auth-api (:8080) and Python TTS API (:8000).
const GO = process.env.E2E_GO_API ?? 'http://127.0.0.1:8080';
const PY = process.env.E2E_PY_API ?? 'http://127.0.0.1:8000';
const ALLOWED_ORIGIN = 'http://localhost:5173';

type Session = { token: string; refreshCookie: string };

// POST /api/auth/login, re-sent while the per-IP limit (5 / 10 s) answers 429 —
// the UI setup logins share that budget when the whole suite runs.
async function postLogin(body: string): Promise<Response> {
  let res!: Response;
  await expect
    .poll(async () => {
      res = await fetch(`${GO}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body });
      return res.status;
    }, { timeout: 60_000, interval: 3_000 })
    .not.toBe(429);
  return res;
}

// Log in once per role (login is rate limited per IP + per email).
const sessions = new Map<string, Promise<Session>>();
function login(role: 'ADMIN' | 'MEMBER'): Promise<Session> {
  if (!sessions.has(role)) {
    sessions.set(role, (async () => {
      const email = process.env[`E2E_USER_${role}_USERNAME`];
      const password = process.env[`E2E_USER_${role}_PASSWORD`];
      if (!email || !password) throw new Error(`E2E_USER_${role}_* not set (.env.e2e)`);
      const res = await postLogin(JSON.stringify({ email, password }));
      if (res.status !== 200) throw new Error(`login ${role} -> ${res.status} ${await res.text()}`);
      const body = (await res.json()) as { access_token: string };
      const rt = res.headers.getSetCookie().find((c) => /^(__Secure-)?rt=/.test(c)) ?? '';
      return { token: body.access_token, refreshCookie: rt.split(';')[0] };
    })());
  }
  return sessions.get(role)!;
}
const bearer = (s: Session) => ({ authorization: `Bearer ${s.token}` });

const LoginResponse = z.object({ access_token: z.string().min(20), expires_in: z.number().positive() });
const Me = z.object({
  id: z.string(),
  email: z.string().email(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
});
const LogEntry = z.object({ timestamp: z.string(), level: z.string(), message: z.string(), service: z.string() }).passthrough();
const Logs = z.object({ entries: z.array(LogEntry), capacity: z.number() });
const Voice = z.object({ id: z.string() }).passthrough();

// 1. Health
test('GET :8080/healthz returns 200 {status:ok}', async () => {
  const res = await fetch(`${GO}/healthz`);
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ status: 'ok' });
});

test('GET :8000/api/health reports status and voice count without auth', async () => {
  const res = await fetch(`${PY}/api/health`);
  expect(res.status).toBe(200);
  const body = expect(await res.json()).toMatchSchema(z.object({ status: z.enum(['ok', 'loading']), voices: z.number() }));
  expect(body.status).toBe('ok');
});

// 2. Auth
test('login returns access_token + expires_in and sets an HttpOnly refresh cookie', async () => {
  const email = process.env.E2E_USER_ADMIN_USERNAME!;
  const password = process.env.E2E_USER_ADMIN_PASSWORD!;
  const res = await postLogin(JSON.stringify({ email, password }));
  expect(res.status).toBe(200);
  const body = expect(await res.json()).toMatchSchema(LoginResponse);
  const cookie = res.headers.getSetCookie().find((c) => /^(__Secure-)?rt=/.test(c));
  expect(cookie).toBeDefined();
  expect(cookie!).toMatch(/HttpOnly/i);
  sessions.set('ADMIN', Promise.resolve({ token: body.access_token, refreshCookie: cookie!.split(';')[0] }));
});

test('login with a non-existent email returns generic 401 INVALID_CREDENTIALS', async () => {
  const res = await postLogin(JSON.stringify({ email: `nobody-${Date.now()}@e2e.invalid`, password: 'not-a-real-password' }));
  expect(res.status).toBe(401);
  expect(await res.json()).toEqual({ code: 'INVALID_CREDENTIALS' });
});

test('login with malformed bodies returns 400, never 5xx', async () => {
  for (const body of ['{not json', JSON.stringify({ email: 'not-an-email', password: 'x' }), JSON.stringify({})]) {
    const res = await postLogin(body);
    expect(res.status).toBe(400);
  }
});

test('GET /api/me with token returns email, roles and permissions', async () => {
  const admin = await login('ADMIN');
  const res = await fetch(`${GO}/api/me`, { headers: bearer(admin) });
  expect(res.status).toBe(200);
  const me = expect(await res.json()).toMatchSchema(Me);
  expect(me.email.toLowerCase()).toBe(process.env.E2E_USER_ADMIN_USERNAME!.toLowerCase());
  expect(me.permissions).toContain('system.view_audit_log');
});

test('GET /api/me without or with a garbage token returns 401', async () => {
  expect((await fetch(`${GO}/api/me`)).status).toBe(401);
  expect((await fetch(`${GO}/api/me`, { headers: { authorization: 'Bearer not.a.jwt' } })).status).toBe(401);
});

// 3. RBAC
test('member is denied admin endpoints with 403', async () => {
  const member = await login('MEMBER');
  const me = Me.parse(await (await fetch(`${GO}/api/me`, { headers: bearer(member) })).json());
  expect(me.permissions).not.toContain('users.list');
  for (const path of ['/api/admin/users', '/api/admin/logs']) {
    const res = await fetch(`${GO}${path}`, { headers: bearer(member) });
    expect(res.status).toBe(403);
  }
});

test('admin can list users and logs', async () => {
  const admin = await login('ADMIN');
  expect((await fetch(`${GO}/api/admin/users`, { headers: bearer(admin) })).status).toBe(200);
  const res = await fetch(`${GO}/api/admin/logs`, { headers: bearer(admin) });
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchSchema(Logs);
});

test('GET /api/admin/logs?level=warn&limit=5 filters by level and respects limit', async () => {
  const admin = await login('ADMIN');
  const res = await fetch(`${GO}/api/admin/logs?level=warn&limit=5`, { headers: bearer(admin) });
  expect(res.status).toBe(200);
  const { entries } = expect(await res.json()).toMatchSchema(Logs);
  expect(entries.length).toBeLessThanOrEqual(5);
  for (const e of entries) expect(e.level).toBe('warn');

  const one = Logs.parse(await (await fetch(`${GO}/api/admin/logs?limit=1`, { headers: bearer(admin) })).json());
  expect(one.entries.length).toBeLessThanOrEqual(1);
});

// 4. Python API auth
test('Python GET /api/voices: 401 without token, 200 array with admin token', async () => {
  const anon = await fetch(`${PY}/api/voices`);
  expect(anon.status).toBe(401);
  expect(await anon.json()).toMatchObject({ detail: expect.any(String) });

  const admin = await login('ADMIN');
  const res = await fetch(`${PY}/api/voices`, { headers: bearer(admin) });
  expect(res.status).toBe(200);
  const voices = expect(await res.json()).toMatchSchema(z.array(Voice));
  expect(voices.length).toBeGreaterThan(0);
});

// 5. Request correlation
test('X-Request-ID is generated, a valid incoming id is echoed, an invalid one replaced (both services)', async () => {
  for (const url of [`${GO}/healthz`, `${PY}/api/health`]) {
    const gen = await fetch(url);
    expect(gen.headers.get('x-request-id')).toMatch(/^[A-Za-z0-9._-]{8,64}$/);

    const echo = await fetch(url, { headers: { 'x-request-id': 'e2e-req-12345678' } });
    expect(echo.headers.get('x-request-id')).toBe('e2e-req-12345678');

    const bad = await fetch(url, { headers: { 'x-request-id': 'bad id' } });
    const rid = bad.headers.get('x-request-id');
    expect(rid).not.toBe('bad id');
    expect(rid).toMatch(/^[A-Za-z0-9._-]{8,64}$/);
  }
});

// 6. Synthesize validation (no real synthesis)
test('POST /api/synthesize rejects empty, over-limit and unknown-voice input with 4xx JSON', async () => {
  const admin = await login('ADMIN');
  const voices = z.array(Voice).parse(await (await fetch(`${PY}/api/voices`, { headers: bearer(admin) })).json());
  const local = voices.find((v) => !v.id.startsWith('ext_') && !v.id.startsWith('clone_'))!;
  const post = (body: unknown) =>
    fetch(`${PY}/api/synthesize`, { method: 'POST', headers: { ...bearer(admin), 'content-type': 'application/json' }, body: JSON.stringify(body) });

  const cases: Array<[string, unknown]> = [
    ['empty text', { text: '', voice: local.id }],
    ['whitespace text', { text: '    ', voice: local.id }],
    ['over limit', { text: 'a'.repeat(50_001), voice: local.id }],
    ['missing voice', { text: 'Xin chào' }],
    ['unknown voice', { text: 'Xin chào', voice: 'does-not-exist-e2e' }],
  ];
  for (const [name, body] of cases) {
    const res = await post(body);
    expect(res.status, name).toBeGreaterThanOrEqual(400);
    expect(res.status, name).toBeLessThan(500);
    const json = await res.json();
    expect(json, name).toHaveProperty('detail');
  }
});

test('POST /api/synthesize without token returns 401', async () => {
  const res = await fetch(`${PY}/api/synthesize`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'Xin chào', voice: 'x' }),
  });
  expect(res.status).toBe(401);
});

// 7. Security headers + CORS
test('Go API sets security headers', async () => {
  const res = await fetch(`${GO}/healthz`);
  expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  expect(res.headers.get('referrer-policy')).toBe('no-referrer');
  expect(res.headers.get('content-security-policy')).toContain("default-src 'self'");
});

test('Go API CORS preflight allows the Vite origin and does not echo an unknown origin', async () => {
  const preflight = (origin: string) =>
    fetch(`${GO}/api/me`, {
      method: 'OPTIONS',
      headers: { origin, 'access-control-request-method': 'GET', 'access-control-request-headers': 'authorization' },
    });
  const ok = await preflight(ALLOWED_ORIGIN);
  expect(ok.status).toBeLessThan(300);
  expect(ok.headers.get('access-control-allow-origin')).toBe(ALLOWED_ORIGIN);
  expect(ok.headers.get('access-control-allow-credentials')).toBe('true');

  const evil = await preflight('https://evil.example');
  expect(evil.headers.get('access-control-allow-origin')).toBeNull();
});

// 8. Logout (last; member account only)
test('logout revokes the member access token and refresh cookie', async () => {
  const member = await login('MEMBER');
  expect((await fetch(`${GO}/api/me`, { headers: bearer(member) })).status).toBe(200);

  const out = await fetch(`${GO}/api/auth/logout`, { method: 'POST', headers: { ...bearer(member), cookie: member.refreshCookie } });
  expect(out.status).toBe(200);

  expect((await fetch(`${GO}/api/me`, { headers: bearer(member) })).status).toBe(401);
  expect((await fetch(`${PY}/api/voices`, { headers: bearer(member) })).status).toBe(401);

  const renew = await fetch(`${GO}/api/auth/renew`, { method: 'POST', headers: { cookie: member.refreshCookie } });
  expect(renew.status).toBe(401);
  sessions.delete('MEMBER');
});
