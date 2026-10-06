// Dynamic controls for external-provider voices. Only the controls the chosen
// provider/model actually declares (voice.controls from /api/voices) are shown,
// so we never expose a knob the provider ignores. Values flow up to App and are
// sent as `options` on synthesize.
import { CONTROL_META } from '../lib/voiceControls';

export default function VoiceOptions({ controls = [], values = {}, specs = {}, onChange, disabled }) {
  if (!controls.length) return null;
  return (
    <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ fontSize: 14.5, fontWeight: 700 }}>Tùy chọn giọng</span>
        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--dim2)' }}>Dịch vụ ngoài</span>
      </div>
      {controls.map((name) => {
        const meta = {...(CONTROL_META[name] || { label: name, min: 0, max: 1, step: 0.05, def: 0.5 }),...specs[name]};
        const value = values[name] ?? meta.def;
        return (
          <label key={name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--dim)', display: 'flex', justifyContent: 'space-between' }}>
              <span>{meta.label}</span>
              <span style={{ color: 'var(--ink2)' }}>{Number(value).toFixed(meta.step < 1 ? 2 : 0)}</span>
            </span>
            <input
              type="range" min={meta.min} max={meta.max} step={meta.step} value={value} disabled={disabled}
              onChange={(e) => onChange(name, Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--acc)' }}
            />
          </label>
        );
      })}
    </div>
  );
}
