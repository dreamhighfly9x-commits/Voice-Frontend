import {useEffect, useRef, useState} from 'react';
import {apiJson} from '../lib/authApi';

export default function GenMaxEnhance({voice, text, onReplace, disabled}) {
  const [busy,setBusy]=useState(false), [unchanged,setUnchanged]=useState(false), [error,setError]=useState('');
  const request=useRef(null);
  useEffect(()=>()=>request.current?.abort(),[]);
  useEffect(()=>{request.current?.abort();setBusy(false);setUnchanged(false);setError('');},[voice,text]);
  async function enhance(){
    const controller=new AbortController();request.current=controller;
    setBusy(true);setError('');setUnchanged(false);
    const timer=setTimeout(()=>controller.abort('timeout'),100000);
    try {
      const result=await apiJson('/api/tts/enhance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({voice,text}),signal:controller.signal});
      if(!controller.signal.aborted){if(result.text===text)setUnchanged(true);else onReplace(result.text);}
    } catch(e){if(!controller.signal.aborted)setError(e.message);else if(controller.signal.reason==='timeout')setError('DreamHigh phản hồi quá lâu. Nội dung của bạn vẫn được giữ nguyên.');}
    finally{clearTimeout(timer);if(request.current===controller)setBusy(false);}
  }
  return <div className="genmax-enhance">
    <button type="button" disabled={disabled||busy||!text.trim()||text.length>5000} onClick={enhance}>{busy?'Đang Auto-Tag…':'✧ Auto-Tag'}</button>
    {busy&&<p role="status">DreamHigh đang xử lý văn bản…</p>}
    {error&&<p role="alert">{error}</p>}
    {unchanged&&<p role="status">Auto-Tag giữ nguyên nội dung.</p>}
  </div>;
}
