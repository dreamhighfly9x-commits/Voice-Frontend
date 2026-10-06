import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { it, expect, vi } from 'vitest';
import DeleteRecording from './DeleteRecording';

it('only deletes the selected recording after confirmation', async () => {
  const user = userEvent.setup();
  const remove = vi.fn().mockResolvedValue(undefined);
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  render(<DeleteRecording recording={{id:'sample',title:'Bản đọc'}} onDelete={remove}/>);
  await user.click(screen.getByRole('button'));
  expect(remove).not.toHaveBeenCalled();
  confirm.mockReturnValue(true);
  await user.click(screen.getByRole('button'));
  expect(remove).toHaveBeenCalledExactlyOnceWith('sample');
  confirm.mockRestore();
});
