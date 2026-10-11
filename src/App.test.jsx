import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from './testRender';
import userEvent from '@testing-library/user-event';
import App from './App';

vi.mock('page-mascot', () => ({ Mascot: () => null }));

const voicesRes = [
  { id: 'han', initial: 'H', name: 'Hân', tags: 'vi-VN · clone', desc: 'Giọng của bạn', seed: 1 },
  { id: 'minh', initial: 'M', name: 'Minh', tags: 'vi-VN · nam trầm', desc: 'Trầm, chậm', seed: 4 },
];
const recordingsRes = [
  { id: 'r1', title: 'Reel — bản ghi cũ', meta: 'HÂN · CLONE', dur: '1:12', seed: 2, url: '/api/media/r1.wav' },
];

class FakeAudio {
  constructor(url) { this.url = url; this.onended = null; this.onerror = null; }
  play() { return Promise.resolve(); }
  pause() {}
}

function mockFetchSequence({ synthesizeResponse } = {}) {
  return vi.fn((url) => {
    if (url.includes('/api/media/')) return Promise.resolve({ok:true,blob:async()=>new Blob(['audio'])});
    if (url.includes('/api/voices')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(voicesRes) });
    }
    if (url.includes('/api/recordings')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(recordingsRes) });
    }
    if (url.includes('/api/synthesize')) {
      return Promise.resolve({...synthesizeResponse, clone: () => ({json:synthesizeResponse.json})});
    }
    return Promise.reject(new Error('unexpected url: ' + url));
  });
}

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:test-audio');
  URL.revokeObjectURL = vi.fn();
  localStorage.clear();
  vi.stubGlobal('Audio', FakeAudio);
});

describe('App engine connection', () => {
  it('engineConnect_apiSuccess_populatesVoicesAndShowsReady', async () => {
    vi.stubGlobal('fetch', mockFetchSequence());
    render(<App defaultScreen="studio" />);
    expect(await screen.findByText(/Sẵn sàng/)).toBeInTheDocument();
    expect(within(screen.getByRole('combobox',{name:'Chọn giọng nói'})).getByRole('option',{name:'Hân'})).toBeInTheDocument();
  });

  it('engineConnect_apiFailure_showsOfflineStatus', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network down'))));
    render(<App defaultScreen="studio" />);
    expect(await screen.findByText(/Chưa kết nối được/)).toBeInTheDocument();
  });
});

describe('App generate flow (Studio)', () => {
  it('generate_success_prependsResultAndShowsToast', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', mockFetchSequence({
      synthesizeResponse: { ok: true, json: () => Promise.resolve({ id: 'r9', title: 'Bản ghi mới', meta: 'HÂN · CLONE', dur: '0:05', seed: 9, url: '/api/media/r9.wav' }) },
    }));
    render(<App defaultScreen="studio" />);
    await screen.findByText(/Sẵn sàng/);
    await user.click(screen.getByRole('button', { name: 'Tạo âm thanh' }));
    expect(await screen.findByText('Bản ghi mới', { selector: '.studio-player strong' })).toBeInTheDocument();
    expect(await screen.findByText('Đã tạo và lưu bản ghi WAV.')).toBeInTheDocument();
  });

  it('generate_serverError_showsServerErrorMessage', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', mockFetchSequence({
      synthesizeResponse: { ok: false, json: () => Promise.resolve({ detail: 'Model quá tải, thử lại sau.' }) },
    }));
    render(<App defaultScreen="studio" />);
    await screen.findByText(/Sẵn sàng/);
    await user.click(screen.getByRole('button', { name: 'Tạo âm thanh' }));
    expect(await screen.findByText('Model quá tải, thử lại sau.')).toBeInTheDocument();
  });
});

describe('App playback flow (via global search)', () => {
  it('play_existingRecording_togglesNgheAndDungViaGlobalSearch', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', mockFetchSequence());
    render(<App defaultScreen="studio" />);
    await screen.findByText(/Sẵn sàng/);

    await user.click(screen.getByRole('button', { name: 'Tìm dự án, giọng, bản ghi' }));
    await user.type(screen.getByLabelText('Nội dung tìm kiếm'), 'Reel');
    const playButton = await screen.findByRole('button', { name: 'Nghe' });
    await user.click(playButton);
    expect(await screen.findByRole('button', { name: 'Dừng' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dừng' }));
    expect(await screen.findByRole('button', { name: 'Nghe' })).toBeInTheDocument();
  });
});

describe('App voice favorites (Voices screen)', () => {
  it('favoriteToggle_inVoicesScreen_persistsToLocalStorage', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', mockFetchSequence());
    render(<App defaultScreen="studio" />);
    await screen.findByText(/Sẵn sàng/);

    await user.click(screen.getByText('Thư viện giọng'));
    const star = await screen.findByRole('button', { name: 'Yêu thích Hân' });
    await user.click(star);

    expect(JSON.parse(localStorage.getItem('voice-favorites'))).toEqual({ han: true });
  });
});

describe('App navigation', () => {
  it('navigation_sidebarClick_switchesToVoicesScreen', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', mockFetchSequence());
    render(<App defaultScreen="studio" />);
    await screen.findByText(/Sẵn sàng/);

    await user.click(screen.getByText('Thư viện âm thanh'));
    expect(await screen.findByText('1 bản ghi')).toBeInTheDocument();
  });
});
