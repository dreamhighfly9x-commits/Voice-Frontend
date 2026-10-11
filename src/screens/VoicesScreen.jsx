import { useEffect, useMemo, useState } from 'react';
import { apiJson } from '../lib/authApi';
import Icon from '../components/Icon';
import VoiceAvatar from '../components/VoiceAvatar';
import {classifyVoice} from '../lib/voiceClassification';
import { ICONS } from '../data';
import './VoicesScreen.css';

const STYLES = { tu_nhien: 'Giọng đọc phổ thông', doc_truyen: 'Đọc truyện', ke_chuyen: 'Kể chuyện', quang_cao: 'Quảng cáo', tin_tuc: 'Tin tức', tiktok: 'TikTok', youtube: 'YouTube', podcast: 'Podcast', thuyet_minh: 'Thuyết minh phim', hoat_hinh: 'Hoạt hình' };
const AGES = { young: 'Trẻ', middle_aged: 'Trung niên', old: 'Lớn tuổi' };
const heart = 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z';
function sourceOf(v) {
  if (v.id.startsWith('clone_')||v.metadata?.is_clone) return 'Giọng nhân bản';
  if (v.metadata?.engine==='minimax') return 'MiniMax';
  if (v.metadata?.engine==='capcut') return 'CapCut';
  const tags = `${v.provider_type || ''} ${v.provider_name || ''} ${v.tags || ''}`.toLowerCase();
  if (/genmax|elevenlabs/.test(tags)) return 'ElevenLabs';
  if (/minimax/.test(tags)) return 'MiniMax';
  if (/capcut/.test(tags)) return 'CapCut';
  return 'DreamHigh';
}

// Cloud tabs are searched/paged on the server (/api/voices/search): the synced
// GenMax catalog is ~20k voices × one row per model, far too much to ship whole.
const SERVER_SOURCES = new Set(['Cộng đồng', 'ElevenLabs', 'MiniMax', 'CapCut', 'Giọng nhân bản']);
const PAGE_SIZE = 24;

export default function VoicesScreen({ previewLoading, animStyle, voices, voiceFilter, onFilter, onClassify, playingId, onPlay, favs = {}, onFav, voice, onPick, overrides = {} }) {
  const [source, setSource] = useState(null);
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState('');
  const [language,setLanguage]=useState('');
  const [debounced, setDebounced] = useState('');
  const [remote, setRemote] = useState({ key: '', total: 0, items: [], categories: [], uncategorized: 0, languages: [] });
  const [remoteError, setRemoteError] = useState('');
  useEffect(() => { const t = setTimeout(() => setDebounced(search.trim()), 250); return () => clearTimeout(t); }, [search]);
  const langOf=v=>v.metadata?.language_code||v.language||(v.tags||'').split(' · ')[0]||'und';
  const langName=code=>{try{return new Intl.DisplayNames(['vi'],{type:'language'}).of(code);}catch{return code;}};
  const available=useMemo(()=>{
  const grouped=new Map();
  for(const v of voices.map(classifyVoice)){
    const key=v.provider_type==='genmax'&&v.remote_id?`genmax:${v.remote_id}`:v.id;
    const old=grouped.get(key);
    const ids=[...(old?._ids||[]),v.id];
    if(!old||v.id===voice||(old.id!==voice&&v.model_id==='eleven_v4'))grouped.set(key,{...v,_ids:ids});
    else old._ids=ids;
  }
  return [...grouped.values()];
  },[voices,voice]);
  const isFavourite=v=>v._ids.some(id=>favs[id]);
  const categoryLabels=Object.fromEntries(available.flatMap(v=>[...(v.metadata?.category_catalog||[]),...v.categories]).map(c=>[c.key,c.name]));
  const labels={...STYLES,...categoryLabels};
  const matches=(v,key)=>key==='unknown'?!v.categories.length&&!STYLES[v.style]:v.style===key||v.categories.some(c=>c.key===key);
  const sources = ['Cộng đồng','ElevenLabs','MiniMax','CapCut','Giọng nhân bản','Yêu thích',...(available.some(v=>sourceOf(v)==='DreamHigh')?['DreamHigh']:[])];
  // Without any cloud voices (local VieNeu only) open on the DreamHigh tab instead of an empty Cộng đồng.
  const hasCloud = voices.some((v) => v.id.startsWith('ext_') || v.id.startsWith('prov:'));
  const activeSource = voiceFilter === 'Yêu thích' ? 'Yêu thích' : source ?? (hasCloud ? 'Cộng đồng' : 'DreamHigh');
  const wantsServer = SERVER_SOURCES.has(activeSource);
  const remoteKey = wantsServer ? JSON.stringify([activeSource, debounced, language, gender, age, category, page]) : '';
  useEffect(() => {
    if (!remoteKey) return undefined;
    const controller = new AbortController();
    const params = new URLSearchParams({ source: activeSource, q: debounced, language, gender, age, category, offset: String(page * PAGE_SIZE), limit: String(PAGE_SIZE) });
    apiJson('/api/voices/search?' + params, { signal: controller.signal })
      .then((data) => {
        // Older backends have no search endpoint: filter the already-loaded list instead.
        if (!data || !Array.isArray(data.items)) { setRemote((r) => ({ ...r, key: remoteKey, unsupported: true })); return; }
        setRemote({ key: remoteKey, ...data }); setRemoteError('');
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error.status === 404) { setRemote((r) => ({ ...r, key: remoteKey, unsupported: true })); return; }
        setRemoteError(error.message || 'Không tải được thư viện giọng.'); setRemote((r) => ({ ...r, key: remoteKey }));
      });
    return () => controller.abort();
  }, [remoteKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const serverMode = wantsServer && !remote.unsupported;
  const remoteLoading = serverMode && remote.key !== remoteKey;
  const remoteItems = useMemo(() => remote.items.map((v) => classifyVoice({ ...v, ...overrides[v.id], _ids: v.variant_ids || [v.id] })), [remote.items, overrides]);
  const base = available.filter(v => (activeSource === 'Cộng đồng' ? (v.metadata?.community||(!v.provider_type&&/genmax/i.test(v.tags||''))) : activeSource === 'Yêu thích' ? isFavourite(v) : sourceOf(v) === activeSource)
    && (!language||langOf(v)===language)
    && (!gender || v.gender === gender) && (!age || (v.age || 'unknown') === age)
    && `${v.name} ${v.desc || ''} ${v.id}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const selectedCategories=category?category.split(','):[];
  const localFiltered = serverMode ? [] : base.filter(v => !selectedCategories.length || selectedCategories.some(key=>matches(v,key)));
  const total = serverMode ? remote.total : localFiltered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const visible = serverMode ? remoteItems : localFiltered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const languageOptions = serverMode ? (language && !remote.languages.includes(language) ? [...remote.languages, language] : remote.languages) : [...new Set(available.map(langOf))];
  const categoryChips = serverMode
    ? [['', 'Tất cả', selectedCategories.length ? '' : remote.total], ...remote.categories.map(c => [c.key, c.name, c.count]), ['unknown', 'Chưa phân loại', remote.uncategorized]]
    : [['', 'Tất cả'], ...Object.entries(labels).filter(([k])=>categoryLabels[k]||base.some(v=>v.style===k)), ['unknown', 'Chưa phân loại']].map(([key, label]) => [key, label, base.filter(v => !key || matches(v,key)).length]);
  function reset() { setSearch(''); setGender(''); setAge(''); setCategory(''); setLanguage(''); setPage(0); }
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
        <label>Ngôn ngữ<select aria-label="Ngôn ngữ giọng" value={language} onChange={e=>{setLanguage(e.target.value);setPage(0);}}><option value="">Tất cả ngôn ngữ</option>{[...languageOptions].sort((a,b)=>a==='vi'?-1:b==='vi'?1:a.localeCompare(b)).map(l=><option key={l} value={l}>{langName(l)}</option>)}</select></label>
        <label>Giới tính<select aria-label="Lọc giới tính" value={gender} onChange={e => { setGender(e.target.value); setPage(0); }}><option value="">Tất cả giới tính</option><option value="male">Nam</option><option value="female">Nữ</option></select></label>
        <label>Tuổi<select aria-label="Lọc độ tuổi" value={age} onChange={e => { setAge(e.target.value); setPage(0); }}><option value="">Tất cả độ tuổi</option>{Object.entries(AGES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}<option value="unknown">Chưa phân loại</option></select></label>
        <button className="vl-reset" type="button" aria-label="Đặt lại bộ lọc" onClick={reset}><Icon path="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1" /></button>
      </div>
      <div className="vl-search"><Icon path="M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0" /><input aria-label="Tìm giọng" value={search} placeholder="Tìm theo tên, mô tả hoặc voice ID…" onChange={e => { setSearch(e.target.value); setPage(0); }} /></div>
      <div className="vl-categories" aria-label="Mục đích sử dụng">
        {categoryChips.map(([key, label, count]) => {
          return <button type="button" key={key} aria-pressed={key?selectedCategories.includes(key):!category} onClick={() => { setCategory(!key?'':(selectedCategories.includes(key)?selectedCategories.filter(k=>k!==key):[...selectedCategories,key]).join(',')); setPage(0); }}>{label}<span>{count}</span></button>;
        })}
      </div>
    </div>
    <div className="vl-results"><span>{remoteLoading ? 'Đang tải…' : `${total.toLocaleString('vi-VN')} giọng nói`} · {language?langName(language):'Tất cả ngôn ngữ'}</span><span role="status">{notice}</span></div>
    {remoteError && <p role="alert" className="vl-empty">{remoteError}</p>}
    {!remoteLoading && !remoteError && !visible.length && <div className="vl-empty">Không tìm thấy giọng phù hợp. Hãy thử đổi từ khóa hoặc đặt lại bộ lọc.</div>}
    <div className="vl-grid" aria-busy={remoteLoading}>
      {visible.map(v => {
        const pid = 'v' + v.id, loading = previewLoading === pid, playing = playingId === pid;
        return <article className={`vl-card ${voice === v.id ? 'is-selected' : ''}`} key={v.id} data-testid="voice-card">
          <div className="vl-card-heading"><div className="vl-avatar"><VoiceAvatar voice={v}/></div><div><h3>{v.name}</h3><small>{sourceOf(v)}{sourceOf(v) === 'ElevenLabs' && (v.provider_type === 'genmax' || /genmax|dreamhigh/i.test(v.tags || '')) ? ' · DreamHigh' : ''}</small></div></div>
          <p className="vl-description">{v.desc || 'Chọn nghe thử để tìm giọng phù hợp với nội dung của bạn.'}</p>
          <div className="vl-tags"><span>{langName(langOf(v))}</span><span>{v.gender === 'male' ? 'Nam' : v.gender === 'female' ? 'Nữ' : 'Chưa rõ giới tính'}</span>{AGES[v.age] && <span>{AGES[v.age]}</span>}{STYLES[v.style] && <span className="vl-use-case">{STYLES[v.style]}</span>}{v.categories.map(c=><span className="vl-use-case" key={c.key}>{c.name}</span>)}{v.accent&&<span>{({northern:'Giọng Bắc',southern:'Giọng Nam',central:'Giọng Trung',standard:'Giọng chuẩn'})[v.accent]||v.accent}</span>}</div>
          <div className="vl-card-meta">{!!v.categories.length&&<small>{v.automatic?'Gợi ý tự động từ mô tả':'Phân loại từ DreamHigh'}</small>}
          <details className="vl-classify"><summary>Chỉnh phân loại cá nhân</summary>
            <label>Giới tính<select aria-label={'Giới tính ' + v.name} value={v.gender || ''} onChange={e => onClassify?.(v.id, { gender: e.target.value })}><option value="">Chưa phân loại</option><option value="male">Nam</option><option value="female">Nữ</option></select></label>
            <label>Độ tuổi<select aria-label={'Độ tuổi ' + v.name} value={v.age || ''} onChange={e => onClassify?.(v.id, { age: e.target.value })}><option value="">Chưa phân loại</option>{Object.entries(AGES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
            <label>Phong cách<select aria-label={'Phong cách ' + v.name} value={v.style || ''} onChange={e => onClassify?.(v.id, { style: e.target.value })}><option value="">Chưa phân loại</option>{Object.entries(STYLES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
            <small>Phân loại cá nhân được lưu trên trình duyệt này.</small>
          </details></div>
          <footer><button type="button" className="vl-icon-button" aria-label={(isFavourite(v) ? 'Bỏ yêu thích ' : 'Yêu thích ') + v.name} aria-pressed={!!isFavourite(v)} onClick={() => isFavourite(v)?v._ids.filter(id=>favs[id]).forEach(id=>onFav?.(id)):onFav?.(v.id)}><Icon path={heart} /></button><button type="button" className="vl-icon-button" aria-label={'Sao chép ID ' + v.name} onClick={() => copy(v)}><Icon path="M8 8h12v13H8zM15 8V3H3v13h5" /></button><button type="button" disabled={loading} aria-label={(playing ? 'Dừng ' : 'Phát ') + v.name} onClick={() => onPlay?.(pid)}>{loading ? 'Đang tải…' : playing ? 'Ⅱ Dừng' : '▷ Phát'}</button><button className="vl-use" type="button" onClick={() => onPick?.(v.id)}>{voice === v.id ? 'Đang dùng' : 'Sử dụng'}</button></footer>
        </article>;
      })}
    </div>
    <nav className="vl-pagination" aria-label="Phân trang giọng"><button type="button" disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>Trang trước</button><span>Trang {currentPage + 1}/{pages}</span><button type="button" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Trang sau</button></nav>
  </section>;
}
