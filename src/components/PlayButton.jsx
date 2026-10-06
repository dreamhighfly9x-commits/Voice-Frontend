import { PLAY_ICON_PAUSE, PLAY_ICON_PLAY } from '../data';

// Filled play/pause circle, size in px. `active` = this id is playing.
export default function PlayButton({ active, loading=false, size = 34, onClick }) {
  const iconSize = Math.round(size * 0.44);
  return (
    <div
      className="tap"
      data-testid="play-button"
      role="button"
      tabIndex={0}
      aria-pressed={active}
      aria-busy={loading}
      aria-label={loading ? 'Đang tải, bấm để hủy' : active ? 'Tạm dừng' : 'Phát'}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        flex: 'none',
        background: active ? 'var(--acc)' : 'var(--accSoft)',
        color: active ? '#fff' : 'var(--acc)',
      }}
    >
      {loading ? <span aria-hidden="true">…</span> : <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} fill="currentColor">
        <path d={active ? PLAY_ICON_PAUSE : PLAY_ICON_PLAY} />
      </svg>}
    </div>
  );
}
