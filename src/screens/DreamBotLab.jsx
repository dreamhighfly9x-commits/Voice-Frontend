import {useEffect,useState} from 'react';
import DreamBot from '../components/DreamBot';
import {chooseBotState} from '../lib/dreamBotActivity';

export default function DreamBotLab(){
 const [state,setState]=useState('idle'),[playing,setPlaying]=useState(false),[phase,setPhase]=useState('idle');
 useEffect(()=>{if(!['welcome','success'].includes(state))return;const timer=setTimeout(()=>setState('idle'),state==='welcome'?2600:2000);return()=>clearTimeout(timer);},[state]);
 return <main style={{padding:32,maxWidth:750,margin:'auto'}}><h1>DreamBot · thử chuyển động</h1><p>Chỉ có trong bản phát triển. Các nút dưới đây mô phỏng trạng thái, không gọi TTS hoặc phát audio.</p>
 <DreamBot state={chooseBotState({success:state==='success',playing:playing||state==='playing',phase:state==='generating'?'generating':phase,welcome:state==='welcome'})} phase={state==='generating'?'generating':phase}/>
 <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:20}}>{['idle','welcome','playing','generating','success'].map(value=><button key={value} onClick={()=>{setState(value);setPhase('idle');}}>{value}</button>)}<button onClick={()=>{setState('idle');setPhase('queued');}}>queued</button></div>
 <label><input type="checkbox" checked={playing} onChange={e=>setPlaying(e.target.checked)}/> Audio vẫn đang phát (kiểm tra ưu tiên)</label>
 <p>Ảnh PNG phẳng: chuyển động toàn thân và hiệu ứng rời. Chưa có chuyển động riêng của tay, mắt, miệng. Sóng âm mang tính trang trí.</p>
 </main>;
}
