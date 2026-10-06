import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render,screen,waitFor,fireEvent } from '../testRender';
import userEvent from '@testing-library/user-event';
import BatchScreen from './BatchScreen';
import { apiFetch } from '../lib/authApi';
vi.mock('../lib/authApi',()=>({apiFetch:vi.fn()}));
const voices=[{id:'han',name:'Hân'},{id:'minh',name:'Minh'}];
beforeEach(()=>{apiFetch.mockReset();apiFetch.mockImplementation(async(_,init)=>{const {voice}=JSON.parse(init.body);return {ok:true,json:async()=>({id:voice,url:'/api/media/'+voice+'.wav'})};});});
const paste=(text)=>fireEvent.change(screen.getByLabelText('Văn bản nguồn'),{target:{value:text}});
describe('Batch screen',()=>{
 it('normalizes long text into one segment per sentence',async()=>{
  const user=userEvent.setup();render(<BatchScreen voices={voices} maxChars={5000}/>);
  paste('Xin  chào.   Tôi là Hân!   Hẹn gặp lại');
  await user.click(screen.getByRole('button',{name:'Chuẩn hóa & tách đoạn'}));
  expect(screen.getByLabelText('Văn bản nguồn')).toHaveValue('Xin chào.\nTôi là Hân!\nHẹn gặp lại');
  expect(screen.getAllByTestId('batch-item')).toHaveLength(3);
  expect(screen.getByLabelText('Nội dung đoạn 2')).toHaveValue('Tôi là Hân!');
 });
 it('uses the shared voice for every segment unless one picks its own',async()=>{
  const user=userEvent.setup();const onCreated=vi.fn();
  render(<BatchScreen voices={voices} maxChars={5000} onCreated={onCreated}/>);
  paste('Câu một. Câu hai. Câu ba.');
  await user.click(screen.getByRole('button',{name:'Chuẩn hóa & tách đoạn'}));
  await user.selectOptions(screen.getByLabelText('Giọng cho tất cả'),'minh');
  await user.selectOptions(screen.getByLabelText('Giọng đoạn 2'),'han');
  await user.click(screen.getByRole('button',{name:'Bắt đầu tạo hàng loạt'}));
  await waitFor(()=>expect(onCreated).toHaveBeenCalledTimes(3));
  expect(apiFetch.mock.calls.map(([,init])=>JSON.parse(init.body).voice)).toEqual(['minh','han','minh']);
 });
 it('marks finished rows with a check and downloads all selected files as one ZIP',async()=>{
  const user=userEvent.setup();
  apiFetch.mockImplementation(async(url,init)=>url.startsWith('/api/download/')?{ok:true,arrayBuffer:async()=>new Uint8Array([82,73,70,70]).buffer}:{ok:true,json:async()=>({id:JSON.parse(init.body).text,url:'/api/media/x.wav'})});
  const createUrl=vi.fn(()=>'blob:zip');URL.createObjectURL=createUrl;URL.revokeObjectURL=vi.fn();
  const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
  render(<BatchScreen voices={voices} maxChars={5000}/>);
  paste('Một. Hai.');
  await user.click(screen.getByRole('button',{name:'Chuẩn hóa & tách đoạn'}));
  await user.click(screen.getByRole('button',{name:'Bắt đầu tạo hàng loạt'}));
  await waitFor(()=>expect(document.querySelectorAll('.batch-done')).toHaveLength(2));
  await user.click(screen.getByLabelText('Chọn tất cả file đã tạo'));
  await user.click(screen.getByRole('button',{name:'Tải 2 file đã chọn (ZIP)'}));
  await waitFor(()=>expect(click).toHaveBeenCalledTimes(1));
  expect(createUrl.mock.calls[0][0].type).toBe('application/zip');
  expect(apiFetch.mock.calls.filter(([url])=>url.startsWith('/api/download/'))).toHaveLength(2);
  click.mockRestore();
 });
 it('clears per-segment voices back to the shared voice',async()=>{
  const user=userEvent.setup();render(<BatchScreen voices={voices} maxChars={5000}/>);
  paste('Một. Hai.');
  await user.click(screen.getByRole('button',{name:'Chuẩn hóa & tách đoạn'}));
  await user.selectOptions(screen.getByLabelText('Giọng đoạn 1'),'minh');
  await user.click(screen.getByRole('button',{name:'Bỏ 1 giọng riêng'}));
  expect(screen.getByLabelText('Giọng đoạn 1')).toHaveValue('');
 });
});
