import { PublicHeader, PublicFooter } from './LandingPage';

export default function PublicApiDocs() {
  const base = window.location.origin;
  return <div className="landing-page"><PublicHeader /><main className="lp-container lp-section lp-docs"><span className="lp-eyebrow">DREAMHIGH VOICE · DEVELOPER DOCUMENTATION</span><h1>Đưa giọng nói<br />vào sản phẩm của bạn.</h1><p>Tạo âm thanh từ văn bản qua HTTP API. Bạn có thể đọc tài liệu này mà không cần tài khoản; gửi yêu cầu tạo giọng cần xác thực và quyền truy cập phù hợp.</p>
    <h2>1. Xác thực</h2><p>Gửi token qua header <code>Authorization: Bearer TOKEN</code>. Đăng nhập để quản lý API key và xem quyền của tài khoản. Lưu token ở phía máy chủ, không đưa vào mã nguồn trình duyệt công khai.</p>
    <h2>2. Chọn giọng và tạo âm thanh</h2><p>Lấy ID giọng từ <code>GET /api/voices</code>, sau đó dùng ID đó ở trường <code>voice</code>. Giọng khả dụng và giới hạn văn bản phụ thuộc vào tài khoản.</p>
    <pre><code>{`const base = "${base}";
const headers = {
  Authorization: \`Bearer \${process.env.DREAMHIGH_TOKEN}\`,
  "Content-Type": "application/json",
};
const response = await fetch(base + "/api/synthesize", {
  method: "POST",
  headers,
  body: JSON.stringify({
    text: "Xin chào, đây là DreamHigh Voice.",
    voice: "VOICE_ID",
  }),
});
if (!response.ok) throw new Error(await response.text());
const recording = await response.json();
// recording: { id, title, dur, url, ... }`}</code></pre>
    <h2>3. Tải kết quả</h2><p>Gửi yêu cầu có xác thực tới <code>/api/download/ID.wav</code>, thay ID bằng trường <code>id</code> trong kết quả tạo giọng. Tài khoản cần quyền tải bản ghi.</p>
    <h2>Các endpoint chính</h2>{[['GET', '/api/voices', 'Danh sách giọng khả dụng cho tài khoản.'], ['POST', '/api/synthesize', 'Tạo âm thanh từ text và voice.'], ['GET', '/api/download/{id}.wav', 'Tải file WAV thuộc tài khoản đang xác thực.']].map(([method,path,desc]) => <div className="lp-endpoint" key={path}><code>{method} {path}</code><p>{desc}</p></div>)}
    <h2>Xử lý lỗi</h2><p>401: token không hợp lệ hoặc hết hạn. 403: tài khoản chưa có quyền. 422: dữ liệu chưa hợp lệ. 429: vượt hạn mức hoặc tần suất. 503: dịch vụ chưa sẵn sàng. Kiểm tra trường <code>detail</code> trong phản hồi lỗi để biết thêm thông tin.</p><a href="/login?next=api" className="lp-button">Đăng nhập để quản lý API <span aria-hidden="true">↗</span></a>
  </main><PublicFooter /></div>;
}
