import { useEffect, useState } from 'react';
import './StudioPlayer.css';

// Loading/playing feedback for a history row: spinner + wave + bar (real progress while playing).
export default function HistoryPlayback({ loading, playing, getAudio }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (!playing) { setPct(0); return undefined; }
    let frame;
    const tick = () => { const a = getAudio?.(); if (a && a.duration) setPct((a.currentTime / a.duration) * 100); frame = requestAnimationFrame(tick); };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [playing, getAudio]);
  if (!loading && !playing) return null;
  return <div className={`history-playback ${playing ? 'is-playing' : 'is-loading'}`} aria-hidden="true">
    <div className="history-playback-row">
      {loading && <span className="studio-loading-spin" />}
      <div className="studio-loading-wave">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</div>
    </div>
    {playing ? <div className="history-progress"><span style={{ width: pct + '%' }} /></div> : <div className="studio-loading-bar" />}
  </div>;
}
