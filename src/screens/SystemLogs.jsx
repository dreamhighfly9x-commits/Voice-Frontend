import { useCallback, useEffect, useState } from 'react';
import { apiJson } from '../lib/authApi';

// Warn/error lines from every backend service (tts-api, auth-api, worker),
// read from the shared Redis list via GET /api/admin/logs (newest first).
const SERVICE_LABEL = { 'tts-api': 'TTS API (Python)', 'auth-api': 'Auth API (Go)', worker: 'Worker (Go)' };
const LEVEL_LABEL = { error: 'Lỗi', warn: 'Cảnh báo', fatal: 'Nghiêm trọng' };
const BASE_KEYS = new Set(['timestamp', 'level', 'message', 'service', 'version', 'env', 'logger', 'caller', 'request_id', 'error']);

function summary(entry) {
  const parts = [];
  if (entry.method && entry.path) parts.push(`${entry.method} ${entry.path}${entry.status ? ' → ' + entry.status : ''}`);
  if (entry.error?.message) parts.push(entry.error.message);
  if (entry.detail) parts.push(entry.detail);
  return parts.join(' · ');
}

export default function SystemLogs() {
  const [entries, setEntries] = useState([]);
  const [level, setLevel] = useState('');
  const [service, setService] = useState('');
  const [query, setQuery] = useState('');
  const [auto, setAuto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadedAt, setLoadedAt] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '500' });
      if (level) params.set('level', level);
      if (service) params.set('service', service);
      const body = await apiJson('/api/admin/logs?' + params);
      setEntries(body?.entries || []);
      setError('');
      setLoadedAt(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [level, service]);

  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);
  useEffect(() => {
    if (!auto) return undefined;
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [auto, load]);

  const needle = query.trim().toLowerCase();
  const visible = needle ? entries.filter((e) => JSON.stringify(e).toLowerCase().includes(needle)) : entries;
  const errors = entries.filter((e) => e.level === 'error' || e.level === 'fatal').length;

  return (
    <section className="admin-card">
      <div className="admin-editor-title">
        <h3>Lỗi &amp; cảnh báo từ backend</h3>
        <small>{errors} lỗi · {entries.length - errors} cảnh báo{loadedAt ? ` · cập nhật ${loadedAt.toLocaleTimeString('vi-VN')}` : ''}</small>
      </div>
      <p className="admin-muted">Tối đa 1.000 dòng gần nhất (cảnh báo và lỗi) từ TTS API, Auth API và Worker. Bấm mã request để xem mọi dòng của cùng một yêu cầu.</p>
      <div className="admin-toolbar">
        <input aria-label="Tìm trong nhật ký" placeholder="Tìm message, đường dẫn, request id…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select aria-label="Lọc mức độ" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">Mọi mức độ</option>
          <option value="error">Chỉ lỗi</option>
          <option value="warn">Chỉ cảnh báo</option>
        </select>
        <select aria-label="Lọc dịch vụ" value={service} onChange={(e) => setService(e.target.value)}>
          <option value="">Mọi dịch vụ</option>
          {Object.entries(SERVICE_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <label className="admin-check"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Tự làm mới 10s</label>
        <button type="button" onClick={load} disabled={loading}>{loading ? 'Đang tải…' : 'Tải lại'}</button>
      </div>
      {error && <p role="alert" className="admin-error">{error}</p>}
      <div className="admin-logs">
        {visible.map((entry, i) => {
          const fields = Object.fromEntries(Object.entries(entry).filter(([k]) => !BASE_KEYS.has(k)));
          return (
            <article key={entry.timestamp + entry.message + i} data-testid="log-entry" className={'admin-log admin-log-' + entry.level}>
              <div className="admin-log-head">
                <span className="admin-log-level">{LEVEL_LABEL[entry.level] || entry.level}</span>
                <strong>{entry.message}</strong>
                <span className="admin-log-service">{SERVICE_LABEL[entry.service] || entry.service}</span>
                <time>{new Date(entry.timestamp).toLocaleString('vi-VN')}</time>
              </div>
              {summary(entry) && <p className="admin-log-summary">{summary(entry)}</p>}
              <div className="admin-log-meta">
                {entry.request_id && <button type="button" className="admin-log-rid" title="Lọc theo request này" onClick={() => setQuery(entry.request_id)}>request {entry.request_id}</button>}
                {entry.caller && <small>{entry.caller}</small>}
              </div>
              <details>
                <summary>Chi tiết</summary>
                {Object.keys(fields).length > 0 && <pre>{JSON.stringify(fields, null, 2)}</pre>}
                {entry.error?.stack && <pre>{entry.error.stack}</pre>}
                {!Object.keys(fields).length && !entry.error?.stack && <pre>{JSON.stringify(entry, null, 2)}</pre>}
              </details>
            </article>
          );
        })}
        {!visible.length && !loading && !error && <p className="admin-empty">Không có lỗi hay cảnh báo nào{needle || level || service ? ' khớp bộ lọc' : ''}.</p>}
      </div>
    </section>
  );
}
