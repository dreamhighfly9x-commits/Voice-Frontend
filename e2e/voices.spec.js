import { test, expect, navigate } from './fixtures.js';

test.describe('Voices library', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await navigate(page, 'Thư viện giọng');
    await expect(page.getByRole('heading', { name: 'Thư viện giọng' })).toBeVisible();
  });

  test('lists preset voices from the real backend', async ({ authedPage: page }) => {
    const cards = page.getByTestId('voice-card');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('favorite toggle filters into "Yêu thích"', async ({ authedPage: page }) => {
    const firstCard = page.getByTestId('voice-card').first();
    const favButton = firstCard.getByRole('button', { name: /Yêu thích/ });
    const name = await firstCard.locator('span').first().textContent();
    await favButton.click();

    await page.getByRole('button', { name: /^Yêu thích \(/ }).click();
    await expect(page.getByTestId('voice-card').filter({ hasText: name })).toBeVisible();

    // Reset the filter — this page is shared across tests (fixtures.js), so
    // leaving "Yêu thích" active would starve the next test's voice list.
    await page.getByRole('button', { name: /^Tất cả \(/ }).click();
  });

  test('picking a voice navigates to Studio with it selected', async ({ authedPage: page }) => {
    const cards = page.getByTestId('voice-card');
    expect(await cards.count()).toBeGreaterThan(1);
    // Pick a card that isn't already the active voice (shows "Chọn", not
    // "Đang dùng") — the page is shared across tests (fixtures.js), so the
    // currently-selected voice depends on what earlier tests left behind.
    const targetCard = cards.filter({ has: page.getByText('Chọn', { exact: true }) }).first();
    await expect(targetCard).toBeVisible();
    const name = await targetCard.locator('span').first().textContent();
    // dispatchEvent bypasses hit-testing — same fixed-position mascot overlap
    // as clones.spec.js's delete-confirm button (App.jsx). Recurring across
    // two unrelated screens now; flagged as a real bug in the final report.
    await targetCard.getByText('Chọn', { exact: true }).dispatchEvent('click');

    await expect(page.getByRole('heading', { name: 'Chuyển văn bản thành giọng nói' })).toBeVisible();
    const rows = page.getByTestId('quick-voice-row');
    await expect(rows.first()).toContainText(name);
    await expect(rows.first()).toContainText('Đang dùng');
  });

  test('classify gender/style persists in the select', async ({ authedPage: page }) => {
    const card = page.getByTestId('voice-card').first();
    await card.getByText('Phân loại', { exact: true }).click();
    const genderSelect = card.getByLabel(/Giới tính/);
    await genderSelect.selectOption('female');
    await expect(genderSelect).toHaveValue('female');
  });
});
