import { useState } from 'react';

export default function DeleteRecording({ recording, onDelete }) {
  const [busy, setBusy] = useState(false);
  if (!onDelete) return null;
  return <button type="button" disabled={busy} aria-label={`Xóa bản ghi ${recording.title}`}
    style={{border:'1px solid var(--line)',borderRadius:8,padding:'7px 10px',fontSize:12,color:'var(--errInk)',cursor:'pointer'}}
    onClick={async()=>{
      if (!window.confirm(`Xóa bản ghi “${recording.title}”? File âm thanh sẽ bị xóa. Đoạn kịch bản dùng bản ghi này cần tạo lại.`)) return;
      setBusy(true);
      try { await onDelete(recording.id); } finally { setBusy(false); }
    }}>{busy ? 'Đang xóa…' : 'Xóa'}</button>;
}
