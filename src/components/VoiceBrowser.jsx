import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiJson } from '../lib/authApi';
import PlayButton from './PlayButton';
import './VoiceBrowser.css';

const SOURCES = ['ElevenLabs', 'MiniMax', 'CapCut', 'Cộng đồng', 'Giọng nhân bản'];
const AGES = { young: 'Trẻ', middle_aged: 'Trung niên', old: 'Lớn tuổi' };
const PAGE_SIZE = 50;
const langName = (code) => { try { return new Intl.DisplayNames(['vi'], { type: 'language' }).of(code); } catch { return code; } };

// Full-catalog table picker for Studio: the dropdown only holds the core list,
// so every cloud voice is browsed here via /api/voices/search.
export default function VoiceBrowser({ initialSource = 'ElevenLabs', voice, playingId, onPlay, onPick, onClose }) {
  const [source, setSource] = useState(SOURCES.includes(initialSource) ? initialSource : 'ElevenLabs');
  const [search, setSearch] = useState(''), [q, setQ] = useState('');
  const [language, setLanguage] = useState(''), [gender, setGender] = useState(''), [age, setAge] = useState(''), [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ key: '', total: 0, items: [], categories: [], languages: [] });
  const [error, setError] = useState('');
  useEffect(() => { const t = setTimeout(() => setQ(search.trim()), 250); return () => clearTimeout(t); }, [search]);
  useEffect(() => { const onKey = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [onClose]);
  const key = JSON.stringify([source, q, language, gender, age, category, page]);
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ source, q, language, gender, age, category, offset: String(page * PAGE_SIZE), limit: String(PAGE_SIZE) });
    apiJson('/api/voices/search?' + params, { signal: controller.signal })
      .then((d) => { setData({ key, total: 0, items: [], categories: [], languages: [], ...d }); setError(''); })
      .catch((e) => { if (!controller.signal.aborted) { setError(e.message || 'Không tải được danh sách giọng.'); setData((d) => ({ ...d, key })); } });
    return () => controller.abort();
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const loading = data.key !== key;
  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const reset = (fn) => (e) => { fn(e.target.value); setPage(0); };
  return createPortal(<div className="vb-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="vb-dialog" role="dialog" aria-modal="true" aria-label="Thư mục giọng">
      <header className="vb-head">
        <div><h2>Thư mục giọng</h2><small>{loading ? 'Đang tải…' : `${data.total.toLocaleString('vi-VN')} giọng`}</small></div>
        <button type="button" className="vb-close" aria-label="Đóng" onClick={onClose}>✕</button>
      </header>
      <div className="vb-tabs" role="tablist">{SOURCES.map((s) => <button type="button" role="tab" key={s} aria-selected={s === source} onClick={() => { setSource(s); setPage(0); setCategory(''); setLanguage(''); }}>{s}</button>)}</div>
      <div className="vb-filters">
        <input aria-label="Tìm giọng" placeholder="Tìm theo tên, mô tả hoặc voice ID…" value={search} onChange={reset(setSearch)} autoFocus />
        <select aria-label="Ngôn ngữ" value={language} onChange={reset(setLanguage)}><option value="">Tất cả ngôn ngữ</option>{[...data.languages].sort((a, b) => a === 'vi' ? -1 : b === 'vi' ? 1 : a.localeCompare(b)).map((l) => <option key={l} value={l}>{langName(l)}</option>)}</select>
        <select aria-label="Giới tính" value={gender} onChange={reset(setGender)}><option value="">Tất cả giới tính</option><option value="male">Nam</option><option value="female">Nữ</option></select>
        <select aria-label="Độ tuổi" value={age} onChange={reset(setAge)}><option value="">Tất cả độ tuổi</option>{Object.entries(AGES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
        <select aria-label="Mục đích" value={category} onChange={reset(setCategory)}><option value="">Tất cả mục đích</option>{data.categories.map((c) => <option key={c.key} value={c.key}>{c.name} ({c.count})</option>)}</select>
      </div>
      <div className="vb-table-wrap" aria-busy={loading}>
        {error && <p role="alert" className="vb-empty">{error}</p>}
        {!error && !loading && !data.items.length && <p className="vb-empty">Không tìm thấy giọng phù hợp.</p>}
        {!!data.items.length && <table className="vb-table">
          <thead><tr><th aria-label="Nghe thử" /><th>Giọng</th><th>Ngôn ngữ</th><th>Giới tính</th><th>Độ tuổi</th><th>Mục đích</th><th aria-label="Chọn" /></tr></thead>
          <tbody>{data.items.map((v) => {
            const m = v.metadata || {}, pid = 'v' + v.id, chosen = (v.variant_ids || [v.id]).includes(voice);
            return <tr key={v.id} className={chosen ? 'is-selected' : ''}>
              <td><PlayButton size={30} active={playingId === pid} onClick={() => onPlay(pid)} /></td>
              <td className="vb-name"><strong>{v.name}</strong>{m.description && <small title={m.description}>{m.description}</small>}</td>
              <td>{langName(m.language_code || v.language || 'und')}</td>
              <td>{v.gender === 'male' ? 'Nam' : v.gender === 'female' ? 'Nữ' : '-'}</td>
              <td>{AGES[m.age] || '-'}</td>
              <td className="vb-cats">{(m.categories || []).slice(0, 2).map((c) => <span key={c.key}>{c.name}</span>)}</td>
              <td><button type="button" className="vb-pick" disabled={chosen} onClick={() => { onPick(v.id); onClose(); }}>{chosen ? 'Đang dùng' : 'Chọn'}</button></td>
            </tr>;
          })}</tbody>
        </table>}
      </div>
      <nav className="vb-pager" aria-label="Phân trang"><button type="button" disabled={!page || loading} onClick={() => setPage(page - 1)}>Trang trước</button><span>Trang {Math.min(page + 1, pages)}/{pages}</span><button type="button" disabled={page + 1 >= pages || loading} onClick={() => setPage(page + 1)}>Trang sau</button></nav>
    </div>
  </div>, document.body);
}
