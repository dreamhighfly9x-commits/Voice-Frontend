import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import BrandLogo from '../components/BrandLogo';
import NeonAI from '../components/NeonAI';
import LoadingIndicator from '../components/LoadingIndicator';
import '../styles/publicBrand.css';
import './AuthScreen.css';
export default function AuthScreen({ subtitle = '', initialMode = 'login', onLoginStart, onLoginFailure }) {
  const { login, register, verifyEmail, finishGoogleMFA } = useAuth();
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleMFA, setGoogleMFA] = useState(() => new URLSearchParams(window.location.search).get('google_mfa') === '1');
  const [googleCode, setGoogleCode] = useState('');
  const [mode, setMode] = useState(initialMode); // login | register | verify
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(() => {
    const messages = {
      invalid_state: 'Phiên đăng nhập Google không hợp lệ. Vui lòng thử lại.',
      expired: 'Phiên đăng nhập Google đã hết hạn. Vui lòng thử lại.',
      cancelled: 'Bạn đã hủy đăng nhập Google.',
      existing_account: 'Email này đã có tài khoản. Hãy đăng nhập bằng mật khẩu của bạn.',
      account_unavailable: 'Tài khoản hiện không thể đăng nhập. Vui lòng liên hệ hỗ trợ.',
      failed: 'Không thể đăng nhập Google. Vui lòng thử lại.',
    };
    return messages[new URLSearchParams(window.location.search).get('google_error')] || '';
  });
  const [notice, setNotice] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/auth/google/config', { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(config => setGoogleEnabled(config?.enabled === true)).catch(() => {});
    return () => controller.abort();
  }, []);

  const startGoogle = () => {
    const next = new URLSearchParams(window.location.search).get('next');
    window.location.assign('/api/auth/google/start' + (next ? '?next=' + encodeURIComponent(next) : ''));
  };

  const goto = (next) => {
    setGoogleMFA(false);
    setGoogleCode('');
    setMode(next);
    setError('');
    setNotice('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (googleMFA) {
        onLoginStart?.();
        await finishGoogleMFA(googleCode);
      } else if (mode === 'login') {
        onLoginStart?.();
        await login(email, password);
      } else if (mode === 'register') {
        await register(email, password);
        setNotice('Đã ghi nhận đăng ký. Nhập token xác thực được cung cấp để hoàn tất tài khoản.');
        setMode('verify');
      } else {
        await verifyEmail(token);
        setNotice('Đã xác thực email — đăng nhập lại để tiếp tục.');
        setMode('login');
      }
    } catch (err) {
      onLoginFailure?.();
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return <main className="voice-auth">
    <div className="voice-auth-layout">
      <section className="voice-auth-story" aria-label="DreamHigh Voice Studio">
        <div className="voice-auth-art"><NeonAI /></div>
        <div className="voice-auth-story-copy">
          <div className="voice-auth-kicker">MỖI GIỌNG NÓI, MỘT DẤU ẤN</div>
          <h1>Ý tưởng của bạn.<br/><span>Thanh âm vô hạn.</span></h1>
          <p>Biến những dòng chữ thành câu chuyện.<br/>Để thế giới lắng nghe sắc màu riêng của bạn.</p>
          <div className="voice-auth-story-bottom"><span className="voice-auth-sound" aria-hidden="true">{[12,24,34,20,28].map((height,i)=><i key={i} style={{height}}/>)}</span><div><strong>DreamHigh Voice</strong><span>Không gian sáng tạo của bạn</span></div><span className="voice-auth-story-arrow" aria-hidden="true">↗</span></div>
        </div>
      </section>
      <section className="voice-auth-panel" aria-labelledby="auth-title">
        <header className="voice-auth-header"><a href="/" aria-label="DreamHigh Voice — Trang chủ"><BrandLogo className="future-brand"/></a><span>TIẾNG VIỆT</span></header>
        <div className="voice-auth-form-wrap">
          <div className="voice-auth-tabs" aria-label="Tài khoản"><button type="button" aria-pressed={mode==='login'} disabled={busy} onClick={()=>goto('login')}>Đăng nhập</button><button type="button" aria-pressed={mode==='register'} disabled={busy} onClick={()=>goto('register')}>Đăng ký</button></div>
          <h2 id="auth-title">{googleMFA?'Xác thực hai bước.':mode==='login'?'Chào mừng trở lại.':mode==='register'?'Bắt đầu sáng tạo.':'Xác thực email.'}</h2>
          <p className="voice-auth-intro">{googleMFA?'Nhập mã từ ứng dụng xác thực hoặc mã khôi phục của bạn.':mode==='login'?(subtitle || 'Đăng nhập để tiếp tục câu chuyện của bạn.'):mode==='register'?'Một tài khoản. Vô vàn thanh âm để khám phá.':'Nhập token để hoàn tất xác thực tài khoản.'}</p>
          {notice&&<p className="voice-auth-notice" role="status">{notice}</p>}{error&&<p className="voice-auth-error" role="alert">{error}</p>}
          {busy && <LoadingIndicator label="Đang xử lý…" />}
          <form onSubmit={submit}>
            {googleMFA ? <div className="voice-auth-field"><label htmlFor="google-otp">Mã xác thực hoặc mã khôi phục</label><input id="google-otp" autoComplete="one-time-code" required maxLength={128} value={googleCode} disabled={busy} onChange={e=>setGoogleCode(e.target.value)} /></div> : mode !== 'verify' ? <>
              <div className="voice-auth-field"><label htmlFor="auth-email">Email</label><input id="auth-email" type="email" autoComplete="email" placeholder="ban@example.com" required value={email} disabled={busy} onChange={e=>setEmail(e.target.value)} /></div>
              <div className="voice-auth-field"><label htmlFor="auth-password">Mật khẩu</label><div className="voice-auth-password"><input id="auth-password" type={showPassword?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} placeholder="Ít nhất 8 ký tự" required minLength={8} value={password} disabled={busy} onChange={e=>setPassword(e.target.value)} /><button type="button" disabled={busy} onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword?'Ẩn mật khẩu':'Hiện mật khẩu'}>{showPassword?'Ẩn':'Hiện'}</button></div></div>
              <div className="voice-auth-divider"><span>hoặc tiếp tục với</span></div>
              <button className="voice-auth-google" type="button" disabled={busy || !googleEnabled} onClick={startGoogle} aria-describedby={!googleEnabled ? "auth-google-note" : undefined}><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.93a6 6 0 0 1 0-3.86V7.48H3.06a10 10 0 0 0 0 9.04l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.83 1.51L18.7 4.6A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.48l3.34 2.59A5.98 5.98 0 0 1 12 5.95Z"/></svg>{mode==='register'?'Đăng ký bằng Google':'Đăng nhập bằng Google'}</button>
              {!googleEnabled && <p id="auth-google-note" className="voice-auth-google-note">Đăng nhập Google chưa khả dụng.</p>}
            </> : <div className="voice-auth-field"><label htmlFor="auth-token">Token xác thực email</label><input id="auth-token" required value={token} disabled={busy} onChange={e=>setToken(e.target.value)} /></div>}
            <button className="voice-auth-submit" type="submit" disabled={busy}>{busy?'Đang xử lý…':mode==='login'?'Đăng nhập':mode==='register'?'Tạo tài khoản':'Xác thực'}<span aria-hidden="true">→</span></button>
          </form>
          {mode!=='verify'&&<p className="voice-auth-switch">{mode==='login'?'Chưa có tài khoản?':'Đã có tài khoản?'} <button type="button" disabled={busy} onClick={()=>goto(mode==='login'?'register':'login')}>{mode==='login'?'Đăng ký miễn phí':'Đăng nhập ngay'}</button></p>}
          <button className="voice-auth-link" type="button" disabled={busy} onClick={()=>goto(mode==='verify'?'login':'verify')}>{mode==='verify'?'Quay lại đăng nhập':'Đã có token xác thực email?'}</button>
        </div>
        <footer className="voice-auth-panel-foot"><span>© {new Date().getFullYear()} DreamHigh Voice</span><a href="/">Về trang chủ ↗</a></footer>
      </section>
    </div>
  </main>;
}
