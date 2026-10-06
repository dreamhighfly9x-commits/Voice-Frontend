import { useRef, useState } from 'react';
import { apiFetch } from '../lib/authApi';
import { createZip } from '../lib/zip';
import { usePermission } from '../lib/AuthContext';
import AudioDownload from '../components/AudioDownload';
import GreenCheckbox from '../components/GreenCheckbox';
import { splitSentences } from '../lib/studioText';
import './WorkspaceScreens.css';
import './BatchScreen.css';

const STATUS_LABEL = { queued: 'Chờ', running: 'Đang chạy', done: 'Hoàn thành', error: 'Lỗi' };
const STATUS_TONE = {
  queued: ['var(--line2)', 'var(--dim)', 'var(--acc)'],
  running: ['var(--accSoft)', 'var(--accDeep)', 'var(--acc)'],
  done: ['var(--okBg)', 'var(--okInk)', '#1fa971'],
  error: ['var(--errBg)', 'var(--errInk)', '#c0392b'],
};

let nextKey = 0;
const newSegment = (text = '') => ({ key: ++nextKey, text, voice: '' });

// segment.voice '' follows the shared voice; any other id is a per-segment override.
function buildRows(segments, voices, sharedVoice, maxChars) {
  return segments.map((segment, i) => {
    const text = segment.text.trim();
    const match = voices.find((v) => v.id === (segment.voice || sharedVoice));
    let error = '';
    if (!text) error = 'Thiếu nội dung.';
    else if (!match) error = 'Chưa chọn giọng.';
    else if (text.length > maxChars) error = `Vượt quá ${maxChars.toLocaleString('vi-VN')} ký tự.`;
    return {
      id: `batch-${Date.now()}-${i}`,
      name: `Đoạn ${i + 1}: ${text}`,
      voiceId: match?.id || '',
      voiceName: match?.name || '',
      text,
      chars: text.length,
      status: error ? 'error' : 'queued',
      error,
      result: null,
    };
  });
}

export default function BatchScreen({ animStyle, voices, maxChars, onCreated, playingId, onPlay }) {
  const { can } = usePermission();
  const permitted = can('tts.create');
  const canDownload = can('recordings.download');
  const [source, setSource] = useState('');
  const [segments, setSegments] = useState([]);
  const [pickedShared, setSharedVoice] = useState('');
  const sharedVoice = voices.some((v) => v.id === pickedShared) ? pickedShared : voices[0]?.id || '';
  const sharedName = voices.find((v) => v.id === sharedVoice)?.name;
  const overrides = segments.filter((seg) => seg.voice).length;
  const updateSegment = (key, patch) => setSegments((list) => list.map((seg) => (seg.key === key ? { ...seg, ...patch } : seg)));
  const normalize = () => {
    const sentences = splitSentences(source, maxChars);
    setSource(sentences.join('\n'));
    setSegments(sentences.map((sentence) => newSegment(sentence)));
  };
  const [rows, setRows] = useState([]);
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [zipping, setZipping] = useState(false);
  const [zipError, setZipError] = useState('');
  const stopRef = useRef(false);
  const rowsRef = useRef([]);
  rowsRef.current = rows;

  const setRow = (id, patch) => setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const runRow = async (row) => {
    setRow(row.id, { status: 'running', error: '' });
    try {
      const response = await apiFetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: row.text, voice: row.voiceId }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof result?.detail === 'string' ? result.detail : 'Không tạo được âm thanh.');
      setRow(row.id, { status: 'done', result });
      onCreated?.(result);
    } catch (error) {
      setRow(row.id, { status: 'error', error: error.message });
    }
  };

  const runQueue = async (queue) => {
    if (!queue.length) return;
    stopRef.current = false;
    setRunning(true);
    for (const row of queue) {
      if (stopRef.current) break;
      await runRow(row);
    }
    setRunning(false);
  };

  const start = () => {
    if (running || !permitted) return;
    const parsed = buildRows(segments, voices, sharedVoice, maxChars);
    setRows(parsed);
    setSelected(new Set());
    runQueue(parsed.filter((r) => r.status === 'queued'));
  };

  const retryFailed = () => {
    if (running) return;
    const failed = rowsRef.current.filter((r) => r.status === 'error' && r.text && r.voiceId);
    if (!failed.length) return;
    failed.forEach((r) => setRow(r.id, { status: 'queued', error: '' }));
    runQueue(failed);
  };

  const stop = () => { stopRef.current = true; };

  const doneRows = rows.filter((r) => r.status === 'done' && r.result);
  const picked = doneRows.filter((r) => selected.has(r.id));
  const allPicked = doneRows.length > 0 && picked.length === doneRows.length;
  const toggle = (id) => setSelected((set) => { const next = new Set(set); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleAll = () => setSelected(allPicked ? new Set() : new Set(doneRows.map((r) => r.id)));

  const downloadZip = async () => {
    if (!picked.length || zipping) return;
    setZipping(true); setZipError('');
    try {
      const files = [];
      for (const r of picked) {
        const response = await apiFetch(r.result.url.replace('/api/media/', '/api/download/'));
        if (!response.ok) throw new Error('Không tải được một số file. Kiểm tra quyền tải hoặc đăng nhập lại.');
        const index = rows.indexOf(r) + 1;
        files.push({ name: `doan-${String(index).padStart(2, '0')}.wav`, data: new Uint8Array(await response.arrayBuffer()) });
      }
      const url = URL.createObjectURL(createZip(files));
      const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
      const a = document.createElement('a'); a.href = url; a.download = `hang-loat-${stamp}.zip`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setZipError(error.message); }
    finally { setZipping(false); }
  };

  const doneCount = rows.filter((r) => r.status === 'done').length;
  const errorCount = rows.filter((r) => r.status === 'error').length;
  const queuedCount = rows.filter((r) => r.status === 'queued' || r.status === 'running').length;
  const stats = [
    { label: 'Tổng mục', value: String(rows.length) },
    { label: 'Hoàn thành', value: String(doneCount), color: '#127a4e' },
    { label: 'Đang chạy / chờ', value: String(queuedCount), color: 'var(--acc)' },
    { label: 'Lỗi', value: String(errorCount), color: '#c0392b' },
  ];

  return (
    <div className="workspace-page" style={animStyle}>
      {!permitted && <p role="status">Admin chưa cấp quyền tạo âm thanh (tts.create) cho tài khoản này.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12.5, color: 'var(--dim)', fontWeight: 500 }}>{s.label}</span>
            <span style={{ fontSize: 23, fontWeight: 800, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      <section className="workspace-card batch-setup">
        <h3>1. Nhập văn bản</h3>
        <p>Dán đoạn văn dài. Bấm chuẩn hóa để gọn khoảng trắng và tách đoạn: văn bản đã xuống dòng thì mỗi dòng là một đoạn; chưa xuống dòng thì tách mỗi câu thành một đoạn. Câu dài hơn {maxChars.toLocaleString('vi-VN')} ký tự sẽ được chia nhỏ.</p>
        <textarea aria-label="Văn bản nguồn" rows={8} value={source} disabled={!permitted || running} placeholder="Dán văn bản cần đọc…" onChange={(e) => setSource(e.target.value)} />
        <div className="workspace-actions">
          <button type="button" className="primary" disabled={!permitted || running || !source.trim()} onClick={normalize}>Chuẩn hóa &amp; tách đoạn</button>
          <small>{source.trim().length.toLocaleString('vi-VN')} ký tự</small>
        </div>
      </section>

      {segments.length > 0 && (
        <section className="workspace-card batch-setup">
          <h3>2. Chọn giọng cho {segments.length} đoạn</h3>
          <div className="batch-default">
            <label>Giọng cho tất cả các đoạn
              <select aria-label="Giọng cho tất cả" value={sharedVoice} disabled={!permitted || running || !voices.length} onChange={(e) => setSharedVoice(e.target.value)}>
                {!voices.length && <option value="">Đang tải thư viện giọng…</option>}
                {voices.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </label>
            {onPlay && sharedVoice && (
              <button type="button" onClick={() => onPlay('v' + sharedVoice)}>{playingId === 'v' + sharedVoice ? 'Dừng nghe' : 'Nghe thử'}</button>
            )}
            {overrides > 0 && (
              <button type="button" disabled={running} onClick={() => setSegments((list) => list.map((seg) => ({ ...seg, voice: '' })))}>Bỏ {overrides} giọng riêng</button>
            )}
          </div>
          <p>Mỗi đoạn tạo một file âm thanh. Đổi giọng ở từng đoạn nếu cần giọng khác với giọng chung.</p>

          {segments.map((seg, i) => (
            <div className="batch-item" key={seg.key} data-testid="batch-item">
              <div className="batch-item-head">
                <strong>Đoạn {i + 1}</strong>
                <select aria-label={`Giọng đoạn ${i + 1}`} value={seg.voice} disabled={!permitted || running} onChange={(e) => updateSegment(seg.key, { voice: e.target.value })}>
                  <option value="">Theo giọng chung{sharedName ? ` (${sharedName})` : ''}</option>
                  {voices.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                <button type="button" aria-label={`Xóa đoạn ${i + 1}`} disabled={running} onClick={() => setSegments((list) => list.filter((s) => s.key !== seg.key))}>Xóa</button>
              </div>
              <textarea aria-label={`Nội dung đoạn ${i + 1}`} rows={2} value={seg.text} disabled={!permitted || running} onChange={(e) => updateSegment(seg.key, { text: e.target.value })} />
              <small className={seg.text.trim().length > maxChars ? 'batch-over' : ''}>{seg.text.trim().length.toLocaleString('vi-VN')} / {maxChars.toLocaleString('vi-VN')} ký tự</small>
            </div>
          ))}

          <div className="workspace-actions">
            <button type="button" disabled={!permitted || running} onClick={() => setSegments((list) => [...list, newSegment()])}>＋ Thêm đoạn</button>
            <button type="button" className="primary" disabled={!permitted || running || !segments.some((seg) => seg.text.trim())} onClick={start}>
              {running ? 'Đang chạy…' : 'Bắt đầu tạo hàng loạt'}
            </button>
            {running && <button type="button" onClick={stop}>Dừng sau mục hiện tại</button>}
            {!running && errorCount > 0 && <button type="button" onClick={retryFailed}>Thử lại {errorCount} mục lỗi</button>}
          </div>
        </section>
      )}

      {rows.length > 0 && (
        <div className="batch-download-bar">
          <label className="batch-check">
            <GreenCheckbox aria-label="Chọn tất cả file đã tạo" checked={allPicked} disabled={!doneRows.length} onChange={toggleAll} />
            Chọn tất cả ({doneRows.length} file đã tạo)
          </label>
          <button type="button" className="primary" disabled={!picked.length || zipping || !canDownload} title={canDownload ? '' : 'Admin chưa cấp quyền tải âm thanh'} onClick={downloadZip}>
            {zipping ? <><span className="batch-spinner" aria-hidden="true" /> Đang nén…</> : `Tải ${picked.length} file đã chọn (ZIP)`}
          </button>
          {zipError && <small role="alert" className="batch-over">{zipError}</small>}
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 18, overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '28px minmax(0,2fr) 140px 90px minmax(0,1fr) 130px 90px',
              padding: '11px 18px',
              background: 'var(--soft)',
              borderBottom: '1px solid var(--line2)',
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'var(--dim2)',
            }}
          >
            <span />
            <span>ĐOẠN</span>
            <span>GIỌNG</span>
            <span>KÝ TỰ</span>
            <span>GHI CHÚ</span>
            <span>TRẠNG THÁI</span>
            <span />
          </div>
          {rows.map((r) => {
            const [bg, fg] = STATUS_TONE[r.status];
            return (
              <div
                key={r.id}
                data-testid="batch-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px minmax(0,2fr) 140px 90px minmax(0,1fr) 130px 90px',
                  alignItems: 'center',
                  padding: '13px 18px',
                  borderBottom: '1px solid var(--line3)',
                  fontSize: 13.5,
                  gap: 8,
                }}
              >
                <GreenCheckbox className="small" aria-label={`Chọn ${r.name}`} checked={selected.has(r.id)} disabled={r.status !== 'done'} onChange={() => toggle(r.id)} />
                <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                <span style={{ color: 'var(--ink2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.voiceName || '—'}</span>
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, color: 'var(--dim)' }}>{r.chars}</span>
                <span style={{ fontSize: 12, color: r.status === 'error' ? '#c0392b' : 'var(--dim2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.error || ''}</span>
                <span style={{ background: bg, color: fg, borderRadius: 999, padding: '4px 10px', fontSize: 11.5, fontWeight: 700, justifySelf: 'start', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {r.status === 'running' && <span className="batch-spinner" aria-hidden="true" />}
                  {r.status === 'done' && <span className="batch-done" aria-hidden="true">✓</span>}
                  {STATUS_LABEL[r.status]}
                </span>
                {r.status === 'done' && r.result ? <AudioDownload url={r.result.url} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '6px 9px', fontSize: 11.5, fontWeight: 600 }} /> : <span />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
