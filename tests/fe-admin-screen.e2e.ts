import { describe, test } from '@e2e-dev/web';
import { expect } from 'e2e';

// Admin screen "Quản trị". Read-only against the real auth-api; the one save flow is mocked.
// The refresh token is single-use, so each saved session is restored by exactly one
// group: all admin checks run serially in one shared app state.
const ADMIN_EMAIL = 'e2e-admin@example.test';
const MEMBER_EMAIL = 'e2e-user@example.test';

type Ctx = Parameters<Parameters<typeof test>[1]>[0];
type Screen = Ctx['screen'];

async function gotoAdminUsers(screen: Screen) {
  await screen.getByRole('navigation', 'Điều hướng chính').getByRole('button', 'Quản trị').tap();
  await expect(screen.getByRole('heading', 'Nhân viên & phân quyền')).toBeVisible({ timeout: 30_000 });
  await screen.getByRole('button', 'Nhân viên').tap();
  await expect(screen.getByRole('button', 'Nhân viên', { pressed: true })).toBeVisible();
}

const userButton = (screen: Screen, email: string) =>
  screen.getByRole('button', new RegExp(email.replace(/[.]/g, '\\.')));

const LOGS = [
  { timestamp: '2026-10-06T08:00:04Z', level: 'error', service: 'auth-api', message: 'db timeout', request_id: 'req-aaa111', method: 'GET', path: '/api/admin/users', status: 500, error: { message: 'pq: timeout', stack: 'goroutine 1 [running]:\nmain.handler()\n\tinternal/admin/users.go:42' } },
  { timestamp: '2026-10-06T08:00:03Z', level: 'warn', service: 'tts-api', message: 'slow synth', request_id: 'req-bbb222', detail: 'took 12s', duration_ms: 12000 },
  { timestamp: '2026-10-06T08:00:02Z', level: 'warn', service: 'worker', message: 'retrying job', request_id: 'req-aaa111', attempt: 2 },
  { timestamp: '2026-10-06T08:00:01Z', level: 'error', service: 'tts-api', message: 'model load failed', request_id: 'req-ccc333' },
];

describe('admin screen (Quản trị)', { tags: ['fe-admin'], serial: true, session: 'admin-screen' }, () => {
  test('hero, stats and users list render', async ({ app, screen }) => {
    await app.open('/');
    await gotoAdminUsers(screen);
    await expect(screen.getByText('QUẢN TRỊ HỆ THỐNG')).toBeVisible();
    for (const label of ['Tài khoản', 'Đang hoạt động', 'Quản trị viên', 'Tạm khóa']) {
      await expect(screen.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await expect(userButton(screen, ADMIN_EMAIL)).toBeVisible({ timeout: 15_000 });
    await expect(userButton(screen, MEMBER_EMAIL)).toBeVisible();
    await expect(screen.getByText(/^\d+ tài khoản · Chọn để chỉnh quyền$/)).toBeVisible();
    await expect(screen.getByRole('alert')).toBeHidden();
  });

  test('search box and status filter narrow the users list', async ({ screen }) => {
    await gotoAdminUsers(screen);
    await expect(userButton(screen, ADMIN_EMAIL)).toBeVisible({ timeout: 15_000 });
    const search = screen.getByRole('textbox', 'Tìm tài khoản');
    await search.fill('e2e-admin@');
    await expect(userButton(screen, ADMIN_EMAIL)).toBeVisible();
    await expect(userButton(screen, MEMBER_EMAIL)).toBeHidden();
    await expect(screen.getByText('1 tài khoản · Chọn để chỉnh quyền')).toBeVisible();

    await search.fill('no-such-user-zzz');
    await expect(screen.getByText('Không có tài khoản phù hợp.')).toBeVisible();
    await expect(screen.getByText('0 tài khoản · Chọn để chỉnh quyền')).toBeVisible();

    await search.fill('');
    const status = screen.getByRole('combobox', 'Lọc trạng thái');
    await status.selectOption('Đang hoạt động');
    await expect(userButton(screen, ADMIN_EMAIL)).toBeVisible();
    await status.selectOption('Tạm khóa');
    await expect(userButton(screen, ADMIN_EMAIL)).toBeHidden();
    await expect(userButton(screen, MEMBER_EMAIL)).toBeHidden();
    await status.selectOption('Tất cả trạng thái');
    await expect(userButton(screen, MEMBER_EMAIL)).toBeVisible();
  });

  test('selecting a user opens the permission editor (no save)', async ({ screen }) => {
    await gotoAdminUsers(screen);
    await expect(screen.getByRole('heading', 'Chọn tài khoản để phân quyền')).toBeVisible({ timeout: 15_000 });
    await userButton(screen, MEMBER_EMAIL).tap();
    await expect(screen.getByRole('heading', 'Quyền sử dụng')).toBeVisible();
    await expect(screen.getByRole('heading', 'Hạn mức')).toBeVisible();
    await expect(screen.getByRole('combobox', 'Vai trò')).toBeVisible();
    await expect(screen.getByRole('combobox', 'Tạo âm thanh')).toBeVisible();
    await expect(screen.getByRole('spinbutton', 'Ký tự / tháng')).toBeVisible();
    await expect(screen.getByRole('button', 'Lưu quyền & hạn mức')).toBeVisible();
    // Admin-area permissions are fixed per role, never overridable per user.
    await expect(screen.getByRole('combobox', 'Quản lý vai trò')).toBeDisabled();
    await screen.getByRole('button', 'Hủy thay đổi').tap();
    await expect(screen.getByRole('heading', 'Chọn tài khoản để phân quyền')).toBeVisible();
  });

  test('save flow sends PATCH with the edited override (mocked)', async ({ screen, browser }) => {
    const patches: string[] = [];
    await browser.route('**/api/admin/users/*', async (route) => {
      if (route.request.method !== 'PATCH') return route.fallback();
      patches.push(route.request.postData ?? '');
      await route.fulfill({ json: { ok: true } });
    });
    try {
      await gotoAdminUsers(screen);
      await userButton(screen, MEMBER_EMAIL).tap();
      await screen.getByRole('combobox', 'Tạo hàng loạt').selectOption('Từ chối');
      await screen.getByRole('button', 'Lưu quyền & hạn mức').tap();
      await expect(screen.getByRole('status').filter({ hasText: 'Đã lưu' })).toHaveText('Đã lưu. Quyền và hạn mức có hiệu lực với yêu cầu tiếp theo.');
      expect(patches).toHaveLength(1);
      const sent = JSON.parse(patches[0]);
      expect(sent.email).toBe(MEMBER_EMAIL);
      expect(sent.overrides['batch.use']).toBe(false);
    } finally {
      await browser.unroute('**/api/admin/users/*');
    }
  });

  test('roles tab lists roles and renders the permission matrix', async ({ screen }) => {
    await gotoAdminUsers(screen);
    await screen.getByRole('button', 'Vai trò & ma trận quyền').tap();
    await expect(screen.getByRole('heading', 'Vai trò')).toBeVisible();
    await screen.getByRole('button', '+ Tạo vai trò').tap();
    await expect(screen.getByRole('heading', 'Ma trận quyền')).toBeVisible();
    const table = screen.getByRole('table');
    for (const col of ['Trang / chức năng', 'Truy cập', 'Tạo', 'Sửa', 'Xóa', 'Quyền thêm']) {
      await expect(table.getByRole('columnheader', col)).toBeVisible();
    }
    await expect(table.getByRole('checkbox', 'Chuyển văn bản: Truy cập')).toBeVisible();
    await expect(table.getByRole('checkbox', 'Dự án: Tạo')).not.toBeChecked();
    // Toggling an action auto-enables page access (local draft only, never saved).
    await table.getByRole('checkbox', 'Dự án: Tạo').check();
    await expect(table.getByRole('checkbox', 'Dự án: Truy cập')).toBeChecked();
    await screen.getByRole('textbox', 'Tìm trang trong ma trận').fill('khong-co-trang');
    await expect(screen.getByText('Không có trang phù hợp.')).toBeVisible();
    await screen.getByRole('button', '← Danh sách vai trò').tap();
    await expect(screen.getByRole('heading', 'Vai trò')).toBeVisible();
  });

  test('audit tab loads entries or empty state without error', async ({ screen, browser }) => {
    await gotoAdminUsers(screen);
    const audit = browser.waitForResponse(/\/api\/admin\/audit\?limit=100/);
    await screen.getByRole('button', 'Nhật ký thay đổi').tap();
    const res = await audit;
    expect(res.status).toBe(200);
    await expect(screen.getByRole('heading', '100 thay đổi gần nhất')).toBeVisible();
    const body = (await res.json()) as unknown[] | null;
    if (body && body.length) {
      await expect(screen.getByText(/^Người thực hiện:/)).toHaveCount(body.length);
    } else {
      await expect(screen.getByText('Chưa có nhật ký.')).toBeVisible();
    }
    await expect(screen.getByRole('alert')).toBeHidden();
  });

  test('logs tab against the real backend renders entries and counts', async ({ screen, browser }) => {
    await gotoAdminUsers(screen);
    const logs = browser.waitForResponse(/\/api\/admin\/logs\?/);
    await screen.getByRole('button', 'Lỗi & cảnh báo').tap();
    const res = await logs;
    expect(res.status).toBe(200);
    const body = (await res.json()) as { entries: { level: string }[] };
    expect(body.entries.length).toBeGreaterThan(0);
    await expect(screen.getByRole('heading', 'Lỗi & cảnh báo từ backend')).toBeVisible();
    await expect(screen.getByTestId('log-entry')).toHaveCount(body.entries.length);
    const errors = body.entries.filter((e) => e.level === 'error' || e.level === 'fatal').length;
    await expect(screen.getByText(new RegExp(`^${errors} lỗi · ${body.entries.length - errors} cảnh báo · cập nhật`))).toBeVisible();
    const first = screen.getByTestId('log-entry').first();
    await expect(first.getByText(/^(Lỗi|Cảnh báo|Nghiêm trọng)$/)).toBeVisible();
    await expect(first.getByText(/^(TTS API \(Python\)|Auth API \(Go\)|Worker \(Go\))$/)).toBeVisible();
    await expect(first.getByText(/^\d{1,2}:\d{2}:\d{2} \d{1,2}\/\d{1,2}\/\d{4}$/)).toBeVisible();
    await expect(screen.getByRole('alert')).toBeHidden();
  });

  test('mocked logs: level/service filters, request-id, details, search', async ({ screen, browser }) => {
    const urls: string[] = [];
    await browser.route('**/api/admin/logs*', async (route) => {
      urls.push(route.request.url);
      const q = new URL(route.request.url).searchParams;
      const entries = LOGS.filter((e) => (!q.get('level') || e.level === q.get('level')) && (!q.get('service') || e.service === q.get('service')));
      await route.fulfill({ json: { entries } });
    });
    try {
      await gotoAdminUsers(screen);
      await screen.getByRole('button', 'Lỗi & cảnh báo').tap();
      const entries = screen.getByTestId('log-entry');
      await expect(entries).toHaveCount(4);
      await expect(screen.getByText(/^2 lỗi · 2 cảnh báo · cập nhật/)).toBeVisible();
      const db = entries.filter({ hasText: 'db timeout' });
      await expect(db.getByText('Lỗi', { exact: true })).toBeVisible();
      await expect(db.getByText('Auth API (Go)')).toBeVisible();
      await expect(db.getByText('GET /api/admin/users → 500 · pq: timeout')).toBeVisible();

      // Level filter goes to the server as level=error.
      await screen.getByRole('combobox', 'Lọc mức độ').selectOption('Chỉ lỗi');
      await expect(entries).toHaveCount(2);
      expect(new URL(urls[urls.length - 1]).searchParams.get('level')).toBe('error');
      await expect(screen.getByTestId('log-entry').getByText('Cảnh báo', { exact: true })).toHaveCount(0);
      await expect(screen.getByText(/^2 lỗi · 0 cảnh báo/)).toBeVisible();

      await screen.getByRole('combobox', 'Lọc mức độ').selectOption('Mọi mức độ');
      await screen.getByRole('combobox', 'Lọc dịch vụ').selectOption('Worker (Go)');
      await expect(entries).toHaveCount(1);
      expect(new URL(urls[urls.length - 1]).searchParams.get('service')).toBe('worker');
      expect(new URL(urls[urls.length - 1]).searchParams.has('level')).toBe(false);
      await screen.getByRole('combobox', 'Lọc dịch vụ').selectOption('Mọi dịch vụ');
      await expect(entries).toHaveCount(4);

      // Request-id button fills the search box and narrows to that request.
      await db.getByRole('button', 'request req-aaa111').tap();
      await expect(screen.getByRole('textbox', 'Tìm trong nhật ký')).toHaveValue('req-aaa111');
      await expect(entries).toHaveCount(2);
      await expect(entries.filter({ hasText: 'retrying job' })).toHaveCount(1);

      // Chi tiết expands extra fields and the stack.
      const dbEntry = screen.getByTestId('log-entry').filter({ hasText: 'db timeout' });
      await expect(dbEntry.getByText(/internal\/admin\/users\.go:42/)).toBeHidden();
      await dbEntry.getByText('Chi tiết').tap();
      await expect(dbEntry.getByText(/internal\/admin\/users\.go:42/)).toBeVisible();
      await expect(dbEntry.getByText(/"status": 500/)).toBeVisible();

      await screen.getByRole('textbox', 'Tìm trong nhật ký').fill('slow synth');
      await expect(entries).toHaveCount(1);
      await screen.getByRole('textbox', 'Tìm trong nhật ký').fill('zzz-nothing');
      await expect(entries).toHaveCount(0);
      await expect(screen.getByText('Không có lỗi hay cảnh báo nào khớp bộ lọc.')).toBeVisible();

      const before = urls.length;
      await screen.getByRole('button', 'Tải lại').tap();
      await expect.poll(() => urls.length).toBeGreaterThan(before);
    } finally {
      await browser.unroute('**/api/admin/logs*');
    }
  });

  test('mocked logs: empty list and server error', async ({ screen, browser }) => {
    let mode: 'empty' | 'fail' = 'empty';
    await browser.route('**/api/admin/logs*', (route) =>
      mode === 'empty' ? route.fulfill({ json: { entries: [] } }) : route.fulfill({ status: 500, json: { error: 'redis down' } }));
    try {
      await gotoAdminUsers(screen);
      await screen.getByRole('button', 'Lỗi & cảnh báo').tap();
      await expect(screen.getByText('Không có lỗi hay cảnh báo nào.')).toBeVisible();
      await expect(screen.getByText(/^0 lỗi · 0 cảnh báo/)).toBeVisible();
      mode = 'fail';
      await screen.getByRole('button', 'Tải lại').tap();
      await expect(screen.getByRole('alert')).toBeVisible();
      await expect(screen.getByText('Không có lỗi hay cảnh báo nào.')).toBeHidden();
    } finally {
      await browser.unroute('**/api/admin/logs*');
    }
  });
});

test('member session cannot reach the admin screen', { session: 'member-admin', tags: ['fe-admin'] }, async ({ app, screen }) => {
  await app.open('/');
  const nav = screen.getByRole('navigation', 'Điều hướng chính');
  await expect(nav.getByRole('button', 'Thư viện giọng')).toBeVisible({ timeout: 30_000 });
  await expect(nav.getByRole('button', 'Quản trị')).toBeHidden();
  await expect(screen.getByRole('heading', 'Nhân viên & phân quyền')).toBeHidden();
});
