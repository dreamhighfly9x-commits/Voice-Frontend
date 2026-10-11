// Integration tests for App.jsx: real component tree (Sidebar, Header,
// screens) wired to real hooks/state, with only the network boundary
// (global.fetch) faked — mirrors the real backend contract in
// Voice-Backend/app/main.py.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, waitFor } from './testRender';
import userEvent from '@testing-library/user-event';
import App from './App';

const VOICES = [
  { id: 'han', name: 'Hân', initial: 'H', tags: 'vi-VN', desc: 'Giọng nữ', seed: 2, gender: 'female', style: '' },
  { id: 'minh', name: 'Minh', initial: 'M', tags: 'vi-VN', desc: 'Giọng nam', seed: 5, gender: 'male', style: '' },
];

const RECORDINGS = [
  { id: 'r1', title: 'Bản ghi có sẵn', meta: 'HÂN · VIENEU · WAV', dur: '0:08', seed: 3, url: '/api/media/r1.wav' },
];

function jsonResponse(body, ok = true, status = ok ? 200 : 400) {
  return Promise.resolve(new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}}));
}

function mockFetch(handlers) {
  global.fetch = vi.fn((url, options) => {
    const handler = handlers.find((h) => url.includes(h.url));
    if (!handler) return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    return handler.respond(options);
  });
}

async function renderReady(extraHandlers = []) {
  mockFetch([
    { url: '/api/voices', respond: () => jsonResponse(VOICES) },
    { url: '/api/recordings', respond: () => jsonResponse(RECORDINGS) },
    ...extraHandlers,
  ]);
  render(<App defaultScreen="studio" />);
  await waitFor(() => expect(screen.getByText(/Sẵn sàng/)).toBeInTheDocument());
}

afterEach(() => {
  vi.restoreAllMocks();
});
beforeEach(() => localStorage.clear());

describe('App integration', () => {
  it('splits sentences in the editor and keeps the action undoable', async () => {
    const user=userEvent.setup();
    await renderReady();
    const textarea=screen.getByRole('textbox',{name:'Nội dung chuyển thành giọng nói'});
    await user.clear(textarea);await user.type(textarea,'Xin chào. Hôm nay trời đẹp!');
    await user.click(screen.getByRole('button',{name:/Tách theo câu/}));
    expect(textarea).toHaveValue('Xin chào.\n\nHôm nay trời đẹp!');
    await user.click(screen.getByRole('button',{name:/Hoàn tác/}));
    expect(textarea).toHaveValue('Xin chào. Hôm nay trời đẹp!');
  });
  it('opens history on successful creation and uses the chosen download name', async () => {
    const user=userEvent.setup();
    await renderReady([{url:'/api/synthesize',respond:()=>jsonResponse({id:'named',title:'Original',url:'/api/media/named.wav'})}]);
    await user.type(screen.getByLabelText('Tên file tải về'),'Bản đọc buổi sáng');
    await user.click(screen.getByRole('button',{name:'Tạo âm thanh'}));
    await waitFor(()=>expect(screen.getByRole('tab',{name:/Lịch sử/})).toHaveAttribute('aria-selected','true'));
    expect(screen.getByText('Bản đọc buổi sáng',{selector:'.studio-player strong'})).toBeVisible();
  });
  it('imports only after confirmation, appends and undoes without losing existing text', async () => {
    const user=userEvent.setup();
    await renderReady([{url:'/api/import-text',respond:()=>jsonResponse({text:'Văn bản từ tài liệu.'})}]);
    const textarea=screen.getByRole('textbox',{name:'Nội dung chuyển thành giọng nói'});
    await user.clear(textarea);await user.type(textarea,'Nội dung cũ.');
    await user.click(screen.getByRole('button',{name:/Nhập file & công cụ/}));
    await user.upload(screen.getByLabelText('Chọn tài liệu'),new File(['Văn bản từ tài liệu.'],'demo.txt',{type:'text/plain'}));
    await screen.findByRole('button',{name:'Thêm vào cuối'});
    expect(textarea).toHaveValue('Nội dung cũ.');
    await user.click(screen.getByRole('button',{name:'Thêm vào cuối'}));
    expect(textarea).toHaveValue('Nội dung cũ.\n\nVăn bản từ tài liệu.');
    await user.click(screen.getByRole('button',{name:/Hoàn tác/}));
    expect(textarea).toHaveValue('Nội dung cũ.');
  });

  it('dictionary affects synthesis but preserves source; split stays in Studio', async () => {
    const user=userEvent.setup();
    await renderReady([{url:'/api/synthesize',respond:()=>jsonResponse({id:'new',title:'AI',url:'/api/media/new.wav'})}]);
    const textarea=screen.getByRole('textbox',{name:'Nội dung chuyển thành giọng nói'});
    await user.clear(textarea);await user.type(textarea,'AI rất hay.');
    await user.click(screen.getByRole('button',{name:/Nhập file & công cụ/}));
    await user.click(screen.getByRole('button',{name:'Từ điển phát âm'}));
    await user.type(screen.getByLabelText('Từ gốc mới'),'AI');await user.type(screen.getByLabelText('Cách đọc mới'),'ây ai');
    await user.click(screen.getByRole('button',{name:'Thêm từ'}));await user.click(screen.getByRole('button',{name:'Lưu từ điển'}));
    await user.click(screen.getByRole('button',{name:/Chia đoạn tự động/}));
    expect(textarea).toHaveValue('AI rất hay.');
    await user.click(screen.getByRole('button',{name:'Tạo âm thanh'}));
    await screen.findByText('Đã tạo và lưu bản ghi WAV.');
    const [,options]=global.fetch.mock.calls.find(([url])=>url.includes('/api/synthesize'));
    expect(JSON.parse(options.body).text).toBe('ây ai rất hay.');
    expect(textarea).toHaveValue('AI rất hay.');
  });

  it('preview remains available for long text and sends only a short excerpt', async () => {
    const user=userEvent.setup();
    await renderReady([{url:'/api/synthesize',respond:()=>jsonResponse({id:'preview',title:'Preview',url:'/api/media/preview.wav'})}]);
    const textarea=screen.getByRole('textbox',{name:'Nội dung chuyển thành giọng nói'});
    await user.clear(textarea);await user.click(textarea);await user.paste('Xin chào. '.repeat(600));
    expect(screen.getByRole('button',{name:'Tạo âm thanh'})).toBeDisabled();
    await user.click(screen.getByRole('button',{name:'Nghe thử 1 đoạn'}));
    await waitFor(()=>expect(global.fetch.mock.calls.some(([url])=>url.includes('/api/synthesize'))).toBe(true));
    const [,options]=global.fetch.mock.calls.find(([url])=>url.includes('/api/synthesize'));
    expect(JSON.parse(options.body).text.length).toBeLessThanOrEqual(300);
  });
  it('App_engineReachable_loadsVoicesAndRecordingsOnMount', async () => {
    await renderReady();
    expect(screen.getByRole('button', { name: 'Tạo âm thanh' })).toBeEnabled();
    await userEvent.click(screen.getByRole('tab',{name:/Lịch sử/}));
    expect(screen.getByText('Bản ghi có sẵn', { selector: '.studio-history-item strong' })).toBeVisible();
  });

  it('App_engineUnreachable_showsRetryStatusAndDisablesGenerate', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('network down')));
    render(<App defaultScreen="studio" />);

    await waitFor(() => expect(screen.getByText(/Đang thử lại/)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Tạo âm thanh' })).toBeDisabled();
  });

  it('App_generateClicked_postsSynthesizeAndPrependsResultToLibrary', async () => {
    const user = userEvent.setup();
    const newRecording = {
      id: 'r2', title: 'Xin chào thế giới', meta: 'HÂN · VIENEU · WAV', dur: '0:03', seed: 1, url: '/api/media/r2.wav',
    };
    await renderReady([{ url: '/api/synthesize', respond: () => jsonResponse(newRecording) }]);

    const textarea = screen.getByPlaceholderText(/Dán hoặc nhập nội dung/);
    await user.clear(textarea);
    await user.type(textarea, 'Xin chào thế giới');
    await user.click(screen.getByRole('button', { name: 'Tạo âm thanh' }));

    await waitFor(() => expect(screen.getByText('Đã tạo và lưu bản ghi WAV.')).toBeInTheDocument());

    const [, options] = global.fetch.mock.calls.find(([url]) => url.includes('/api/synthesize'));
    expect(JSON.parse(options.body)).toEqual({ text: 'Xin chào thế giới', voice: 'han' });

    await user.click(screen.getByText('Thư viện âm thanh'));
    // { selector: 'span' } disambiguates from GlobalSearch's always-mounted
    // <dialog> results list, which jsdom keeps in the DOM even when closed.
    expect(await screen.findByText('Xin chào thế giới', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Bản ghi có sẵn', { selector: 'span' })).toBeInTheDocument();
  });

  it('App_generateFailsWithDetail_showsErrorToastAndDoesNotAddRecording', async () => {
    const user = userEvent.setup();
    await renderReady([
      { url: '/api/synthesize', respond: () => jsonResponse({ detail: 'Nội dung không được để trống.' }, false, 400) },
    ]);

    const textarea = screen.getByPlaceholderText(/Dán hoặc nhập nội dung/);
    await user.type(textarea, ' thêm chữ');
    await user.click(screen.getByRole('button', { name: 'Tạo âm thanh' }));

    await waitFor(() => expect(screen.getByText('Nội dung không được để trống.')).toBeInTheDocument());

    await user.click(screen.getByText('Thư viện âm thanh'));
    expect(screen.getAllByText('Bản ghi có sẵn', { selector: 'span' })).toHaveLength(1);
  });

  it('App_textClearedToBlank_disablesGenerateAndNeverCallsSynthesize', async () => {
    const user = userEvent.setup();
    await renderReady();

    const textarea = screen.getByPlaceholderText(/Dán hoặc nhập nội dung/);
    await user.clear(textarea);

    expect(screen.getByRole('button', { name: 'Tạo âm thanh' })).toBeDisabled();
    expect(global.fetch.mock.calls.every(([url]) => !url.includes('/api/synthesize'))).toBe(true);
  });

  it('App_navigatesToVoicesThenHome_rendersSelectedScreen', async () => {
    const user = userEvent.setup();
    await renderReady();

    await user.click(screen.getByText('Thư viện giọng'));
    expect(screen.getByRole('heading', { name: 'Minh', level: 3 })).toBeInTheDocument();

    await user.click(screen.getByText('Tổng quan'));
    expect(screen.queryByPlaceholderText(/Dán hoặc nhập nội dung/)).not.toBeInTheDocument();
  });
});
