import { test, expect } from '@playwright/test';

test.use({ channel: 'chrome' });

async function anonymous(page) {
  const privateRequests = [];
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path !== '/api/auth/renew') privateRequests.push(path);
    return route.fulfill({ status: 401, json: { error: 'No public session' } });
  });
  return privateRequests;
}

test('public content, real sample playback, FAQ and auth links without private requests', async ({ page }) => {
  const privateRequests = await anonymous(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Giọng Nói Đầy Cảm Xúc');
  await expect(page.locator('.lp-plan')).toHaveCount(4);
  for (const id of ['features', 'intro', 'voices', 'pricing', 'faq']) await expect(page.locator(`#${id}`)).toBeAttached();
  await expect(page.locator('.app,.nav-rail,.voice-auth')).toHaveCount(0);
  for (const title of ['Thanh âm kể chuyện', 'Thanh âm sáng tạo', 'Thanh âm đồng hành']) {
    await page.getByRole('button', { name: `Nghe ${title}`, exact: true }).click();
    await expect.poll(() => page.locator('audio').evaluate(el => el.currentTime)).toBeGreaterThan(0);
    await expect(page.getByRole('button', { name: `Tạm dừng ${title}` })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: `Tạm dừng ${title}` }).click();
  }
  await page.locator('#faq summary').first().click();
  await expect(page.locator('#faq details').first()).toHaveAttribute('open', '');
  await page.getByRole('link', { name: 'Bắt đầu tạo giọng nói' }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByRole('heading', { name: 'Bắt đầu sáng tạo.' })).toBeVisible();
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Chào mừng trở lại.' })).toBeVisible();
  await page.goto('/docs/api');
  await expect(page.getByRole('heading', { name: '1. Xác thực' })).toBeVisible();
  await expect(page.locator('.api-key-manager,.nav-rail')).toHaveCount(0);
  expect(privateRequests).toEqual([]);
});

test('public landing still works when authentication is unavailable', async ({ page }) => {
  await page.route('**/api/**', route => route.abort());
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Giọng Nói Đầy Cảm Xúc');
  await expect(page.locator('#pricing')).toBeAttached();
});

test('demo draft survives login and opens Studio without generating automatically', async ({ page }) => {
  let created = false;
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/renew') return route.fulfill({ status: 401, json: {} });
    if (path === '/api/auth/login') return route.fulfill({ json: { access_token: 'public-landing-test' } });
    if (path === '/api/me') return route.fulfill({ json: { id: 'landing-test', name: 'Test User', email: 'test@example.invalid', roles: ['user'], permissions: ['tts.create', 'voices.read'], limits: { max_chars_request: 5000, max_chars_month: 20000 } } });
    if (path === '/api/voices') return route.fulfill({ json: [{ id: 'test', name: 'Test Voice', tags: 'vi-VN', seed: 1 }] });
    if (path === '/api/synthesize') created = true;
    return route.fulfill({ json: [] });
  });
  await page.goto('/');
  const draft = 'Đây là ý tưởng cần được giữ lại khi đăng nhập.';
  await page.getByLabel('Văn bản của bạn', { exact: true }).fill(draft);
  await page.getByRole('link', { name: 'Tạo giọng nói', exact: true }).click();
  await expect(page).toHaveURL(/\/login\?next=studio$/);
  await page.locator('#auth-email').fill('test@example.invalid');
  await page.locator('#auth-password').fill('test-password-only');
  await page.locator('button[type=submit]').click();
  await expect(page.getByRole('textbox', { name: 'Nội dung chuyển thành giọng nói' })).toHaveValue(draft);
  expect(await page.evaluate(() => sessionStorage.getItem('dreamhigh-public-draft'))).toBeNull();
  expect(created).toBe(false);
});

for (const [name, width, height] of [['desktop', 1440, 1000], ['tablet', 820, 1180], ['mobile', 390, 844]]) {
  test(`${name}: responsive layout and navigation`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await anonymous(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
    await page.screenshot({ path: testInfo.outputPath(`${name}-hero.png`) });
    if (width < 851) {
      const menu = page.getByRole('button', { name: 'Menu điều hướng' });
      await menu.click();
      await expect(menu).toHaveAttribute('aria-expanded', 'true');
      await page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name: 'Bảng giá' }).click();
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
      await expect(page).toHaveURL(/#pricing$/);
    }
  });
}

test('configured intro exposes native video controls and caption track', async ({ page }) => {
  await anonymous(page);
  await page.route('**/landing-config.json', route => route.fulfill({ json: { introVideo: '/video/intro.mp4', introPoster: '/favicon.png', introCaptions: '/video/intro.vi.vtt' } }));
  // Hold media request so this test can inspect configuration without needing an owner's video.
  await page.route('**/video/intro.mp4', () => {});
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const video = page.getByLabel('Video giới thiệu DreamHigh Voice');
  await expect(video).toHaveAttribute('controls', '');
  await expect(video).toHaveAttribute('playsinline', '');
  await expect(video.locator('track')).toHaveAttribute('src', '/video/intro.vi.vtt');
});

test('owner video plays below the headline, left of the use case slider', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await anonymous(page);
  await page.goto('/');
  const video = page.getByLabel('Video giới thiệu DreamHigh Voice');
  await expect(video).toHaveAttribute('src', '/video/dreamhigh-intro.mp4');
  await expect.poll(() => video.evaluate(el => el.readyState)).toBeGreaterThan(0);
  expect(await video.evaluate(el => el.paused)).toBe(true);
  const videoBox = await video.boundingBox();
  const headingBox = await page.getByRole('heading', { level: 1 }).boundingBox();
  const sliderBox = await page.getByRole('region', { name: 'Ứng dụng thực tế của DreamHigh Voice' }).boundingBox();
  expect(videoBox.y).toBeGreaterThan(headingBox.y + headingBox.height);
  expect(videoBox.x + videoBox.width).toBeLessThan(sliderBox.x);
  await video.evaluate(el => el.play());
  await expect.poll(() => video.evaluate(el => el.currentTime)).toBeGreaterThan(0);
  await video.evaluate(el => el.pause());
  expect(await video.evaluate(el => el.videoWidth / el.videoHeight)).toBeCloseTo(16 / 9);
});

test('use case slider: arrows, dots, keyboard and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await anonymous(page);
  await page.goto('/');
  const slider = page.getByRole('region', { name: 'Ứng dụng thực tế của DreamHigh Voice' });
  const active = slider.locator('.uc-card.is-active h3');
  await expect(active).toHaveText('Thuyết Minh Video');
  await slider.getByRole('button', { name: 'Slide tiếp theo' }).click();
  await expect(active).toHaveText('Review & Tóm Tắt Phim');
  await slider.getByRole('button', { name: 'Slide trước' }).click();
  await expect(active).toHaveText('Thuyết Minh Video');
  await slider.getByRole('button', { name: /slide 8:/ }).click();
  await expect(active).toHaveText('Bài Giảng & Học Tập');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(active).toHaveText('Thuyết Minh Video');
  await page.keyboard.press('End');
  await expect(active).toHaveText('Bài Giảng & Học Tập');
  await slider.locator('.uc-card[data-offset="1"]').click();
  await expect(active).toHaveText('Thuyết Minh Video');
  await slider.getByRole('button', { name: 'Expand' }).click();
  await expect(page.getByRole('dialog', { name: 'Thuyết Minh Video' })).toBeVisible();
  await page.getByRole('button', { name: 'Đóng' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.keyboard.press('End');
  // Reduced motion: no auto-advance.
  await page.waitForTimeout(6500);
  await expect(active).toHaveText('Bài Giảng & Học Tập');
});
