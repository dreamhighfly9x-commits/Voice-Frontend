import DeleteRecording from '../components/DeleteRecording';
import AudioDownload from '../components/AudioDownload';
import { LIB_FILTERS } from '../data';
import PlayButton from '../components/PlayButton';
import Waveform from '../components/Waveform';

export default function LibraryScreen({ animStyle, items, libFilter, onFilter, playingId, onPlay, onDelete }) {
  return (
    <div style={{ ...animStyle, padding: '24px 30px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
        {LIB_FILTERS.map((f) => {
          const on = libFilter === f;
          return (
            <div
              key={f}
              className="tap"
              onClick={() => onFilter(f)}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                border: `1px solid ${on ? 'var(--contrast)' : 'var(--line)'}`,
                background: on ? 'var(--contrast)' : 'var(--panel)',
                color: on ? 'var(--contrastInk)' : 'var(--ink2)',
              }}
            >
              {f}
            </div>
          );
        })}
        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--dim2)' }}>{items.length} bản ghi</span>
      </div>

      <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 18, overflow: 'hidden' }}>
        {items.map((r) => (
          <div key={r.id} data-testid="library-row" style={{ padding: '15px 18px', borderBottom: '1px solid var(--line3)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 15px' }}>
            <PlayButton active={playingId === r.id} size={34} onClick={() => onPlay(r.id)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: '1 1 180px' }}>
              <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</span>
              <span style={{ fontSize: 12, color: 'var(--dim2)' }}>{r.meta}</span>
            </div>
            <Waveform n={24} seed={r.seed} active={playingId === r.id ? 0.45 : 1} live={playingId === r.id} height={32} />
            <span style={{ fontFamily: 'AppArial, Arial, Helvetica, sans-serif', fontSize: 11.5, color: 'var(--dim2)' }}>{r.dur}</span>
            <div style={{ display: 'flex', gap: 7 }}>
              <DeleteRecording recording={r} onDelete={onDelete}/>
              <AudioDownload url={r.url} className="tap tap-line" style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 600 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
