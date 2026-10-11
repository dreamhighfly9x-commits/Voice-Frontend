import { it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoicesScreen from './VoicesScreen';
import { apiJson } from '../lib/authApi';

vi.mock('../lib/authApi', () => ({ apiJson: vi.fn() }));

// Minimal stand-in for GET /api/voices/search: filter by source/text/language, then page.
function serverOver(catalog) {
  return async (url) => {
    const p = new URL(url, 'http://x').searchParams;
    let rows = catalog.filter((v) => v.tab === p.get('source'));
    const q = (p.get('q') || '').toLowerCase();
    if (q) rows = rows.filter((v) => v.name.toLowerCase().includes(q));
    const languages = [...new Set(rows.map((v) => v.language))];
    if (p.get('language')) rows = rows.filter((v) => v.language === p.get('language'));
    const offset = Number(p.get('offset')), limit = Number(p.get('limit'));
    return { total: rows.length, items: rows.slice(offset, offset + limit).map((v) => ({ ...v, variant_ids: v.variant_ids || [v.id] })), categories: [], uncategorized: rows.length, languages };
  };
}

beforeEach(() => apiJson.mockReset());

it('pages and searches the cloud library on the server with a language filter', async () => {
  const user = userEvent.setup();
  const catalog = Array.from({ length: 50 }, (_, i) => ({
    id: `ext_${i}`, name: `Community ${i}`, initial: 'C', tab: 'Cộng đồng', metadata: { community: true },
    language: i === 49 ? 'en' : 'vi', tags: 'GenMax', seed: i,
  }));
  apiJson.mockImplementation(serverOver(catalog));
  render(<VoicesScreen voices={[catalog[0]]} favs={{}} voiceFilter="Tất cả" onFilter={vi.fn()} />);
  await waitFor(() => expect(screen.getAllByTestId('voice-card')).toHaveLength(24));
  expect(screen.getByText('50 giọng nói', { exact: false })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Trang sau' }));
  expect(await screen.findByText('Community 24')).toBeInTheDocument();
  await user.selectOptions(screen.getByRole('combobox', { name: 'Ngôn ngữ giọng' }), 'en');
  await waitFor(() => expect(screen.getAllByTestId('voice-card')).toHaveLength(1));
  expect(screen.getByText('Community 49')).toBeInTheDocument();
  await user.type(screen.getByRole('textbox', { name: 'Tìm giọng' }), 'Community 48');
  await waitFor(() => expect(screen.queryAllByTestId('voice-card')).toHaveLength(0));
  expect(apiJson.mock.calls.at(-1)[0]).toContain('q=Community+48');
});

it('separates GenMax sources on the server and keeps favorites across model variants', async () => {
  const user = userEvent.setup();
  const row = (id, tab, metadata) => ({ id: 'ext_' + id, name: id, provider_type: 'genmax', remote_id: id, tab, metadata });
  const catalog = [row('e', 'ElevenLabs', { engine: 'elevenlabs' }), row('c', 'CapCut', { engine: 'capcut' }),
    row('clone', 'Giọng nhân bản', { engine: 'minimax', is_clone: true }), row('shared', 'Cộng đồng', { engine: 'minimax', community: true })];
  apiJson.mockImplementation(serverOver(catalog));
  // ext_m is a favorite loaded into the app's list (core or looked up); Yêu thích filters locally.
  const loaded = [{ id: 'ext_m', name: 'm', provider_type: 'genmax', remote_id: 'm', metadata: { engine: 'minimax' } }];
  render(<VoicesScreen voices={loaded} favs={{ ext_m: true }} />);
  expect(await screen.findByText('shared')).toBeInTheDocument();
  expect(screen.getAllByTestId('voice-card')).toHaveLength(1);
  await user.click(screen.getByRole('button', { name: 'ElevenLabs', exact: true })); expect(await screen.findByText('e')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'CapCut', exact: true })); expect(await screen.findByText('c')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Giọng nhân bản', exact: true })); expect(await screen.findByText('clone')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Yêu thích', exact: true })); expect(await screen.findByText('m')).toBeInTheDocument();
});

it('falls back to filtering the loaded list when the backend has no search endpoint', async () => {
  // An older backend answers /api/voices/search with the plain voice array.
  apiJson.mockResolvedValue([]);
  const voices = [{ id: 'ext_x', name: 'Old backend voice', provider_type: 'genmax', remote_id: 'x', metadata: { community: true } }];
  render(<VoicesScreen voices={voices} favs={{}} />);
  expect(await screen.findByText('Old backend voice')).toBeInTheDocument();
});
