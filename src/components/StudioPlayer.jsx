import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../lib/authApi';
import AudioDownload from './AudioDownload';
import { expiryLabel, recordingFacts } from '../lib/expiry';
import './StudioPlayer.css';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const fmt = (s) => { if (!Number.isFinite(s)) return '0:00'; const m = Math.floor(s / 60), r = Math.floor(s % 60); return `${m}:${String(r).padStart(2, '0')}`; };

// Full media bar for the take just generated in Studio (media URLs need auth, so it plays a fetched blob).
export default function StudioPlayer({ recording, filename, autoPlay = false }) {
  const audio = useRef(null);
  const [src, setSrc] = useState(''), [error, setError] = useState('');
  const [playing, setPlaying] = useState(false), [time, setTime] = useState(0), [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1), [volume, setVolume] = useState(1), [muted, setMuted] = useState(false);
  useEffect(() => {
    let url = '', alive = true;
    setSrc(''); setError(''); setTime(0); setDuration(0); setPlaying(false);
    apiFetch(recording.url).then((r) => { if (!r.ok) throw new Error(); return r.blob(); })
      .then((blob) => { if (!alive) return; url = URL.createObjectURL(blob); setSrc(url); })
      .catch(() => alive && setError('Không tải được âm thanh.'));
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
  }, [recording.url]);
  useEffect(() => { if (audio.current) audio.current.playbackRate = speed; }, [speed, src]);
  useEffect(() => { if (audio.current) { audio.current.volume = volume; audio.current.muted = muted; } }, [volume, muted, src]);
  const toggle = () => { const a = audio.current; if (!a) return; if (a.paused) a.play().catch(() => {}); else a.pause(); };
  const seek = (t) => { const a = audio.current; if (a && Number.isFinite(a.duration)) a.currentTime = Math.max(0, Math.min(a.duration, t)); };
  const pct = duration ? (time / duration) * 100 : 0;
  return <section className="studio-player" aria-label="Trình phát bản ghi vừa tạo">
    <header><span className="studio-player-badge">Vừa tạo</span><strong title={filename || recording.title}>{filename || recording.title}</strong>{expiryLabel(recording.expires_at) && <small className="studio-expiry" title={'Tự động xóa lúc ' + new Date(recording.expires_at * 1000).toLocaleString('vi-VN')}>⏱ {expiryLabel(recording.expires_at).text}</small>}</header>
    {recordingFacts(recording) && <p className="studio-player-facts">{recordingFacts(recording)}</p>}
    {src && <audio ref={audio} src={src} autoPlay={autoPlay} preload="metadata"
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
      onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)} onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)} />}
    {error ? <p role="alert" className="studio-player-error">{error}</p> : <>
      <div className="studio-player-seek">
        <span>{fmt(time)}</span>
        <input type="range" aria-label="Tua" min="0" max={duration || 0} step="0.01" value={time} disabled={!duration} style={{ '--pct': pct + '%' }} onChange={(e) => seek(Number(e.target.value))} />
        <span>{fmt(duration)}</span>
      </div>
      <div className="studio-player-controls">
        <button type="button" aria-label="Lùi 10 giây" disabled={!src} onClick={() => seek(time - 10)}>↺10</button>
        <button type="button" className="studio-player-play" aria-label={playing ? 'Tạm dừng' : 'Phát'} disabled={!src} onClick={toggle}>
          {!src ? <span className="studio-player-spin" aria-hidden="true" /> : playing
            ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
            : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>}
        </button>
        <button type="button" aria-label="Tiến 10 giây" disabled={!src} onClick={() => seek(time + 10)}>10↻</button>
        <button type="button" className="studio-player-speed" aria-label="Tốc độ phát" onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}>{speed}x</button>
        <span className="studio-player-volume">
          <button type="button" aria-label={muted ? 'Bật tiếng' : 'Tắt tiếng'} onClick={() => setMuted(!muted)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z" />{!muted && volume > 0 ? <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /> : <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}</svg>
          </button>
          <input type="range" aria-label="Âm lượng" min="0" max="1" step="0.05" value={muted ? 0 : volume} style={{ '--pct': (muted ? 0 : volume * 100) + '%' }} onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }} />
        </span>
        <AudioDownload url={recording.url} filename={filename} className="studio-player-download" />
      </div>
    </>}
  </section>;
}
