import { useMemo, useState } from 'react';
import { usePermission } from '../lib/AuthContext';
import { apiJson } from '../lib/authApi';
import { MATRIX_COLUMNS, MATRIX_KEYS, MATRIX_ROWS, PERMISSION_LABELS, rowKeys, slugifyRole, toggleCell } from '../lib/permissionMatrix';

const blank = { id: null, key: '', name: '', description: '', permissions: [] };

export default function RolesPanel({ roles, catalog, onChanged, loading = false }) {
  const { can } = usePermission();
  const [draft, setDraft] = useState(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const known = useMemo(() => new Set(catalog.map((p) => p.key)), [catalog]);
  const others = catalog.filter((p) => !MATRIX_KEYS.has(p.key));
  const locked = draft && roles.find((r) => r.id === draft.id)?.locked;
  const selected = new Set(draft?.permissions || []);
  const label = (key) => PERMISSION_LABELS[key] || catalog.find((p) => p.key === key)?.description || key;

  const open = (role) => { setDraft(role ? { ...role } : { ...blank }); setQuery(''); setError(''); setNotice(''); };
  const setPerms = (set) => setDraft({ ...draft, permissions: [...set] });
  const cellState = (keys) => { const n = keys.filter((k) => selected.has(k)).length; return n === 0 ? false : n === keys.length ? true : 'mixed'; };
  // Nobody can grant what they don't hold; the server enforces the same rule.
  const grantable = (keys) => keys.every((k) => can(k) || selected.has(k));

  const save = async (e) => {
    e.preventDefault(); if (busy) return;
    setBusy(true); setError(''); setNotice('');
    const body = { key: draft.key, name: draft.name, description: draft.description, permissions: draft.permissions.filter((k) => known.has(k)) };
    try {
      const result = await apiJson(draft.id ? '/api/admin/roles/' + draft.id : '/api/admin/roles', { method: draft.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setNotice(result?.message || 'Đã lưu vai trò.');
      setDraft({ ...draft, id: draft.id || result?.id });
      await onChanged();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (busy || !window.confirm(`Xóa vai trò "${draft.name}"?`)) return;
    setBusy(true); setError('');
    try { await apiJson('/api/admin/roles/' + draft.id, { method: 'DELETE' }); setDraft(null); setNotice('Đã xóa vai trò.'); await onChanged(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const checkbox = (row, column, key) => {
    const keys = (key ? [key] : row.cells[column]).filter((k) => known.has(k));
    if (!keys.some((k) => known.has(k))) return <span className="role-na" aria-hidden="true">-</span>;
    const state = cellState(keys);
    const name = `${row.label}: ${key ? label(key) : MATRIX_COLUMNS.find(([c]) => c === column)[1]}`;
    const required = [...keys, ...(column !== 'view' ? row.cells.view || [] : [])];
    const allowed = state === true || required.every((k) => known.has(k) && (can(k) || selected.has(k)));
    return <input type="checkbox" aria-label={name} title={allowed ? keys.join(', ') : 'Bạn không có đủ quyền truy cập và thao tác để cấp'}
      checked={state === true} ref={(el) => { if (el) el.indeterminate = state === 'mixed'; }}
      disabled={locked || !allowed} onChange={(e) => setPerms(toggleCell(selected, row, column, key, e.target.checked))} />;
  };
  const toggleRow = (row, on) => {
    if (on && (row.cells.view || []).some((k) => !known.has(k) || (!can(k) && !selected.has(k)))) return;
    const next = new Set(selected);
    rowKeys(row).filter((k) => known.has(k) && (!on || can(k))).forEach((k) => (on ? next.add(k) : next.delete(k)));
    setPerms(next);
  };
  const pages = MATRIX_ROWS.filter((row) => row.cells.view?.every((k) => selected.has(k))).length;
  const search = (text) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const visibleRows = MATRIX_ROWS.filter((row) => rowKeys(row).some((k) => known.has(k)) && search(row.label + ' ' + row.group).includes(search(query)));

  return <div className="roles-layout">
    {!draft && <section className="admin-card">
      <div className="admin-editor-title"><h3>Vai trò</h3><button className="admin-primary" disabled={busy || loading} onClick={() => open(null)}>+ Tạo vai trò</button></div>
      <p className="admin-muted">Vai trò là bộ quyền mặc định. Gán vai trò khi tạo nhân viên; ngoại lệ chỉnh riêng ở tab Nhân viên.</p>
      <div className="admin-users">{roles.map((r) => <button key={r.id} className={'admin-user ' + (draft?.id === r.id ? 'selected' : '')} disabled={busy} onClick={() => open(r)}>
        <span className="admin-avatar">{r.name.slice(0, 1).toUpperCase()}</span>
        <span className="admin-user-info"><strong>{r.name}</strong><small>{r.description || r.key}</small>
          <span className="admin-badges"><span>{r.permissions.length} quyền</span><span>{r.user_count} nhân viên</span>{r.is_system && <span>Hệ thống</span>}</span></span>
        <span aria-hidden="true">›</span></button>)}</div>
      {notice && <p role="status" className="admin-success">{notice}</p>}
    </section>}
    {draft && <section className="admin-card">
      <form onSubmit={save}>
        <div className="admin-editor-title"><div><h3>{draft.id ? draft.name : 'Vai trò mới'}</h3><small>{selected.size} quyền · {pages} trang / chức năng có điều kiện</small></div><button type="button" disabled={busy} onClick={() => setDraft(null)}>← Danh sách vai trò</button></div>
        {error && <p role="alert" className="admin-error">{error}</p>}{notice && <p role="status" className="admin-success">{notice}</p>}
        {locked && <p className="admin-note">Vai trò {draft.name} luôn có toàn bộ quyền để tránh khóa hệ thống, nên chỉ xem được.</p>}
        <fieldset disabled={busy}>
          <div className="admin-fields">
            <label>Tên vai trò<input required maxLength={60} value={draft.name} disabled={locked} onChange={(e) => setDraft({ ...draft, name: e.target.value, key: draft.id ? draft.key : slugifyRole(e.target.value) })} /></label>
            <label>Mã (tự sinh)<input required readOnly={!!draft.id} pattern="[a-z][a-z0-9_]{1,31}" maxLength={32} value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value })} /></label>
            <label className="roles-wide">Mô tả<input maxLength={200} value={draft.description} disabled={locked} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
            {!draft.id && <label className="roles-wide">Sao chép quyền từ<select value="" onChange={(e) => { const src = roles.find((r) => String(r.id) === e.target.value); if (src) setDraft({ ...draft, permissions: src.permissions.filter((k) => can(k)) }); }}><option value="">- Bắt đầu trống -</option>{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>}
          </div>
          <h4>Ma trận quyền</h4>
          <p className="admin-muted">Bật một hành động sẽ tự bật quyền truy cập trang; tắt truy cập sẽ tắt mọi hành động của trang đó.</p>
          <p className="admin-note">Các trang dùng chung như Tổng quan, Hồ sơ và Thư viện âm thanh luôn khả dụng. Một số chức năng dùng chung quyền truy cập và thao tác; ô “—” nghĩa là chưa có quyền riêng.</p>
          <div className="admin-toolbar"><input aria-label="Tìm trang trong ma trận" placeholder="Tìm trang hoặc nhóm chức năng…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <div className="roles-matrix-wrap"><table className="roles-matrix">
            <thead><tr><th scope="col">Trang / chức năng</th>{MATRIX_COLUMNS.map(([id, name]) => <th scope="col" key={id}>{name}</th>)}</tr></thead>
            <tbody>{visibleRows.map((row, index) => {
              const header = row.group !== visibleRows[index - 1]?.group ? row.group : null;
              const all = cellState(rowKeys(row).filter((k) => known.has(k)));
              return [header && <tr key={'g-' + header} className="roles-group"><th colSpan={MATRIX_COLUMNS.length + 1}>{header}</th></tr>,
                <tr key={row.id}>
                  <th scope="row"><label className="admin-check"><input type="checkbox" aria-label={'Toàn bộ ' + row.label} checked={all === true} ref={(el) => { if (el) el.indeterminate = all === 'mixed'; }} disabled={locked} onChange={(e) => toggleRow(row, e.target.checked)} />{row.label}</label></th>
                  {MATRIX_COLUMNS.map(([column]) => <td key={column}>{column === 'extra'
                    ? (row.cells.extra ? <div className="roles-extra">{row.cells.extra.filter((k) => known.has(k)).map((k) => <label key={k} className="admin-check">{checkbox(row, 'extra', k)}{label(k)}</label>)}</div> : <span className="role-na" aria-hidden="true">-</span>)
                    : row.cells[column] ? checkbox(row, column) : <span className="role-na" aria-hidden="true">-</span>}</td>)}
                </tr>];
            })}</tbody>
          </table></div>
          {!visibleRows.length && <p role="status" className="admin-muted">Không có trang phù hợp.</p>}
          {others.length > 0 && <><h4>Quyền khác</h4><div className="roles-extra">{others.map((p) => <label key={p.key} className="admin-check"><input type="checkbox" checked={selected.has(p.key)} disabled={locked || !grantable([p.key])} onChange={(e) => { const next = new Set(selected); if (e.target.checked) next.add(p.key); else next.delete(p.key); setPerms(next); }} />{label(p.key)}</label>)}</div></>}
          {!locked && <div className="admin-actions"><button className="admin-primary">{busy ? 'Đang lưu…' : draft.id ? 'Lưu vai trò' : 'Tạo vai trò'}</button>
            {draft.id && !roles.find((r) => r.id === draft.id)?.is_system && <button type="button" onClick={remove}>Xóa vai trò</button>}</div>}
        </fieldset>
      </form>
    </section>}
  </div>;
}
