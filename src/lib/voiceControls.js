// Metadata + defaults for external-provider voice controls. Kept out of the
// component file so both the panel and App can import the helper without
// tripping react-refresh's "only export components" rule.
export const CONTROL_META = {
  stability: { label: 'Độ ổn định', min: 0, max: 1, step: 0.05, def: 0.5 },
  similarity: { label: 'Độ giống giọng gốc', min: 0, max: 1, step: 0.05, def: 0.75 },
  similarity_boost: { label: 'Độ giống giọng gốc', min: 0, max: 1, step: 0.05, def: 0.75 },
  style: { label: 'Cường độ phong cách', min: 0, max: 1, step: 0.05, def: 0 },
  speed: { label: 'Tốc độ đọc', min: 0.7, max: 1.2, step: 0.05, def: 1 },
  pitch: { label: 'Cao độ', min: -12, max: 12, step: 1, def: 0 },
  temperature: { label: 'Độ ngẫu nhiên', min: 0, max: 1, step: 0.05, def: 0.7 },
};

export function defaultOptions(controls = []) {
  const out = {};
  for (const name of controls) out[name] = CONTROL_META[name]?.def ?? 0.5;
  return out;
}
