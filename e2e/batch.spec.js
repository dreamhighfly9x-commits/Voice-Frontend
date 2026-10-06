import { test, expect, navigate } from './fixtures.js';

test.describe('Batch generation', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await navigate(page, 'Tạo hàng loạt');
    await expect(page.getByRole('heading', { name: 'Tạo hàng loạt' })).toBeVisible();
  });

  test('splits long text into sentences and generates each with library voices', async ({ authedPage: page }) => {
    await page.getByLabel('Văn bản nguồn').fill('Đây là câu thứ nhất qua Playwright.   Đây là câu thứ hai qua Playwright.');
    await page.getByRole('button', { name: 'Chuẩn hóa & tách đoạn' }).click();
    await expect(page.getByTestId('batch-item')).toHaveCount(2);
    if (await page.getByLabel('Giọng đoạn 2').locator('option').nth(2).count()) {
      await page.getByLabel('Giọng đoạn 2').selectOption({ index: 2 });
    }
    await page.getByRole('button', { name: 'Bắt đầu tạo hàng loạt' }).click();

    const rows = page.getByTestId('batch-row');
    await expect(rows).toHaveCount(2);
    await expect(rows.filter({ hasText: 'Hoàn thành' })).toHaveCount(2, { timeout: 60000 });
    await expect(rows.getByRole('button', { name: 'Tải WAV' })).toHaveCount(2);
  });

  test('an emptied segment fails without blocking the rest of the batch', async ({ authedPage: page }) => {
    await page.getByLabel('Văn bản nguồn').fill('Câu sẽ bị xóa nội dung. Nội dung đoạn hợp lệ.');
    await page.getByRole('button', { name: 'Chuẩn hóa & tách đoạn' }).click();
    await page.getByLabel('Nội dung đoạn 1').fill('');
    await page.getByRole('button', { name: 'Bắt đầu tạo hàng loạt' }).click();

    const rows = page.getByTestId('batch-row');
    await expect(rows.nth(0)).toContainText('Lỗi');
    await expect(rows.nth(1)).toContainText('Hoàn thành', { timeout: 30000 });
  });

  test('permission gate: tts.create disabled state shows the notice', async ({ authedPage: page }) => {
    const notice = page.getByText('Admin chưa cấp quyền tạo âm thanh (tts.create) cho tài khoản này.');
    const textarea = page.getByLabel('Văn bản nguồn');
    await expect(textarea).toBeVisible();
    if (await textarea.isDisabled()) await expect(notice).toBeVisible();
  });
});
