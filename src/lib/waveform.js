// Waveform bar generator — ported 1:1 from the DreamHigh Voice prototype.
// n: number of bars, seed: variety per waveform instance,
// active: 0-1 fraction already "played" (undefined = fully on),
// live: true while actually playing -> per-bar pulse animation.
export function bars(n, seed, active, live) {
  return Array.from({ length: n }, (_, i) => {
    const h =
      22 +
      (Math.abs(Math.sin((i + seed) * 1.7)) * 0.72 +
        Math.abs(Math.sin((i + seed) * 0.53)) * 0.28) *
        76;
    const on = active === undefined ? true : i / n < active;
    const c1 = on ? 'var(--wave1)' : 'var(--barOff)';
    const c2 = on ? 'var(--wave3)' : 'var(--barOff)';
    const style = {
      flex: '1 1 2px',
      maxWidth: '2px',
      minWidth: '1px',
      height: `${h.toFixed(0)}%`,
      borderRadius: '1px',
      backgroundImage: `linear-gradient(${c1}, ${c1}), linear-gradient(to bottom, ${c2}, ${c1} 48%, ${c2})`,
      backgroundSize: '100% 1px, 100% 100%',
      backgroundPosition: 'center center, center',
      backgroundRepeat: 'no-repeat',
      transition: 'height .35s ease',
    };
    if (live) {
      style.animation = `wavePulse ${(0.9 + (i % 5) * 0.12).toFixed(2)}s ease-in-out ${(-i * 0.07).toFixed(2)}s infinite`;
    }
    return { key: i, style };
  });
}

export function pillStyle(bg, fg) {
  return {
    background: bg,
    color: fg,
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 11.5,
    fontWeight: 700,
    justifySelf: 'start',
  };
}
