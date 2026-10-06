import { useState } from 'react';
import Icon from '../components/Icon';
import { ICONS } from '../data';
import './VoicesScreen.css';

const STYLES = { tu_nhien: 'Giọng đọc phổ thông', doc_truyen: 'Đọc truyện', ke_chuyen: 'Kể chuyện', quang_cao: 'Quảng cáo', tin_tuc: 'Tin tức', tiktok: 'TikTok', youtube: 'YouTube', podcast: 'Podcast', thuyet_minh: 'Thuyết minh phim', hoat_hinh: 'Hoạt hình' };
const AGES = { young: 'Trẻ', middle_aged: 'Trung niên', old: 'Lớn tuổi' };
const heart = 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z';
function sourceOf(v) {
  if (v.id.startsWith('clone_')) return 'Giọng của tôi';
  const tags = `${v.provider_type || ''} ${v.provider_name || ''} ${v.tags || ''}`.toLowerCase();
  if (/genmax|elevenlabs/.test(tags)) return 'ElevenLabs';
  if (/minimax/.test(tags)) return 'MiniMax';
  if (/capcut/.test(tags)) return 'CapCut';
  return 'DreamHigh';
}
function isVietnamese(v) {
  const lang = (v.language || (v.tags || '').split(' · ')[0]).trim().toLowerCase();
  return ['vi', 'vi-vn', 'vietnamese', 'tiếng việt'].includes(lang)
    || (!v.id.startsWith('ext_') && !v.id.startsWith('prov:'));
}

export default function VoicesScreen({ previewLoading, animStyle, voices, voiceFilter, onFilter, onClassify, playingId, onPlay, favs = {}, onFav, voice, onPick }) {
  const [source, setSource] = useState('Cộng đồng');
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState('');
  const available = voices.filter(isVietnamese);
  const sources = ['Cộng đồng', ...new Set(available.map(sourceOf)), 'Yêu thích'];
  const activeSource = voiceFilter === 'Yêu thích' ? 'Yêu thích' : source;
  const base = available.filter(v => (activeSource === 'Cộng đồng' || (activeSource === 'Yêu thích' ? favs[v.id] : sourceOf(v) === activeSource))
    && (!gender || v.gender === gender) && (!age || (v.age || 'unknown') === age)
    && `${v.name} ${v.desc || ''} ${v.id}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const filtered = base.filter(v => !category || (category === 'unknown' ? !STYLES[v.style] : v.style === category));
  const pages = Math.max(1, Math.ceil(filtered.length / 24));
  const currentPage = Math.min(page, pages - 1);
  function reset() { setSearch(''); setGender(''); setAge(''); setCategory(''); setPage(0); }
  async function copy(v) {
    try { await navigator.clipboard.writeText(v.id); setNotice(`Đã sao chép ID giọng ${v.name}.`); }
    catch { setNotice('Không thể sao chép. Trình duyệt chưa cho phép truy cập bộ nhớ tạm.'); }
  }
  return <section className="voice-library" style={animStyle}>
    <div className="vl-source-tabs" aria-label="Nguồn giọng">
      {sources.map(s => <button type="button" key={s} aria-pressed={s === activeSource} onClick={() => { setSource(s); onFilter?.(s === 'Yêu thích' ? s : 'Tất cả'); reset(); }}>
        <Icon path={s === 'Yêu thích' ? heart : s === 'Cộng đồng' ? ICONS.admin : ICONS.voices} />{s}
      </button>)}
    </div>
    <div className="vl-filters">
      <div className="vl-selects">
        <label>Ngôn ngữ<select aria-label="Ngôn ngữ giọng" value="vi" disabled><option value="vi">🇻🇳 Tiếng Việt</option></select></label>
        <label>Giới tính<select aria-label="Lọc giới tính" value={gender} onChange={e => { setGender(e.target.value); setPage(0); }}><option value="">Tất cả giới tính</option><option value="male">Nam</option><option value="female">Nữ</option></select></label>
        <label>Tuổi<select aria-label="Lọc độ tuổi" value={age} onChange={e => { setAge(e.target.value); setPage(0); }}><option value="">Tất cả độ tuổi</option>{Object.entries(AGES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}<option value="unknown">Chưa phân loại</option></select></label>
        <button className="vl-reset" type="button" aria-label="Đặt lại bộ lọc" onClick={reset}><Icon path="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1" /></button>
      </div>
      <div className="vl-search"><Icon path="M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0" /><input aria-label="Tìm giọng" value={search} placeholder="Tìm theo tên, mô tả hoặc voice ID…" onChange={e => { setSearch(e.target.value); setPage(0); }} /></div>
      <div className="vl-categories" aria-label="Mục đích sử dụng">
        {[['', 'Tất cả'], ...Object.entries(STYLES), ['unknown', 'Chưa phân loại']].map(([key, label]) => {
          const count = base.filter(v => !key || (key === 'unknown' ? !STYLES[v.style] : v.style === key)).length;
          return <button type="button" key={key} aria-pressed={category === key} onClick={() => { setCategory(key); setPage(0); }}>{label}<span>{count}</span></button>;
        })}
      </div>
    </div>
    <div className="vl-results"><span>{filtered.length} giọng nói · Tiếng Việt</span><span role="status">{notice}</span></div>
    {!filtered.length && <div className="vl-empty">Không tìm thấy giọng phù hợp. Hãy thử đổi từ khóa hoặc đặt lại bộ lọc.</div>}
    <div className="vl-grid">
      {filtered.slice(currentPage * 24, (currentPage + 1) * 24).map(v => {
        const pid = 'v' + v.id, loading = previewLoading === pid, playing = playingId === pid;
        return <article className={`vl-card ${voice === v.id ? 'is-selected' : ''}`} key={v.id} data-testid="voice-card">
          <div className="vl-card-heading"><div className="vl-avatar"><Icon path={ICONS.voices} size={23} /></div><div><h3>{v.name}</h3><small>{sourceOf(v)}{sourceOf(v) === 'ElevenLabs' && /genmax/i.test(v.tags || '') ? ' · GenMax' : ''}</small></div></div>
          <p className="vl-description">{v.desc || 'Chọn nghe thử để tìm giọng phù hợp với nội dung của bạn.'}</p>
          <div className="vl-tags"><span>Tiếng Việt</span><span>{v.gender === 'male' ? 'Nam' : v.gender === 'female' ? 'Nữ' : 'Chưa rõ giới tính'}</span>{AGES[v.age] && <span>{AGES[v.age]}</span>}{STYLES[v.style] && <span className="vl-use-case">{STYLES[v.style]}</span>}</div>
          <details className="vl-classify"><summary>Phân loại</summary>
            <label>Giới tính<select aria-label={'Giới tính ' + v.name} value={v.gender || ''} onChange={e => onClassify?.(v.id, { gender: e.target.value })}><option value="">Chưa phân loại</option><option value="male">Nam</option><option value="female">Nữ</option></select></label>
            <label>Độ tuổi<select aria-label={'Độ tuổi ' + v.name} value={v.age || ''} onChange={e => onClassify?.(v.id, { age: e.target.value })}><option value="">Chưa phân loại</option>{Object.entries(AGES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
            <label>Phong cách<select aria-label={'Phong cách ' + v.name} value={v.style || ''} onChange={e => onClassify?.(v.id, { style: e.target.value })}><option value="">Chưa phân loại</option>{Object.entries(STYLES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
            <small>Phân loại cá nhân được lưu trên trình duyệt này.</small>
          </details>
          <footer><button type="button" className="vl-icon-button" aria-label={(favs[v.id] ? 'Bỏ yêu thích ' : 'Yêu thích ') + v.name} aria-pressed={!!favs[v.id]} onClick={() => onFav?.(v.id)}><Icon path={heart} /></button><button type="button" className="vl-icon-button" aria-label={'Sao chép ID ' + v.name} onClick={() => copy(v)}><Icon path="M8 8h12v13H8zM15 8V3H3v13h5" /></button><button type="button" disabled={loading} aria-label={(playing ? 'Dừng ' : 'Phát ') + v.name} onClick={() => onPlay?.(pid)}>{loading ? 'Đang tải…' : playing ? 'Ⅱ Dừng' : '▷ Phát'}</button><button className="vl-use" type="button" onClick={() => onPick?.(v.id)}>{voice === v.id ? 'Đang dùng' : 'Sử dụng'}</button></footer>
        </article>;
      })}
    </div>
    <nav className="vl-pagination" aria-label="Phân trang giọng"><button type="button" disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>Trang trước</button><span>Trang {currentPage + 1}/{pages}</span><button type="button" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Trang sau</button></nav>
  </section>;
}
