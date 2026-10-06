import { apiFetch } from '../lib/authApi';
import { usePermission } from '../lib/AuthContext';
import { useEffect, useRef, useState } from 'react';
const field = { padding: 12, border: '1px solid var(--line)', borderRadius: 10, background: 'var(--panel)', color: 'var(--ink)' };
const button = { ...field, cursor: 'pointer', fontWeight: 700 };
export default function ClonesScreen({ animStyle, clones, busy, onPlay, onPick, onCreated, onRenamed, onDeleted }) {
  const { can } = usePermission();
  const permitted = can('clones.create');
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const actionPending = useRef(false);
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!uploading) return;
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [uploading]);
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const pending = useRef(false);
  const input = useRef(null);
  const mutateVoice = async (id, remove = false) => {
    if (busy || uploading || actionPending.current || (!remove && !editName.trim())) return;
    actionPending.current = true;
    setSaving(true);
    setActionMessage('');
    try {
      const response = await apiFetch('/api/clones/' + encodeURIComponent(id), remove ? { method: 'DELETE' } : {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editName.trim() }),
      });
      const result = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof result?.detail === 'string' ? result.detail : 'Không lưu được thay đổi. Vui lòng thử lại.');
      if (remove) { onDeleted(id); setDeleting(null); setActionMessage('Đã xóa giọng. Các bản ghi đã tạo vẫn được giữ lại.'); }
      else { onRenamed(result); setEditing(null); setActionMessage('Đã lưu tên mới.'); }
    } catch (error) { setActionMessage(error.message); }
    finally { actionPending.current = false; setSaving(false); }
  };
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const selectFile = (selected) => {
    if (!selected || pending.current) return;
    setMessage('');
    if (selected.size > 20 * 1024 * 1024) { setMessage('File tối đa 20 MB.'); return; }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setName(selected.name.replace(/\.[^.]+$/, '').slice(0, 80));
  };
  const upload = async (event) => {
    event.preventDefault();
    if (!file || !name.trim() || !consent || pending.current || busy || actionPending.current) return;
    pending.current = true;
    setElapsed(0);
    setUploading(true);
    setMessage('Đang tải audio và trích đặc trưng giọng. Lần đầu có thể cần tải thêm dữ liệu model…');
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('name', name.trim());
      const response = await apiFetch('/api/clones', { method: 'POST', body });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result) throw new Error(typeof result?.detail === 'string' ? result.detail : 'Không tạo được giọng clone. Kiểm tra kết nối backend.');
      onCreated(result);
      setMessage('Đã lưu giọng. Bấm Nghe thử hoặc Dùng giọng để tạo âm thanh.');
      setFile(null); setPreview(''); setName(''); setConsent(false);
      if (input.current) input.current.value = '';
    } catch (error) { setMessage(error.message); }
    finally { pending.current = false; setUploading(false); }
  };
  return <div style={{ ...animStyle, padding: '24px 30px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
    {!permitted && <p role="status">Admin chưa cấp quyền tạo hoặc chỉnh sửa giọng clone cho tài khoản này.</p>}
    <form onSubmit={upload} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ margin: 0, fontSize: 20 }}>Tải file để clone giọng</h2>
      <p style={{ margin: 0, color: 'var(--dim)', lineHeight: 1.6 }}>VieNeu v3 Turbo · WAV, MP3 hoặc FLAC · 3–30 giây · tối đa 20 MB. Chọn bản ghi một người nói rõ, ít tiếng ồn, không nhạc nền. Không cần nhập lời thoại mẫu.</p>
      <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); selectFile(e.dataTransfer.files[0]); }} style={{ ...field, borderStyle: 'dashed', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <strong>Chọn file giọng có sẵn hoặc kéo file vào đây</strong>
        <input ref={input} type="file" accept=".wav,.mp3,.flac" disabled={!permitted || uploading} onChange={(e) => selectFile(e.target.files[0])} />
        {file && <span>{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</span>}
      </label>
      {preview && <audio controls src={preview} style={{ width: '100%' }} />}
      <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>Tên giọng
        <input required maxLength={80} value={name} disabled={!permitted || uploading} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Giọng của tôi" style={field} />
      </label>
      <label><input type="checkbox" checked={consent} disabled={!permitted || uploading} onChange={(e) => setConsent(e.target.checked)} /> Tôi được phép sử dụng giọng trong bản ghi này.</label>
      <button type="submit" disabled={!permitted || !file || !name.trim() || !consent || uploading || busy} style={{ ...button, alignSelf: 'flex-start', background: 'var(--acc)', color: '#fff' }}>{uploading ? 'Đang tạo giọng…' : 'Tải lên và tạo giọng clone'}</button>
      {uploading && <div aria-busy="true"><progress aria-label="Đang tạo giọng clone" /><p>Đã chờ {elapsed} giây. {elapsed >= 30 ? 'Engine có thể đang khởi tạo model hoặc chờ tác vụ âm thanh khác. Đừng gửi lại file trong lúc đang xử lý.' : 'Đang tải file và xử lý mẫu giọng…'}</p></div>}
      {message && <p role="status" style={{ margin: 0, lineHeight: 1.6 }}>{message}</p>}
    </form>
    <h2 style={{ margin: 0, fontSize: 18 }}>Giọng đã lưu ({clones.length})</h2>
    {actionMessage && <p role="status">{actionMessage}</p>}
    {!clones.length && <p>Chưa có giọng clone. Tải file mẫu ở trên để tạo giọng đầu tiên.</p>}
    {clones.map((voice) => <div key={voice.id} data-testid="clone-row" style={{ ...field, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <strong style={{ flex: 1 }}>{voice.name}</strong>
      <button type="button" disabled={!permitted || busy || uploading || saving} onClick={() => onPlay(voice.id)} style={button}>Nghe thử</button>
      <button type="button" disabled={!permitted || busy || uploading || saving} onClick={() => onPick(voice.id)} style={button}>Dùng giọng</button>
      <button type="button" disabled={!permitted || busy || uploading || saving} onClick={() => { setEditing(voice.id); setEditName(voice.name); setDeleting(null); setActionMessage(''); }} style={button}>Sửa tên</button>
      <button type="button" disabled={!permitted || busy || uploading || saving} onClick={() => { setDeleting(voice.id); setEditing(null); setActionMessage(''); }} style={button}>Xóa</button>
      {editing === voice.id && <form onSubmit={(e) => { e.preventDefault(); mutateVoice(voice.id); }} style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <input aria-label="Tên giọng mới" autoFocus required maxLength={80} value={editName} disabled={saving} onChange={(e) => setEditName(e.target.value)} style={{ ...field, flex: 1 }} />
        <button disabled={busy || uploading || saving || !editName.trim()} style={button}>{saving ? 'Đang lưu…' : 'Lưu tên'}</button>
        <button type="button" disabled={saving} onClick={() => setEditing(null)} style={button}>Hủy</button>
      </form>}
      {deleting === voice.id && <div style={{ width: '100%' }}>
        <p>Xóa giọng “{voice.name}” và file mẫu? Các bản ghi âm đã tạo vẫn được giữ lại.</p>
        <button type="button" disabled={!permitted || busy || uploading || saving} onClick={() => mutateVoice(voice.id, true)} style={button}>{saving ? 'Đang xóa…' : 'Xác nhận xóa'}</button>{' '}
        <button type="button" disabled={saving} onClick={() => setDeleting(null)} style={button}>Hủy</button>
      </div>}
    </div>)}
  </div>;
}
