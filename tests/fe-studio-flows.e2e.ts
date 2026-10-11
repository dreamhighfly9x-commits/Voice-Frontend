import { describe, test } from '@e2e-dev/web';
import { expect } from 'e2e';

// Studio, Batch, voice library and audio library flows.
// One serial group: the app's refresh token is single-use with reuse detection, so every
// test restoring the same saved session would revoke it; a shared app state avoids that.
const nav = (screen: any, label: string) => screen.getByRole('complementary').getByRole('button', label).tap();

async function openBatch(app: any, screen: any) {
  await app.open('/');
  await nav(screen, 'Tạo hàng loạt');
  await expect(screen.getByRole('heading', '1. Nhập văn bản')).toBeVisible({ timeout: 30_000 });
}

describe('fe-studio', { serial: true, session: 'admin-studio' }, () => {
  test('text without line breaks splits into one segment per sentence', async ({ app, screen }) => {
    await openBatch(app, screen);
    const source = screen.getByRole('textbox', 'Văn bản nguồn');
    await source.fill('Câu một. Câu hai! Câu ba?');
    await screen.getByRole('button', 'Chuẩn hóa & tách đoạn').tap();

    await expect(screen.getByRole('heading', '2. Chọn giọng cho 3 đoạn')).toBeVisible();
    await expect(screen.getByTestId('batch-item')).toHaveCount(3);
    await expect(screen.getByRole('textbox', 'Nội dung đoạn 1')).toHaveValue('Câu một.');
    await expect(screen.getByRole('textbox', 'Nội dung đoạn 2')).toHaveValue('Câu hai!');
    await expect(screen.getByRole('textbox', 'Nội dung đoạn 3')).toHaveValue('Câu ba?');
    await expect(source).toHaveValue('Câu một.\nCâu hai!\nCâu ba?');
  });

  test('text with line breaks splits per line and keeps periods inside a line', async ({ app, screen }) => {
    await openBatch(app, screen);
    const source = screen.getByRole('textbox', 'Văn bản nguồn');
    await source.fill('Dòng một. Vẫn dòng một.\nDòng hai.');
    await screen.getByRole('button', 'Chuẩn hóa & tách đoạn').tap();

    await expect(screen.getByRole('heading', '2. Chọn giọng cho 2 đoạn')).toBeVisible();
    await expect(screen.getByTestId('batch-item')).toHaveCount(2);
    await expect(screen.getByRole('textbox', 'Nội dung đoạn 1')).toHaveValue('Dòng một. Vẫn dòng một.');
    await expect(screen.getByRole('textbox', 'Nội dung đoạn 2')).toHaveValue('Dòng hai.');
    await expect(source).toHaveValue('Dòng một. Vẫn dòng một.\nDòng hai.');
  });

  test('empty or blank input keeps normalize disabled', async ({ app, screen }) => {
    await openBatch(app, screen);
    const normalize = screen.getByRole('button', 'Chuẩn hóa & tách đoạn');
    await expect(normalize).toBeDisabled();
    await screen.getByRole('textbox', 'Văn bản nguồn').fill('   \n  ');
    await expect(normalize).toBeDisabled();
    await expect(screen.getByTestId('batch-item')).toHaveCount(0);
    await screen.getByRole('textbox', 'Văn bản nguồn').fill('Có chữ.');
    await expect(normalize).toBeEnabled();
  });

  test('add and delete segment buttons change the segment count', async ({ app, screen }) => {
    await openBatch(app, screen);
    await screen.getByRole('textbox', 'Văn bản nguồn').fill('Một. Hai.');
    await screen.getByRole('button', 'Chuẩn hóa & tách đoạn').tap();
    await expect(screen.getByTestId('batch-item')).toHaveCount(2);

    await screen.getByRole('button', '＋ Thêm đoạn').tap();
    await expect(screen.getByTestId('batch-item')).toHaveCount(3);
    await expect(screen.getByRole('heading', '2. Chọn giọng cho 3 đoạn')).toBeVisible();
    await expect(screen.getByRole('textbox', 'Nội dung đoạn 3')).toHaveValue('');

    await screen.getByRole('button', 'Xóa đoạn 1').tap();
    await expect(screen.getByTestId('batch-item')).toHaveCount(2);
    await expect(screen.getByRole('textbox', 'Nội dung đoạn 1')).toHaveValue('Hai.');
    await expect(screen.getByRole('textbox', 'Nội dung đoạn 2')).toHaveValue('');

    await screen.getByRole('button', 'Xóa đoạn 1').tap();
    await expect(screen.getByTestId('batch-item')).toHaveCount(1);
    // Only an empty segment is left: nothing to synthesize.
    await expect(screen.getByRole('button', 'Bắt đầu tạo hàng loạt')).toBeDisabled();
  });

  test('studio loads a populated voice picker and counts typed characters', async ({ app, screen }) => {
    await app.open('/');
    await nav(screen, 'Chuyển văn bản');
    const picker = screen.getByRole('combobox', /^Chọn giọng nói/);
    await expect(picker).toBeEnabled({ timeout: 30_000 });
    await expect.poll(() => picker.getByRole('option').count(), { timeout: 15_000 }).toBeGreaterThan(0);

    const editor = screen.getByRole('textbox', 'Nội dung chuyển thành giọng nói');
    await editor.fill('');
    await expect(screen.getByText(/^0 \/ [\d.]+ ký tự$/)).toBeVisible();
    await editor.fill('Xin chào');
    await expect(screen.getByText(/^8 \/ [\d.]+ ký tự$/)).toBeVisible();
    await expect(screen.getByRole('button', 'Tạo âm thanh')).toBeEnabled({ timeout: 30_000 });
    await editor.fill('');
    await expect(screen.getByRole('button', 'Tạo âm thanh')).toBeDisabled();
  });

  test('voice library lists voices and search narrows / clears the list', async ({ app, screen }) => {
    await app.open('/');
    await nav(screen, 'Thư viện giọng');
    const cards = screen.getByTestId('voice-card');
    await expect.poll(() => cards.count(), { timeout: 30_000 }).toBeGreaterThan(0);
    const total = await cards.count();
    const firstName = (await cards.first().getByRole('heading').textContent())!.trim();

    const search = screen.getByRole('textbox', 'Tìm giọng');
    await search.fill(firstName);
    await expect.poll(() => cards.count()).toBeGreaterThan(0);
    expect(await cards.count()).toBeLessThanOrEqual(total);
    await expect(cards.first().getByRole('heading')).toContainText(firstName);

    await search.fill('zzz-khong-co-giong-nay');
    await expect(cards).toHaveCount(0);
    await expect(screen.getByText('Không tìm thấy giọng phù hợp. Hãy thử đổi từ khóa hoặc đặt lại bộ lọc.')).toBeVisible();
    await expect(screen.getByText('0 giọng nói · Tiếng Việt')).toBeVisible();

    await screen.getByRole('button', 'Đặt lại bộ lọc').tap();
    await expect(search).toHaveValue('');
    await expect(cards).toHaveCount(Math.min(total, 24));
  });

  test('a short one-segment batch completes, offers download and lands in the audio library',
    { timeout: 180_000 }, async ({ app, screen }) => {
      const phrase = `Kiểm thử hàng loạt số ${Date.now() % 100000}.`;
      await openBatch(app, screen);
      await screen.getByRole('textbox', 'Văn bản nguồn').fill(phrase);
      await screen.getByRole('button', 'Chuẩn hóa & tách đoạn').tap();
      await expect(screen.getByTestId('batch-item')).toHaveCount(1);
      await expect(screen.getByRole('combobox', 'Giọng cho tất cả')).toBeEnabled({ timeout: 30_000 });

      await screen.getByRole('button', 'Bắt đầu tạo hàng loạt').tap();
      const row = screen.getByTestId('batch-row');
      await expect(row).toHaveCount(1);
      await expect(row).toContainText(phrase);
      await expect(row).toContainText('Hoàn thành', { timeout: 150_000 });
      await expect(row.getByRole('button', 'Tải WAV')).toBeEnabled();
      await expect(screen.getByRole('button', 'Tải 0 file đã chọn (ZIP)')).toBeDisabled();
      await screen.getByRole('checkbox', 'Chọn tất cả file đã tạo').check();
      await expect(screen.getByRole('button', 'Tải 1 file đã chọn (ZIP)')).toBeEnabled();

      await nav(screen, 'Thư viện âm thanh');
      await expect(screen.getByTestId('library-row').filter({ hasText: phrase })).toHaveCount(1, { timeout: 15_000 });
    });

  test('studio generates a short text into a playable history entry shown in the audio library',
    { timeout: 180_000 }, async ({ app, screen }) => {
      const phrase = `Kiểm thử chuyển văn bản số ${Date.now() % 100000}.`;
      await app.open('/');
      await nav(screen, 'Chuyển văn bản');
      await screen.getByRole('textbox', 'Nội dung chuyển thành giọng nói').fill(phrase);
      const generate = screen.getByRole('button', 'Tạo âm thanh');
      await expect(generate).toBeEnabled({ timeout: 30_000 });
      await generate.tap();

      const entry = screen.getByTestId('studio-result-row').filter({ hasText: phrase });
      await expect(entry).toBeVisible({ timeout: 150_000 });
      await expect(screen.getByRole('tab', /^◷ Lịch sử/)).toHaveAttribute('aria-selected', 'true');
      await expect(entry.getByRole('button', 'Tải WAV')).toBeEnabled();
      await expect(screen.getByRole('alert')).toHaveCount(0);

      await nav(screen, 'Thư viện âm thanh');
      await expect(screen.getByTestId('library-row').filter({ hasText: phrase })).toHaveCount(1, { timeout: 15_000 });
    });

  test('audio library lists recordings with a matching count label', async ({ app, screen }) => {
    await app.open('/');
    await nav(screen, 'Thư viện âm thanh');
    const rows = screen.getByTestId('library-row');
    await expect.poll(() => rows.count(), { timeout: 30_000 }).toBeGreaterThan(0);
    const n = await rows.count();
    await expect(screen.getByText(`${n} bản ghi`)).toBeVisible();
    await expect(rows.first().getByRole('button', 'Tải WAV')).toBeEnabled();
  });

  test('audio library "Lô hàng loạt" filter hides non-batch recordings', async ({ app, screen }) => {
    await app.open('/');
    await nav(screen, 'Thư viện âm thanh');
    const studioRows = screen.getByTestId('library-row').filter({ hasText: 'Kiểm thử chuyển văn bản số' });
    await expect.poll(() => studioRows.count(), { timeout: 30_000 }).toBeGreaterThan(0);
    await screen.getByText('Lô hàng loạt', { exact: true }).tap();
    // A recording made from the Studio screen is not part of a batch.
    await expect(studioRows).toHaveCount(0);
  });
});
