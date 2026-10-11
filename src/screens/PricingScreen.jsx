import { useRef, useState } from 'react';
import { apiJson } from '../lib/authApi';
import { useAuth } from '../lib/AuthContext';
import { PRICING_PLANS, PRICING_HIGHLIGHTS, SUGGESTED_COUPON, NEW_MEMBER_OFFER, formatVnd, formatChars, applyCoupon } from '../lib/pricingPlans';
import './WorkspaceScreens.css';
import './PricingScreen.css';

const PAID = PRICING_PLANS.filter((p) => p.price > 0);
const COUPON_ERRORS = { 404: 'invalid', 410: 'expired', 409: 'used' };
const COUPON_MESSAGES = {
  invalid: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn.',
  expired: 'Mã khuyến mãi đã hết hạn.',
  used: 'Bạn đã sử dụng mã khuyến mãi này.',
};

function Breakdown({ price, coupon }) {
  const { original, discount, total } = applyCoupon(price, coupon?.percent_off || 0);
  return <dl className="pricing-breakdown">
    <div><dt>Giá gốc</dt><dd>{formatVnd(original)}</dd></div>
    {coupon && <div className="is-discount"><dt>Giảm</dt><dd>-{formatVnd(discount)}</dd></div>}
    <div className="is-total"><dt>Thanh toán</dt><dd>{formatVnd(total)}</dd></div>
  </dl>;
}

export default function PricingScreen({ animStyle, onNavigate, onToast }) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState({ state: 'idle' });
  const [target, setTarget] = useState('pro');
  const [order, setOrder] = useState(null);
  const [offerNotice, setOfferNotice] = useState('');
  const orderRef = useRef(null);
  const valid = coupon.state === 'success' ? coupon.data : null;
  const targetPlan = PAID.find((p) => p.id === (order?.id || target)) || PAID[0];

  async function check(e) {
    e.preventDefault();
    const typed = code.trim();
    if (!typed) return;
    setCoupon({ state: 'loading' });
    try {
      const data = await apiJson('/api/pricing/coupons/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: typed }) });
      setCoupon({ state: 'success', data });
    } catch (error) {
      const state = COUPON_ERRORS[error.status];
      setCoupon(state ? { state } : { state: 'error', message: error.message || 'Không kiểm tra được mã, thử lại sau.' });
    }
  }
  function choose(plan) {
    if (!plan.price) { onNavigate?.('studio'); onToast?.('Bạn đang dùng gói FREE. Bắt đầu tạo giọng nói ngay.'); return; }
    setOrder(plan); setTarget(plan.id);
    requestAnimationFrame(() => orderRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' }));
  }
  async function copyCoupon() {
    try { await navigator.clipboard.writeText(SUGGESTED_COUPON.code); onToast?.('Đã sao chép mã ưu đãi.', 2600, true); }
    catch { onToast?.('Trình duyệt chưa cho phép sao chép. Mã: ' + SUGGESTED_COUPON.code); }
  }

  return <div className="workspace-page pricing-page" style={animStyle}>
    <header className="pricing-head">
      <h2>Chọn gói phù hợp với bạn</h2>
      <p>Tạo giọng nói AI chất lượng cao với mức giá hợp lý.</p>
      <p className="pricing-highlights">{PRICING_HIGHLIGHTS.join(' • ')}</p>
    </header>

    <div className="pricing-grid">
      {PRICING_PLANS.map((p) => <article key={p.id} className={'pricing-card' + (p.popular ? ' is-popular' : '')} data-testid={'plan-' + p.id}>
        {p.badge && <span className="pricing-badge">{p.badge}</span>}
        <h3>{p.name}</h3>
        <div className="pricing-price"><strong>{formatVnd(p.price)}</strong><span>/tháng</span></div>
        <div className="pricing-quota">{formatChars(p.characters)} ký tự / tháng</div>
        <ul>
          <li><span aria-hidden="true">✓</span>{formatChars(p.characters)} ký tự / tháng</li>
          {p.features.map((f) => <li key={f}><span aria-hidden="true">✓</span>{f}</li>)}
          {p.missing.map((f) => <li key={f} className="is-missing"><span aria-hidden="true">✕</span>Không {f}</li>)}
        </ul>
        <button type="button" className={p.popular ? 'primary' : ''} onClick={() => choose(p)}>{p.cta}</button>
      </article>)}
    </div>

    {order && <section className="workspace-card pricing-order" ref={orderRef} aria-label="Xác nhận đơn">
      <h3>Xác nhận đơn · Gói {order.name}</h3>
      <p>{formatChars(order.characters)} ký tự / tháng{valid ? ` · Mã ${valid.code} (-${valid.percent_off}%)` : ''}</p>
      <Breakdown price={order.price} coupon={valid} />
      <p className="workspace-notice" role="status">Thanh toán online chưa được kết nối. Liên hệ Admin kèm thông tin đơn này để nâng cấp tài khoản {user?.email}.</p>
      <button type="button" onClick={() => setOrder(null)}>Hủy</button>
    </section>}

    <div className="pricing-extras">
      <section className="workspace-card pricing-coupon">
        <h3><span aria-hidden="true">🎁</span> Bạn có mã khuyến mãi?</h3>
        <p>Nhập mã để nhận ưu đãi đặc biệt.</p>
        <form onSubmit={check} className="pricing-coupon-form">
          <input aria-label="Mã khuyến mãi" placeholder="Nhập mã khuyến mãi" value={code} disabled={coupon.state === 'loading'}
            onChange={(e) => { setCode(e.target.value); if (coupon.state !== 'idle') setCoupon({ state: 'idle' }); }} />
          <button type="submit" className="primary" disabled={coupon.state === 'loading' || !code.trim()}>{coupon.state === 'loading' ? 'Đang kiểm tra...' : 'Áp dụng'}</button>
        </form>
        {valid && <div className="pricing-coupon-result is-success" role="status">
          <strong>✓ Mã giảm giá hợp lệ</strong>
          <p>Mã {valid.code} giảm {valid.percent_off}% cho đơn hàng này.</p>
          <label className="pricing-target">Áp dụng cho gói
            <select value={targetPlan.id} onChange={(e) => { setTarget(e.target.value); if (order) setOrder(PAID.find((p) => p.id === e.target.value)); }}>
              {PAID.map((p) => <option key={p.id} value={p.id}>{p.name} · {formatVnd(p.price)}</option>)}
            </select>
          </label>
          <Breakdown price={targetPlan.price} coupon={valid} />
        </div>}
        {COUPON_MESSAGES[coupon.state] && <p className="pricing-coupon-result is-error" role="alert">{COUPON_MESSAGES[coupon.state]}</p>}
        {coupon.state === 'error' && <p className="pricing-coupon-result is-error" role="alert">{coupon.message}</p>}
      </section>

      <div className="pricing-side">
        <section className="workspace-card pricing-offer">
          <h3><span aria-hidden="true">🎁</span> Ưu đãi cho thành viên mới</h3>
          <p>Đăng ký tài khoản mới và nhận {formatChars(NEW_MEMBER_OFFER.characters)} ký tự miễn phí.</p>
          <button type="button" className="primary" onClick={() => setOfferNotice(`Hệ thống thưởng chưa được kết nối. Liên hệ Admin để nhận ${formatChars(NEW_MEMBER_OFFER.characters)} ký tự cho tài khoản ${user?.email || 'của bạn'}.`)}>Nhận ưu đãi</button>
          {offerNotice && <p className="workspace-notice" role="status">{offerNotice}</p>}
        </section>
        <section className="workspace-card pricing-suggested">
          <div><code>{SUGGESTED_COUPON.code}</code><p>{SUGGESTED_COUPON.note}</p></div>
          <button type="button" onClick={copyCoupon}>Sao chép mã</button>
        </section>
      </div>
    </div>
  </div>;
}
