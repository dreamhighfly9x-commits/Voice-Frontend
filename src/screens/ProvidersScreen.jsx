import { useCallback, useEffect, useState } from 'react';
import { usePermission } from '../lib/AuthContext';
import {
  listProviders, createProvider, updateProvider, deleteProvider,
  testProvider, syncVoices, getModels, getVoices,
} from '../lib/providersApi';
import './ProvidersScreen.css';

// Only provider types the backend REGISTRY actually supports. base = official
// API URL enforced server-side; docs = official documentation.
const TYPES = {
  elevenlabs: { label: 'ElevenLabs', base: 'https://api.elevenlabs.io/v1', custom: false,
    docs: 'https://elevenlabs.io/docs/api-reference/authentication',
    features: ['Text to Speech', 'Voice Library', 'Voice Cloning', 'Streaming'] },
  openai: { label: 'OpenAI', base: 'https://api.openai.com/v1', custom: false,
    docs: 'https://platform.openai.com/docs/guides/text-to-speech',
    features: ['Text to Speech', '10 giọng dựng sẵn', 'gpt-4o-mini-tts'] },
  vieneu: { label: 'VieNeu (hosted)', base: 'https://api.vieneu.io/api/v1', custom: false, backendType: 'vieneu',
    docs: 'https://www.vieneu.io/#/developer',
    features: ['TTS tiếng Việt', 'Engine v3 & v4', 'Chỉ cần API key'] },
  genmax: { label: 'GenMax', base: 'https://api.genmax.io', custom: false, backendType: 'genmax',
    docs: 'https://genmax.io/docs', features: ['ElevenLabs cộng đồng', 'Chỉ cần API key', 'Đồng bộ nhiều trang'] },
  custom: { label: 'Custom API', base: '', custom: true,
    docs: '', features: ['Tự cấu hình endpoint', 'Bearer / Header auth', 'binary · url · base64'] },
};

const STATUS = {
  connected: ['ok', 'Đã kết nối'], error: ['bad', 'Lỗi kết nối'], untested: ['idle', 'Chưa kiểm tra'],
};

function Stat({ label, value }) {
  return <div className="prov-stat"><span className="prov-stat__v">{value}</span><span className="prov-stat__l">{label}</span></div>;
}

function blankCustomConfig() {
  return {
    test_endpoint: '/v1/models', synthesis_endpoint: '/v1/tts', method: 'POST',
    auth_type: 'bearer', auth_header: 'X-API-Key', response_type: 'binary',
    text_parameter: 'text', voice_parameter: 'voice', model_parameter: 'model',
  };
}

export default function ProvidersScreen({ animStyle }) {
  const { can } = usePermission();
  const [items, setItems] = useState([]);
  const [encReady, setEncReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [wizard, setWizard] = useState(null);     // {step,type,form,progress,error}
  const [manage, setManage] = useState(null);      // provider being managed
  const [confirmId, setConfirmId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await listProviders();
      setItems(data.items || []);
      setEncReady(data.encryption_ready !== false);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t); }, [load]);

  if (!can('providers.manage')) {
    return <div className="prov-page"><h2>Không có quyền</h2><p>Bạn cần quyền quản lý nguồn TTS. Liên hệ Admin.</p></div>;
  }

  const flash = (m) => { setNotice(m); setError(''); setTimeout(() => setNotice(''), 3200); };
  const voicesChanged = () => window.dispatchEvent(new Event('voices-changed'));

  const stats = {
    connected: items.filter((p) => p.status === 'connected').length,
    voices: items.reduce((s, p) => s + (p.voices_count || 0), 0),
    models: items.reduce((s, p) => s + (p.models_count || 0), 0),
    active: `${items.filter((p) => p.enabled).length}/${items.length || 0}`,
  };

  const runTest = async (id) => {
    setBusy(id); setError('');
    try { const r = await testProvider(id); await load(); flash(r.message || 'Kết nối thành công.'); }
    catch (e) { await load(); setError(e.message); } finally { setBusy(''); }
  };
  const runSync = async (id) => {
    setBusy(id); setError('');
    try { const r = await syncVoices(id); await load(); voicesChanged(); flash(`Đã đồng bộ ${r.models} model, ${r.voices} giọng.`); }
    catch (e) { await load(); setError(e.message); } finally { setBusy(''); }
  };
  const toggle = async (p) => {
    setBusy(p.id); setError('');
    try { await updateProvider(p.id, { name: p.name, provider_type: p.provider_type, base_url: p.base_url, enabled: !p.enabled, config: p.config, version: p.version }); await load(); voicesChanged(); }
    catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const remove = async (id) => {
    setBusy(id); setError('');
    try { await deleteProvider(id); setConfirmId(null); await load(); voicesChanged(); flash('Đã xóa provider (audio đã tạo vẫn giữ).'); }
    catch (e) { setError(e.message); } finally { setBusy(''); }
  };

  return (
    <div className="prov-page" style={animStyle}>
      <div className="prov-head">
        <div>
          <h2>API & Nguồn giọng</h2>
          <p>Kết nối các dịch vụ TTS và đồng bộ giọng nói vào DreamHigh Voice. API key được mã hóa và lưu ở máy chủ — không bao giờ gửi về trình duyệt.</p>
        </div>
        <button className="prov-btn prov-btn--primary" onClick={() => setWizard({ step: 1, type: '', form: {}, progress: '', error: '' })}>+ Kết nối nguồn mới</button>
      </div>

      <div className="prov-stats">
        <Stat label="Nguồn đã kết nối" value={stats.connected} />
        <Stat label="Tổng số giọng" value={stats.voices} />
        <Stat label="Model khả dụng" value={stats.models} />
        <Stat label="Đang hoạt động" value={stats.active} />
      </div>

      {!encReady && <div className="prov-banner prov-banner--warn">Chưa cấu hình <code>TTS_ENCRYPTION_KEY</code> (32 byte base64) trên máy chủ — không thể lưu/giải mã API key.</div>}
      {error && <div className="prov-banner prov-banner--error">{error}</div>}
      {notice && <div className="prov-banner prov-banner--ok">{notice}</div>}

      <h3 className="prov-section">Nguồn TTS</h3>
      {loading ? <div className="prov-skeleton">Đang tải…</div>
        : items.length === 0 ? (
          <div className="prov-empty">
            Bạn chưa kết nối nguồn TTS nào.
            <div><button className="prov-btn prov-btn--primary" onClick={() => setWizard({ step: 1, type: '', form: {}, progress: '', error: '' })}>+ Kết nối nguồn đầu tiên</button></div>
          </div>
        ) : (
          <div className="prov-grid">
            {items.map((p) => {
              const [cls, label] = STATUS[p.status] || STATUS.untested;
              return (
                <div className="prov-card" key={p.id}>
                  <div className="prov-card__top">
                    <div><h3>{p.name}</h3><span className="prov-type">{TYPES[p.provider_type]?.label || p.provider_type}</span></div>
                    <span className={'prov-dot prov-dot--' + cls}>● {label}</span>
                  </div>
                  <div className="prov-card__stats"><span>{p.models_count || 0} model</span><span>{p.voices_count || 0} giọng</span><span>{p.has_credentials ? 'Có API key' : 'Chưa có key'}</span></div>
                  <label className="prov-toggle"><input type="checkbox" checked={p.enabled} disabled={busy === p.id} onChange={() => toggle(p)} /><span>{p.enabled ? 'Đang bật' : 'Đang tắt'}</span></label>
                  <div className="prov-actions">
                    <button className="prov-btn" disabled={busy === p.id} onClick={() => setManage(p)}>Quản lý</button>
                    <button className="prov-btn" disabled={busy === p.id} onClick={() => runSync(p.id)}>Đồng bộ</button>
                    <button className="prov-btn" disabled={busy === p.id} onClick={() => runTest(p.id)}>Kiểm tra</button>
                    <button className="prov-btn prov-btn--danger" disabled={busy === p.id} onClick={() => setConfirmId(p.id)}>Xóa</button>
                  </div>
                  {confirmId === p.id && (
                    <div className="prov-confirm">Xóa nguồn này? Audio đã tạo vẫn giữ, giọng chuyển sang không khả dụng.
                      <div><button className="prov-btn prov-btn--danger" disabled={busy === p.id} onClick={() => remove(p.id)}>Xóa hẳn</button><button className="prov-btn" onClick={() => setConfirmId(null)}>Hủy</button></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {wizard && <ConnectWizard state={wizard} setState={setWizard} onDone={async () => { setWizard(null); await load(); voicesChanged(); flash('Đã kết nối nguồn mới.'); }} />}
      {manage && <ManagePanel provider={manage} onClose={() => setManage(null)} onChanged={load} />}
    </div>
  );
}

// ── Connect wizard ────────────────────────────────────────────────────────
function ConnectWizard({ state, setState, onDone }) {
  const { step, type, form } = state;
  const meta = TYPES[type];
  const set = (patch) => setState((s) => ({ ...s, ...patch }));
  const setForm = (patch) => setState((s) => ({ ...s, form: { ...s.form, ...patch } }));

  const pick = (t) => {
    const T = TYPES[t];
    const config = T.preset ? JSON.parse(JSON.stringify(T.preset)) : T.custom ? blankCustomConfig() : {};
    set({ type: t, step: 2, form: { name: T.label, base_url: T.base, api_key: '', config }, error: '' });
  };

  const run = async () => {
    set({ step: 3, progress: 'Đang lưu cấu hình…', error: '' });
    try {
      const body = { name: form.name.trim(), provider_type: meta.backendType || type, base_url: (form.base_url || meta.base).trim(),
        api_key: form.api_key || undefined, enabled: false, config: meta.custom ? form.config : {} };
      const created = await createProvider(body);
      set({ progress: 'Đang kiểm tra kết nối…' });
      await testProvider(created.id);
      set({ progress: 'Đang đồng bộ model và giọng…' });
      const sync = await syncVoices(created.id);
      await updateProvider(created.id, { name: created.name, provider_type: type, base_url: created.base_url, enabled: true, config: created.config, version: created.version });
      set({ step: 4, result: sync });
    } catch (e) { set({ step: 2, error: e.message }); }
  };

  return (
    <div className="prov-modal" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setState(null); }}>
      <div className="prov-form">
        <div className="prov-steps">{['Chọn nguồn', 'Thông tin', 'Kết nối', 'Hoàn tất'].map((s, i) => <span key={s} className={'prov-step' + (step === i + 1 ? ' on' : step > i + 1 ? ' done' : '')}>{i + 1}. {s}</span>)}</div>

        {step === 1 && <>
          <h3>Kết nối nguồn TTS</h3>
          <p className="prov-hint">Chọn dịch vụ bạn muốn kết nối với DreamHigh Voice.</p>
          <div className="prov-pick">
            {Object.entries(TYPES).map(([id, t]) => (
              <button key={id} className="prov-pick__item" onClick={() => pick(id)}>
                <b>{t.label}</b>
                <span>{t.features.join(' · ')}</span>
              </button>
            ))}
          </div>
          <div className="prov-form__actions"><button className="prov-btn" onClick={() => setState(null)}>Hủy</button></div>
        </>}

        {step === 2 && <>
          <h3>{meta.label} — thông tin</h3>
          {state.error && <div className="prov-banner prov-banner--error">{state.error}</div>}
          <label>Tên hiển thị<input value={form.name} maxLength={80} onChange={(e) => setForm({ name: e.target.value })} /></label>
          <label>API Key<input type="password" autoComplete="off" value={form.api_key} onChange={(e) => setForm({ api_key: e.target.value })} /></label>
          {meta.docs && <a className="prov-link" href={meta.docs} target="_blank" rel="noreferrer">API key lấy ở đâu?</a>}
          {meta.custom && <>
            <label>Base URL<input value={form.base_url} placeholder="https://api.example.com" onChange={(e) => setForm({ base_url: e.target.value })} /></label>
            <div className="prov-hint">Host phải nằm trong allowlist <code>TTS_ALLOWED_HOSTS</code> của máy chủ.</div>
            <CustomConfig config={form.config} onChange={(c) => setForm({ config: c })} />
          </>}
          <div className="prov-form__actions">
            <button className="prov-btn" onClick={() => set({ step: 1, error: '' })}>Quay lại</button>
            <button className="prov-btn prov-btn--primary" disabled={!form.name?.trim()} onClick={run}>Kết nối & Đồng bộ</button>
          </div>
        </>}

        {step === 3 && <div className="prov-progress"><div className="prov-spin" /><span>{state.progress}</span></div>}

        {step === 4 && <>
          <div className="prov-done">✓</div>
          <h3>Đã kết nối {meta.label}</h3>
          <p className="prov-hint">Đồng bộ {state.result?.models} model và {state.result?.voices} giọng. Nguồn đã được bật; giọng xuất hiện trong Thư viện giọng.</p>
          <div className="prov-form__actions"><button className="prov-btn prov-btn--primary" onClick={onDone}>Hoàn tất</button></div>
        </>}
      </div>
    </div>
  );
}

const ADVANCED_KEYS = ['body_template', 'models', 'voices', 'headers'];

function CustomConfig({ config, onChange }) {
  const set = (patch) => onChange({ ...config, ...patch });
  const [advText, setAdvText] = useState(() => {
    const adv = Object.fromEntries(ADVANCED_KEYS.filter((k) => k in config).map((k) => [k, config[k]]));
    return Object.keys(adv).length ? JSON.stringify(adv, null, 2) : '';
  });
  const [advErr, setAdvErr] = useState('');
  const onAdv = (text) => {
    setAdvText(text);
    if (!text.trim()) { setAdvErr(''); const c = { ...config }; ADVANCED_KEYS.forEach((k) => delete c[k]); onChange(c); return; }
    try {
      const parsed = JSON.parse(text);
      const c = { ...config };
      ADVANCED_KEYS.forEach((k) => delete c[k]);
      for (const [k, v] of Object.entries(parsed)) if (ADVANCED_KEYS.includes(k)) c[k] = v;
      onChange(c); setAdvErr('');
    } catch { setAdvErr('JSON chưa hợp lệ.'); }
  };
  return (
    <div className="prov-custom">
      <div className="prov-row">
        <label>Endpoint synth<input value={config.synthesis_endpoint || ''} onChange={(e) => set({ synthesis_endpoint: e.target.value })} /></label>
        <label>Endpoint test<input value={config.test_endpoint || ''} onChange={(e) => set({ test_endpoint: e.target.value })} /></label>
      </div>
      <div className="prov-row">
        <label>HTTP Method<select value={config.method || 'POST'} onChange={(e) => set({ method: e.target.value })}><option>POST</option><option>PUT</option></select></label>
        <label>Auth<select value={config.auth_type || 'bearer'} onChange={(e) => set({ auth_type: e.target.value })}><option value="bearer">Bearer Token</option><option value="header">Header</option><option value="none">None</option></select></label>
        {config.auth_type === 'header' && <label>Auth header<input value={config.auth_header || 'X-API-Key'} onChange={(e) => set({ auth_header: e.target.value })} /></label>}
      </div>
      <div className="prov-row">
        <label>Response<select value={config.response_type || 'binary'} onChange={(e) => set({ response_type: e.target.value })}><option value="binary">Audio Binary</option><option value="url">Audio URL</option><option value="base64">Base64</option></select></label>
        {config.response_type !== 'binary' && <label>Response field<input value={config.response_field || ''} placeholder={config.response_type === 'url' ? 'audio_url' : 'audio_base64'} onChange={(e) => set({ response_field: e.target.value })} /></label>}
      </div>
      <div className="prov-hint">Tham số: text=<code>{'{{TEXT}}'}</code>, voice=<code>{'{{VOICE_ID}}'}</code> (dùng được cả trong Endpoint synth), model=<code>{'{{MODEL}}'}</code>, options=<code>{'{{OPTIONS}}'}</code>. Không đặt API key trong cấu hình.</div>
      <label>Cấu hình nâng cao (JSON) <em>(body_template, models, voices, headers)</em>
        <textarea value={advText} rows={8} spellCheck={false} placeholder='{"body_template":{...},"models":[...],"voices":[...]}' onChange={(e) => onAdv(e.target.value)} />
      </label>
      {advErr && <span style={{ color: 'var(--err)', fontSize: 12 }}>{advErr}</span>}
    </div>
  );
}

// ── Manage panel ──────────────────────────────────────────────────────────
function ManagePanel({ provider, onClose, onChanged }) {
  const [tab, setTab] = useState('overview');
  const [models, setModels] = useState(null);
  const [voices, setVoices] = useState(null);
  const [form, setForm] = useState({ name: provider.name, base_url: provider.base_url, api_key: '', enabled: provider.enabled });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (tab === 'models' && !models) getModels(provider.id).then(setModels).catch((e) => setErr(e.message));
    if (tab === 'voices' && !voices) getVoices(provider.id).then(setVoices).catch((e) => setErr(e.message));
  }, [tab, models, voices, provider.id]);

  const save = async () => {
    setBusy(true); setErr(''); setMsg('');
    try {
      await updateProvider(provider.id, { name: form.name.trim(), provider_type: provider.provider_type, base_url: form.base_url.trim(),
        api_key: form.api_key || undefined, enabled: form.enabled, config: provider.config, version: provider.version });
      setMsg('Đã lưu. Nếu đổi API key, hãy đồng bộ lại giọng.'); await onChanged(); onClose();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const TABS = [['overview', 'Tổng quan'], ['models', 'Models'], ['voices', 'Giọng'], ['settings', 'Cài đặt'], ['usage', 'Sử dụng'], ['logs', 'Nhật ký']];

  return (
    <div className="prov-modal" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="prov-form prov-form--wide">
        <div className="prov-card__top"><h3>{provider.name}</h3><button className="prov-btn" onClick={onClose}>Đóng</button></div>
        <div className="prov-tabs">{TABS.map(([id, l]) => <button key={id} className={'prov-tab' + (tab === id ? ' on' : '')} onClick={() => setTab(id)}>{l}</button>)}</div>
        {err && <div className="prov-banner prov-banner--error">{err}</div>}
        {msg && <div className="prov-banner prov-banner--ok">{msg}</div>}

        {tab === 'overview' && <div className="prov-card__stats prov-overview">
          <span>Trạng thái: {(STATUS[provider.status] || STATUS.untested)[1]}</span>
          <span>Loại: {TYPES[provider.provider_type]?.label || provider.provider_type}</span>
          <span>Base URL: {provider.base_url}</span>
          <span>{provider.models_count || 0} model · {provider.voices_count || 0} giọng</span>
          <span>{provider.enabled ? 'Đang bật' : 'Đang tắt'}</span>
        </div>}

        {tab === 'models' && <div className="prov-list">{!models ? 'Đang tải…' : models.length === 0 ? 'Chưa đồng bộ model.' : models.map((m) => <div key={m.id} className="prov-list__row"><b>{m.name}</b><span>{m.id}</span><span>{Object.keys((m.capabilities || {}).options || {}).join(', ') || '—'}</span></div>)}</div>}

        {tab === 'voices' && <div className="prov-list">{!voices ? 'Đang tải…' : voices.length === 0 ? 'Chưa có giọng. Bấm Đồng bộ.' : voices.map((v) => <div key={v.id} className="prov-list__row"><b>{v.name}</b><span>{v.language} · {v.gender || '—'}</span><span>{v.is_active ? 'Khả dụng' : 'Ẩn'}</span></div>)}</div>}

        {tab === 'settings' && <>
          <label>Tên<input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></label>
          {TYPES[provider.provider_type]?.custom && <label>Base URL<input value={form.base_url} onChange={(e) => setForm((f) => ({ ...f, base_url: e.target.value }))} /></label>}
          <label>API Key <em>(để trống nếu giữ key hiện tại)</em><input type="password" autoComplete="off" placeholder={provider.has_credentials ? '••••••••' : ''} value={form.api_key} onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))} /></label>
          <label className="prov-inline"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} /> Cho phép người dùng (tts.cloud) dùng nguồn này</label>
          <div className="prov-form__actions"><button className="prov-btn prov-btn--primary" disabled={busy} onClick={save}>{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</button></div>
        </>}

        {tab === 'usage' && <div className="prov-hint">Thống kê sử dụng theo provider sẽ hiển thị ở đây khi có dữ liệu yêu cầu. Hiện dựa trên nhật ký yêu cầu nội bộ.</div>}
        {tab === 'logs' && <div className="prov-hint">Nhật ký yêu cầu (thời gian · hành động · trạng thái · độ trễ) — không ghi API key. Sẽ hiển thị khi có yêu cầu tới nguồn này.</div>}
      </div>
    </div>
  );
}
