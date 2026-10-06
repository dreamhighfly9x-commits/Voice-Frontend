import AudioDownload from './AudioDownload';
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { searchItems } from '../lib/search';

export default function GlobalSearch({ items, ready, onChoose, onPlay, playingId }) {
  const dialog = useRef(null);
  const input = useRef(null);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('Tất cả');
  const open = () => { dialog.current.showModal(); input.current?.focus(); };
  useEffect(() => {
    const shortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!dialog.current.open) dialog.current.showModal();
        input.current?.focus();
      }
    };
    document.addEventListener('keydown', shortcut);
    return () => document.removeEventListener('keydown', shortcut);
  }, []);
  const matches = searchItems(items, query).filter((item) => kind === 'Tất cả' || item.kind === kind);
  const choose = (item) => { onChoose(item); dialog.current.close(); };
  const button = { padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--panel)', color: 'var(--ink)', cursor: 'pointer' };
  return <>
    <button type="button" onClick={open} className="tap" aria-haspopup="dialog" aria-label="Tìm dự án, giọng, bản ghi" title="Tìm kiếm (Ctrl+K)" style={{ ...button, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <Icon path="M10.5 3.5a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM16 16l5 5" size={18} />
      <span>Tìm dự án, giọng, bản ghi</span>
    </button>
    <dialog ref={dialog} aria-labelledby="global-search-title" onClick={(e) => { if (e.target === dialog.current) dialog.current.close(); }} style={{ width: 'min(680px, calc(100vw - 32px))', maxHeight: '85vh', padding: 0, border: '1px solid var(--line)', borderRadius: 18, background: 'var(--panel)', color: 'var(--ink)', boxShadow: '0 20px 80px #0005' }}>
      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 id="global-search-title" style={{ margin: 0, flex: 1, fontSize: 20 }}>Tìm kiếm</h2>
          <button type="button" onClick={() => dialog.current.close()} aria-label="Đóng tìm kiếm" style={button}>Đóng · Esc</button>
        </div>
        <input ref={input} aria-label="Nội dung tìm kiếm" placeholder="Nhập tên giọng, dự án hoặc nội dung bản ghi…" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && matches[0]) { e.preventDefault(); choose(matches[0]); } }} style={{ ...button, padding: 14, cursor: 'text', width: '100%', boxSizing: 'border-box', fontSize: 16 }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['Tất cả', 'Dự án', 'Giọng', 'Bản ghi'].map((value) => <button type="button" key={value} aria-pressed={kind === value} onClick={() => setKind(value)} style={{ ...button, background: kind === value ? 'var(--accSoft)' : 'var(--panel)' }}>{value}</button>)}
        </div>
        {!ready && <p role="status">Đang kết nối dữ liệu giọng và bản ghi…</p>}
        <span role="status" style={{ color: 'var(--dim)', fontSize: 13 }}>{matches.length} kết quả · Có thể tìm không dấu</span>
        {!matches.length && <p>Không tìm thấy kết quả. Thử tên khác hoặc chọn “Tất cả”.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {matches.slice(0, 60).map((item) => <div key={item.key} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <button type="button" onClick={() => choose(item)} style={{ ...button, textAlign: 'left', flex: '1 1 240px', border: 0, minWidth: 0 }}>
              <strong style={{ display: 'block', overflowWrap: 'anywhere' }}>{item.title}</strong>
              <span style={{ display: 'block', marginTop: 5, fontSize: 12, color: 'var(--dim)' }}>{item.kind} · {item.detail}</span>
              <span style={{ display: 'block', marginTop: 5, fontSize: 12, color: 'var(--acc)' }}>{item.kind === 'Giọng' ? 'Dùng trong Studio' : item.kind === 'Dự án' ? 'Xem trong Tổng quan' : 'Mở và phát bản ghi'}</span>
            </button>
            {item.kind === 'Bản ghi' && <>
              <button type="button" onClick={() => onPlay(item.id)} style={button}>{playingId === item.id ? 'Dừng' : 'Nghe'}</button>
              <AudioDownload url={item.url} style={button} />
            </>}
          </div>)}
        </div>
        {matches.length > 60 && <p>Đang hiển thị 60 kết quả đầu. Nhập thêm từ để thu hẹp kết quả.</p>}
      </div>
    </dialog>
  </>;
}
