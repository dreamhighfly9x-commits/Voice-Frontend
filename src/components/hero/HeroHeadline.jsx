export default function HeroHeadline() {
  return <div className="hh">
    <span className="hh-eyebrow"><span className="hh-eyebrow-dot" aria-hidden="true" />AI POWERED TEXT TO SPEECH</span>
    <h1 className="hh-title" id="dh-hero-title">Biến Văn Bản Thành<br /><span className="hh-gradient">Giọng Nói</span> Đầy Cảm Xúc</h1>
    <p className="hh-desc">DreamHigh Voice giúp bạn biến mọi ý tưởng thành giọng nói tự nhiên. Tạo nội dung YouTube, TikTok, Podcast, thuyết minh, lồng tiếng và nhiều ứng dụng khác chỉ trong vài bước đơn giản.</p>
    <div className="hh-actions">
      <a href="/register" className="hh-btn hh-btn-primary">Bắt đầu tạo giọng nói<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></a>
      <a href="#features" className="hh-btn hh-btn-ghost">Khám phá tính năng</a>
    </div>
    <div className="hh-note"><span>✓ Không cần thẻ thanh toán</span><span>✓ Có gói miễn phí</span></div>
  </div>;
}
