import { useCallback, useEffect, useState } from 'react';
import { useAuth, usePermission } from '../lib/AuthContext';
import { apiJson } from '../lib/authApi';
import SystemLogs from './SystemLogs';
import RolesPanel from './RolesPanel';
import CreateEmployee from './CreateEmployee';
import { PERMISSION_LABELS, adminTabs } from '../lib/permissionMatrix';
import './AdminScreen.css';
const labels = PERMISSION_LABELS;
const limits = [['max_chars_month','Ký tự / tháng',0,100000000],['max_chars_request','Ký tự / lần tạo',1,5000],['max_concurrent_jobs','Tác vụ đồng thời',1,32],['max_clones','Giọng clone tối đa',0,1000],['max_storage_mb','Lưu trữ (MB)',1,1000000]];
export default function AdminScreen({ animStyle }) {
 const { user } = useAuth(); const { can } = usePermission();
 const [users,setUsers]=useState([]),[catalog,setCatalog]=useState([]),[roles,setRoles]=useState([]),[audit,setAudit]=useState([]),[selected,setSelected]=useState(null);
 const tabs=adminTabs(can),canList=can('users.list');
 const [requestedTab,setTab]=useState(tabs[0]||'users'),[query,setQuery]=useState(''),[statusFilter,setStatusFilter]=useState('all');
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [creating,setCreating]=useState(false);
 const [rolesError,setRolesError]=useState('');
 const tab=tabs.includes(requestedTab)?requestedTab:tabs[0];
 const [localUsage,setLocalUsage]=useState({});
 const load=useCallback(async()=>{
  setLoading(true);setError('');
  const list=(v)=>Array.isArray(v)?v:[];
  const [u,p,r]=await Promise.allSettled([canList?apiJson('/api/admin/users'):[],apiJson('/api/admin/permissions'),apiJson('/api/admin/roles')]);
  if(u.status==='fulfilled')setUsers(list(u.value));
  if(p.status==='fulfilled')setCatalog(list(p.value));
  if(r.status==='fulfilled'&&(r.value===null||Array.isArray(r.value))){setRoles(list(r.value));setRolesError('');}
  else {setRoles([]);setRolesError('Không tải được danh sách vai trò. Hãy thử tải lại hoặc liên hệ quản trị viên để kiểm tra dịch vụ phân quyền.');}
  const failed=[u,p].find(result=>result.status==='rejected');
  if(failed)setError(failed.reason.message);
  setLoading(false);
 },[canList]);
 useEffect(()=>{if(user?.roles?.includes('super_admin')||['users.list','roles.manage'].some(p=>user?.permissions?.includes(p))) {const timer=setTimeout(load,0);return()=>clearTimeout(timer);}},[load,user]);
 const showAudit=async()=>{setTab('audit');setError('');try{setAudit(await apiJson('/api/admin/audit?limit=100')||[]);}catch(e){setError(e.message);}};
 const select=async(u)=>{
  setSelected({...u,role:u.roles.find(r=>r!=='super_admin')||'user',overrides:{...u.overrides}});setError('');setNotice('');setLocalUsage({});
  try{const value=await apiJson('/api/local-usage/'+u.id);setLocalUsage({...value,id:u.id});}catch{setLocalUsage({unavailable:true,id:u.id});}
 };
 const save=async(e)=>{e.preventDefault();if(busy)return;setBusy(true);setError('');setNotice('');
  try {await apiJson('/api/admin/users/'+selected.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(selected)});setNotice('Đã lưu. Quyền và hạn mức có hiệu lực với yêu cầu tiếp theo.');await load();setSelected(null);}catch(e){setError(e.message);}finally{setBusy(false);}
 };
 if(!tabs.length)return <div className="admin-page"><h2>Không có quyền quản trị</h2><p>Liên hệ Admin để được cấp quyền.</p></div>;
 const visible=users.filter(u=>(u.email+' '+u.name).toLowerCase().includes(query.toLowerCase())&&(statusFilter==='all'||(statusFilter==='locked')===u.is_suspended));
 const assignable=roles.filter(r=>r.key!=='super_admin');
 const grantableRole=(r)=>r.permissions.every(can);
 const protectedUser=selected&&selected.roles.includes('super_admin');
 const self=selected?.id===user.id;
 return <div className="admin-page" style={animStyle}>
  <section className="admin-hero"><div><span className="admin-eyebrow">QUẢN TRỊ HỆ THỐNG</span><h2>Nhân viên & phân quyền</h2><p>Quản lý ai được làm gì, hạn mức sử dụng và lịch sử thay đổi.</p></div>{!creating&&canList&&can('users.update')&&<button className="admin-primary" disabled={busy||loading||!!rolesError} onClick={()=>{setCreating(true);setSelected(null);setTab('users');setError('');setNotice('');}}>+ Thêm nhân viên</button>}</section>
  {!creating&&<div className="admin-stats">{[['Tài khoản',users.length],['Đang hoạt động',users.filter(u=>!u.is_suspended).length],['Quản trị viên',users.filter(u=>u.roles.some(r=>r==='admin'||r==='super_admin')).length],['Tạm khóa',users.filter(u=>u.is_suspended).length]].map(([label,n])=><article key={label}><span>{label}</span><strong>{n}</strong></article>)}</div>}
  {!creating&&<div className="admin-tabs">{can('users.list')&&<button aria-pressed={tab==='users'} onClick={()=>setTab('users')}>Nhân viên</button>}{can('roles.manage')&&<button aria-pressed={tab==='roles'} onClick={()=>{setTab('roles');setNotice('');}}>Vai trò & ma trận quyền</button>}<button aria-pressed={tab==='audit'} disabled={!can('system.view_audit_log')} onClick={showAudit}>Nhật ký thay đổi</button><button aria-pressed={tab==='logs'} disabled={!can('system.view_audit_log')} onClick={()=>{setTab('logs');setError('');}}>Lỗi &amp; cảnh báo</button>{tab!=='logs'&&tab!=='roles'&&<button onClick={tab==='audit'?showAudit:load} disabled={busy||loading}>Làm mới</button>}</div>}
  {error&&<p role="alert" className="admin-error">{error}</p>}{notice&&<p role="status" className="admin-success">{notice}</p>}
  {rolesError&&<div className="admin-error" role="alert">{rolesError} <button disabled={loading} onClick={load}>Tải lại vai trò</button></div>}
  {creating&&canList&&can('users.update')&&<CreateEmployee roles={roles} onCancel={()=>setCreating(false)} onCreated={async()=>{setCreating(false);setNotice('Đã tạo nhân viên. Gửi mật khẩu ban đầu qua kênh riêng.');await load();}}/>}
  {!creating&&tab==='users'&&<div className="admin-columns"><section className="admin-card"><div className="admin-toolbar"><input aria-label="Tìm tài khoản" placeholder="Tìm tên hoặc email…" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Lọc trạng thái" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">Tất cả trạng thái</option><option value="active">Đang hoạt động</option><option value="locked">Tạm khóa</option></select></div>
   {loading?<p role="status">Đang tải tài khoản…</p>:<><p className="admin-muted">{visible.length} tài khoản · Chọn để chỉnh quyền</p><div className="admin-users">{visible.map(u=><button key={u.id} className={'admin-user '+(selected?.id===u.id?'selected':'')} disabled={busy} onClick={()=>select(u)}><span className="admin-avatar">{(u.name||u.email).slice(0,1).toUpperCase()}</span><span className="admin-user-info"><strong>{u.name||u.email.split('@')[0]}</strong><small>{u.email}</small><span className="admin-badges"><span>{u.roles.join(', ')||'Chưa có vai trò'}</span><span className={u.is_suspended?'locked':'active'}>{u.is_suspended?'Tạm khóa':'Hoạt động'}</span></span></span><span aria-hidden="true">›</span></button>)}{!visible.length&&<p>Không có tài khoản phù hợp.</p>}</div></>}
  </section><section className="admin-card">{!selected?<div className="admin-empty"><span>◎</span><h3>Chọn tài khoản để phân quyền</h3><p>Quyền theo vai trò là mặc định. Bạn có thể cấp hoặc từ chối riêng từng quyền cho một người dùng.</p></div>:<form onSubmit={save}>
   <div className="admin-editor-title"><div><h3>{selected.name||selected.email}</h3><small>{selected.email}</small></div><button type="button" disabled={busy} onClick={()=>setSelected(null)}>Đóng</button></div>
   {(protectedUser||self)&&<p className="admin-note">Bạn không thể tự khóa hoặc hạ vai trò Admin của mình. Hạn mức vẫn có thể điều chỉnh; Super Admin chỉ quản lý bằng công cụ vận hành.</p>}
   <fieldset disabled={busy||protectedUser||!can('users.update')}><div className="admin-fields"><label>Vai trò<select disabled={self} value={selected.role} onChange={e=>setSelected({...selected,role:e.target.value,overrides:{}})}>{assignable.map(r=><option key={r.key} value={r.key} disabled={r.key!==selected.role&&!grantableRole(r)}>{r.name}</option>)}</select></label><label>Trạng thái<select disabled={self} value={selected.is_suspended?'locked':'active'} onChange={e=>setSelected({...selected,is_suspended:e.target.value==='locked'})}><option value="active">Hoạt động</option><option value="locked">Tạm khóa</option></select></label></div>
   <h4>Quyền sử dụng</h4><p className="admin-muted">“Theo vai trò” áp dụng mặc định. Quyền quản trị chỉ được cấp qua vai trò (tab Vai trò).</p><div>{catalog.map(p=>{const fixed=/^(users|system|roles)\./.test(p.key);const defaultAllowed=(p.roles||[]).includes(selected.role);return <label className="admin-permission" key={p.key}><span><strong>{labels[p.key]||p.description}</strong><small>{defaultAllowed?'Vai trò mặc định: Cho phép':'Vai trò mặc định: Không cho phép'}</small></span><select aria-label={labels[p.key]||p.key} disabled={fixed} value={selected.overrides[p.key]===undefined?'inherit':String(selected.overrides[p.key])} onChange={e=>{const next={...selected.overrides};if(e.target.value==='inherit')delete next[p.key];else next[p.key]=e.target.value==='true';setSelected({...selected,overrides:next});}}><option value="inherit">Theo vai trò</option><option value="true">Cho phép</option><option value="false">Từ chối</option></select></label>;})}</div>
   <h4>Hạn mức</h4><div className="admin-fields">{limits.map(([key,label,min,max])=><label key={key}>{label}<input required type="number" min={min} max={max} step="1" value={selected[key]} onChange={e=>setSelected({...selected,[key]:e.target.value===''?'':Number(e.target.value)})}/></label>)}</div>
   {localUsage.id===selected.id&&<p className="admin-note">{localUsage.unavailable?'Chưa đọc được mức sử dụng Studio.':`Studio tháng này: ${(localUsage.used_chars_month||0).toLocaleString('vi-VN')} ký tự · ${localUsage.clones||0} giọng clone · ${((localUsage.storage_bytes||0)/1048576).toFixed(1)} MB`}</p>}
   <div className="admin-actions"><button className="admin-primary">{busy?'Đang lưu…':'Lưu quyền & hạn mức'}</button><button type="button" onClick={()=>setSelected(null)}>Hủy thay đổi</button></div></fieldset>
  </form>}</section></div>}
  {!creating&&tab==='roles'&&<RolesPanel roles={roles} catalog={catalog} onChanged={load} loading={loading}/>}
  {!creating&&tab==='audit'&&<section className="admin-card"><h3>100 thay đổi gần nhất</h3><div className="admin-audit">{audit.map((entry,i)=><article key={entry.action+entry.id+String(i)}><time>{new Date(entry.created_at).toLocaleString('vi-VN')}</time><strong>{entry.action}</strong><small>Người thực hiện: {users.find(u=>u.id===entry.actor_id)?.email||entry.actor_id||'Hệ thống'}</small><small>Tài khoản: {users.find(u=>u.id===entry.target_id)?.email||entry.target_id||'—'}</small>{entry.metadata&&<details><summary>Chi tiết thay đổi</summary><pre>{JSON.stringify(entry.metadata,null,2)}</pre></details>}</article>)}{!audit.length&&<p>Chưa có nhật ký.</p>}</div></section>}
  {!creating&&tab==='logs'&&<SystemLogs/>}
 </div>;
}
