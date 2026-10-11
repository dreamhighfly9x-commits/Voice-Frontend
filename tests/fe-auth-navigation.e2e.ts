import { describe, test } from '@e2e-dev/web';
import { expect } from 'e2e';

// Deterministic auth / navigation / RBAC checks. No agent steps.
// Wrong-credential logins use a NON-EXISTENT email so no real account gets locked.

const NOBODY = 'nobody-e2e@example.test';

describe('login page', { tags: ['fe-auth'] }, () => {
  test('renders heading, fields and tabs', async ({ app, screen }) => {
    await app.open('/');
    await expect(screen.getByRole('heading', 'Chào mừng trở lại.')).toBeVisible({ timeout: 30_000 });
    await expect(screen.getByRole('textbox', 'Email address')).toBeVisible();
    await expect(screen.getByRole('textbox', 'Password')).toBeVisible();
    await expect(screen.getByRole('button', 'Đăng nhập', { pressed: true })).toBeVisible();
    await expect(screen.getByRole('button', 'Đăng ký', { pressed: false })).toBeVisible();
    await expect(screen.getByRole('button', 'Đăng nhập', { pressed: false })).toBeVisible();
  });

  test('register tab switches the form heading and submit label', async ({ app, screen }) => {
    await app.open('/');
    await screen.getByRole('button', 'Đăng ký', { pressed: false }).tap();
    await expect(screen.getByRole('heading', 'Bắt đầu sáng tạo.')).toBeVisible();
    await expect(screen.getByRole('button', 'Tạo tài khoản', { exact: false })).toBeVisible();
    await screen.getByRole('button', 'Đăng nhập', { pressed: false }).tap();
    await expect(screen.getByRole('heading', 'Chào mừng trở lại.')).toBeVisible();
  });

  test('wrong credentials show an alert and stay on login', async ({ app, screen }) => {
    await app.open('/');
    await screen.getByRole('textbox', 'Email address').fill(NOBODY);
    await screen.getByRole('textbox', 'Password').fill('definitely-wrong-123');
    await screen.getByRole('button', 'Đăng nhập', { pressed: false }).tap();
    await expect(screen.getByRole('alert')).toBeVisible({ timeout: 15_000 });
    await expect(screen.getByRole('heading', 'Chào mừng trở lại.')).toBeVisible();
    await expect(screen.getByRole('button', 'Đăng xuất')).toHaveCount(0);
  });

  test('empty submit does not log in', async ({ app, screen }) => {
    await app.open('/');
    await screen.getByRole('button', 'Đăng nhập', { pressed: false }).tap();
    await expect(screen.getByRole('heading', 'Chào mừng trở lại.')).toBeVisible();
    await expect(screen.getByRole('button', 'Đăng xuất')).toHaveCount(0);
  });

  test('short password is blocked client-side', async ({ app, screen }) => {
    await app.open('/');
    await screen.getByRole('textbox', 'Email address').fill(NOBODY);
    await screen.getByRole('textbox', 'Password').fill('short');
    await screen.getByRole('button', 'Đăng nhập', { pressed: false }).tap();
    await expect(screen.getByRole('heading', 'Chào mừng trở lại.')).toBeVisible();
    await expect(screen.getByRole('alert')).toHaveCount(0);
    await expect(screen.getByRole('button', 'Đăng xuất')).toHaveCount(0);
  });

  test('show/hide password toggle flips its label', async ({ app, screen }) => {
    await app.open('/');
    await screen.getByRole('button', 'Hiện mật khẩu').tap();
    await expect(screen.getByRole('button', 'Ẩn mật khẩu')).toBeVisible();
    await expect(screen.getByRole('button', 'Hiện mật khẩu')).toHaveCount(0);
    await screen.getByRole('button', 'Ẩn mật khẩu').tap();
    await expect(screen.getByRole('button', 'Hiện mật khẩu')).toBeVisible();
  });
});

const PAGES: Array<[string, string]> = [
  ['Chuyển văn bản', 'Chuyển văn bản thành giọng nói'],
  ['Kịch bản nhiều giọng', 'Kịch bản nhiều giọng'],
  ['Tạo hàng loạt', 'Tạo hàng loạt'],
  ['Thư viện giọng', 'Thư viện giọng'],
  ['Giọng của tôi', 'Giọng của tôi'],
  ['Thư viện âm thanh', 'Thư viện âm thanh'],
  ['Bảng giá', 'Bảng giá'],
  ['Cài đặt tài khoản', 'Cài đặt tài khoản'],
  ['API & Nguồn giọng', 'API & Nguồn giọng'],
  ['Quản trị', 'Quản trị hệ thống'],
  ['Tổng quan', 'Tổng quan'],
];

// IMPORTANT: a saved session can be restored only ONCE per run. The refresh
// token is single-use (rotation + reuse detection, auth-flow.md section 7): the
// first restore rotates it, a second restore replays the consumed token, and the
// server revokes the whole family + bumps token_version (every session of that
// account dies). So each role session is used by exactly one test below.
describe('signed-in navigation', { tags: ['fe-auth'] }, () => {
  test('admin: every sidebar item opens its screen, Quản trị works, session survives reload', { session: 'admin-nav' }, async ({ app, screen, browser }) => {
    await app.open('/');
    const nav = screen.getByRole('navigation', 'Điều hướng chính');
    await expect(nav).toBeVisible({ timeout: 30_000 });
    for (const [label, heading] of PAGES) {
      await nav.getByRole('button', label).tap();
      await expect(screen.getByRole('heading', heading, { level: 1 })).toBeVisible({ timeout: 10_000 });
      await expect(nav.getByRole('button', label)).toHaveAttribute('aria-current', 'page');
      if (label === 'Quản trị') {
        await expect(screen.getByRole('heading', 'Nhân viên & phân quyền')).toBeVisible({ timeout: 15_000 });
        await expect(screen.getByRole('heading', 'Không có quyền quản trị')).toHaveCount(0);
      }
    }

    // Session persistence: full reload must re-authenticate silently via the refresh cookie.
    await browser.reload();
    await expect(screen.getByRole('button', 'Đăng xuất')).toBeVisible({ timeout: 30_000 });
    await expect(screen.getByRole('heading', 'Chào mừng trở lại.')).toHaveCount(0);
    await app.open('/');
    await expect(screen.getByRole('heading', 'Tổng quan', { level: 1 })).toBeVisible({ timeout: 30_000 });
  });

  // Logout calls POST /api/auth/logout-all, which revokes EVERY session of the
  // shared e2e account (would break concurrently running suites). Stub only that
  // call; the client-side transition back to the login page is what is tested.
  test('member: Quản trị hidden, then logout returns to the login page', { session: 'member-nav' }, async ({ app, screen, browser }) => {
    let hits = 0;
    await browser.route('**/api/auth/logout*', (route) => { hits++; return route.fulfill({ status: 204, body: '' }); });
    await app.open('/');
    const nav = screen.getByRole('navigation', 'Điều hướng chính');
    await expect(nav.getByRole('button', 'Tổng quan')).toBeVisible({ timeout: 30_000 });
    await expect(nav.getByRole('button', 'Quản trị')).toHaveCount(0);
    await expect(screen.getByRole('heading', 'Nhân viên & phân quyền')).toHaveCount(0);

    await screen.getByRole('button', 'Đăng xuất').tap();
    await expect(screen.getByRole('heading', 'Chào mừng trở lại.')).toBeVisible({ timeout: 15_000 });
    await expect(screen.getByRole('textbox', 'Email address')).toBeVisible();
    await expect(screen.getByRole('navigation', 'Điều hướng chính')).toHaveCount(0);
    expect(hits).toBe(1);
  });
});
