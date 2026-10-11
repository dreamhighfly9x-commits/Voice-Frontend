import { useEffect, useMemo, useState } from 'react';
import { useAuth, usePermission } from '../lib/AuthContext';
import { apiJson } from '../lib/authApi';
import { createApiKey, listApiKeys, revokeApiKey, sessionToken } from '../lib/apiKeysApi';
import './ApiDocsScreen.css';

// Every endpoint, limit and error below mirrors the live Python API
// (Voice-Backend/app/main.py, access.py) — keep in sync when those change.
const SECTIONS = [
  ['intro', 'Giới thiệu'], ['auth', 'Xác thực'], ['keys', 'API Key'], ['tts', 'Chuyển văn bản'],
  ['clone', 'Clone giọng'], ['voices', 'Danh sách giọng'], ['usage', 'Hạn mức sử dụng'], ['limits', 'Giới hạn tần suất'], ['errors', 'Mã lỗi'],
];
const REFERENCE = [
  ['ref-synthesize', 'POST', '/api/synthesize'], ['ref-voices', 'GET', '/api/voices'], ['ref-download', 'GET', '/api/download/{file}'],
  ['ref-clones', 'POST', '/api/clones'], ['ref-usage', 'GET', '/api/local-usage'], ['ref-me', 'GET', '/api/me'],
];
const LANGS = [['curl', 'cURL'], ['js', 'JavaScript'], ['node', 'Node.js'], ['python', 'Python'], ['php', 'PHP']];
const ERRORS = [
  ['400', 'Nội dung rỗng, vượt giới hạn ký tự của hệ thống hoặc ID giọng không hợp lệ.'], ['401', 'Thiếu token, token sai hoặc đã hết hạn.'],
  ['403', 'Tài khoản chưa được cấp quyền (vd. tts.create, recordings.download).'], ['404', 'Không tìm thấy, hoặc tài nguyên không thuộc tài khoản của bạn.'],
  ['409', 'Xung đột dữ liệu hoặc tác vụ đang xử lý.'], ['413', 'File tải lên quá lớn (clone tối đa 20 MB).'],
  ['422', 'Dữ liệu gửi lên không hợp lệ; xem trường detail.'], ['429', 'Vượt hạn mức ký tự, số tác vụ đồng thời, số clone, dung lượng hoặc tần suất gọi.'],
  ['503', 'Model hoặc dịch vụ đăng nhập chưa sẵn sàng; thử lại sau.'],
];

function snippets(base) {
  const url = base + '/api/synthesize';
  const body = '{"text": "Xin chào, đây là DreamHigh Voice.", "voice": "VOICE_ID"}';
  return {
    curl: `curl -X POST "${url}" \\
  -H "Authorization: Bearer $DREAMHIGH_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '${body}'

# Tải file WAV vừa tạo (thay <id> bằng trường id trong kết quả)
curl -L "${base}/api/download/<id>.wav" \\
  -H "Authorization: Bearer $DREAMHIGH_TOKEN" -o speech.wav`,
    js: `// Chạy ở backend hoặc công cụ nội bộ. Không nhúng token vào code phía trình duyệt công khai.
const token = await getTokenFromYourServer();
const res = await fetch("${url}", {
  method: "POST",
  headers: { Authorization: \`Bearer \${token}\`, "Content-Type": "application/json" },
  body: JSON.stringify({ text: "Xin chào, đây là DreamHigh Voice.", voice: "VOICE_ID" }),
});
if (!res.ok) throw new Error((await res.json()).detail);
const recording = await res.json(); // { id, title, dur, url, ... }
const audio = await fetch("${base}/api/download/" + recording.id + ".wav", {
  headers: { Authorization: \`Bearer \${token}\` },
});
const blob = await audio.blob();`,
    node: `// Node.js 18+ (fetch có sẵn)
import { writeFile } from "node:fs/promises";

const token = process.env.DREAMHIGH_TOKEN;
const headers = { Authorization: \`Bearer \${token}\` };
const res = await fetch("${url}", {
  method: "POST",
  headers: { ...headers, "Content-Type": "application/json" },
  body: JSON.stringify({ text: "Xin chào, đây là DreamHigh Voice.", voice: "VOICE_ID" }),
});
if (!res.ok) throw new Error((await res.json()).detail);
const { id } = await res.json();
const wav = await fetch(\`${base}/api/download/\${id}.wav\`, { headers });
await writeFile("speech.wav", Buffer.from(await wav.arrayBuffer()));`,
    python: `import os
import requests

BASE = "${base}"
headers = {"Authorization": f"Bearer {os.environ['DREAMHIGH_TOKEN']}"}

res = requests.post(f"{BASE}/api/synthesize", headers=headers, timeout=300,
                    json={"text": "Xin chào, đây là DreamHigh Voice.", "voice": "VOICE_ID"})
res.raise_for_status()
recording = res.json()

wav = requests.get(f"{BASE}/api/download/{recording['id']}.wav", headers=headers, timeout=60)
wav.raise_for_status()
open("speech.wav", "wb").write(wav.content)`,
    php: `<?php
$base = "${base}";
$token = getenv("DREAMHIGH_TOKEN");

$ch = curl_init("$base/api/synthesize");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 300,
    CURLOPT_HTTPHEADER => ["Authorization: Bearer $token", "Content-Type: application/json"],
    CURLOPT_POSTFIELDS => json_encode(["text" => "Xin chào, đây là DreamHigh Voice.", "voice" => "VOICE_ID"]),
]);
$recording = json_decode(curl_exec($ch), true);
if (curl_getinfo($ch, CURLINFO_HTTP_CODE) !== 200) die($recording["detail"] ?? "Lỗi");

$ch = curl_init("$base/api/download/{$recording['id']}.wav");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => ["Authorization: Bearer $token"]]);
file_put_contents("speech.wav", curl_exec($ch));`,
  };
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const area = document.createElement('textarea');
    area.value = text; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0';
    document.body.appendChild(area); area.select();
    const ok = document.execCommand('copy'); area.remove(); return ok;
  }
}

function CopyButton({ text, label = 'Sao chép' }) {
  const [state, setState] = useState('');
  useEffect(() => { if (!state) return undefined; const t = setTimeout(() => setState(''), 1800); return () => clearTimeout(t); }, [state]);
  return <button type="button" className="apidocs-copy" onClick={async () => setState(await copyText(text) ? 'ok' : 'fail')} aria-label={label}>
    {state === 'ok' ? 'Đã chép' : state === 'fail' ? 'Không chép được' : 'Sao chép'}
  </button>;
}

function Code({ code, lang = '' }) {
  return <div className="apidocs-code"><div className="apidocs-code-bar"><span>{lang}</span><CopyButton text={code} label={'Sao chép mã ' + lang} /></div><pre><code>{code}</code></pre></div>;
}

function Endpoint({ id, method, path, perm, children }) {
  return <article className="apidocs-endpoint" id={id}>
    <h3><span className={'apidocs-method ' + method.toLowerCase()}>{method}</span><code>{path}</code></h3>
    {perm && <p className="apidocs-perm">Quyền cần có: <code>{perm}</code></p>}
    {children}
  </article>;
}

export default function ApiDocsScreen({ animStyle }) {
  const { user } = useAuth();
  const { can } = usePermission();
  const base = window.location.origin;
  const code = useMemo(() => snippets(base), [base]);
  const [lang, setLang] = useState('curl');
  const [usage, setUsage] = useState(null);
  const [keys, setKeys] = useState({ loading: true, supported: true, list: [] });
  const [newKey, setNewKey] = useState(null), [keyName, setKeyName] = useState(''), [keyError, setKeyError] = useState(''), [busy, setBusy] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const limits = user?.limits || {};

  useEffect(() => {
    let active = true;
    apiJson('/api/local-usage').then((u) => active && setUsage(u)).catch(() => active && setUsage({ unavailable: true }));
    listApiKeys().then((r) => active && setKeys({ loading: false, supported: r.supported, list: r.data || [] }))
      .catch((e) => active && (setKeys({ loading: false, supported: true, list: [] }), setKeyError(e.message)));
    return () => { active = false; };
  }, []);

  const create = async (e) => {
    e.preventDefault(); if (busy) return;
    setBusy(true); setKeyError('');
    try {
      const r = await createApiKey(keyName.trim() || 'API key');
      if (!r.supported) setKeys((k) => ({ ...k, supported: false }));
      else { setNewKey(r.data); setKeyName(''); const l = await listApiKeys(); setKeys({ loading: false, supported: true, list: l.data || [] }); }
    } catch (err) { setKeyError(err.message); } finally { setBusy(false); }
  };
  const revoke = async (key) => {
    if (busy || !window.confirm(`Thu hồi key "${key.name}"? Ứng dụng đang dùng key này sẽ ngừng hoạt động.`)) return;
    setBusy(true); setKeyError('');
    try { await revokeApiKey(key.id); setKeys((k) => ({ ...k, list: k.list.filter((x) => x.id !== key.id) })); }
    catch (err) { setKeyError(err.message); } finally { setBusy(false); }
  };

  const used = usage?.used_chars_month || 0, max = limits.max_chars_month || 0;
  const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const token = sessionToken();

  return <div className="apidocs" style={animStyle}>
    <nav className="apidocs-toc" aria-label="Mục lục tài liệu API">
      <small>API DOCS</small>
      {SECTIONS.map(([id, label]) => <a key={id} href={'#' + id}>{label}</a>)}
      <small>API REFERENCE</small>
      {REFERENCE.map(([id, method, path]) => <a key={id} href={'#' + id} className="apidocs-toc-ref"><span className={'apidocs-method ' + method.toLowerCase()}>{method}</span>{path.replace('/api', '')}</a>)}
      <a href="/swagger/index.html" target="_blank" rel="noreferrer" className="apidocs-toc-ext">Swagger đầy đủ ↗</a>
    </nav>

    <div className="apidocs-body">
      <section id="intro" className="apidocs-hero">
        <span className="apidocs-eyebrow">DREAMHIGH VOICE API</span>
        <h2>Tích hợp giọng nói tiếng Việt vào ứng dụng của bạn</h2>
        <p>Gọi đúng engine mà Studio đang dùng, qua HTTPS và JSON. Mỗi lần tạo trả về một bản ghi WAV mà bạn tải về bằng ID.</p>
        <div className="apidocs-base"><span>Base URL</span><code>{base}</code><CopyButton text={base} label="Sao chép Base URL" /></div>
        <h3>Bắt đầu nhanh</h3>
        <ol>
          <li>Lấy token ở mục <a href="#keys">API Key</a>.</li>
          <li>Gọi <a href="#ref-voices"><code>GET /api/voices</code></a> và chọn một <code>id</code> giọng.</li>
          <li>Gửi văn bản tới <a href="#ref-synthesize"><code>POST /api/synthesize</code></a>, rồi tải file bằng <code>id</code> trả về.</li>
        </ol>
      </section>

      <section id="auth">
        <h2>Xác thực</h2>
        <p>Mọi request (trừ <code>/api/health</code>) gửi header <code>Authorization: Bearer &lt;token&gt;</code>. API kiểm tra quyền và hạn mức của chính tài khoản sở hữu token.</p>
        <Code lang="http" code={'Authorization: Bearer <token>\nContent-Type: application/json'} />
        <p className="apidocs-warn">Giữ token ở phía máy chủ hoặc biến môi trường. Không commit vào git, không nhúng vào JavaScript của trang web công khai.</p>
      </section>

      <section id="keys">
        <h2>API Key</h2>
        {keys.loading ? <p role="status">Đang kiểm tra API key…</p> : keys.supported ? <>
          <p>Key dùng thay cho token ở header <code>Authorization: Bearer</code>. Key chỉ hiện <strong>một lần</strong> khi tạo, hãy lưu ngay.</p>
          {newKey?.key && <div className="apidocs-newkey" role="status"><strong>Key mới: {newKey.name}</strong><code>{newKey.key}</code><CopyButton text={newKey.key} label="Sao chép API key mới" /><small>Đóng mục này là không xem lại được key.</small><button type="button" onClick={() => setNewKey(null)}>Tôi đã lưu key</button></div>}
          <form className="apidocs-keyform" onSubmit={create}><input aria-label="Tên API key" maxLength={60} placeholder="Tên key, vd. Website bán hàng" value={keyName} onChange={(e) => setKeyName(e.target.value)} /><button className="apidocs-primary" disabled={busy}>{busy ? 'Đang tạo…' : '+ Tạo API key'}</button></form>
          <table className="apidocs-table"><thead><tr><th>Tên</th><th>Key</th><th>Tạo lúc</th><th>Dùng gần nhất</th><th /></tr></thead>
            <tbody>{keys.list.map((k) => <tr key={k.id}><td>{k.name}</td><td><code>{k.prefix}…</code></td><td>{k.created_at ? new Date(k.created_at).toLocaleDateString('vi-VN') : '-'}</td><td>{k.last_used_at ? new Date(k.last_used_at).toLocaleString('vi-VN') : 'Chưa dùng'}</td><td><button type="button" disabled={busy} onClick={() => revoke(k)}>Thu hồi</button></td></tr>)}
              {!keys.list.length && <tr><td colSpan={5}>Chưa có API key.</td></tr>}</tbody></table>
        </> : <>
          <p className="apidocs-note">Máy chủ hiện <strong>chưa bật API key dài hạn</strong>. Trong lúc chờ, bạn có thể thử API bằng access token của phiên đăng nhập này. Token hết hạn sau khoảng <strong>15 phút</strong>, chỉ dùng để thử nghiệm.</p>
          {token ? <div className="apidocs-newkey"><strong>Access token tạm thời</strong><code>{showToken ? token : token.slice(0, 12) + '•'.repeat(24)}</code>
            <div className="apidocs-row"><button type="button" onClick={() => setShowToken(!showToken)}>{showToken ? 'Ẩn' : 'Hiện'}</button><CopyButton text={token} label="Sao chép access token" /></div></div>
            : <p>Đăng nhập lại để lấy token.</p>}
          <p className="apidocs-muted">Lấy token mới bằng <code>POST /api/auth/login</code> (email, mật khẩu) như hướng dẫn trong Swagger.</p>
        </>}
        {keyError && <p role="alert" className="apidocs-error">{keyError}</p>}
      </section>

      <section id="tts">
        <h2>Chuyển văn bản thành giọng nói</h2>
        <p>Gửi văn bản và ID giọng. Request chờ đến khi tạo xong (có thể mất vài chục giây với văn bản dài), rồi trả về bản ghi. Đặt timeout phía client tối thiểu 5 phút.</p>
        {!can('tts.create') && <p className="apidocs-warn">Tài khoản của bạn chưa có quyền <code>tts.create</code>, gọi API sẽ nhận lỗi 403.</p>}
        <div className="apidocs-tabs" role="tablist" aria-label="Ngôn ngữ ví dụ">{LANGS.map(([id, label]) => <button key={id} role="tab" type="button" aria-selected={lang === id} onClick={() => setLang(id)}>{label}</button>)}</div>
        <Code lang={LANGS.find(([id]) => id === lang)[1]} code={code[lang]} />
      </section>

      <section id="clone">
        <h2>Clone giọng</h2>
        <p>Tải lên một file mẫu (tối đa 20 MB) kèm tên. Kết quả là một giọng riêng tư có <code>id</code> bắt đầu bằng <code>clone_</code>, dùng được ngay ở <code>voice</code> khi tạo giọng. Tính vào hạn mức số clone và dung lượng.</p>
        <Code lang="cURL" code={`curl -X POST "${base}/api/clones" \\\n  -H "Authorization: Bearer $DREAMHIGH_TOKEN" \\\n  -F "name=Giọng kể chuyện" \\\n  -F "file=@mau-giong.wav"`} />
      </section>

      <section id="voices">
        <h2>Danh sách giọng</h2>
        <p>Trả về giọng dựng sẵn, giọng clone của bạn và giọng cloud được phép dùng. Dùng trường <code>id</code> làm giá trị <code>voice</code>.</p>
        <Code lang="cURL" code={`curl "${base}/api/voices" -H "Authorization: Bearer $DREAMHIGH_TOKEN"`} />
      </section>

      <section id="usage">
        <h2>Hạn mức sử dụng</h2>
        <div className="apidocs-usage">
          <article><span>Ký tự tháng này</span><strong>{usage?.unavailable ? 'Không đọc được' : usage ? `${used.toLocaleString('vi-VN')} / ${max.toLocaleString('vi-VN')}` : '…'}</strong>{usage && !usage.unavailable && <div className="apidocs-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Đã dùng ký tự tháng này"><i style={{ width: pct + '%' }} /></div>}</article>
          <article><span>Giọng clone</span><strong>{usage && !usage.unavailable ? `${usage.clones || 0} / ${limits.max_clones ?? '-'}` : '…'}</strong></article>
          <article><span>Lưu trữ</span><strong>{usage && !usage.unavailable ? `${((usage.storage_bytes || 0) / 1048576).toFixed(1)} / ${limits.max_storage_mb ?? '-'} MB` : '…'}</strong></article>
        </div>
        <p>Đọc hạn mức bằng code: <code>GET /api/local-usage</code> (đã dùng) và <code>GET /api/me</code> trường <code>limits</code> (tối đa).</p>
      </section>

      <section id="limits">
        <h2>Giới hạn tần suất</h2>
        <table className="apidocs-table"><thead><tr><th>Giới hạn</th><th>Của bạn</th><th>Khi vượt</th></tr></thead><tbody>
          <tr><td>Ký tự mỗi lần tạo</td><td>{(limits.max_chars_request ?? 5000).toLocaleString('vi-VN')}</td><td>429 (400 nếu vượt giới hạn hệ thống)</td></tr>
          <tr><td>Ký tự mỗi tháng</td><td>{max ? max.toLocaleString('vi-VN') : '-'}</td><td>429</td></tr>
          <tr><td>Tác vụ chạy đồng thời</td><td>{limits.max_concurrent_jobs ?? 1}</td><td>429</td></tr>
          <tr><td>Giọng clone</td><td>{limits.max_clones ?? '-'}</td><td>429</td></tr>
          <tr><td>Dung lượng lưu trữ</td><td>{limits.max_storage_mb ? limits.max_storage_mb + ' MB' : '-'}</td><td>429</td></tr>
          <tr><td>Tạo bằng giọng cloud</td><td>20 lần / phút / nhà cung cấp</td><td>429</td></tr>
        </tbody></table>
        <p className="apidocs-muted">Khi nhận 429, chờ tác vụ trước hoàn tất rồi thử lại với backoff tăng dần. Tạo hàng loạt nên gửi tuần tự theo số tác vụ đồng thời.</p>
      </section>

      <section id="errors">
        <h2>Mã lỗi</h2>
        <p>Lỗi trả JSON có trường <code>detail</code> mô tả bằng tiếng Việt.</p>
        <Code lang="JSON" code={'{ "detail": "Đã vượt hạn mức ký tự. Liên hệ Admin để tăng hạn mức." }'} />
        <table className="apidocs-table"><thead><tr><th>HTTP</th><th>Ý nghĩa</th></tr></thead><tbody>{ERRORS.map(([c, d]) => <tr key={c}><td><code>{c}</code></td><td>{d}</td></tr>)}</tbody></table>
      </section>

      <section id="reference">
        <h2>API Reference</h2>
        <Endpoint id="ref-synthesize" method="POST" path="/api/synthesize" perm="tts.create, voices.read">
          <table className="apidocs-table"><thead><tr><th>Trường</th><th>Kiểu</th><th>Mô tả</th></tr></thead><tbody>
            <tr><td><code>text</code></td><td>string, bắt buộc</td><td>Văn bản cần đọc, tối đa {(limits.max_chars_request ?? 5000).toLocaleString('vi-VN')} ký tự.</td></tr>
            <tr><td><code>voice</code></td><td>string, bắt buộc</td><td>ID giọng lấy từ <code>GET /api/voices</code>.</td></tr>
            <tr><td><code>options</code></td><td>object</td><td>Tùy chọn riêng của model cloud (chỉ giọng <code>ext_…</code>).</td></tr>
          </tbody></table>
          <Code lang="Response 200" code={'{\n  "id": "3f9c0d…",\n  "title": "Xin chào, đây là DreamHigh Voice.",\n  "meta": "…",\n  "dur": "0:03",\n  "seed": 7,\n  "url": "/api/media/3f9c0d….wav"\n}'} />
        </Endpoint>
        <Endpoint id="ref-voices" method="GET" path="/api/voices" perm="voices.read">
          <p>Trả mảng giọng: <code>id</code>, <code>name</code>, <code>gender</code>, <code>tags</code>, <code>desc</code>, <code>provider_name</code>, <code>model_name</code>…</p>
        </Endpoint>
        <Endpoint id="ref-download" method="GET" path="/api/download/{id}.wav" perm="recordings.download">
          <p>Tải file WAV của bản ghi thuộc tài khoản. Trả dữ liệu nhị phân <code>audio/wav</code>.</p>
        </Endpoint>
        <Endpoint id="ref-clones" method="POST" path="/api/clones" perm="clones.create">
          <p>Multipart: <code>file</code> (âm thanh, tối đa 20 MB) và <code>name</code>. Trả đối tượng giọng mới.</p>
        </Endpoint>
        <Endpoint id="ref-usage" method="GET" path="/api/local-usage">
          <Code lang="Response 200" code={'{ "used_chars_month": 1240, "storage_bytes": 5242880, "clones": 1 }'} />
        </Endpoint>
        <Endpoint id="ref-me" method="GET" path="/api/me">
          <p>Thông tin tài khoản, <code>permissions</code> và <code>limits</code> (max_chars_month, max_chars_request, max_concurrent_jobs, max_clones, max_storage_mb).</p>
        </Endpoint>
        <p className="apidocs-muted">Danh mục đầy đủ (kịch bản, dự án, quản trị) và thử trực tiếp: <a href="/swagger/index.html" target="_blank" rel="noreferrer">Swagger</a>.</p>
      </section>
    </div>
  </div>;
}
