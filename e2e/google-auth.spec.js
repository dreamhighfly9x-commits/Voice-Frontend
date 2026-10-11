import { test, expect } from '@playwright/test';

test('Google sign-in uses the backend redirect and preserves the requested screen', async ({ page }) => {
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/auth/google/config') return route.fulfill({ json: { enabled: true } });
    if (url.pathname === '/api/auth/google/start') return route.fulfill({ contentType: 'text/html', body: '<h1>Google redirect reached</h1>' });
    return route.fulfill({ status: 401, json: {} });
  });
  await page.goto('/login?next=studio');
  await page.getByRole('button', { name: 'Đăng nhập bằng Google', exact: true }).click();
  await expect(page).toHaveURL(/\/api\/auth\/google\/start\?next=studio$/);
  await expect(page.getByRole('heading', { name: 'Google redirect reached' })).toBeVisible();
});

test('Google availability, register mode and callback failures remain clear', async ({ page }) => {
  await page.route('**/api/**', route => {
    if (new URL(route.request().url()).pathname === '/api/auth/google/config') return route.fulfill({ json: { enabled: false } });
    return route.fulfill({ status: 401, json: {} });
  });
  await page.goto('/register');
  await expect(page.getByRole('button', { name: 'Đăng ký bằng Google', exact: true })).toBeDisabled();
  await page.goto('/login?google_error=cancelled');
  await expect(page.getByRole('alert')).toHaveText('Bạn đã hủy đăng nhập Google.');
  await page.goto('/login?google_error=existing_account');
  await expect(page.getByRole('alert')).toContainText('đăng nhập bằng mật khẩu');
});

test('Google MFA requires a code and then loads the app session', async ({ page }) => {
  let verified = false;
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/google/config') return route.fulfill({ json: { enabled: true } });
    if (path === '/api/auth/renew') return route.fulfill({ status: 401, json: {} });
    if (path === '/api/auth/google/mfa') {
      expect(route.request().postDataJSON()).toEqual({ code: '123456' });
      verified = true;
      return route.fulfill({ json: { access_token: 'google-mfa-test', next: 'voices' } });
    }
    if (path === '/api/me') return route.fulfill({ json: { id: 'google-test', roles: ['user'], permissions: ['voices.read'], limits: {} } });
    return route.fulfill({ json: [] });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/login?google_mfa=1');
  await expect(page.getByRole('heading', { name: 'Xác thực hai bước.' })).toBeVisible();
  await page.getByLabel('Mã xác thực hoặc mã khôi phục').fill('123456');
  await page.locator('button[type=submit]').click();
  await expect(page.locator('.voice-auth')).toHaveCount(0);
  await expect(page.locator('.app-shell')).toBeVisible();
  expect(verified).toBe(true);
});
