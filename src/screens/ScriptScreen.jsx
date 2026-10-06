import {useEffect,useRef,useState} from 'react';
import {apiFetch,apiJson} from '../lib/authApi';
import {usePermission} from '../lib/AuthContext';
import AudioDownload from '../components/AudioDownload';
import ExpressionTextarea from '../components/ExpressionTextarea';
import './WorkspaceScreens.css';

const id=()=>crypto.randomUUID();
const empty=voice=>({name:'Kịch bản mới',version:0,characters:[{id:id(),name:'Người dẫn',voice:voice||''}],segments:[]});
const rendered=(s,script)=>s.recording_id&&s.rendered_text===s.text&&s.rendered_voice===script.characters.find(c=>c.id===s.character)?.voice;

export default function ScriptScreen({voices=[],voicesReady=true,voiceStatus='',maxChars=5000,onCreated,onPlay,playingId,openId,onOpened}) {
 const {can}=usePermission();
 const [voiceSearch,setVoiceSearch]=useState('');
 const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
 const matchingVoices=voices.filter(v=>normalize([v.name,v.tags,v.desc,v.id].join(' ')).includes(normalize(voiceSearch.trim())));
 const [script,setScript]=useState(()=>empty(voices[0]?.id)),[saved,setSaved]=useState([]),[dirty,setDirty]=useState(false),[busy,setBusy]=useState(false),[current,setCurrent]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[raw,setRaw]=useState(''),[merged,setMerged]=useState(null);
 const state=useRef(script),lock=useRef(false),stop=useRef(false),drag=useRef(null);
 const update=(next,changed=true)=>{state.current=next;setScript(next);setDirty(changed);if(changed)setMerged(null);};
 const refresh=()=>apiJson('/api/scripts').then(setSaved).catch(e=>setError(e.message));
 useEffect(()=>{refresh();return()=>{stop.current=true;};},[]);
 useEffect(()=>{if(openId){if(lock.current){setError('Đợi tác vụ hiện tại hoàn thành rồi mở kịch bản.');onOpened?.();return;}if(dirty&&!window.confirm('Bỏ thay đổi chưa lưu để mở kịch bản khác?')){onOpened?.();return;}apiJson('/api/scripts/'+openId).then(value=>{state.current=value;setScript(value);setDirty(false);setMerged(null);onOpened?.();}).catch(e=>{setError(e.message);onOpened?.();});}},[openId,onOpened,dirty]);
 useEffect(()=>{if(!dirty)return;const warn=e=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 useEffect(()=>{
  if(busy||!voices.length||state.current.id)return;
  const value=state.current;
  if(!value.characters.some(c=>!c.voice))return;
  const next={...value,characters:value.characters.map(c=>c.voice?c:{...c,voice:voices[0].id})};
  state.current=next;setScript(next);
 },[voices,busy]);
 async function persist(value=state.current) {
  const result=await apiJson('/api/scripts'+(value.id?'/'+value.id:''),{method:value.id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
  update(result,false);await refresh();return result;
 }
 async function save(){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await persist();setNotice('Đã lưu kịch bản trên tài khoản của bạn.');}catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);}}
 function mutateSegment(key,patch){update({...state.current,segments:state.current.segments.map(s=>s.id===key?{...s,...patch}:s)});}
 function move(from,to){if(to<0||to>=script.segments.length||busy)return;const list=[...script.segments];list.splice(to,0,list.splice(from,1)[0]);update({...script,segments:list});}
 function add(){if(script.segments.length>=100)return;update({...script,segments:[...script.segments,{id:id(),character:script.characters[0].id,text:'',pause:.4,recording_id:'',rendered_text:'',rendered_voice:''}]});}
 async function open(key){if(dirty&&!window.confirm('Bỏ thay đổi chưa lưu để mở kịch bản khác?'))return;setError('');try{update(await apiJson('/api/scripts/'+key),false);setMerged(null);}catch(e){setError(e.message);}}
 async function removeScript(){if(!script.id||!window.confirm('Xóa kịch bản này? Các bản ghi âm đã tạo vẫn được giữ lại.'))return;setBusy(true);try{const response=await apiFetch('/api/scripts/'+script.id,{method:'DELETE'});if(!response.ok)throw new Error('Không xóa được kịch bản.');update(empty(voices[0]?.id),false);await refresh();}catch(e){setError(e.message);}finally{setBusy(false);}}
 function importText(){
  const characters=script.characters.map(c=>({...c})),segments=[];
  for(const line of raw.split('\n').filter(s=>s.trim())){
   const match=line.match(/^\s*([^:]{1,50}):\s*(.*)$/);
   if(match){let character=characters.find(c=>c.name===match[1].trim());if(!character){character={id:id(),name:match[1].trim(),voice:voices[0]?.id||''};characters.push(character);}segments.push({id:id(),character:character.id,text:match[2],pause:.4,recording_id:'',rendered_text:'',rendered_voice:''});}
   else if(segments.length)segments.at(-1).text+='\n'+line.trim();else segments.push({id:id(),character:characters[0].id,text:line.trim(),pause:.4,recording_id:'',rendered_text:'',rendered_voice:''});
  }
  if(!segments.length||segments.length>100||characters.length>30||segments.some(s=>s.text.length>maxChars)){setError('Tối đa 100 đoạn, 30 nhân vật; mỗi đoạn không vượt hạn mức ký tự.');return;}
  if(script.segments.length&&!window.confirm('Thay toàn bộ lời thoại hiện tại bằng nội dung đã nhập?'))return;
  update({...script,characters,segments});setRaw('');setNotice(`Đã nhập ${segments.length} đoạn. Chọn giọng cho từng nhân vật trước khi tạo.`);
 }
 async function generate(keys){
  if(lock.current||!can('tts.create'))return;lock.current=true;stop.current=false;setBusy(true);setError('');setNotice('');
  let failures=0,completed=0;
  try{
   await persist();
   for(const key of keys){
    if(stop.current)break;
    let value=state.current;const segment=value.segments.find(s=>s.id===key),character=value.characters.find(c=>c.id===segment.character);
    setCurrent(key);
    try{
     if(!segment.text.trim()||segment.text.length>maxChars)throw new Error('Nhập lời thoại trong hạn mức '+maxChars+' ký tự.');
     if(!voices.some(v=>v.id===character.voice))throw new Error('Chọn giọng còn khả dụng cho '+character.name+'.');
     const result=await apiJson('/api/synthesize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:segment.text,voice:character.voice})});
     onCreated(result);
     value={...state.current,segments:state.current.segments.map(s=>s.id===key?{...s,recording_id:result.id,rendered_text:segment.text,rendered_voice:character.voice}:s)};
     update(value);await persist(value);completed++;
    }catch(e){failures++;setError(`${character.name}: ${e.message}`);}
   }
   setNotice(`Đã tạo ${completed} đoạn${failures?`, ${failures} đoạn lỗi`:''}. Các đoạn thành công đã được lưu.`);
  }catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);setCurrent('');}
 }
 async function merge(){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await persist();const result=await apiJson('/api/scripts/merge/audio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:script.name,parts:script.segments.map((s,i)=>({id:s.recording_id,pause:i===script.segments.length-1?0:s.pause}))})});setMerged(result);onCreated(result);setNotice('Đã ghép WAV và lưu vào Thư viện âm thanh.');}catch(e){setError(e.message);}finally{lock.current=false;setBusy(false);}}
 const valid=script.segments.length>0&&script.segments.every(s=>rendered(s,script));
 return <div className="workspace-page">
  <section className="workspace-card"><h2>Kịch bản nhiều giọng</h2><p>Gán giọng cho nhân vật, tạo từng đoạn rồi ghép thành một bản đọc.</p>
   <div className="workspace-actions"><input aria-label="Tên kịch bản" maxLength={160} value={script.name} disabled={busy} onChange={e=>update({...script,name:e.target.value})}/><button disabled={busy||!can(script.id?'projects.update':'projects.create')} onClick={save}>Lưu kịch bản{dirty?' *':''}</button><button disabled={busy} onClick={()=>{if(!dirty||window.confirm('Bỏ thay đổi chưa lưu?'))update(empty(voices[0]?.id),false);}}>Kịch bản mới</button><button disabled={busy||!script.id||!can('projects.delete')} onClick={removeScript}>Xóa kịch bản</button></div>
   <label>Mở kịch bản đã lưu<select aria-label="Mở kịch bản đã lưu" value={script.id||''} disabled={busy} onChange={e=>{if(e.target.value)open(e.target.value);}}><option value="">Chọn kịch bản…</option>{saved.map(s=><option key={s.id} value={s.id}>{s.name} · {s.segments} đoạn</option>)}</select></label>
  </section>
  {error&&<p role="alert" className="workspace-error">{error}</p>}{notice&&<p role="status" className="workspace-notice">{notice}</p>}
  <div className="workspace-columns"><div>
   <div className="workspace-actions"><button disabled={busy||script.segments.length>=100} onClick={add}>+ Thêm đoạn</button><button className="primary" disabled={busy||!voices.length||!script.segments.length||!can('tts.create')} onClick={()=>generate(script.segments.filter(s=>!rendered(s,script)).map(s=>s.id))}>Tạo các đoạn chưa có âm thanh</button>{busy&&<button onClick={()=>{stop.current=true;setNotice('Sẽ dừng sau đoạn đang xử lý.');}}>Dừng sau đoạn hiện tại</button>}</div>
   {!script.segments.length&&<section className="workspace-card"><p>Thêm đoạn hoặc nhập kịch bản có nhãn nhân vật để bắt đầu.</p></section>}
   {script.segments.map((s,index)=><section className="workspace-card script-segment" key={s.id} onDragOver={e=>e.preventDefault()} onDrop={()=>{if(drag.current!==null)move(drag.current,index);drag.current=null;}}>
    <div className="workspace-actions"><button aria-label={`Kéo đoạn ${index+1}`} draggable={!busy} onDragStart={()=>{drag.current=index;}} onDragEnd={()=>{drag.current=null;}}>⠿ {index+1}</button><select aria-label={`Nhân vật đoạn ${index+1}`} disabled={busy} value={s.character} onChange={e=>mutateSegment(s.id,{character:e.target.value})}>{script.characters.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><span className="muted">{current===s.id?'Đang tạo…':rendered(s,script)?'Đã tạo':s.recording_id?'Cần tạo lại':'Chưa tạo'}</span></div>
    <ExpressionTextarea voiceId={script.characters.find(c=>c.id===s.character)?.voice} aria-label={`Lời thoại đoạn ${index+1}`} disabled={busy} value={s.text} onChange={e=>mutateSegment(s.id,{text:e.target.value})}/>
    <div className="workspace-actions"><small>{s.text.length}/{maxChars} ký tự</small><label>Nghỉ sau đoạn (giây)<input aria-label={`Khoảng nghỉ đoạn ${index+1}`} type="number" min="0" max="5" step="0.1" disabled={busy} value={s.pause} onChange={e=>mutateSegment(s.id,{pause:Number(e.target.value)})}/></label><button disabled={busy||!rendered(s,script)} onClick={()=>onPlay(s.recording_id)}>{playingId===s.recording_id?'Dừng nghe':'Nghe đoạn'}</button><button disabled={busy||!can('tts.create')} onClick={()=>generate([s.id])}>Tạo lại đoạn này</button></div>
    <div className="workspace-actions"><button aria-label={`Đưa đoạn ${index+1} lên`} disabled={busy||index===0} onClick={()=>move(index,index-1)}>↑</button><button aria-label={`Đưa đoạn ${index+1} xuống`} disabled={busy||index===script.segments.length-1} onClick={()=>move(index,index+1)}>↓</button><button disabled={busy} onClick={()=>update({...script,segments:script.segments.filter(v=>v.id!==s.id)})}>Xóa đoạn</button>{rendered(s,script)&&<AudioDownload url={'/api/media/'+s.recording_id+'.wav'}/>}</div>
   </section>)}
  </div><aside>
   <section className="workspace-card"><h3>Nhân vật & giọng đọc</h3><p>{voices.length ? `Đã nạp ${voices.length} giọng từ thư viện (gồm giọng có sẵn và giọng clone được cấp quyền).` : voicesReady ? 'Thư viện chưa có giọng khả dụng.' : voiceStatus || 'Đang nạp thư viện giọng…'}</p><label>Tìm giọng trong thư viện<input aria-label="Tìm giọng trong thư viện" placeholder="Tên giọng, ngôn ngữ…" value={voiceSearch} onChange={e=>setVoiceSearch(e.target.value)}/></label>{voiceSearch&&!matchingVoices.length&&<p>Không tìm thấy giọng phù hợp. Xóa từ khóa để xem tất cả.</p>}{script.characters.map((c,index)=><div className="character-fields" key={c.id}><input aria-label={`Tên nhân vật ${index+1}`} maxLength={80} disabled={busy} value={c.name} onChange={e=>update({...script,characters:script.characters.map(v=>v.id===c.id?{...v,name:e.target.value}:v)})}/><select aria-label={`Giọng nhân vật ${index+1}`} disabled={busy||!voices.length} value={c.voice} onChange={e=>update({...script,characters:script.characters.map(v=>v.id===c.id?{...v,voice:e.target.value}:v)})}><option value="">Chọn giọng…</option>{!voices.some(v=>v.id===c.voice)&&c.voice&&<option value={c.voice}>Giọng không còn khả dụng</option>}{voices.filter(v=>v.id===c.voice||matchingVoices.some(m=>m.id===v.id)).map(v=><option key={v.id} value={v.id}>{v.name}{v.id.startsWith('clone_')?' · Giọng clone':''}</option>)}</select><button disabled={busy||script.characters.length===1||script.segments.some(s=>s.character===c.id)} title="Chỉ xóa được nhân vật chưa dùng trong lời thoại" onClick={()=>update({...script,characters:script.characters.filter(v=>v.id!==c.id)})}>Xóa nhân vật</button></div>)}<button disabled={busy||script.characters.length>=30} onClick={()=>update({...script,characters:[...script.characters,{id:id(),name:'Nhân vật '+(script.characters.length+1),voice:voices[0]?.id||''}]})}>+ Thêm nhân vật</button></section>
   <section className="workspace-card"><h3>Nhập kịch bản có nhãn</h3><p>Mỗi lượt thoại bắt đầu bằng tên và dấu hai chấm. Ví dụ: Lan: Xin chào.</p><textarea aria-label="Kịch bản có nhãn" placeholder={'Người dẫn: Hôm nay…\nLan: Xin chào!'} value={raw} disabled={busy} onChange={e=>setRaw(e.target.value)}/><button disabled={busy||!raw.trim()} onClick={importText}>Nhập lời thoại</button></section>
   <section className="workspace-card"><h3>Bản đọc hoàn chỉnh</h3><p>Ghép đúng thứ tự, dùng khoảng nghỉ giữa các đoạn. WAV 48 kHz.</p><button className="primary" disabled={busy||!valid||!can('tts.create')} onClick={merge}>Ghép âm thanh</button>{merged&&<div className="workspace-actions"><button onClick={()=>onPlay(merged.id)}>Nghe bản ghép</button><AudioDownload url={merged.url}/></div>}</section>
  </aside></div>
 </div>;
}
