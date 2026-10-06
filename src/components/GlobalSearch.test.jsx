import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../testRender';
import userEvent from '@testing-library/user-event';
import GlobalSearch from './GlobalSearch';

const items = [
  { key: 'voice:han', id: 'han', kind: 'Giọng', title: 'Hân', detail: 'Giọng clone' },
  { key: 'voice:minh', id: 'minh', kind: 'Giọng', title: 'Minh', detail: 'Nam trầm' },
  { key: 'recording:r1', id: 'r1', kind: 'Bản ghi', title: 'Reel — tập 1', detail: 'Hân · clone', url: '/r1.wav' },
];

async function openSearch(user) {
  await user.click(screen.getByRole('button', { name: 'Tìm dự án, giọng, bản ghi' }));
}

describe('GlobalSearch', () => {
  it('globalSearch_typingQuery_filtersResultsToMatchingItems', async () => {
    const user = userEvent.setup();
    render(<GlobalSearch items={items} ready onChoose={() => {}} onPlay={() => {}} playingId={null} />);
    await openSearch(user);
    await user.type(screen.getByLabelText('Nội dung tìm kiếm'), 'Minh');
    expect(screen.getByText('Minh')).toBeInTheDocument();
    expect(screen.queryByText('Hân')).not.toBeInTheDocument();
  });

  it('globalSearch_enterKey_choosesFirstMatchAndClosesDialog', async () => {
    const user = userEvent.setup();
    const onChoose = vi.fn();
    render(<GlobalSearch items={items} ready onChoose={onChoose} onPlay={() => {}} playingId={null} />);
    await openSearch(user);
    const input = screen.getByLabelText('Nội dung tìm kiếm');
    await user.type(input, 'Minh{Enter}');
    expect(onChoose).toHaveBeenCalledWith(expect.objectContaining({ id: 'minh' }));
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });
});
