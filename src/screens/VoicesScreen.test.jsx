import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoicesScreen from './VoicesScreen';

it('pages a large library and searches across pages with a language filter', async () => {
  const user = userEvent.setup();
  const voices = Array.from({ length: 50 }, (_, i) => ({
    id: `ext_${i}`, name: `Community ${i}`, initial: 'C',
    language: i === 49 ? 'en' : 'vi', tags: `${i === 49 ? 'en' : 'vi'} · GenMax · v3`, seed: i,
  }));
  render(<VoicesScreen voices={voices} favs={{}} voiceFilter="Tất cả" onFilter={vi.fn()} />);
  expect(screen.getAllByTestId('voice-card')).toHaveLength(24);
  await user.click(screen.getByRole('button', { name: 'Trang sau' }));
  expect(screen.getByText('Community 24')).toBeInTheDocument();
  await user.type(screen.getByRole('textbox', { name: 'Tìm giọng' }), 'Community 48');
  expect(screen.getAllByTestId('voice-card')).toHaveLength(1);
  expect(screen.getByText('Community 48')).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Ngôn ngữ giọng' })).toBeDisabled();
  await user.clear(screen.getByRole('textbox', { name: 'Tìm giọng' }));
  await user.type(screen.getByRole('textbox', { name: 'Tìm giọng' }), 'Community 49');
  expect(screen.queryAllByTestId('voice-card')).toHaveLength(0);
});
