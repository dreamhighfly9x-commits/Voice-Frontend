const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 53 + 7) % 92}%`,
  size: 2 + (i % 3),
  delay: `${-i * 1.3}s`,
  duration: `${9 + (i % 5) * 2}s`,
}));

export default function HeroBackgroundEffects() {
  return <div className="hb" aria-hidden="true">
    <span className="hb-blob hb-blob-a" /><span className="hb-blob hb-blob-b" /><span className="hb-blob hb-blob-c" />
    <svg className="hb-rings" viewBox="0 0 600 600">{[120, 190, 260, 330].map(r => <circle key={r} cx="300" cy="300" r={r} />)}</svg>
    <svg className="hb-waves" viewBox="0 0 1200 200" preserveAspectRatio="none">
      <path d="M0 100 C150 40 300 160 450 100 S750 40 900 100 1200 160 1200 100" />
      <path d="M0 120 C200 70 350 170 600 110 S950 60 1200 120" />
    </svg>
    {PARTICLES.map((p, i) => <i key={i} className="hb-particle" style={{ left: p.left, top: p.top, width: p.size, height: p.size, animationDelay: p.delay, animationDuration: p.duration }} />)}
  </div>;
}
