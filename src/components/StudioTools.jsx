import { useRef, useState } from 'react';
import { apiFetch } from '../lib/authApi';
import Icon from './Icon';
import './StudioTools.css';

export default function StudioTools({ text, onReplace, onNormalize, onAutoSplit, dictionary = [], onDictionary, userId, disabled }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  async function importFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setMessage(''); setPending(null);
    if (!/\.(txt|docx|pdf)$/i.test(file.name)) { setMessage('Chỉ hỗ trợ TXT, DOCX và PDF.'); return; }
    if (file.size > 10*1024*1024) { setMessage('File tối đa 10 MB.'); return; }
    setBusy(true);
    try {
      const form = new FormData(); form.append('file',file);
      const response = await apiFetch('/api/import-text', { method:'POST', body:form });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Không đọc được tài liệu.');
      setPending({name:file.name, text:data.text});
    } catch (error) { setMessage(error.message || 'Không tải được file.'); }
    finally { setBusy(false); }
  }
  function accept(append) {
    onReplace(append && text.trim() ? `${text}\n\n${pending.text}` : pending.text);
    setMessage(`Đã nhập ${pending.text.length.toLocaleString('vi-VN')} ký tự từ ${pending.name}.`);
    setPending(null);
  }
  function addEntry() {
    if (!from.trim() || !to.trim()) { setMessage('Nhập từ gốc và cách đọc thay thế.'); return; }
    if (draft.some(e => e.from === from.trim())) { setMessage('Từ này đã có; hãy sửa dòng bên dưới.'); return; }
    if (draft.length >= 100) { setMessage('Tối đa 100 mục trong từ điển.'); return; }
    setDraft([...draft, {from:from.trim(),to:to.trim()}]); setFrom(''); setTo(''); setMessage('');
  }
  function save() {
    const entries=draft.map(e=>({from:e.from.trim(),to:e.to.trim()}));
    if(entries.some(e=>!e.from || !e.to) || new Set(entries.map(e=>e.from)).size!==entries.length) { setMessage('Mỗi dòng cần đủ hai ô và từ gốc không trùng nhau.'); return; }
    try { localStorage.setItem(`studio-dictionary:${userId}`,JSON.stringify(entries)); }
    catch { setMessage('Trình duyệt không lưu được từ điển. Hãy kiểm tra dung lượng lưu trữ.'); return; }
    onDictionary(entries);setOpen(false);setMessage('Đã lưu từ điển. Áp dụng cho các lần tạo âm thanh tiếp theo.');
  }
  return <section className="studio-tools" aria-label="Công cụ văn bản">
    <div className="studio-toolbar">
      <input ref={input} type="file" accept=".txt,.docx,.pdf" aria-label="Chọn tài liệu" hidden onChange={importFile} />
      <button disabled={disabled || busy} onClick={()=>input.current.click()}><Icon path="M12 16V4M8 8l4-4 4 4M4 16v3h16v-3" size={15}/>{busy ? 'Đang đọc tài liệu…' : 'Tải TXT / DOCX / PDF'}</button>
      <button disabled={disabled || !text.trim()} onClick={onNormalize}><Icon path="M12 4l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" size={15}/>Chuẩn hóa văn bản</button>
      <button disabled={disabled || !text.trim()} onClick={onAutoSplit}><Icon path="M4 6h16M4 12h9M4 18h16M17 10l3 2-3 2" size={15}/>Chia đoạn tự động</button>
      <button disabled={disabled} aria-expanded={open} onClick={()=>{setDraft(dictionary.map(e=>({...e})));setOpen(!open);setMessage('');}}>Từ điển phát âm{dictionary.length ? ` (${dictionary.length})` : ''}</button>
    </div>
    <p>File tối đa 10 MB · TXT UTF-8/UTF-16 · PDF có văn bản (tối đa 100 trang).</p>
    {message && <p role="status">{message}</p>}
    {pending && <div className="studio-tool-panel">
      <strong>{pending.name} · {pending.text.length.toLocaleString('vi-VN')} ký tự</strong>
      <pre>{pending.text.slice(0,800)}{pending.text.length>800?'…':''}</pre>
      <div className="studio-toolbar"><button disabled={disabled} onClick={()=>accept(false)}>Thay nội dung hiện tại</button><button disabled={disabled} onClick={()=>accept(true)}>Thêm vào cuối</button><button onClick={()=>setPending(null)}>Hủy nhập</button></div>
    </div>}
    {open && <div className="studio-tool-panel">
      <strong>Từ điển phát âm</strong>
      <p>Lưu riêng cho tài khoản trên trình duyệt này. Phân biệt hoa/thường; thay từ trước khi đọc, giữ nguyên văn bản gốc. Ví dụ: AI → ây ai.</p>
      <div className="studio-dict-row"><input aria-label="Từ gốc mới" placeholder="Từ gốc: AI" maxLength={100} value={from} onChange={e=>setFrom(e.target.value)} /><input aria-label="Cách đọc mới" placeholder="Cách đọc: ây ai" maxLength={200} value={to} onChange={e=>setTo(e.target.value)} /><button onClick={addEntry}>Thêm từ</button></div>
      {draft.map((entry,index)=><div className="studio-dict-row" key={index}>
        <input aria-label={`Từ gốc ${index+1}`} maxLength={100} value={entry.from} onChange={e=>setDraft(draft.map((v,i)=>i===index?{...v,from:e.target.value}:v))}/>
        <input aria-label={`Cách đọc ${index+1}`} maxLength={200} value={entry.to} onChange={e=>setDraft(draft.map((v,i)=>i===index?{...v,to:e.target.value}:v))}/>
        <button aria-label={`Xóa từ ${index+1}`} onClick={()=>setDraft(draft.filter((_,i)=>i!==index))}>Xóa</button>
      </div>)}
      <div className="studio-toolbar"><button disabled={disabled} onClick={save}>Lưu từ điển</button><button onClick={()=>setOpen(false)}>Hủy chỉnh sửa</button></div>
    </div>}
  </section>;
}
