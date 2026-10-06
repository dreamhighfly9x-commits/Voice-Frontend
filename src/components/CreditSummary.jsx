const format=value=>Number(value).toLocaleString('vi-VN');

export default function CreditSummary({usage,limit=0,maxChars=0,error,onDetails}) {
 const ready=usage&&Number.isFinite(Number(usage.used_chars_month));
 const used=ready?Math.max(0,Number(usage.used_chars_month)):0;
 const remaining=Math.max(0,limit-used);
 const percent=limit>0?Math.min(100,Math.round(remaining/limit*100)):0;
 return <section className="welcome-credit" aria-label="Credit và hạn mức tháng">
  <div className="welcome-credit-heading"><span className="credit-symbol" aria-hidden="true">✦</span><span>Credit còn lại</span><small>THÁNG NÀY</small></div>
  <strong className="welcome-credit-number">{ready?format(remaining):'—'}</strong><span className="welcome-credit-unit">ký tự để tạo giọng</span>
  {ready?<><div className="welcome-credit-meter"><span>Còn {percent}% hạn mức</span><span>{format(limit)} ký tự</span></div><progress value={remaining} max={Math.max(limit,1)} aria-label="Ký tự còn lại trong tháng"/><p>Đã dùng <b>{format(used)}</b> ký tự{remaining===0?' · Đã hết hạn mức':''}</p></>:<p role="status">{error?'Chưa tải được hạn mức':'Đang tải hạn mức…'}</p>}
  <div className="welcome-credit-bottom"><span>{maxChars>0?`${format(maxChars)} ký tự / lần tạo`:'Hạn mức theo tài khoản'}</span><button onClick={onDetails}>Chi tiết ↗</button></div>
 </section>;
}
