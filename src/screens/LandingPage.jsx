import { useEffect, useRef, useState } from 'react';
import BrandLogo from '../components/BrandLogo';
import DreamHighHero from '../components/hero/DreamHighHero';
import { PRICING_PLANS, formatChars, formatVnd } from '../lib/pricingPlans';
import { saveLandingDraft } from '../lib/landingDraft';
import '../styles/publicBrand.css';
import './LandingPage.css';
import './LandingPastel.css';

const SAMPLE_TEXT = 'Mỗi ý tưởng đều xứng đáng được lắng nghe. Với DreamHigh Voice, hãy biến những dòng chữ thành câu chuyện mang thanh âm của riêng bạn.';
const SAMPLES = [
  { id: 'voice-1', name: 'Thanh âm kể chuyện', tag: 'Tiếng Việt · VieNeu', symbol: '✳', color: 'peach' },
  { id: 'voice-2', name: 'Thanh âm sáng tạo', tag: 'Tiếng Việt · VieNeu', symbol: '◈', color: 'lilac' },
  { id: 'voice-3', name: 'Thanh âm đồng hành', tag: 'Tiếng Việt · VieNeu', symbol: '✺', color: 'mint' },
];
const FAQ = [
  ['Tôi có thể trải nghiệm mà không đăng nhập không?', 'Bạn có thể khám phá toàn bộ trang giới thiệu, bảng giá, tài liệu API và nghe các bản demo công khai. Để tạo âm thanh từ văn bản của mình hoặc lưu dự án, hãy đăng ký hoặc đăng nhập.'],
  ['DreamHigh Voice hỗ trợ những giọng nói nào?', 'Thư viện kết hợp các giọng từ ElevenLabs, MiniMax, CapCut và VieNeu. Bạn có thể khám phá giọng cộng đồng, giọng nhân bản và lưu giọng yêu thích trong ứng dụng. Giọng và model sử dụng được phụ thuộc vào quyền của tài khoản và gói dịch vụ.'],
  ['Tôi có thể dùng âm thanh cho video và công việc không?', 'Bạn có thể dùng DreamHigh Voice để sản xuất nội dung video, học liệu, thuyết minh và nhiều định dạng âm thanh khác. Các gói trả phí trong bảng giá có mục Commercial use; quyền sử dụng cụ thể còn phụ thuộc vào giọng và điều khoản của nhà cung cấp.'],
  ['Tính năng nhân bản giọng hoạt động như thế nào?', 'Trong ứng dụng, tải lên mẫu âm thanh của giọng bạn có quyền sử dụng và làm theo hướng dẫn tạo giọng. Chất lượng kết quả phụ thuộc vào độ rõ, nội dung và chất lượng bản thu. Tính năng cần tài khoản có quyền Voice Clone.'],
  ['Có API để tích hợp vào sản phẩm của tôi không?', 'Có. Bạn có thể đọc hướng dẫn API công khai ngay trên website. Việc gọi API yêu cầu token hợp lệ và tài khoản được cấp quyền tương ứng; các gói PRO và BUSINESS có API trong danh sách tính năng.'],
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const home = window.location.pathname === '/welcome' ? '/welcome' : '/';
  return <header className="lp-header"><div className="lp-container lp-header-inner">
    <a className="lp-brand" href={home} aria-label="DreamHigh Voice — Trang chủ"><BrandLogo /></a>
    <button className="lp-menu-button" type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="public-navigation" aria-label="Menu điều hướng">{open ? '✕' : '☰'}</button>
    <nav id="public-navigation" className={open ? 'lp-nav is-open' : 'lp-nav'} aria-label="Điều hướng chính" onClick={() => setOpen(false)}>
      <a href={`${home}#features`}>Tính năng</a><a href={`${home}#voices`}>Giọng AI</a><a href={`${home}#pricing`}>Bảng giá</a><a href="/docs/api">Tài liệu API <span aria-hidden="true">↗</span></a>
      <div className="lp-nav-auth"><a href="/login">Đăng nhập</a><a className="lp-button lp-button-small" href="/register">Đăng ký miễn phí <span aria-hidden="true">↗</span></a></div>
    </nav>
  </div></header>;
}

function Waveform({ small = false }) {
  return <div className={`lp-waveform ${small ? 'is-small' : ''}`} aria-hidden="true">{Array.from({ length: small ? 32 : 55 }, (_, i) => <i key={i} style={{ '--height': `${12 + Math.abs(Math.sin(i * .62) * Math.cos(i * .19)) * 88}%`, '--delay': `${i * -.09}s` }} />)}</div>;
}

export function PublicFooter() {
  return <footer className="lp-footer lp-container"><div><a className="lp-brand" href="/" aria-label="DreamHigh Voice — Trang chủ"><BrandLogo /></a><p>Ý tưởng của bạn. Thanh âm của tương lai.</p></div><nav aria-label="Liên kết cuối trang"><a href="/#features">Tính năng</a><a href="/#pricing">Bảng giá</a><a href="/docs/api">Tài liệu API</a><a href="/login">Đăng nhập</a></nav><div className="lp-footer-bottom"><span>© {new Date().getFullYear()} DreamHigh Voice</span><span>MADE FOR YOUR NEXT BIG IDEA <span aria-hidden="true">↗</span></span></div></footer>;
}

export default function LandingPage() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [config, setConfig] = useState({});
  const audio = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/landing-config.json', { signal: controller.signal }).then(r => r.ok ? r.json() : {}).then(setConfig).catch(() => {});
    return () => controller.abort();
  }, []);
  const playSample = async (index = selected) => {
    const player = audio.current;
    if (!player) return;
    if (playing && index === selected) { player.pause(); return; }
    setSelected(index); setAudioError('');
    player.src = `/audio/${SAMPLES[index].id}.wav`;
    try { await player.play(); } catch { setAudioError('Chưa phát được bản mẫu. Vui lòng thử lại.'); }
  };
  const startStudio = (event) => {
    if (!text.trim()) { event.preventDefault(); document.getElementById('public-demo-text').focus(); return; }
    saveLandingDraft(text.trim());
  };
  return <div className="landing-page">
    <a className="lp-skip" href="#main-content">Bỏ qua điều hướng</a>
    <PublicHeader />
    <main id="main-content">
      <DreamHighHero config={config} />

      <section className="lp-provider-strip lp-container" aria-label="Công nghệ giọng nói"><p>Nhiều công nghệ.<br /><strong>Một không gian sáng tạo.</strong></p><div><span>ElevenLabs</span><span>MiniMax<span className="lp-provider-mark">✦</span></span><span>CapCut</span><span>VieNeu <small>Tiếng Việt</small></span></div></section>

      <section id="demo" className="lp-section lp-container">
        <div className="lp-section-heading"><div><span className="lp-eyebrow">01 — NGHE ĐỂ CẢM NHẬN</span><h2>Văn bản của bạn.<br /><span>Thanh âm đầy sức sống.</span></h2></div><p>Một đoạn văn. Nhiều cách thể hiện.<br />Khám phá chất giọng phù hợp với câu chuyện.</p></div>
        <div className="lp-demo"><div className="lp-demo-editor"><div className="lp-demo-top"><label htmlFor="public-demo-text">Văn bản của bạn</label><span>VI · Tiếng Việt</span></div><textarea id="public-demo-text" maxLength={5000} value={text} onChange={e => setText(e.target.value)} /><div className="lp-demo-editor-foot"><span>{text.length.toLocaleString('vi-VN')} / 5.000 ký tự</span><button type="button" onClick={() => setText(SAMPLE_TEXT)}>Dùng văn bản mẫu ↺</button></div><div className="lp-demo-cta"><div><strong>Sẵn sàng nghe ý tưởng của bạn?</strong><p>Đăng nhập để tạo âm thanh từ nội dung đã nhập.</p></div><a href="/login?next=studio" onClick={startStudio} className="lp-button">Tạo giọng nói <span aria-hidden="true">↗</span></a></div></div>
          <div className="lp-demo-voices"><span className="lp-eyebrow">THƯ VIỆN NGHE THỬ</span>{SAMPLES.map((sample, index) => <button type="button" key={sample.id} className={`lp-voice-option ${selected === index ? 'is-selected' : ''}`} onClick={() => playSample(index)} aria-label={`${playing && selected === index ? 'Tạm dừng' : 'Nghe'} ${sample.name}`} aria-pressed={playing && selected === index}><span className={`lp-avatar ${sample.color}`} aria-hidden="true">{sample.symbol}</span><span><strong>{sample.name}</strong><small>{sample.tag}</small></span><span className="lp-voice-play" aria-hidden="true">{playing && selected === index ? 'Ⅱ' : '▶'}</span></button>)}<p className="lp-demo-disclosure">Các bản mẫu được tạo sẵn từ cùng một đoạn văn giới thiệu. Nội dung chỉnh sửa sẽ được tạo trong Studio sau khi đăng nhập.</p>{audioError && <p role="alert" className="lp-error">{audioError}</p>}</div>
        </div>
        <audio ref={audio} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => { setPlaying(false); setAudioError('Không tải được bản mẫu. Vui lòng thử lại.'); }} />
      </section>

      <section id="features" className="lp-section lp-features"><div className="lp-container"><div className="lp-section-heading"><div><span className="lp-eyebrow">02 — TỪ Ý TƯỞNG ĐẾN THÀNH PHẨM</span><h2>Ít thao tác hơn.<br /><span>Nhiều cảm hứng hơn.</span></h2></div><a href="/register" className="lp-text-link">Khám phá Studio <span aria-hidden="true">↗</span></a></div><div className="lp-feature-grid">
        <article className="lp-feature-card lp-feature-main"><span className="lp-feature-icon">Aa<span>↗</span></span><div><h3>Viết ra. Nghe thấy.</h3><p>Chuyển kịch bản thành âm thanh, chọn giọng và điều chỉnh cách thể hiện trong cùng một Studio.</p></div><div className="lp-mini-editor" aria-hidden="true"><span>Ý tưởng hôm nay, câu chuyện ngày mai.<i /></span><div><span>✦ AI Voice</span><Waveform small /><span>▶</span></div></div><a href="/register">Bắt đầu tạo giọng <span aria-hidden="true">↗</span></a></article>
        <article className="lp-feature-card"><span className="lp-feature-icon">◈</span><h3>Mang dấu ấn riêng</h3><p>Nhân bản giọng từ mẫu thu để xây dựng chất giọng nhất quán cho nội dung của bạn.</p><a href="/login?next=clones">Khám phá Voice Clone <span aria-hidden="true">↗</span></a></article>
        <article className="lp-feature-card"><span className="lp-feature-icon">≋</span><h3>Sáng tạo có tổ chức</h3><p>Quản lý kịch bản, tạo âm thanh hàng loạt và tìm lại bản thu trong thư viện cá nhân.</p><a href="/login?next=studio">Mở không gian làm việc <span aria-hidden="true">↗</span></a></article>
        <article className="lp-feature-card lp-feature-api"><span className="lp-feature-icon">{'{ }'}</span><div><h3>Giọng nói trong sản phẩm của bạn</h3><p>Kết nối khả năng tạo giọng nói với ứng dụng và quy trình làm việc qua API.</p></div><a href="/docs/api">Đọc tài liệu <span aria-hidden="true">↗</span></a></article>
      </div></div></section>

      <section id="voices" className="lp-section lp-container"><div className="lp-section-heading"><div><span className="lp-eyebrow">03 — MỌI CÂU CHUYỆN, MỘT CHẤT GIỌNG</span><h2>Tìm thanh âm<br /><span>thuộc về bạn.</span></h2></div><p>Từ một video ngắn đến cả khóa học.<br />Chọn giọng phù hợp với điều bạn muốn kể.</p></div><div className="lp-usecase-grid">{[['✳', 'peach', 'Video & mạng xã hội', 'Thêm giọng đọc cho video, nội dung ngắn và câu chuyện mỗi ngày.'], ['◈', 'lilac', 'Sách nói & học liệu', 'Đưa kiến thức đến gần hơn qua bài giảng, sách nói và hướng dẫn.'], ['✺', 'mint', 'Thương hiệu & sản phẩm', 'Tạo trải nghiệm âm thanh nhất quán cho thông điệp của bạn.']].map(([icon,color,title,description]) => <article key={title}><span className={`lp-avatar ${color}`} aria-hidden="true">{icon}</span><h3>{title}</h3><p>{description}</p></article>)}</div><div className="lp-library-link"><span>Giọng cộng đồng · ElevenLabs · MiniMax · CapCut · Giọng nhân bản</span><a href="/login?next=voices" className="lp-text-link">Khám phá thư viện giọng <span aria-hidden="true">↗</span></a></div></section>

      <section id="pricing" className="lp-section lp-pricing"><div className="lp-container"><div className="lp-centered-heading"><span className="lp-eyebrow">04 — KHỞI ĐẦU NHỎ. SÁNG TẠO LỚN.</span><h2>Một gói cho mỗi<br /><span>hành trình sáng tạo.</span></h2><p>Bắt đầu miễn phí. Chọn thêm khả năng khi bạn cần.</p><span className="lp-billing-label">Giá theo tháng · VND</span></div><div className="lp-pricing-grid">{PRICING_PLANS.map(plan => <article className={`lp-plan ${plan.popular ? 'is-popular' : ''}`} key={plan.id}><div className="lp-plan-label"><h3>{plan.name}</h3>{plan.popular && <span>PHỔ BIẾN NHẤT</span>}</div><div className="lp-plan-price">{formatVnd(plan.price)}<small>/ tháng</small></div><p className="lp-plan-quota"><strong>{formatChars(plan.characters)}</strong> ký tự / tháng</p><a href={`/register?plan=${plan.id}`} className={`lp-button ${plan.popular ? '' : 'lp-button-outline'}`}>{plan.price === 0 ? 'Bắt đầu miễn phí' : `Chọn ${plan.name}`} <span aria-hidden="true">↗</span></a><ul>{plan.features.map(feature => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}</ul></article>)}</div><p className="lp-pricing-note">Quyền sử dụng giọng và tính năng theo gói được cấp cho tài khoản. Bạn có thể xem lại thông tin gói trong ứng dụng trước khi nâng cấp.</p></div></section>

      <section id="faq" className="lp-section lp-container lp-faq"><div><span className="lp-eyebrow">05 — GIẢI ĐÁP NHANH</span><h2>Bạn hỏi.<br /><span>DreamHigh trả lời.</span></h2><p>Một vài điều cần biết trước<br />khi bắt đầu sáng tạo.</p></div><div>{FAQ.map(([question,answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>

      <section className="lp-final-cta lp-container"><span className="lp-eyebrow">YOUR NEXT STORY STARTS HERE</span><h2>Ý tưởng đã sẵn sàng.<br />Đến lượt giọng nói của bạn.</h2><a href="/register" className="lp-button">Bắt đầu miễn phí <span aria-hidden="true">↗</span></a><span className="lp-cta-decoration" aria-hidden="true">✳</span></section>
    </main><PublicFooter />
  </div>;
}
