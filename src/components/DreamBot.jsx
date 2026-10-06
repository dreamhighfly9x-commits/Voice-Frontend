import {useEffect,useState} from 'react';
import './DreamBot.css';

export function dreamBotMessage(state,phase){
 if(state==='success')return 'Xong rồi! Nghe thử bản đọc của bạn nhé.';
 if(state==='playing')return 'Cùng nghe giọng của bạn nào!';
 if(state==='generating')return phase==='queued'?'Đang chờ đến lượt…':phase==='pending'?'Đang gửi yêu cầu tạo giọng…':'Mình đang tạo giọng cho bạn…';
 return 'Chào bạn! Hôm nay mình tạo giọng gì nhé?';
}

export default function DreamBot({state='idle',phase='idle',showMessage=true}){
 const [hidden,setHidden]=useState(()=>document.hidden);
 useEffect(()=>{const update=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
 return <div className="dreambot-unit">
  <div className="dreambot" data-state={state} data-paused={hidden} role="img" aria-label={`DreamBot — ${dreamBotMessage(state,phase)}`}>
   <div className="dreambot-body"><img src="/images/dreambot-cat.png" width="160" height="160" alt="" decoding="async" draggable="false"/></div>
   {state==='generating'&&<div className="dreambot-dots" aria-hidden="true"><i/><i/><i/></div>}
   {state==='playing'&&<div className="dreambot-waves" aria-hidden="true">{[0,1,2,3,4].map(i=><i key={i} style={{animationDelay:`${i*-.17}s`}}/>)}</div>}
   {state==='success'&&<div className="dreambot-sparks" aria-hidden="true">{[0,1,2,3].map(i=><i key={i} style={{'--angle':`${i*90+25}deg`}}>✦</i>)}</div>}
  </div>
  {showMessage&&<p className="dreambot-message" role="status" aria-live="polite">{dreamBotMessage(state,phase)}</p>}
 </div>;
}
