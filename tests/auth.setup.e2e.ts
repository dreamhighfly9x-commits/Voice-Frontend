import { test } from '@e2e-dev/web';
import { credentials, expect } from 'e2e';

// One saved session per consuming file. The refresh token is single-use with
// reuse detection (Voice-Backend internal/auth/service.go), so two files
// restoring the SAME session replay a spent token and the server revokes every
// session of that account. Each name below must be restored by one file only
// (inside that file: one test, or one `serial` describe).
const SESSIONS = {
  'admin-nav': 'admin', // fe-auth-navigation
  'admin-screen': 'admin', // fe-admin-screen
  'admin-studio': 'admin', // fe-studio-flows
  'admin-smoke': 'admin', // smoke
  'member-nav': 'member', // fe-auth-navigation
  'member-admin': 'member', // fe-admin-screen
} as const;

// Proof of login = the sidebar "Đăng xuất" button, only rendered for an authenticated user.
for (const [name, role] of Object.entries(SESSIONS)) {
  test.setup(`sign in as ${role} (${name})`, { sessions: [name] }, async ({ app, screen, session }) => {
    const account = credentials.user(role);
    await app.open('/');
    await screen.getByRole('textbox', 'Email address').fill(account.username);
    await screen.getByRole('textbox', 'Password').fill(account.password);
    const submit = screen.getByRole('button', 'Đăng nhập', { pressed: false });
    const signedIn = screen.getByRole('button', 'Đăng xuất');
    await submit.tap();
    // Login is limited to 5 attempts / 10 s per IP. When several setups (and
    // the API suite) log in back to back, re-submit after the rate-limit alert
    // instead of failing.
    await expect
      .poll(async () => {
        if (await signedIn.isVisible()) return 'signed-in';
        const alert = screen.getByRole('alert');
        if ((await alert.count()) === 1 && /quá nhanh/.test((await alert.textContent()) ?? '')) await submit.tap();
        return 'waiting';
      }, { timeout: 60_000, interval: 3_000 })
      .toBe('signed-in');
    await session.save(name);
  });
}
