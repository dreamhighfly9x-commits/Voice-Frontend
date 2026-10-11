// Brand marks for synthesis engines (ElevenLabs: Simple Icons, CC0; CapCut: theSVG, MIT).
const PATHS = {
  ElevenLabs: { viewBox: '0 0 24 24', d: 'M4.604 0v24h4.931V0zm9.86 0v24h4.933V0z' },
  CapCut: { viewBox: '0 0 24.2 24', d: 'M24.189 6.442V2.671l-4.535 2.383V4.91c.002-1.505-1.078-2.411-2.638-2.411H2.64C.993 2.5 0 3.407 0 4.91v3.81L6.354 12L0 15.316v3.8C0 20.595 1 21.5 2.64 21.5h14.373c1.56 0 2.639-.907 2.639-2.382v-.197l4.536 2.409v-3.828L13.64 12l10.55-5.557zM9.982 13.873l7.797 4.083H2.157zm7.741-7.828l-7.742 4.057l-7.825-4.057z', evenOdd: true },
};

export default function ProviderLogo({ name, size = 16 }) {
  const key = Object.keys(PATHS).find((k) => name?.includes(k));
  if (!key) return null;
  const p = PATHS[key];
  return <svg className="provider-logo" width={size} height={size} viewBox={p.viewBox} aria-hidden="true" focusable="false"><path fill="currentColor" fillRule={p.evenOdd ? 'evenodd' : undefined} d={p.d} /></svg>;
}
