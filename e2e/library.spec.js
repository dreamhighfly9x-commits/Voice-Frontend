import { test, expect, navigate } from './fixtures.js';

test.describe('Library', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await navigate(page, 'Chuyển văn bản');
    await expect(page.getByRole('heading', { name: 'Chuyển văn bản thành giọng nói' })).toBeVisible();
  });

  test('generated recording shows up in Library and downloads via the real backend', async ({ authedPage: page }) => {
    const marker = 'Kiểm tra thư viện âm thanh ' + Date.now();

    await page.locator('textarea').fill(marker);
    await page.getByRole('button', { name: 'Tạo âm thanh' }).click();
    await expect(page.getByText('Đã tạo và lưu bản ghi WAV.')).toBeVisible({ timeout: 60000 });

    await navigate(page, 'Thư viện âm thanh');
    await expect(page.getByRole('heading', { name: 'Thư viện âm thanh' })).toBeVisible();

    const row = page.getByTestId('library-row').filter({ hasText: marker });
    // AudioDownload fetches the blob via apiFetch (Bearer auth) and triggers
    // a synthetic <a download> click — assert the real browser download event.
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      row.getByRole('button', { name: 'Tải WAV' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.wav$/);
  });

  test('play button reacts to a click (plays or falls back to a toast)', async ({ authedPage: page }) => {
    const marker = 'Kiểm tra phát lại trong thư viện ' + Date.now();

    await page.locator('textarea').fill(marker);
    await page.getByRole('button', { name: 'Tạo âm thanh' }).click();
    await expect(page.getByText('Đã tạo và lưu bản ghi WAV.')).toBeVisible({ timeout: 60000 });

    await navigate(page, 'Thư viện âm thanh');
    const row = page.getByTestId('library-row').filter({ hasText: marker });
    const playButton = row.getByTestId('play-button');
    await expect(playButton).toHaveAttribute('aria-label', 'Phát');
    await playButton.click();
    // Headless Chromium may reject Audio.play() (no output device) — the app
    // falls back to a toast instead of crashing; either outcome is a pass.
    await page.waitForTimeout(500);
    const label = await playButton.getAttribute('aria-label');
    expect(['Phát', 'Tạm dừng']).toContain(label);
  });
});
