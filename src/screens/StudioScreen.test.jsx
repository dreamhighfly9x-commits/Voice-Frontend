import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../testRender';
import userEvent from '@testing-library/user-event';
import StudioScreen from './StudioScreen';

const quickVoices = [
  { id: 'han', initial: 'H', name: 'Hân', tags: 'vi-VN · clone' },
  { id: 'minh', initial: 'M', name: 'Minh', tags: 'vi-VN · nam trầm' },
];

function baseProps(overrides = {}) {
  return {
    modelName: 'VieNeu v3 Turbo',
    maxChars: 5000,
    animStyle: {},
    text: 'Xin chào',
    onText: vi.fn(),
    onNormalize: vi.fn(),
    onAutoSplit: vi.fn(),
    charLabel: '8 / 5.000 ký tự',
    estDuration: '1 giây',
    segmentCountLabel: '1 đoạn văn bản',
    onPreview: vi.fn(),
    onGenerate: vi.fn(),
    generating: false,
    engineReady: true,
    results: [],
    playingId: null,
    onPlay: vi.fn(),
    quickVoices,
    voice: 'han',
    onPickVoice: vi.fn(),
    onGoVoices: vi.fn(),
    queueLabel: 'VieNeu v3 Turbo · Sẵn sàng',
    ...overrides,
  };
}

describe('StudioScreen', () => {
  it('studioScreen_emptyResults_showsEmptyStateMessage', () => {
    render(<StudioScreen {...baseProps({ results: [] })} />);
    expect(screen.getByText(/Chưa có bản ghi. Nhập văn bản/)).toBeInTheDocument();
  });

  it('studioScreen_engineNotReady_generateButtonDisabled', () => {
    render(<StudioScreen {...baseProps({ engineReady: false })} />);
    expect(screen.getByRole('button', { name: 'Tạo âm thanh' })).toBeDisabled();
  });

  it('studioScreen_emptyText_generateButtonDisabled', () => {
    render(<StudioScreen {...baseProps({ text: '   ' })} />);
    expect(screen.getByRole('button', { name: 'Tạo âm thanh' })).toBeDisabled();
  });

  it('studioScreen_textOverMaxChars_generateButtonDisabled', () => {
    render(<StudioScreen {...baseProps({ text: 'a'.repeat(10), maxChars: 5 })} />);
    expect(screen.getByRole('button', { name: 'Tạo âm thanh' })).toBeDisabled();
  });

  it('studioScreen_readyWithText_generateButtonEnabled', () => {
    render(<StudioScreen {...baseProps()} />);
    expect(screen.getByRole('button', { name: 'Tạo âm thanh' })).toBeEnabled();
  });

  it('studioScreen_pickQuickVoice_callsOnPickVoice', async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<StudioScreen {...props} />);
    await user.click(screen.getByRole('button', { name: 'Minh' }));
    expect(props.onPickVoice).toHaveBeenCalledWith('minh');
  });
});
