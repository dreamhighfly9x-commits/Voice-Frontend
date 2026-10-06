import { test, expect, navigate } from './fixtures.js';

const NAV = [
  { label: 'Tổng quan', heading: 'Tổng quan' },
  { label: 'Chuyển văn bản', heading: 'Chuyển văn bản thành giọng nói' },
  { label: 'Kịch bản nhiều giọng', heading: 'Kịch bản nhiều giọng' },
  { label: 'Tạo hàng loạt', heading: 'Tạo hàng loạt' },
  { label: 'Thư viện giọng', heading: 'Thư viện giọng' },
  { label: 'Giọng của tôi', heading: 'Giọng của tôi' },
  { label: 'Thư viện âm thanh', heading: 'Thư viện âm thanh' },
  { label: 'Cài đặt tài khoản', heading: 'Cài đặt tài khoản' },
  { label: 'Quản trị', heading: 'Quản trị hệ thống' },
];

test.describe('Navigation across all screens', () => {
  test('sidebar walks every screen with no console errors and correct header', async ({ authedPage: page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    for (const { label, heading } of NAV) {
      await navigate(page, label);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    }

    const relevant = errors.filter((e) => !/ResizeObserver|Warning: ReactDOM.render|401 \(Unauthorized\)/.test(e));
    expect(relevant, `console/page errors during navigation walk:\n${relevant.join('\n')}`).toEqual([]);
  });
});
