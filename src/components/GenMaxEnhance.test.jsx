import {it,expect,vi,beforeEach} from 'vitest';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {apiJson} from '../lib/authApi';
import GenMaxEnhance from './GenMaxEnhance';
vi.mock('../lib/authApi',()=>({apiJson:vi.fn()}));
beforeEach(()=>vi.clearAllMocks());
it('previews before applying and preserves original on failure',async()=>{
  const replace=vi.fn();apiJson.mockResolvedValueOnce({text:'[happy] Xin chào'});
  render(<GenMaxEnhance voice="ext_1" text="Xin chào" onReplace={replace}/>);
  fireEvent.click(screen.getByText(/Tự động thêm/));
  await screen.findByText('[happy] Xin chào');expect(replace).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Áp dụng cảm xúc'));expect(replace).toHaveBeenCalledWith('[happy] Xin chào');
  replace.mockClear();apiJson.mockRejectedValueOnce(new Error('Hết credit'));
  fireEvent.click(screen.getByText(/Tự động thêm/));await screen.findByRole('alert');expect(replace).not.toHaveBeenCalled();
});
it('discards response when text changes while processing',async()=>{
  let finish;apiJson.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
  const replace=vi.fn();const view=render(<GenMaxEnhance voice="ext_1" text="Cũ" onReplace={replace}/>);
  fireEvent.click(screen.getByText(/Tự động thêm/));
  view.rerender(<GenMaxEnhance voice="ext_1" text="Mới" onReplace={replace}/>);
  finish({text:'[happy] Cũ'});
  await waitFor(()=>expect(screen.queryByText('Áp dụng cảm xúc')).not.toBeInTheDocument());
  expect(replace).not.toHaveBeenCalled();
});
