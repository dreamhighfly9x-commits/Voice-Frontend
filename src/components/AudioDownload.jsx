import { useState } from 'react';
import { apiFetch, apiJson } from '../lib/authApi';
import { usePermission } from '../lib/AuthContext';

export default function AudioDownload({ url, style, className, filename }) {
  const { can } = usePermission();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const download = async () => {
    setBusy(true); setError('');
    try {
      const response = await apiFetch(url.replace('/api/media/', '/api/download/'));
      if (!response.ok) throw new Error('Không được phép tải hoặc phiên đã hết hạn.');
      const objectUrl = URL.createObjectURL(await response.blob());
      const a = document.createElement('a'); a.href = objectUrl; a.download = filename ? filename.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').slice(0,120).replace(/\.wav$/i,'')+'.wav' : url.split('/').pop(); a.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      const key=url.split('/').pop().replace('.wav','');
      if (/^[0-9a-f]{32}$/.test(key)) apiJson('/api/dashboard/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({recording:key,action:'download'})}).catch(()=>{});
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <span><button type="button" style={style} className={className} disabled={busy || !can('recordings.download')} title={!can('recordings.download') ? 'Admin chưa cấp quyền tải âm thanh' : ''} onClick={download}>{busy ? 'Đang tải…' : 'Tải WAV'}</button>{error && <small role="alert">{error}</small>}</span>;
}
