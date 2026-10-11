import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../testRender';
import userEvent from '@testing-library/user-event';
import ApiDocsScreen from './ApiDocsScreen';
import { apiFetch, apiJson } from '../lib/authApi';

vi.mock('../lib/authApi', () => ({ apiFetch: vi.fn(), apiJson: vi.fn(), errorMessage: (b) => b?.detail || 'err', currentApiToken: () => 'session-token-abcdefghijklmnop' }));
const json = (status, body) => ({ status, ok: status < 400, json: async () => body });

beforeEach(() => {
  apiJson.mockReset(); apiFetch.mockReset();
  apiJson.mockResolvedValue({ used_chars_month: 1200, storage_bytes: 0, clones: 1 });
});

describe('API docs', () => {
  it('falls back to the session token when the server has no API keys', async () => {
    apiFetch.mockResolvedValue(json(404, null));
    render(<ApiDocsScreen />);
    expect(await screen.findByText(/chưa bật API key dài hạn/)).toBeInTheDocument();
    expect(screen.queryByText('session-token-abcdefghijklmnop')).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Hiện' }));
    expect(screen.getByText('session-token-abcdefghijklmnop')).toBeInTheDocument();
  });

  it('creates a key and shows it once', async () => {
    apiFetch.mockImplementation(async (path, opts) => opts?.method === 'POST'
      ? json(201, { id: 'k1', name: 'Shop', prefix: 'dh_live_ab', key: 'dh_live_abcdef123' })
      : json(200, apiFetch.mock.calls.length > 1 ? [{ id: 'k1', name: 'Shop', prefix: 'dh_live_ab' }] : []));
    const user = userEvent.setup();
    render(<ApiDocsScreen />);
    await user.type(await screen.findByLabelText('Tên API key'), 'Shop');
    await user.click(screen.getByRole('button', { name: '+ Tạo API key' }));
    expect(await screen.findByText('dh_live_abcdef123')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tôi đã lưu key' }));
    expect(screen.queryByText('dh_live_abcdef123')).not.toBeInTheDocument();
    expect(screen.getByText('dh_live_ab…')).toBeInTheDocument();
  });

  it('switches example language and copies code', async () => {
    apiFetch.mockResolvedValue(json(404, null));
    const user = userEvent.setup(); // installs its own clipboard stub, so override after
    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<ApiDocsScreen />);
    await user.click(screen.getByRole('tab', { name: 'Python' }));
    await user.click(screen.getByRole('button', { name: 'Sao chép mã Python' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining('requests.post')));
    expect(await screen.findAllByText('Đã chép')).not.toHaveLength(0);
  });
});
