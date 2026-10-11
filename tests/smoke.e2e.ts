import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('admin lands on the app after login', { session: 'admin-smoke' }, async ({ app, screen }) => {
  await app.open('/');
  await expect(screen.getByRole('heading', 'Tổng quan')).toBeVisible({ timeout: 30_000 });
});
