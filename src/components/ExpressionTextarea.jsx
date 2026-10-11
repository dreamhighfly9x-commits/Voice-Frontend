import { useLayoutEffect, useRef, useId, useState } from 'react';
import './ExpressionTextarea.css';

const expressions = ['cười', 'thở dài', 'hắng giọng'];

export default function ExpressionTextarea({ voiceId = '', value, onChange, disabled, compact=false, providerType='', emotionTags, tagGroups, toolbarExtra, ...props }) {
  const [expanded,setExpanded]=useState(false);
  const input = useRef(null);
  const caret = useRef(null);
  const touched = useRef(false);
  const hint = useId();
  const supported = emotionTags ?? !/^qwen(?:06|17):/.test(voiceId);
  const tags = providerType==='genmax' ? ['happy', 'sad', 'laughs', 'sighs', 'whispers'] : expressions;
  useLayoutEffect(() => {
    if (caret.current === null) return;
    input.current.focus();
    input.current.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  }, [value]);
  function insert(expression) {
    const node = input.current;
    const start = touched.current ? node.selectionStart : value.length;
    const end = touched.current ? node.selectionEnd : value.length;
    const before = value.slice(0, start), after = value.slice(end);
    const tag = `${before && !/\s$/.test(before) ? ' ' : ''}[${expression}]${!after || !/^[\s,.!?;:…]/.test(after) ? ' ' : ''}`;
    caret.current = start + tag.length;
    touched.current = true;
    onChange({ target: { value: before + tag + after } });
  }
  return <>
    <div className="expression-tools">
      {compact&&<div className="expression-toolbar">{toolbarExtra}<button type="button" disabled={disabled} aria-expanded={expanded} onMouseDown={e=>e.preventDefault()} onClick={()=>setExpanded(!expanded)}>{tagGroups?'✧ Hướng dẫn thẻ âm thanh':'✧ Thêm thẻ cảm xúc'}</button></div>}
      {tagGroups?<div className="expression-tag-guide" hidden={compact&&!expanded} role="group" aria-label="Thẻ âm thanh">
        <p className="expression-tag-intro">Đặt thẻ trong ngoặc vuông ngay trước đoạn cần thể hiện, ví dụ <code>[whispering] Bí mật nhé.</code> Bấm một thẻ để chèn tại con trỏ.</p>
        {tagGroups.map(g=><div className="expression-tag-group" key={g.name}><h4>{g.name}<small>{g.vi}</small></h4><div>
          {g.tags.map(t=><button key={t} type="button" disabled={disabled||!supported} aria-label={`Chèn ${t}`} onMouseDown={e=>e.preventDefault()} onClick={()=>insert(t)}>[{t}]</button>)}
        </div></div>)}
      </div>:<div className="expression-tools-row" hidden={compact&&!expanded} role="group" aria-label="Chèn cảm xúc và âm thanh">
        <span>Cảm xúc & âm thanh</span>
        {tags.map(expression => <button key={expression} type="button"
          disabled={disabled || !supported} aria-label={`Chèn ${expression}`}
          onMouseDown={event => event.preventDefault()} onClick={() => insert(expression)}>
          + {expression.charAt(0).toUpperCase() + expression.slice(1)}
        </button>)}
      </div>}
      <p id={hint} hidden={compact&&!expanded}>{supported
        ? providerType==='genmax' ? 'Thẻ cảm xúc DreamHigh: hiệu quả tùy model, giọng và ngữ cảnh.' : 'Chèn tại con trỏ hoặc thay phần đang chọn. VieNeu v3: tính năng thử nghiệm, hiệu quả tùy giọng và câu đọc.'
        : 'Model này chưa hỗ trợ các thẻ cảm xúc.'}</p>
    </div>
    <textarea {...props} ref={input} value={value} disabled={disabled} onChange={onChange}
      aria-describedby={[props['aria-describedby'], hint].filter(Boolean).join(' ')}
      onFocus={event => { touched.current = true; props.onFocus?.(event); }} />
  </>;
}
