import Waveform from './Waveform';
import AudioDownload from './AudioDownload';
import './LatestRecording.css';

function newest(recordings) {
  return recordings.reduce((best, r) => (!best || (r.created_at || 0) > (best.created_at || 0) ? r : best), null);
}

// Fills the right side of the home greeting: the most recent recording, ready to replay or download.
export default function LatestRecording({recordings = [], playingId, onPlay, onNavigate}) {
  const latest = newest(recordings);
  if (!latest) {
    return <aside className="latest-recording latest-recording-empty" aria-label="Bản đọc gần nhất">
      <span className="latest-label">Bản đọc gần nhất</span>
      <p>Bản đọc đầu tiên của bạn sẽ hiện ở đây.</p>
      <button type="button" className="latest-link" onClick={() => onNavigate('studio')}>Mở Studio ↗</button>
    </aside>;
  }
  const playing = playingId === latest.id;
  return <aside className="latest-recording" aria-label="Bản đọc gần nhất">
    <span className="latest-label">Bản đọc gần nhất</span>
    <strong className="latest-title" title={latest.title}>{latest.title}</strong>
    <small className="latest-meta">{latest.meta}</small>
    <Waveform n={28} seed={latest.seed || 1} active={playing} live={playing} height={30}/>
    <div className="latest-actions">
      <button type="button" className="latest-play" aria-label={(playing ? 'Dừng ' : 'Nghe ') + latest.title} onClick={() => onPlay(latest.id)}>{playing ? '■' : '▷'}</button>
      <span className="latest-dur">{latest.dur}</span>
      <AudioDownload url={latest.url} className="latest-download"/>
      <button type="button" className="latest-link" onClick={() => onNavigate('library')}>Thư viện ↗</button>
    </div>
  </aside>;
}
