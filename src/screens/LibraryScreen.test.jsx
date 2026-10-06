import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../testRender';
import userEvent from '@testing-library/user-event';
import LibraryScreen from './LibraryScreen';
import { LIB_FILTERS } from '../data';

const items = [
  { id: 'r1', title: 'Reel — 5 mẹo học tiếng Anh', meta: 'HÂN · CLONE', dur: '1:12', seed: 2, url: '/api/media/r1.wav' },
  { id: 'r2', title: 'Podcast tập 12', meta: 'MINH', dur: '18:26', seed: 6, url: '/api/media/r2.wav' },
];

describe('LibraryScreen', () => {
  it('libraryScreen_filterButtons_switchActiveFilter', async () => {
    const onFilter = vi.fn();
    const user = userEvent.setup();
    render(<LibraryScreen animStyle={{}} items={items} libFilter="Tất cả" onFilter={onFilter} playingId={null} onPlay={() => {}} />);
    await user.click(screen.getByText(LIB_FILTERS[1]));
    expect(onFilter).toHaveBeenCalledWith(LIB_FILTERS[1]);
  });

  it('libraryScreen_items_renderDownloadLinkPerItem', () => {
    render(<LibraryScreen animStyle={{}} items={items} libFilter="Tất cả" onFilter={() => {}} playingId={null} onPlay={() => {}} />);
    const links = screen.getAllByRole('button', { name: 'Tải WAV' });
    expect(links).toHaveLength(2);
    expect(links[0]).toBeEnabled();
    expect(screen.getByText('Podcast tập 12')).toBeInTheDocument();
  });
});
