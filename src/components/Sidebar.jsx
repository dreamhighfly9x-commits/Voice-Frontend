import UserAvatar from './UserAvatar';
import {useState} from 'react';
import {ICONS,NAV_GROUPS} from '../data';
import Icon from './Icon';
import BrandLogo from './BrandLogo';
import {useAuth,usePermission} from '../lib/AuthContext';
import {canOpenPage} from '../lib/permissionMatrix';
import './CartButton.css';

const CART='M3 4h2l2.4 10.2a1.5 1.5 0 0 0 1.5 1.1h8.3a1.5 1.5 0 0 0 1.4-1.1L20.5 8H6.2M8.1 19.5a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0M15.6 19.5a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0';

export default function Sidebar({screen,onNavigate}) {
 const {user,logout}=useAuth();const {can}=usePermission();const [expanded,setExpanded]=useState(false);
 return <aside className={'nav-rail '+(expanded?'expanded':'')}>
  <button className="brand-mark" onClick={()=>onNavigate('home')} aria-label="DreamHigh Voice — Tổng quan"><BrandLogo/></button>
  <button className="rail-toggle" onClick={()=>setExpanded(!expanded)} aria-label={expanded?'Thu gọn menu':'Mở rộng menu'}>{expanded?'‹':'›'}<span>Thu gọn</span></button>
  <nav aria-label="Điều hướng chính">{NAV_GROUPS.map(g=><div className="nav-section" key={g.title}><small>{g.title}</small>{g.items.filter(it=>canOpenPage(it.id,can)).map(it=><button key={it.id} title={it.label} aria-label={it.label} aria-current={screen===it.id?'page':undefined} onClick={()=>onNavigate(it.id)}><Icon path={ICONS[it.id]} size={20}/><span>{it.label}</span></button>)}</div>)}</nav>
  <div className="rail-bottom"><div className="rail-user-row"><button title={user.name||user.email} onClick={()=>onNavigate('settings')} aria-label="Hồ sơ của tôi"><UserAvatar user={user} className="user-initial"/><span>{user.name||user.email}</span></button>{canOpenPage('pricing',can)&&<button className="rail-cart" title="Bảng giá" aria-label="Bảng giá" aria-current={screen==='pricing'?'page':undefined} onClick={()=>onNavigate('pricing')}><Icon path={CART} size={20}/></button>}</div><button onClick={logout} title="Đăng xuất" aria-label="Đăng xuất"><Icon path="M9 4H4v16h5M12 8l4 4-4 4M8 12h12" size={20}/><span>Đăng xuất</span></button></div>
 </aside>;
}
