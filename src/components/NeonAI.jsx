/** Original image with a crisp vector neon trace over its AI lettering. */
export default function NeonAI() {
  const letters='M700 392 L723 337 L747 392 M709 373 H737 M765 337 V392';
  return <svg className="auth-ai-visual" viewBox="0 0 1199 799" role="img" aria-label="Khuôn mặt trí tuệ nhân tạo với chữ AI phát sáng">
    <image href="/images/login-ai.jpg" width="1199" height="799"/>
    <rect x="688" y="326" width="94" height="77" fill="#021324"/>
    <g fill="none" strokeLinejoin="round" strokeLinecap="round">
      <path d={letters} stroke="#1298db" strokeWidth="6"/>
      <path className="auth-ai-glow" d={letters} pathLength="100" stroke="#57eaff" strokeWidth="9"/>
      <path className="auth-ai-flow" d={letters} pathLength="100" stroke="#e1ffff" strokeWidth="4"/>
      <rect className="auth-ai-circuit" x="670" y="306" width="118" height="116" rx="8" pathLength="100" stroke="#57eaff" strokeWidth="2"/>
    </g>
  </svg>;
}
