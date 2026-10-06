import {useEffect,useState} from 'react';
import './DailyGreeting.css';
import {dreamBotMessage} from './DreamBot';
import RobotGreeting from './RobotGreeting';
import LottieIcon from './LottieIcon';

const GENERATE_ICON = import.meta.env.BASE_URL + 'animations/ai-generate.lottie';

export default function DailyGreeting({name,onNavigate,feature,aside,bot={state:"idle",phase:"idle"}}) {
 const [now,setNow]=useState(()=>new Date());
 useEffect(()=>{
  let timer;
  const tick=()=>{const next=new Date();setNow(next);clearTimeout(timer);timer=setTimeout(tick,Math.min(60000,new Date(next.getFullYear(),next.getMonth(),next.getDate()+1)-next+50));};
  const wake=()=>{if(!document.hidden)tick();};
  tick();document.addEventListener('visibilitychange',wake);window.addEventListener('focus',wake);
  return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',wake);window.removeEventListener('focus',wake);};
 },[]);
 const weekday=new Intl.DateTimeFormat('vi-VN',{weekday:'long'}).format(now);
 const date=new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}).format(now);
 const greeting=now.getHours()<12?'Chào buổi sáng':now.getHours()<18?'Chào buổi chiều':'Chào buổi tối';
 const day=(now.getDay()+6)%7;
 return <section className="daily-greeting" aria-labelledby="daily-question">
  <div className="daily-message"><RobotGreeting/><p className="daily-salutation">{greeting}{name?`, ${name}`:''}!</p><h2 id="daily-question">Hôm nay bạn muốn tạo giọng gì?</h2><p className="dreambot-message" role="status" aria-live="polite">{dreamBotMessage(bot.state,bot.phase)}</p><div className="daily-actions"><button className="daily-generate" onClick={()=>onNavigate('studio')}><LottieIcon src={GENERATE_ICON} active size={80}/><span>Tạo bản đọc</span></button><button onClick={()=>onNavigate('voices')}>Chọn giọng từ thư viện <span aria-hidden="true">→</span></button></div>{aside}</div>
  <div className="daily-calendar"><span className="daily-today">HÔM NAY</span><time dateTime={`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`}><strong>{weekday.charAt(0).toUpperCase()+weekday.slice(1)}</strong><span>{date}</span></time><div className="daily-week" aria-label="Thứ trong tuần">{['T2','T3','T4','T5','T6','T7','CN'].map((label,i)=><span key={label} aria-current={day===i?'date':undefined} title={i===6?'Chủ nhật':`Thứ ${i+2}`}>{label}</span>)}</div><small>Theo giờ trên thiết bị của bạn</small></div>
  {feature&&<div className="daily-feature">{feature}</div>}
 </section>;
}
