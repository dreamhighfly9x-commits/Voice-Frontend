import { test, expect } from './fixtures.js';

test.describe('Global search', () => {
  test('opens via button, filters by kind, and choosing a voice jumps to Studio', async ({ authedPage: page }) => {
    await page.getByRole('button', { name: 'Tìm dự án, giọng, bản ghi' }).click();
    const dialogInput = page.getByLabel('Nội dung tìm kiếm');
    await expect(dialogInput).toBeVisible();

    await page.getByRole('button', { name: 'Giọng', exact: true }).click();
    await dialogInput.fill('a');
    await expect(page.getByText(/kết quả/)).toBeVisible();

    const firstResult = page.locator('dialog[open] button').filter({ hasText: 'Dùng trong Studio' }).first();
    await firstResult.click();

    await expect(page.getByRole('heading', { name: 'Chuyển văn bản thành giọng nói' })).toBeVisible();
  });

  test('Ctrl+K opens the dialog and Esc closes it', async ({ authedPage: page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.getByLabel('Nội dung tìm kiếm')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByLabel('Nội dung tìm kiếm')).toBeHidden();
  });
});
