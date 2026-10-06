import UserAvatar from './UserAvatar';
import {SCREEN_TITLES} from '../data';
import {useAuth} from '../lib/AuthContext';
import BrandLogo from './BrandLogo';
import ThemeToggle from './ThemeToggle';
import SoundToggle from './SoundToggle';
export default function Header({screen,theme,sound,onToggleTheme,onToggleSound,onNewProject,search,onAccount}) {
 const {user}=useAuth(); const [title,subtitle]=SCREEN_TITLES[screen];
 return <header className="app-header"><div className="page-heading"><BrandLogo className="header-brand"/><h1>{title}</h1><p>{screen==='home'?'Không gian sáng tạo giọng nói của bạn.':subtitle}</p></div><div className="header-actions">{search}<ThemeToggle theme={theme} onToggle={onToggleTheme}/><SoundToggle sound={sound} onToggle={onToggleSound}/><button className="profile-pill" onClick={onAccount}><UserAvatar user={user}/><span>{user.name||user.email?.split('@')[0]}</span><span>⌄</span></button><button className="new-reading" onClick={onNewProject}>＋ Bản đọc mới</button></div></header>;
}
