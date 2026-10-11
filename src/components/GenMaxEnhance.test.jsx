import {it,expect,vi,beforeEach} from 'vitest';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {apiJson} from '../lib/authApi';
import GenMaxEnhance from './GenMaxEnhance';
vi.mock('../lib/authApi',()=>({apiJson:vi.fn()}));
beforeEach(()=>vi.clearAllMocks());
it('applies the tagged text directly and preserves original on failure',async()=>{
  const replace=vi.fn();apiJson.mockResolvedValueOnce({text:'[happy] Xin chào'});
  render(<GenMaxEnhance voice="ext_1" text="Xin chào" onReplace={replace}/>);
  fireEvent.click(screen.getByText(/Auto-Tag/));
  await waitFor(()=>expect(replace).toHaveBeenCalledWith('[happy] Xin chào'));
  replace.mockClear();apiJson.mockRejectedValueOnce(new Error('Hết credit'));
  fireEvent.click(screen.getByText(/Auto-Tag/));await screen.findByRole('alert');expect(replace).not.toHaveBeenCalled();
});
it('discards response when text changes while processing',async()=>{
  let finish;apiJson.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
  const replace=vi.fn();const view=render(<GenMaxEnhance voice="ext_1" text="Cũ" onReplace={replace}/>);
  fireEvent.click(screen.getByText(/Auto-Tag/));
  view.rerender(<GenMaxEnhance voice="ext_1" text="Mới" onReplace={replace}/>);
  finish({text:'[happy] Cũ'});
  await new Promise(r=>setTimeout(r,0));
  expect(replace).not.toHaveBeenCalled();
});
