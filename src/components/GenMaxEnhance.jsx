import {useEffect, useRef, useState} from 'react';
import {apiJson} from '../lib/authApi';

export default function GenMaxEnhance({voice, text, onReplace, disabled}) {
  const [busy,setBusy]=useState(false), [proposal,setProposal]=useState(null), [error,setError]=useState('');
  const request=useRef(null);
  useEffect(()=>()=>request.current?.abort(),[]);
  useEffect(()=>{request.current?.abort();setBusy(false);setProposal(null);setError('');},[voice,text]);
  async function enhance(){
    const controller=new AbortController();request.current=controller;
    setBusy(true);setError('');setProposal(null);
    const timer=setTimeout(()=>controller.abort('timeout'),100000);
    try {
      const result=await apiJson('/api/tts/enhance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({voice,text}),signal:controller.signal});
      if(!controller.signal.aborted)setProposal(result.text);
    } catch(e){if(!controller.signal.aborted)setError(e.message);else if(controller.signal.reason==='timeout')setError('GenMax phản hồi quá lâu. Nội dung của bạn vẫn được giữ nguyên.');}
    finally{clearTimeout(timer);if(request.current===controller)setBusy(false);}
  }
  return <div className="genmax-enhance">
    <button type="button" disabled={disabled||busy||!text.trim()||text.length>5000} onClick={enhance}>{busy?'Đang thêm cảm xúc…':'✧ Tự động thêm cảm xúc (GenMax)'}</button>
    {busy&&<p role="status">GenMax đang xử lý văn bản…</p>}
    {error&&<p role="alert">{error}</p>}
    {proposal!==null&&<div><p>{proposal===text?'GenMax giữ nguyên nội dung.':'Xem trước thẻ cảm xúc:'}</p><pre style={{whiteSpace:'pre-wrap',maxHeight:220,overflow:'auto'}}>{proposal}</pre><button disabled={disabled||proposal===text} onClick={()=>{onReplace(proposal);setProposal(null);}}>Áp dụng cảm xúc</button> <button onClick={()=>setProposal(null)}>Bỏ qua</button></div>}
  </div>;
}
