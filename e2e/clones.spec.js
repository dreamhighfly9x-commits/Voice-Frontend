import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { test, expect, navigate } from './fixtures.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function firstSampleWav() {
  const dir = path.resolve(__dirname, '../../Voice-Backend/storage/audio');
  const file = fs.readdirSync(dir).find((f) => f.endsWith('.wav'));
  return path.join(dir, file);
}

test.describe('Voice cloning', () => {
  test('upload, rename, then delete a clone', async ({ authedPage: page }) => {
    const sample = firstSampleWav();
    const cloneName = 'E2E Clone ' + Date.now();

    await navigate(page, 'Giọng của tôi');
    await expect(page.getByRole('heading', { name: 'Tải file để clone giọng' })).toBeVisible();

    await page.locator('input[type=file]').setInputFiles(sample);
    const nameInput = page.getByPlaceholder('Ví dụ: Giọng của tôi');
    await nameInput.fill(cloneName);
    await page.getByRole('checkbox').check();

    const submit = page.getByRole('button', { name: 'Tải lên và tạo giọng clone' });
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect(page.getByText('Đã lưu giọng. Bấm Nghe thử hoặc Dùng giọng để tạo âm thanh.')).toBeVisible({ timeout: 30000 });
    const row = page.getByTestId('clone-row').filter({ hasText: cloneName });
    await expect(row).toBeVisible();

    // Rename
    await row.getByRole('button', { name: 'Sửa tên' }).click();
    const renameInput = page.getByLabel('Tên giọng mới');
    const renamed = cloneName + ' (đã đổi tên)';
    await renameInput.fill(renamed);
    await page.getByRole('button', { name: 'Lưu tên' }).click();
    await expect(page.getByText('Đã lưu tên mới.')).toBeVisible({ timeout: 15000 });
    const renamedRow = page.getByTestId('clone-row').filter({ hasText: renamed });
    await expect(renamedRow).toBeVisible();

    // Delete
    await renamedRow.getByRole('button', { name: 'Xóa' }).click();
    // dispatchEvent bypasses hit-testing — the fixed-position mascot widget
    // (App.jsx) visually overlaps this corner of a tall scrolled page, so a
    // coordinate-based click (even with force:true) can land on it instead
    // of the button underneath. See final report for the real-app finding.
    await page.getByRole('button', { name: 'Xác nhận xóa' }).dispatchEvent('click');
    await expect(page.getByText('Đã xóa giọng. Các bản ghi đã tạo vẫn được giữ lại.')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('clone-row').filter({ hasText: renamed })).toHaveCount(0);
  });
});
