import { useState } from 'react';
import { usePermission } from '../lib/AuthContext';
import { apiJson } from '../lib/authApi';
import { MATRIX_ROWS, PERMISSION_LABELS, randomPassword } from '../lib/permissionMatrix';

export default function CreateEmployee({ roles, onCreated, onCancel }) {
  const { can } = usePermission();
  const assignable = roles.filter((r) => r.key !== 'super_admin' && r.permissions.every(can));
  const [draft, setDraft] = useState({ name: '', email: '', password: '', role: assignable.find((r) => r.key === 'user')?.key || assignable[0]?.key || '' });
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [showPassword, setShowPassword] = useState(false);
  const role = assignable.find((r) => r.key === draft.role);
  const pages = MATRIX_ROWS.filter((row) => row.cells.view?.every((key) => role?.permissions.includes(key)));
  const change = (key, value) => setDraft((previous) => ({ ...previous, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    if (busy || !role || !can('users.update')) return;
    setBusy(true); setError('');
    try {
      await apiJson('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...draft, name: draft.name.trim(), email: draft.email.trim() }) });
    } catch (err) { setError(err.message); setBusy(false); return; }
    await onCreated();
  };
  return <section className="admin-card employee-create-page">
    <div className="admin-editor-title"><div><h3>Thêm nhân viên</h3><p className="admin-muted">Tạo tài khoản và gán bộ quyền theo vai trò.</p></div><button disabled={busy} onClick={onCancel}>← Danh sách nhân viên</button></div>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <form onSubmit={submit}><fieldset disabled={busy || !can('users.update')}>
      <div className="employee-create-grid"><div className="admin-fields">
        <label className="roles-wide">Tên hiển thị<input autoFocus maxLength={80} autoComplete="name" value={draft.name} onChange={(e) => change('name', e.target.value)} /></label>
        <label className="roles-wide">Email<input required type="email" autoComplete="email" value={draft.email} onChange={(e) => change('email', e.target.value)} /></label>
        <label className="roles-wide">Vai trò<select required value={draft.role} onChange={(e) => change('role', e.target.value)}><option value="" disabled>Chọn vai trò</option>{assignable.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}</select></label>
        {!assignable.length && <p role="alert">Chưa có vai trò bạn được phép cấp. Liên hệ quản trị viên để thiết lập vai trò.</p>}
        <label className="roles-wide">Mật khẩu ban đầu<input required type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={12} maxLength={128} value={draft.password} onChange={(e) => change('password', e.target.value)} /></label>
        <div className="admin-inline roles-wide"><button type="button" onClick={() => { change('password', randomPassword()); setShowPassword(true); }}>Tạo ngẫu nhiên</button><button type="button" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}</button></div>
        <p className="admin-muted roles-wide">Tối thiểu 12 ký tự. Tài khoản được xác thực ngay; gửi mật khẩu ban đầu cho nhân viên qua kênh riêng.</p>
      </div><aside className="employee-permission-preview" aria-label="Quyền của nhân viên">
        <h4>Quyền theo vai trò</h4>{role ? <><strong>{role.name}</strong><p className="admin-muted">{role.description || `${role.permissions.length} quyền được cấp`}</p>
          <h4>Trang / chức năng được truy cập</h4>{pages.length ? <ul>{pages.map((row) => <li key={row.id}>{row.label}</li>)}</ul> : <p>Chưa cấp quyền truy cập chức năng riêng.</p>}
          <p className="admin-muted">Các trang dùng chung như Tổng quan, Hồ sơ và Thư viện âm thanh vẫn khả dụng. Dữ liệu được giới hạn theo tài khoản.</p>
          <details><summary>Chi tiết {role.permissions.length} quyền</summary><ul>{role.permissions.map((key) => <li key={key}>{PERMISSION_LABELS[key] || key}</li>)}</ul></details>
        </> : <p>Chọn vai trò để xem quyền trước khi tạo tài khoản.</p>}
      </aside></div>
      <div className="admin-actions"><button className="admin-primary" disabled={!role}>{busy ? 'Đang tạo…' : 'Tạo tài khoản'}</button><button type="button" onClick={onCancel}>Hủy</button></div>
    </fieldset></form>
  </section>;
}
