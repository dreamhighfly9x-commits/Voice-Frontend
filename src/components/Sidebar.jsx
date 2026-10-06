import UserAvatar from './UserAvatar';
import {useState} from 'react';
import {ICONS,NAV_GROUPS} from '../data';
import Icon from './Icon';
import BrandLogo from './BrandLogo';
import {useAuth,usePermission} from '../lib/AuthContext';
import {canOpenPage} from '../lib/permissionMatrix';

export default function Sidebar({screen,onNavigate}) {
 const {user,logout}=useAuth();const {can}=usePermission();const [expanded,setExpanded]=useState(false);
 return <aside className={'nav-rail '+(expanded?'expanded':'')}>
  <button className="brand-mark" onClick={()=>onNavigate('home')} aria-label="DreamHigh Voice — Tổng quan"><BrandLogo/></button>
  <button className="rail-toggle" onClick={()=>setExpanded(!expanded)} aria-label={expanded?'Thu gọn menu':'Mở rộng menu'}>{expanded?'‹':'›'}<span>Thu gọn</span></button>
  <nav aria-label="Điều hướng chính">{NAV_GROUPS.map(g=><div className="nav-section" key={g.title}><small>{g.title}</small>{g.items.filter(it=>canOpenPage(it.id,can)).map(it=><button key={it.id} title={it.label} aria-label={it.label} aria-current={screen===it.id?'page':undefined} onClick={()=>onNavigate(it.id)}><Icon path={ICONS[it.id]} size={20}/><span>{it.label}</span></button>)}</div>)}</nav>
  <div className="rail-bottom"><button title={user.name||user.email} onClick={()=>onNavigate('settings')} aria-label="Hồ sơ của tôi"><UserAvatar user={user} className="user-initial"/><span>{user.name||user.email}</span></button><button onClick={logout} title="Đăng xuất" aria-label="Đăng xuất"><Icon path="M9 4H4v16h5M12 8l4 4-4 4M8 12h12" size={20}/><span>Đăng xuất</span></button></div>
 </aside>;
}
