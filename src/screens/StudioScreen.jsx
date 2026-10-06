import {useState} from 'react';
import DeleteRecording from '../components/DeleteRecording';
import AudioDownload from '../components/AudioDownload';
import StudioTools from '../components/StudioTools';
import PlayButton from '../components/PlayButton';
import GenerateButton from '../components/GenerateButton';
import ExpressionTextarea from '../components/ExpressionTextarea';
import VoiceOptions from '../components/VoiceOptions';
import GenMaxEnhance from '../components/GenMaxEnhance';
import {defaultOptions} from '../lib/voiceControls';
import './StudioScreen.css';

function voiceSource(v, fallback) {
  const cloud=v.id.startsWith('prov:')||v.id.startsWith('ext_');
  const tags=(v.tags||'').split(' · ');
  return {provider:v.provider_name||(cloud?tags[1]||'Cloud TTS':'VieNeu Local'),model:v.model_name||(cloud?tags[2]||'Model của giọng':fallback),language:v.language||tags[0]||'Tiếng Việt'};
}

export default function StudioScreen({modelName,maxChars,voiceLanguage='Tiếng Việt',voiceControls=[],voiceOptions={},onVoiceOption,
 dictionary,onDictionary,userId,onReplace,onUndo,canUndo,effectiveChars,animStyle,text,onText,onNormalize,onAutoSplit,charLabel,estDuration,segmentCountLabel,
 onPreview,onGenerate,generating,engineReady,results,playingId,onPlay,onDelete,quickVoices=[],voices=quickVoices,voice,onPickVoice,onGoVoices,queueLabel}) {
 const [tab,setTab]=useState('settings'),[taskName,setTaskName]=useState(''),[toolsOpen,setToolsOpen]=useState(false),[message,setMessage]=useState('');
 const [names,setNames]=useState(()=>{try{const saved=JSON.parse(localStorage.getItem(`studio-download-names:${userId}`)||'{}');return saved&&typeof saved==='object'&&!Array.isArray(saved)?Object.fromEntries(Object.entries(saved).filter(([,value])=>typeof value==='string')):{};}catch{return {};}});
 const catalog=voices.map(v=>({...v,...voiceSource(v,modelName)}));
 const selected=catalog.find(v=>v.id===voice);
 const provider=selected?.provider||catalog[0]?.provider;
 const providerVoices=catalog.filter(v=>v.provider===provider);
 const models=[...new Set(providerVoices.map(v=>v.model))];
 const model=selected?.model||models[0];
 const modelVoices=providerVoices.filter(v=>v.model===model);
 const languages=[...new Set(modelVoices.map(v=>v.language))];
 const language=selected?.language||languages[0];
 const chars=effectiveChars??text.length;
 function split(mode){
   const pieces=mode==='lines'?text.split(/\r?\n/):typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('vi',{granularity:'sentence'}).segment(text)].map(s=>s.segment):text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[];
   const clean=pieces.map(s=>s.trim()).filter(Boolean);onReplace(clean.join('\n\n'));setMessage(`Đã tách ${clean.length} ${mode==='lines'?'dòng':'câu'} trong văn bản. Tạo âm thanh vẫn xuất một bản ghi.`);
 }
 async function create(){
   const filename=taskName.trim();const record=await onGenerate();
   if(record?.id){if(filename){const next={...names,[record.id]:filename};setNames(next);try{localStorage.setItem(`studio-download-names:${userId}`,JSON.stringify(next));}catch{/* Download naming still works during this visit. */}}setTab('history');}
 }
 return <div className="voice-studio" style={animStyle}>
   <section className="studio-editor" aria-label="Soạn nội dung tạo giọng">
     <div className="studio-editor-top"><label className="studio-task-name"><span aria-hidden="true">◇</span><input aria-label="Tên file tải về" placeholder="Tên task (tên file tải về)" value={taskName} maxLength={100} disabled={generating} onChange={e=>setTaskName(e.target.value)}/></label><div className="studio-split-actions"><button disabled={generating||!text.trim()} onClick={()=>split('lines')}>Tách theo dòng</button><button className="studio-accent-button" disabled={generating||!text.trim()} onClick={()=>split('sentences')}>✂ Tách theo câu</button></div></div>
     <div className="studio-writing"><ExpressionTextarea providerType={selected?.provider_type} emotionTags={selected?.provider_type?selected?.capabilities?.emotion_tags:undefined} compact voiceId={voice} disabled={generating} aria-label="Nội dung chuyển thành giọng nói" value={text} onChange={onText} placeholder="Dán hoặc nhập nội dung bạn muốn chuyển thành giọng nói…"/>
       {chars>maxChars&&<p role="alert" className="studio-error">Nội dung vượt giới hạn {maxChars.toLocaleString('vi-VN')} ký tự/lần tạo. Hãy rút ngắn nội dung; vẫn có thể nghe thử đoạn đầu.</p>}
       {selected?.provider_type==='genmax'&&selected?.capabilities?.emotion_tags&&<GenMaxEnhance voice={voice} text={text} onReplace={onReplace} disabled={generating}/>}
       {message&&<p className="studio-notice" role="status">{message}</p>}
     </div>
     {toolsOpen&&<StudioTools text={text} onReplace={onReplace} onNormalize={onNormalize} onAutoSplit={onAutoSplit} dictionary={dictionary} onDictionary={onDictionary} userId={userId} disabled={generating}/>}
     <div className="studio-editor-bottom"><div className="studio-edit-actions"><button aria-expanded={toolsOpen} onClick={()=>setToolsOpen(!toolsOpen)}>↥ Nhập file & công cụ</button><button disabled={generating||!text.trim()} onClick={onNormalize}>✧ Chuẩn hóa văn bản</button><button disabled={!canUndo||generating} onClick={onUndo}>↶ Hoàn tác</button></div><div className="studio-submit-row"><div className="studio-word-count"><strong>{charLabel}</strong><span>{effectiveChars!==undefined&&effectiveChars!==text.length?`Sau từ điển: ${chars.toLocaleString('vi-VN')} ký tự · `:''}Ước tính {estDuration} · {segmentCountLabel}</span></div><button onClick={onPreview} disabled={generating||!engineReady||!text.trim()||!voice}>Nghe thử 1 đoạn</button><GenerateButton generating={generating} onClick={create} disabled={generating||!engineReady||!text.trim()||!voice||chars>maxChars}/></div></div>
   </section>
   <aside className="studio-settings"><div className="studio-panel-tabs" role="tablist" aria-label="Bảng điều khiển tạo giọng"><button id="studio-settings-tab" role="tab" aria-selected={tab==='settings'} aria-controls="studio-settings-panel" onClick={()=>setTab('settings')}>☷ Cài đặt</button><button id="studio-history-tab" role="tab" aria-selected={tab==='history'} aria-controls="studio-history-panel" onClick={()=>setTab('history')}>◷ Lịch sử <span>{results.length}</span></button></div>
     <section role="tabpanel" id="studio-settings-panel" aria-labelledby="studio-settings-tab" hidden={tab!=='settings'}>
       <div className="studio-setting-group"><h3>Nhà cung cấp</h3><div className="studio-provider-options">{[...new Set(catalog.map(v=>v.provider))].map(name=><button key={name} aria-pressed={provider===name} disabled={generating} onClick={()=>onPickVoice(catalog.find(v=>v.provider===name).id)}>{name}</button>)}</div>{!catalog.length&&<p>Đang tải thư viện giọng…</p>}</div>
       <label className="studio-field">Chọn giọng nói<select value={voice} disabled={generating||!catalog.length} onChange={e=>onPickVoice(e.target.value)}>{!selected&&<option value="">Chọn giọng</option>}{modelVoices.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
       <button className="studio-library-link" onClick={onGoVoices}>Xem thư viện giọng ↗</button>
       <label className="studio-field">Chọn mô hình<select value={model||''} disabled={generating||models.length<2} onChange={e=>onPickVoice((providerVoices.find(v=>v.model===e.target.value&&v.name===selected?.name)||providerVoices.find(v=>v.model===e.target.value)).id)}>{models.map(m=><option key={m}>{m}</option>)}</select></label>
       <label className="studio-field">Ngôn ngữ của giọng<select value={language||''} disabled={generating||languages.length<2} onChange={e=>onPickVoice(modelVoices.find(v=>v.language===e.target.value).id)}>{languages.length?languages.map(l=><option key={l}>{l}</option>):<option value="">{voiceLanguage}</option>}</select></label>
       <div className="studio-voice-controls"><VoiceOptions specs={selected?.capabilities?.options} controls={voiceControls} values={voiceOptions} onChange={onVoiceOption} disabled={generating}/>{!voiceControls.length&&<p className="studio-control-hint">Giọng này dùng thông số mặc định của model, chưa hỗ trợ chỉnh tốc độ hoặc độ ổn định.</p>}</div>
       <button className="studio-reset" disabled={generating||!voiceControls.length} onClick={()=>Object.entries(defaultOptions(voiceControls)).forEach(([key,value])=>onVoiceOption(key,value))}>↶ Đặt lại thông số</button>
       <label className="studio-srt"><input type="checkbox" disabled/> Xuất phụ đề SRT <span>Chưa hỗ trợ</span></label><p className="studio-control-hint">Cần mốc thời gian từ âm thanh để xuất phụ đề chính xác.</p>
       <div className="studio-status" role="status"><strong>{generating?'Đang xử lý…':'Trạng thái tạo giọng'}</strong><span>{queueLabel}</span><small>WAV · Tối đa {maxChars.toLocaleString('vi-VN')} ký tự/lần</small></div>
       <details className="studio-quick-voices"><summary>Giọng chọn nhanh</summary>{quickVoices.map(v=><button key={v.id} data-testid="quick-voice-row" aria-pressed={voice===v.id} disabled={generating} onClick={()=>onPickVoice(v.id)}>{v.name}</button>)}</details>
     </section>
     <section role="tabpanel" id="studio-history-panel" aria-labelledby="studio-history-tab" hidden={tab!=='history'}><h3>Bản ghi đã tạo</h3>{!results.length&&<p className="studio-control-hint">Chưa có bản ghi. Nhập văn bản và bấm Tạo âm thanh.</p>}{results.map(r=><article key={r.id} className="studio-history-item" data-testid="studio-result-row"><div><PlayButton active={playingId===r.id} size={34} onClick={()=>onPlay(r.id)}/><strong title={r.title}>{names[r.id]||r.title}</strong><small>{r.dur}</small></div><p>{r.meta}</p><div className="studio-history-actions"><AudioDownload url={r.url} filename={names[r.id]}/><DeleteRecording recording={r} onDelete={onDelete}/></div></article>)}</section>
   </aside>
 </div>;
}
