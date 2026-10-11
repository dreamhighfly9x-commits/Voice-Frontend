import {useEffect,useState} from 'react';
import {apiJson} from '../lib/authApi';
import {useAuth,usePermission} from '../lib/AuthContext';
import Icon from '../components/Icon';
import DailyGreeting from '../components/DailyGreeting';
import {ICONS} from '../data';
import './Dashboard.css';
import FavoriteLeaderboard from '../components/FavoriteLeaderboard';
import CreditSummary from '../components/CreditSummary';
import LatestRecording from '../components/LatestRecording';

const number=n=>Number(n||0).toLocaleString('vi-VN');
const shortDate=date=>date.slice(8)+'/'+date.slice(5,7);

function ActivityChart({series}) {
 const [selected,setSelected]=useState(null);
 const max=Math.max(1,...series.map(d=>d.created));
 const point=(d,i)=>[20+i*660/Math.max(1,series.length-1),135-d.created/max*105];
 const points=series.map(point); const line=points.map(p=>p.join(',')).join(' ');
 const active=series[selected]||series.at(-1);
 return <div className="activity-chart"><div className="chart-summary"><span>{active?shortDate(active.date):'—'}</span><strong>{number(active?.created)} bản ghi</strong><small>Di chuột hoặc chọn một điểm</small></div><svg viewBox="0 0 700 166" role="img" aria-label="Số bản ghi tạo mỗi ngày"><defs><linearGradient id="usageFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--chart)" stopOpacity=".4"/><stop offset="100%" stopColor="var(--chart)" stopOpacity="0"/></linearGradient></defs>{[30,82,135].map(y=><line key={y} x1="20" x2="680" y1={y} y2={y} stroke="var(--line)" strokeDasharray="3 6"/>)}{points.length>0&&<><polygon points={'20,145 '+line+' 680,145'} fill="url(#usageFill)"/><polyline points={line} fill="none" stroke="var(--chart)" strokeWidth="2.5" strokeLinejoin="round"/>{points.map(([x,y],i)=><g key={series[i].date}><circle cx={x} cy={y} r={selected===i?5:3} fill="var(--chart)"/><circle className="chart-point" cx={x} cy={y} r="11" fill="transparent" tabIndex="0" role="button" aria-label={`${shortDate(series[i].date)}: ${series[i].created} bản ghi`} onFocus={()=>setSelected(i)} onMouseEnter={()=>setSelected(i)} onClick={()=>setSelected(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')setSelected(i);}}><title>{series[i].date}: {series[i].created} bản ghi</title></circle></g>)}</>}</svg><div className="chart-axis"><span>{shortDate(series[0]?.date||'')}</span><span>Tần suất tạo âm thanh / ngày</span><span>{shortDate(series.at(-1)?.date||'')}</span></div></div>;
}

export default function HomeScreen({bot,favorites={},voices=[],recordings=[],playingId,generating,onPlay,getAudio,onPick,onNavigate,engineReady}) {
 const {user}=useAuth(),{can}=usePermission();
 const [days,setDays]=useState(7),[data,setData]=useState(null),[error,setError]=useState(''),[reload,setReload]=useState(0),[table,setTable]=useState(false);
 useEffect(()=>{let active=true;setData(null);setError('');apiJson(`/api/dashboard?days=${days}&offset=${new Date().getTimezoneOffset()}`).then(d=>{if(active)setData(d);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[days,reload,recordings.length]);
 const series=data?.series||[],total=key=>series.reduce((sum,d)=>sum+d[key],0);
 const created=total('created');
 const limit=user.limits?.max_chars_month||0;
 return <div className="dashboard">
  <DailyGreeting bot={bot} name={user.name} onNavigate={onNavigate} aside={<LatestRecording recordings={recordings} playingId={playingId} onPlay={onPlay} getAudio={getAudio} onNavigate={onNavigate}/>}/>
  <FavoriteLeaderboard voices={voices} favorites={favorites} data={data} days={days} error={error} generating={generating} canCreate={can("tts.create")} playingId={playingId} onPlay={onPlay} onPick={onPick} onNavigate={onNavigate}/>
  <div className="dashboard-toolbar"><div><span className="status-dot"/>{engineReady?'Không gian của bạn đã sẵn sàng':'Đang kết nối thư viện giọng…'}</div><div className="period-control" aria-label="Khoảng thời gian">{[7,30].map(n=><button key={n} aria-pressed={days===n} onClick={()=>setDays(n)}>{n} ngày</button>)}<button className="refresh-data" onClick={()=>setReload(v=>v+1)} aria-label="Làm mới thống kê">↻</button></div></div>
  {error&&<div role="alert" className="dashboard-error">Chưa tải được thống kê: {error} <button onClick={()=>setReload(v=>v+1)}>Thử lại</button></div>}
  <div className="overview-grid">
   <section className="metric-card pastel-lavender"><div className="card-topline"><span>Thời lượng đã tạo</span><Icon path={ICONS.library} size={19}/></div><div className="metric-value">{data?number(Math.round(total('seconds')/60*10)/10):'—'}<small> phút</small></div><p>Âm thanh trong {days} ngày</p><div className="metric-footer"><b className="metric-icon">◷</b><span>{data?number(data.recordings):'—'} bản ghi trong thư viện</span></div></section>
   <section className="metric-card pastel-mint"><div className="card-topline"><span>Thư viện giọng</span><Icon path={ICONS.voices} size={19}/></div><div className="metric-value">{number(voices.length)}<small> giọng</small></div><p>{voices.filter(v=>v.id.startsWith('clone_')).length} giọng clone của bạn</p><button className="metric-footer metric-link" onClick={()=>onNavigate('voices')}><b className="metric-icon">♫</b><span>Khám phá thư viện ↗</span></button></section>
   <div className="overview-credit"><CreditSummary usage={data?.usage} limit={limit} maxChars={user.limits?.max_chars_request} error={error} onDetails={()=>onNavigate('settings')}/></div>
   <section className="portfolio-card pastel-blue"><div className="card-topline"><span>Hoạt động sáng tạo</span><Icon path={ICONS.studio} size={20}/></div><div className="portfolio-value">{data?number(created):'—'}<span>bản ghi / {days} ngày</span></div><ActivityChart series={series}/></section>
  </div>
  <div className="dashboard-middle"><section className="interaction-card recording-launcher" aria-labelledby="create-recording-title"><span className="recording-launcher-icon" aria-hidden="true"><Icon path={ICONS.studio} size={28}/></span><h2 id="create-recording-title">Tạo bản ghi của bạn</h2><p>Nhập văn bản, chọn giọng và tạo âm thanh.</p><button className="create-recording-button" disabled={!can('tts.create')} onClick={()=>onNavigate('studio')}><span aria-hidden="true">＋</span> Tạo bản ghi</button>{!can('tts.create')&&<small>Tài khoản chưa được cấp quyền tạo giọng.</small>}</section>
   <section className="create-promo"><div className="promo-orbits" aria-hidden="true"><i/><i/><i/></div><span className="promo-kicker">GIỌNG NÓI MANG DẤU ẤN RIÊNG</span><h2>Biến ý tưởng<br/>thành <em>âm thanh.</em></h2><p>Một câu chuyện. Nhiều nhân vật.<br/>Tất cả trong không gian của bạn.</p><button onClick={()=>onNavigate('script')}>Tạo kịch bản nhiều giọng <span>↗</span></button></section>
  </div>
  <div className="dashboard-bottom">
   <section className="recent-card"><div className="section-heading"><h2>Gần đây</h2><button className="text-link" onClick={()=>onNavigate('library')}>Xem tất cả ↗</button></div>{!data?.recent?.length?<div className="recent-empty"><Icon path={ICONS.library} size={30}/><p>Chưa có bản ghi trong {days} ngày này.</p><button onClick={()=>onNavigate('studio')}>Tạo bản đọc đầu tiên ↗</button></div>:data.recent.map(r=><button className="recent-item" key={r.id} onClick={()=>onPlay(r.id)}><span className="recent-play">{playingId===r.id?'■':'▷'}</span><span><strong>{r.title}</strong><small>{new Date(r.created_at*1000).toLocaleDateString('vi-VN')} · {r.dur}</small></span></button>)}<div className="clone-shortcut"><Icon path={ICONS.clones} size={24}/><div><strong>Giọng của riêng bạn</strong><p>Thêm mẫu âm thanh để bắt đầu.</p></div><button onClick={()=>onNavigate('clones')} aria-label="Tạo giọng clone">↗</button></div></section>
  </div>
  <div className="dashboard-footnote"><span>Dữ liệu riêng tư trong tài khoản của bạn.{data?.legacy_dates?' Bản ghi cũ sử dụng thời gian lưu tệp.':''}</span><button onClick={()=>setTable(!table)}>{table?'Ẩn':'Xem'} bảng số liệu</button></div>{table&&<div className="data-table-wrap"><table><caption>Hoạt động theo ngày</caption><thead><tr><th>Ngày</th><th>Tạo</th><th>Nghe</th><th>Tải</th></tr></thead><tbody>{series.map(d=><tr key={d.date}><td>{shortDate(d.date)}</td><td>{d.created}</td><td>{d.listen}</td><td>{d.download}</td></tr>)}</tbody></table></div>}
 </div>;
}
