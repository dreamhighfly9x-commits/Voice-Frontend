import { test, expect, navigate } from './fixtures.js';

// Requires the logged-in E2E account to hold the admin role (users.list) —
// see Voice-Backend/cmd/access-setup for how to bootstrap one locally.
test.describe('Admin — users & permissions', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await navigate(page, 'Quản trị');
    await expect(page.getByRole('heading', { name: 'Người dùng & phân quyền' })).toBeVisible();
    // The page (and AdminScreen's internal `tab` state) is shared across
    // tests — re-navigating to an already-active screen doesn't remount it,
    // so a previous test's "Nhật ký thay đổi" tab can still be selected.
    await page.getByRole('button', { name: 'Tài khoản & quyền' }).click();
  });

  test('lists at least the logged-in account and opens its permission editor', async ({ authedPage: page }) => {
    await expect(page.getByText(/tài khoản · Chọn để chỉnh quyền/)).toBeVisible({ timeout: 15000 });
    const firstUser = page.locator('.admin-user').first();
    await expect(firstUser).toBeVisible();
    await firstUser.click();
    await expect(page.getByRole('button', { name: /Lưu quyền/ })).toBeVisible();
  });

  test('audit log tab loads without crashing', async ({ authedPage: page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await page.getByRole('button', { name: 'Nhật ký thay đổi' }).click();
    await expect(page.getByRole('heading', { name: '100 thay đổi gần nhất' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('search box filters the account list', async ({ authedPage: page }) => {
    await expect(page.getByText(/tài khoản · Chọn để chỉnh quyền/)).toBeVisible({ timeout: 15000 });
    const before = await page.locator('.admin-user').count();
    await page.getByLabel('Tìm tài khoản').fill('khong-ton-tai-xyz-' + Date.now());
    await expect(page.getByText('Không có tài khoản phù hợp.')).toBeVisible();
    await page.getByLabel('Tìm tài khoản').fill('');
    await expect(page.locator('.admin-user')).toHaveCount(before);
  });
});
