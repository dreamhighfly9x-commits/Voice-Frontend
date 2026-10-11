// Single source for the Pricing page: plans, the suggested coupon and the new-member offer.
// Prices are VND per month; `missing` lists features shown struck through.
export const PRICING_PLANS = [
  {
    id: 'free', name: 'FREE', price: 0, currency: 'VND', interval: 'month', characters: 20000, badge: null,
    features: ['TTS cơ bản', 'Các voice được phép ở gói Free', 'Xuất MP3', 'Tốc độ xử lý tiêu chuẩn'],
    missing: ['Voice Clone', 'API', 'Batch generation'],
    cta: 'Dùng miễn phí',
  },
  {
    id: 'basic', name: 'BASIC', price: 199000, currency: 'VND', interval: 'month', characters: 1000000, badge: 'Cho cá nhân',
    features: ['ElevenLabs TTS', 'Hỗ trợ tiếng Việt', 'Nhiều voice', 'Voice Clone', 'MP3 / WAV', 'Không watermark', 'Commercial use', 'Lưu lịch sử audio', 'Tốc độ xử lý tiêu chuẩn'],
    missing: [],
    cta: 'Mua BASIC',
  },
  {
    id: 'pro', name: 'PRO', price: 499000, currency: 'VND', interval: 'month', characters: 3000000, badge: 'PHỔ BIẾN NHẤT', popular: true,
    features: ['ElevenLabs TTS', 'Voice Clone', 'Nhiều voice', 'MP3 / WAV', 'Batch generation', 'Lưu voice riêng', 'Lưu lịch sử audio', 'Commercial use', 'Ưu tiên xử lý', 'API access'],
    missing: [],
    cta: 'Mua PRO',
  },
  {
    id: 'business', name: 'BUSINESS', price: 1699000, currency: 'VND', interval: 'month', characters: 10000000, badge: 'Cho doanh nghiệp',
    features: ['ElevenLabs TTS', 'Voice Clone', 'API đầy đủ', 'Batch generation', 'Priority processing', 'Nhiều project', 'Quản lý nhiều voice', 'Commercial use', 'Hỗ trợ ưu tiên'],
    missing: [],
    cta: 'Mua BUSINESS',
  },
];

export const PRICING_HIGHLIGHTS = ['Không watermark', 'Voice Clone', 'API', 'Hỗ trợ tiếng Việt'];
export const SUGGESTED_COUPON = { code: 'WELCOME20', note: 'Giảm 20% đơn hàng đầu tiên' };
export const NEW_MEMBER_OFFER = { characters: 100000 };

export const formatVnd = (n) => Math.round(n).toLocaleString('vi-VN') + 'đ';
export const formatChars = (n) => n.toLocaleString('vi-VN');
export function applyCoupon(price, percentOff) {
  const discount = Math.round(price * percentOff / 100);
  return { original: price, discount, total: price - discount };
}
