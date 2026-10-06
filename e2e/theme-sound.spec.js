import { test, expect } from './fixtures.js';

test.describe('Theme and sound toggles', () => {
  test('theme toggle switches data-theme and button label', async ({ authedPage: page }) => {
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByText('Tối', { exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByText('Sáng', { exact: true })).toBeVisible();
    await page.getByText('Sáng', { exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('sound toggle switches label between Âm thanh / Tắt tiếng', async ({ authedPage: page }) => {
    await expect(page.getByText('Âm thanh', { exact: true })).toBeVisible();
    await page.getByText('Âm thanh', { exact: true }).click();
    await expect(page.getByText('Tắt tiếng', { exact: true })).toBeVisible();
    await page.getByText('Tắt tiếng', { exact: true }).click();
  });
});
