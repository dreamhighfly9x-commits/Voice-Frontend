import {useEffect,useState} from 'react';
import {apiJson} from '../lib/authApi';
import {useAuth} from '../lib/AuthContext';
import {CREDIT_BASE_PRICE_PER_1K,CREDIT_PACKAGES} from '../data';
import './WorkspaceScreens.css';
import './CreditsScreen.css';

const vnd=n=>Math.round(n).toLocaleString('vi-VN')+' đ';
const num=n=>n.toLocaleString('vi-VN');
const per1k=p=>p.price/p.chars*1000;
// Same speaking rate the Studio uses for its duration estimate (15 chars/second).
const minutes=chars=>Math.round(chars/900);
const MIN_CUSTOM=10000;

export function customQuote(chars){
 const tier=[...CREDIT_PACKAGES].reverse().find(p=>chars>=p.chars);
 const rate=tier?per1k(tier):CREDIT_BASE_PRICE_PER_1K;
 return {rate,price:Math.round(chars/1000*rate/100)*100};
}

export default function CreditsScreen({animStyle}) {
 const {user}=useAuth();
 const [usage,setUsage]=useState(null),[custom,setCustom]=useState(300000),[order,setOrder]=useState(null);
 useEffect(()=>{let alive=true;apiJson('/api/local-usage').then(u=>{if(alive)setUsage(u);}).catch(()=>{});return()=>{alive=false;};},[]);
 const used=usage?.used_chars_month||0,limit=user.limits?.max_chars_month||0;
 const quote=customQuote(custom),customValid=custom>=MIN_CUSTOM;
 const choose=o=>{setOrder(o);requestAnimationFrame(()=>document.getElementById('credit-order')?.scrollIntoView?.({behavior:'smooth',block:'nearest'}));};
 return <div className="workspace-page credits-page" style={animStyle}>
  <section className="workspace-card credits-balance">
   <div><h3>Hạn mức tháng này</h3><p>Đã dùng <strong>{num(used)}</strong> / {num(limit)} ký tự · còn lại <strong>{num(Math.max(limit-used,0))}</strong></p></div>
   <progress value={Math.min(used,limit)} max={Math.max(limit,1)} aria-label="Ký tự đã dùng tháng này"/>
  </section>

  <div className="credit-plans">{CREDIT_PACKAGES.map(p=><article key={p.id} className={'workspace-card credit-plan'+(p.popular?' popular':'')}>
   {p.popular&&<span className="credit-badge">Phổ biến</span>}
   <h3>{p.name}</h3><p>{p.note}</p>
   <div className="credit-price">{vnd(p.price)}</div>
   <div className="credit-chars">{num(p.chars)} ký tự</div>
   <ul><li>{vnd(per1k(p))} / 1.000 ký tự</li><li>Khoảng {num(minutes(p.chars))} phút audio</li>{per1k(p)<CREDIT_BASE_PRICE_PER_1K&&<li>Tiết kiệm {Math.round((1-per1k(p)/CREDIT_BASE_PRICE_PER_1K)*100)}% so với giá lẻ</li>}</ul>
   <button className={p.popular?'primary':''} onClick={()=>choose({name:'Gói '+p.name,chars:p.chars,price:p.price})}>Mua gói</button>
  </article>)}</div>

  <div className="workspace-columns">
   <section className="workspace-card"><h3>Bảng giá ký tự</h3>
    <div className="credit-table-wrap"><table className="credit-table"><thead><tr><th>Gói</th><th>Số ký tự</th><th>Giá</th><th>Giá / 1.000 ký tự</th><th>Audio ước tính</th></tr></thead>
     <tbody><tr><td>Giá lẻ</td><td>Từ {num(MIN_CUSTOM)}</td><td>—</td><td>{vnd(CREDIT_BASE_PRICE_PER_1K)}</td><td>—</td></tr>
      {CREDIT_PACKAGES.map(p=><tr key={p.id}><td>{p.name}</td><td>{num(p.chars)}</td><td>{vnd(p.price)}</td><td>{vnd(per1k(p))}</td><td>~{num(minutes(p.chars))} phút</td></tr>)}</tbody></table></div>
    <p>Ký tự tính trên văn bản sau khi áp dụng từ điển phát âm, gồm cả dấu câu và khoảng trắng. Ký tự đã mua cộng vào hạn mức tài khoản. Tạo lại một đoạn tính lại số ký tự của đoạn đó.</p>
   </section>
   <aside><section className="workspace-card"><h3>Mua theo số lượng</h3>
    <label>Số ký tự cần mua<input type="number" min={MIN_CUSTOM} step={10000} value={custom} onChange={e=>setCustom(Math.max(0,Math.floor(Number(e.target.value)||0)))}/></label>
    {customValid?<><p>Đơn giá áp dụng: <strong>{vnd(quote.rate)}</strong> / 1.000 ký tự · khoảng {num(minutes(custom))} phút audio</p><div className="credit-price">{vnd(quote.price)}</div></>:<p className="workspace-error">Tối thiểu {num(MIN_CUSTOM)} ký tự.</p>}
    <button className="primary" disabled={!customValid} onClick={()=>choose({name:'Mua lẻ',chars:custom,price:quote.price})}>Mua {num(custom)} ký tự</button>
   </section>
   {order&&<section className="workspace-card" id="credit-order"><h3>Xác nhận đơn</h3>
    <p>{order.name} · <strong>{num(order.chars)} ký tự</strong><br/>Thành tiền: <strong>{vnd(order.price)}</strong></p>
    <p className="workspace-notice" role="status">Thanh toán online chưa được kết nối. Liên hệ Admin kèm thông tin đơn này để nạp ký tự vào tài khoản {user.email}.</p>
    <button onClick={()=>setOrder(null)}>Hủy</button>
   </section>}</aside>
  </div>
 </div>;
}
