import { test as base, expect } from '@playwright/test';

// Voice-Frontend now requires login for every screen (AuthContext.jsx /
// App.jsx `status !== 'authenticated'` gate). Point these at a real local
// account — e.g. one minted by `Voice-Backend/cmd/reset-local-password
// -email <you>` — via env vars so no credential is committed to the repo.
export const E2E_EMAIL = process.env.E2E_EMAIL || '';
export const E2E_PASSWORD = process.env.E2E_PASSWORD || '';

// One real POST /api/auth/login per worker, not per test. The backend's
// refresh token is single-use with rotation + reuse detection
// (auth-flow.md §7) and login itself is rate-limited to 5 attempts / 10s
// (auth-flow.md §5) — logging in fresh in every test both risks that limit
// and fights the single-use cookie once two contexts race to renew it.
// Sharing one already-authenticated page across a whole spec file (or the
// whole run, since playwright.config.js pins workers to 1) avoids both.
export const test = base.extend({
  authedPage: [
    async ({ browser }, use) => {
      if (!E2E_EMAIL || !E2E_PASSWORD) {
        throw new Error('Set E2E_EMAIL / E2E_PASSWORD env vars to a real local account before running e2e tests (see Voice-Backend/cmd/reset-local-password).');
      }
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto('/');
      await page.getByLabel('Email').fill(E2E_EMAIL);
      await page.getByLabel('Mật khẩu').fill(E2E_PASSWORD);
      await page.getByRole('button', { name: 'Đăng nhập' }).click();
      await expect(page.getByText(/Sẵn sàng/)).toBeVisible({ timeout: 20000 });
      await use(page);
      await context.close();
    },
    { scope: 'worker' },
  ],
});

export { expect };

// Sidebar nav labels are the same string as their screen's <h1> for most
// screens (e.g. "Thư viện giọng" is both). With a page shared across tests
// (see `authedPage` above) the target screen may already be active when a
// test's beforeEach fires, so a bare getByText(label) is ambiguous between
// the nav item and the heading it's about to click into. Scope to the
// sidebar (<aside>, role=complementary) to always mean "the nav item".
export function navigate(page, label) {
  return page.getByRole('complementary').getByText(label, { exact: true }).click();
}
