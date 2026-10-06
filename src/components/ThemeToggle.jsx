import './ThemeToggle.css';

export default function ThemeToggle({ theme, onToggle }) {
  const dark = theme === 'dark';
  const label = dark ? 'Giao diện sáng' : 'Giao diện tối';
  return (
    <button type="button" className="voice-theme-switch" onClick={onToggle}
      aria-label={label} aria-pressed={dark} title={label}>
      <span className="voice-theme-slider" aria-hidden="true">
        <span className="voice-theme-sun">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ffcf48" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" fill="#ffcf48" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
          </svg>
        </span>
        <span className="voice-theme-moon">
          <svg viewBox="0 0 24 24"><path d="M20.9 13.3A9 9 0 0 1 10.7 3.1a9 9 0 1 0 10.2 10.2Z" /></svg>
        </span>
      </span>
    </button>
  );
}
