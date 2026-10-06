import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render,screen } from '../testRender';
import userEvent from '@testing-library/user-event';
import CreditsScreen,{customQuote} from './CreditsScreen';
import { apiJson } from '../lib/authApi';
vi.mock('../lib/authApi',()=>({apiJson:vi.fn()}));
beforeEach(()=>{apiJson.mockReset();apiJson.mockResolvedValue({used_chars_month:50000});});
describe('Credits screen',()=>{
 it('shows remaining quota and the price table',async()=>{
  render(<CreditsScreen/>);
  expect(await screen.findByText('150.000')).toBeInTheDocument();
  expect(screen.getByRole('table')).toHaveTextContent('Chuyên nghiệp');
  expect(screen.getAllByRole('button',{name:'Mua gói'})).toHaveLength(4);
 });
 it('uses the best tier rate reached by the custom amount',()=>{
  expect(customQuote(50000)).toEqual({rate:490,price:24500});
  expect(customQuote(2000000).price).toBe(690000);
 });
 it('opens an order summary without charging',async()=>{
  const user=userEvent.setup();render(<CreditsScreen/>);
  await user.click(screen.getAllByRole('button',{name:'Mua gói'})[0]);
  expect(screen.getByRole('status')).toHaveTextContent('Thanh toán online chưa được kết nối');
  expect(screen.getByText('Xác nhận đơn').parentElement).toHaveTextContent('100.000 ký tự');
 });
});
