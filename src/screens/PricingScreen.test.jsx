import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../testRender';
import userEvent from '@testing-library/user-event';
import PricingScreen from './PricingScreen';
import { apiJson } from '../lib/authApi';
import { applyCoupon } from '../lib/pricingPlans';
vi.mock('../lib/authApi', () => ({ apiJson: vi.fn() }));
beforeEach(() => apiJson.mockReset());
const fail = (status) => Object.assign(new Error('x'), { status });

describe('Pricing screen', () => {
  it('shows the four plans in order with PRO highlighted', () => {
    render(<PricingScreen />);
    const cards = screen.getAllByRole('article');
    expect(cards.map((c) => c.querySelector('h3').textContent)).toEqual(['FREE', 'BASIC', 'PRO', 'BUSINESS']);
    expect(cards[2]).toHaveClass('is-popular');
    expect(cards[2]).toHaveTextContent('PHỔ BIẾN NHẤT');
    expect(cards[2]).toHaveTextContent('499.000đ');
    expect(cards[2]).toHaveTextContent('3.000.000 ký tự / tháng');
    expect(cards[0]).toHaveTextContent('Không Voice Clone');
  });
  it('applies a valid coupon with loading state and price breakdown', async () => {
    const user = userEvent.setup();
    let resolve; apiJson.mockImplementationOnce(() => new Promise((r) => { resolve = r; }));
    render(<PricingScreen />);
    await user.type(screen.getByLabelText('Mã khuyến mãi'), 'welcome20');
    await user.click(screen.getByRole('button', { name: 'Áp dụng' }));
    expect(screen.getByRole('button', { name: 'Đang kiểm tra...' })).toBeDisabled();
    expect(screen.getByLabelText('Mã khuyến mãi')).toBeDisabled();
    resolve({ code: 'WELCOME20', percent_off: 20 });
    expect(await screen.findByText('✓ Mã giảm giá hợp lệ')).toBeInTheDocument();
    expect(screen.getByText('Mã WELCOME20 giảm 20% cho đơn hàng này.')).toBeInTheDocument();
    expect(screen.getByText('-99.800đ')).toBeInTheDocument();
    expect(screen.getByText('399.200đ')).toBeInTheDocument();
  });
  it.each([[404, 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn.'], [410, 'Mã khuyến mãi đã hết hạn.'], [409, 'Bạn đã sử dụng mã khuyến mãi này.']])('coupon error %i', async (status, message) => {
    const user = userEvent.setup();
    apiJson.mockRejectedValueOnce(fail(status));
    render(<PricingScreen />);
    await user.type(screen.getByLabelText('Mã khuyến mãi'), 'ABC');
    await user.click(screen.getByRole('button', { name: 'Áp dụng' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });
  it('opens the existing order flow for paid plans and copies the suggested coupon', async () => {
    const user = userEvent.setup();
    const toast = vi.fn(), go = vi.fn();
    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<PricingScreen onToast={toast} onNavigate={go} />);
    await user.click(screen.getByRole('button', { name: 'Mua PRO' }));
    expect(screen.getByRole('region', { name: 'Xác nhận đơn' })).toHaveTextContent('Thanh toán online chưa được kết nối');
    await user.click(screen.getByRole('button', { name: 'Dùng miễn phí' }));
    expect(go).toHaveBeenCalledWith('studio');
    await user.click(screen.getByRole('button', { name: 'Sao chép mã' }));
    expect(writeText).toHaveBeenCalledWith('WELCOME20');
    expect(toast).toHaveBeenCalledWith('Đã sao chép mã ưu đãi.', 2600, true);
  });
  it('computes discounts without decimals', () => {
    expect(applyCoupon(399000, 20)).toEqual({ original: 399000, discount: 79800, total: 319200 });
  });
});
