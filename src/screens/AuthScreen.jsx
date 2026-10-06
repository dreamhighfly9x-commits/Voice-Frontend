import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import BrandLogo from '../components/BrandLogo';
import NeonAI from '../components/NeonAI';
import LoadingIndicator from '../components/LoadingIndicator';
import WaveInput from '../components/WaveInput';
import './AuthScreen.css';
export default function AuthScreen({ subtitle = '', onLoginStart, onLoginFailure }) {
  const { login, register, verifyEmail } = useAuth();
  const [mode, setMode] = useState('login'); // login | register | verify
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const goto = (next) => {
    setMode(next);
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        onLoginStart?.();
        await login(email, password);
      } else if (mode === 'register') {
        await register(email, password);
        setNotice('Đã ghi nhận đăng ký. Backend chưa nối SMTP (dev): lấy link xác thực trong log server, hoặc dán token xác thực bên dưới.');
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
    <header className="voice-auth-header"><BrandLogo className="future-brand"/><span>YOUR VOICE. BEYOND LIMITS.</span></header>
    <div className="voice-auth-layout">
      <section className="voice-auth-story" aria-label="DreamHigh Voice Studio">
        <div className="voice-auth-art"><NeonAI/></div>
        <div className="voice-auth-story-copy"><div className="voice-auth-kicker">◈ CÔNG NGHỆ AI · DẤU ẤN CỦA BẠN</div><h1>Khơi nguồn sáng tạo.<br/><span>Chạm đến tương lai.</span></h1><p>Biến văn bản thành giọng nói tự nhiên. Kể câu chuyện của bạn bằng thanh âm mang dấu ấn riêng.</p><div className="voice-auth-features"><span>Chuyển văn bản thành giọng nói</span><span>Nhân bản giọng nói</span><span>Đa ngôn ngữ</span></div></div>
        <div className="voice-auth-signal" aria-hidden="true"><span>VOICE ENGINE</span><div>{Array.from({length:35},(_,i)=><i key={i} style={{height:8+Math.abs(Math.sin(i*1.7))*25}}/>)}</div><span>01 / AUDIO</span></div>
      </section>
      <section className="voice-auth-panel">
        <div className="voice-auth-panel-top"><span>DREAMHIGH ACCOUNT</span><span>↗</span></div>
        <div className="voice-auth-tabs"><button type="button" aria-pressed={mode==='login'} disabled={busy} onClick={()=>goto('login')}>Đăng nhập</button><button type="button" aria-pressed={mode==='register'} disabled={busy} onClick={()=>goto('register')}>Đăng ký</button></div>
        <h2>{mode==='login'?'Chào mừng trở lại.':mode==='register'?'Bắt đầu sáng tạo.':'Xác thực email.'}</h2>
        <p className="voice-auth-intro">{mode==='login'?subtitle:mode==='register'?'Tạo tài khoản để khám phá giọng nói của riêng bạn.':'Nhập token để hoàn tất xác thực tài khoản.'}</p>
        {notice&&<p className="voice-auth-notice" role="status">{notice}</p>}{error&&<p className="voice-auth-error" role="alert">{error}</p>}
        {busy && <LoadingIndicator label="Đang xử lý…" />}
        <form onSubmit={submit}>
          {mode !== 'verify' ? <>
            <WaveInput id="auth-email" label="Email address" type="email" autoComplete="email" required value={email} disabled={busy} onChange={e=>setEmail(e.target.value)} />
            <WaveInput id="auth-password" label="Password" type={showPassword?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} required minLength={8} value={password} disabled={busy} onChange={e=>setPassword(e.target.value)}>
              <button type="button" disabled={busy} onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword?'Ẩn mật khẩu':'Hiện mật khẩu'}>{showPassword?'Ẩn':'Hiện'}</button>
            </WaveInput>
          </> : <WaveInput id="auth-token" label="Token xác thực email" required value={token} disabled={busy} onChange={e=>setToken(e.target.value)} />}
          <button className="voice-auth-submit" type="submit" disabled={busy}>{busy?'Đang xử lý…':mode==='login'?'Đăng nhập':mode==='register'?'Tạo tài khoản':'Xác thực'}<span aria-hidden="true">→</span></button>
        </form>
        <button className="voice-auth-link" type="button" disabled={busy} onClick={()=>goto(mode==='verify'?'login':'verify')}>{mode==='verify'?'Quay lại đăng nhập':'Đã có token xác thực email?'}</button>
        <div className="voice-auth-panel-foot">◇ Không gian riêng cho giọng nói của bạn</div>
      </section>
    </div>
    <footer className="voice-auth-footer"><span>© {new Date().getFullYear()} DreamHigh Voice</span><span>CREATED TO BE HEARD</span></footer>
  </main>;
}
