import { test, expect, navigate } from './fixtures.js';

test.describe('Studio — text to speech generation', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await navigate(page, 'Chuyển văn bản');
    await expect(page.getByRole('heading', { name: 'Chuyển văn bản thành giọng nói' })).toBeVisible();
  });

  test('engine connects and shows preset voices', async ({ authedPage: page }) => {
    // Quick-voice panel should list at least one real preset voice from the backend.
    await expect(page.getByText('Giọng đọc', { exact: true })).toBeVisible();
    await expect(page.getByTestId('quick-voice-row').first()).toBeVisible();
  });

  test('generate writes a new recording and shows the success toast', async ({ authedPage: page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('Đây là bài kiểm tra Playwright cho DreamHigh Voice.');

    const generateButton = page.getByRole('button', { name: 'Tạo âm thanh' });
    await expect(generateButton).toBeEnabled();
    await generateButton.click();

    await expect(page.getByText('Đã tạo và lưu bản ghi WAV.')).toBeVisible({ timeout: 60000 });
    // The new recording is prepended to "Bản ghi đã tạo".
    await expect(page.getByTestId('studio-result-row').first()).toContainText('Đây là bài kiểm tra Playwright');
  });

  test('generate is blocked for empty text', async ({ authedPage: page }) => {
    await page.locator('textarea').fill('');
    await expect(page.getByRole('button', { name: 'Tạo âm thanh' })).toBeDisabled();
  });

  test('picking a quick voice marks it as in use', async ({ authedPage: page }) => {
    const rows = page.getByTestId('quick-voice-row');
    await expect(rows.first()).toContainText('Đang dùng');
    const secondName = (await rows.nth(1).locator('span').first().textContent()) || '';

    // Selecting a different voice promotes it to the front of the quick list.
    await rows.nth(1).click();
    await expect(rows.first()).toContainText('Đang dùng');
    await expect(rows.first()).toContainText(secondName);
  });
});
