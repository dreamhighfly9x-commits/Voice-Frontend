// Vector placeholders in the hero palette, used until a real image is set in useCaseSlides.js.
const INK = '#10213A';
const BLUE = '#2563EB';
const SKY = '#38BDF8';

function Bars({ x, y, width, height, count = 24, color = BLUE, seed = 1 }) {
  const step = width / count;
  return <g className="uc-art-wave">{Array.from({ length: count }, (_, i) => {
    const h = height * (0.22 + Math.abs(Math.sin(i * 0.7 + seed) * Math.cos(i * 0.23 + seed)) * 0.78);
    return <rect key={i} x={x + i * step} y={y - h / 2} width={step * 0.52} height={h} rx={step * 0.26} fill={color} opacity={0.35 + (i % 3) * 0.2} style={{ '--i': i }} />;
  })}</g>;
}

const Panel = ({ x, y, width, height, r = 16, fill = '#fff', opacity = 0.9 }) =>
  <rect x={x} y={y} width={width} height={height} rx={r} fill={fill} fillOpacity={opacity} stroke="#fff" strokeWidth="2" filter="url(#uc-shadow)" />;

const Mic = ({ x, y, s = 1 }) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <rect x="-22" y="-60" width="44" height="78" rx="22" fill="url(#uc-metal)" stroke="#fff" strokeWidth="2" />
  {[-40, -28, -16].map(v => <line key={v} x1="-14" x2="14" y1={v} y2={v} stroke="#fff" strokeOpacity=".7" strokeWidth="2" />)}
  <path d="M-34 0a34 34 0 0 0 68 0" fill="none" stroke={INK} strokeOpacity=".55" strokeWidth="5" strokeLinecap="round" />
  <rect x="-3" y="34" width="6" height="40" fill={INK} fillOpacity=".55" /><rect x="-30" y="72" width="60" height="8" rx="4" fill={INK} fillOpacity=".55" />
</g>;

const Headphones = ({ x, y, s = 1 }) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <path d="M-52 10v-12a52 52 0 0 1 104 0v12" fill="none" stroke={INK} strokeOpacity=".6" strokeWidth="9" strokeLinecap="round" />
  <rect x="-66" y="0" width="28" height="48" rx="12" fill={BLUE} /><rect x="38" y="0" width="28" height="48" rx="12" fill={BLUE} />
</g>;

const SCENES = {
  'ai-dubbing': accent => <>
    <Panel x={56} y={70} width={300} height={196} />
    <rect x="72" y="86" width="268" height="112" rx="10" fill="url(#uc-screen)" />
    <path d="M190 122l34 20-34 20z" fill="#fff" />
    {[0, 1, 2].map(i => <g key={i}><rect x="72" y={210 + i * 16} width="268" height="10" rx="5" fill="#EAF6FF" /><rect x={84 + i * 40} y={210 + i * 16} width={110 - i * 18} height="10" rx="5" fill={i === 1 ? accent : BLUE} opacity=".7" /></g>)}
    <Mic x={392} y={210} s={1.05} />
    <Bars x={80} y={316} width={300} height={54} seed={0.4} />
  </>,
  podcast: accent => <>
    <circle cx="240" cy="200" r="132" fill="#fff" fillOpacity=".55" stroke="#fff" strokeWidth="2" />
    <Mic x={240} y={210} s={1.7} />
    <Headphones x={110} y={150} s={0.8} />
    <Panel x={318} y={86} width={98} height={36} r={18} />
    <circle cx="340" cy="104" r="7" fill={accent}><animate attributeName="opacity" values="1;.3;1" dur="1.8s" repeatCount="indefinite" /></circle>
    <text x="354" y="109" fontSize="14" fontWeight="700" fill={INK} fontFamily="AppArial,Arial,sans-serif">ON AIR</text>
    <Bars x={96} y={360} width={288} height={36} count={30} seed={1.2} />
  </>,
  narration: accent => <>
    <Panel x={40} y={66} width={270} height={250} />
    <rect x="56" y="82" width="238" height="134" rx="10" fill="url(#uc-screen)" />
    <circle cx="175" cy="149" r="26" fill="#fff" fillOpacity=".9" /><path d="M167 136l22 13-22 13z" fill={BLUE} />
    {[0, 1, 2, 3].map(i => <rect key={i} x="56" y={232 + i * 18} width={238 - i * 40} height="9" rx="4.5" fill={i ? '#DFF7FF' : accent} opacity={i ? 1 : 0.7} />)}
    <Panel x={326} y={96} width={114} height={220} />
    {[0, 1, 2, 3].map(i => <g key={i}><rect x={344 + i * 22} y="120" width="6" height="150" rx="3" fill="#EAF6FF" /><rect x={338 + i * 22} y={150 + (i % 2) * 50 + i * 8} width="18" height="12" rx="6" fill={i % 2 ? SKY : BLUE} /></g>)}
    <Bars x={60} y={360} width={360} height={40} count={36} seed={2.1} />
  </>,
  'movie-review': accent => <>
    <path d="M60 80h360l-24 170H84z" fill="url(#uc-screen)" stroke="#fff" strokeWidth="3" filter="url(#uc-shadow)" />
    <Bars x={110} y={165} width={260} height={70} count={26} color="#fff" seed={0.9} />
    {[0, 1, 2].map(row => Array.from({ length: 7 - row }, (_, i) => <rect key={`${row}-${i}`} x={82 + row * 24 + i * 48} y={278 + row * 30} width="38" height="22" rx="8" fill={row === 1 && i === 2 ? accent : '#fff'} fillOpacity={row === 1 && i === 2 ? 0.9 : 0.75} stroke="#cfe6f7" />))}
    <rect x="368" y="60" width="64" height="40" rx="8" fill={INK} fillOpacity=".75" transform="rotate(12 400 80)" />
    {[0, 1, 2, 3].map(i => <rect key={i} x={376 + i * 14} y="66" width="8" height="6" rx="2" fill="#fff" transform="rotate(12 400 80)" />)}
  </>,
  tiktok: accent => <>
    <rect x="160" y="40" width="168" height="330" rx="30" fill={INK} filter="url(#uc-shadow)" />
    <rect x="170" y="50" width="148" height="310" rx="22" fill="url(#uc-screen)" />
    <circle cx="244" cy="170" r="40" fill="#fff" fillOpacity=".25" /><path d="M234 152l30 18-30 18z" fill="#fff" />
    {[0, 1].map(i => <rect key={i} x="184" y={300 + i * 16} width={i ? 70 : 104} height="8" rx="4" fill="#fff" fillOpacity=".85" />)}
    {[0, 1, 2].map(i => <circle key={i} cx="300" cy={226 + i * 30} r="10" fill="#fff" fillOpacity=".85" />)}
    <path d="M110 120c-12-14-34-2-24 16l24 22 24-22c10-18-12-30-24-16z" fill={accent} opacity=".85" />
    <path d="M372 200c-9-10-25-1-18 12l18 16 18-16c7-13-9-22-18-12z" fill={BLUE} opacity=".6" />
    <Bars x={74} y={330} width={70} height={40} count={8} seed={0.2} /><Bars x={344} y={300} width={70} height={40} count={8} seed={1.7} />
  </>,
  youtube: accent => <>
    <Panel x={50} y={60} width={380} height={232} />
    <rect x="66" y="76" width="236" height="140" rx="10" fill="url(#uc-screen)" />
    <rect x="160" y="128" width="48" height="34" rx="10" fill="#fff" /><path d="M178 136l14 9-14 9z" fill={BLUE} />
    {[0, 1, 2].map(i => <g key={i}><rect x="316" y={76 + i * 48} width="98" height="38" rx="8" fill={i ? '#EAF6FF' : '#DFF7FF'} /><rect x="324" y={88 + i * 48} width={60 - i * 10} height="6" rx="3" fill={i ? SKY : accent} /></g>)}
    {[0, 1].map(i => <rect key={i} x="66" y={232 + i * 22} width="348" height="14" rx="7" fill="#EAF6FF" />)}
    <rect x="96" y="232" width="150" height="14" rx="7" fill={BLUE} opacity=".7" /><rect x="180" y="254" width="200" height="14" rx="7" fill={accent} opacity=".6" />
    <line x1="210" x2="210" y1="224" y2="276" stroke={INK} strokeWidth="2" />
    <Bars x={80} y={348} width={320} height={44} count={32} seed={3.3} />
  </>,
  audiobook: accent => <>
    <path d="M240 124c-50-26-110-26-160-8v190c50-18 110-18 160 8z" fill="#fff" stroke="#cfe6f7" strokeWidth="2" filter="url(#uc-shadow)" />
    <path d="M240 124c50-26 110-26 160-8v190c-50-18-110-18-160 8z" fill="#F8FCFF" stroke="#cfe6f7" strokeWidth="2" filter="url(#uc-shadow)" />
    {[0, 1, 2, 3, 4].map(i => <g key={i}><rect x="104" y={156 + i * 24} width={112 - (i % 2) * 24} height="6" rx="3" fill="#cfe0f2" /><rect x="264" y={156 + i * 24} width={112 - ((i + 1) % 2) * 24} height="6" rx="3" fill="#cfe0f2" /></g>)}
    <Headphones x={240} y={96} s={1.25} />
    <Panel x={110} y={330} width={260} height={50} r={25} />
    <circle cx="136" cy="355" r="15" fill={BLUE} /><path d="M131 347l12 8-12 8z" fill="#fff" />
    <rect x="164" y="352" width="186" height="6" rx="3" fill="#EAF6FF" /><rect x="164" y="352" width="96" height="6" rx="3" fill={accent} />
  </>,
  'e-learning': accent => <>
    <rect x="70" y="70" width="340" height="216" rx="16" fill={INK} fillOpacity=".85" filter="url(#uc-shadow)" />
    <rect x="82" y="82" width="316" height="192" rx="8" fill="#F8FCFF" />
    <rect x="96" y="96" width="176" height="104" rx="8" fill="url(#uc-screen)" />
    <circle cx="184" cy="148" r="22" fill="#fff" fillOpacity=".9" /><path d="M178 137l18 11-18 11z" fill={BLUE} />
    {[0, 1, 2].map(i => <g key={i}><rect x="286" y={98 + i * 34} width="98" height="24" rx="6" fill="#EAF6FF" /><rect x="294" y={108 + i * 34} width={70 - i * 18} height="5" rx="2.5" fill={i ? SKY : accent} /></g>)}
    {[0, 1].map(i => <g key={i}><rect x="96" y={216 + i * 22} width="288" height="10" rx="5" fill="#EAF6FF" /><rect x="96" y={216 + i * 22} width={200 - i * 80} height="10" rx="5" fill={i ? SKY : BLUE} opacity=".75" /></g>)}
    <path d="M40 300h400l-24 22H64z" fill="#cfe0f2" />
    <path d="M370 40l46 18-46 18-46-18z" fill={BLUE} /><path d="M350 66v18c12 8 28 8 40 0V66" fill={BLUE} opacity=".7" />
    <Bars x={96} y={360} width={290} height={36} count={28} seed={0.6} />
  </>,
};

// Gradients/filters shared by every slide; rendered once by the slider so ids stay unique.
// Foreground object that pops out of the card on hover (3D hover card "character" layer).
const POPS = {
  'ai-dubbing': accent => <><Mic x={150} y={150} s={1.9} /><Bars x={40} y={268} width={220} height={36} count={22} color={accent} seed={0.4} /></>,
  podcast: () => <><Headphones x={150} y={120} s={1.9} /><Mic x={150} y={200} s={0.9} /></>,
  narration: accent => <>
    <circle cx="150" cy="150" r="78" fill="#fff" fillOpacity=".92" stroke="#fff" strokeWidth="3" filter="url(#uc-shadow)" />
    <path d="M128 112l64 38-64 38z" fill={BLUE} />
    <Bars x={50} y={262} width={200} height={34} count={20} color={accent} seed={2.1} />
  </>,
  'movie-review': accent => <g transform="translate(150 170)">
    <rect x="-96" y="-30" width="192" height="110" rx="12" fill={INK} filter="url(#uc-shadow)" />
    <g transform="rotate(-14 -96 -30)"><rect x="-96" y="-64" width="192" height="34" rx="8" fill={INK} />{[0, 1, 2, 3, 4].map(i => <path key={i} d={`M${-80 + i * 38} -64l18 34h-14l-18-34z`} fill="#fff" />)}</g>
    {[0, 1, 2].map(i => <rect key={i} x="-76" y={-8 + i * 26} width={150 - i * 40} height="9" rx="4.5" fill={i ? '#fff' : accent} fillOpacity={i ? 0.35 : 0.9} />)}
  </g>,
  tiktok: accent => <>
    <rect x="94" y="30" width="112" height="226" rx="22" fill={INK} filter="url(#uc-shadow)" />
    <rect x="102" y="38" width="96" height="210" rx="16" fill="url(#uc-screen)" />
    <path d="M140 124l26 16-26 16z" fill="#fff" />
    <path d="M232 92c-9-10-25-1-18 12l18 16 18-16c7-13-9-22-18-12z" fill={accent} />
    <path d="M62 170c-7-8-19-1-14 9l14 12 14-12c5-10-7-17-14-9z" fill={BLUE} opacity=".75" />
  </>,
  youtube: accent => <>
    <rect x="52" y="86" width="196" height="132" rx="34" fill="url(#uc-screen)" stroke="#fff" strokeWidth="4" filter="url(#uc-shadow)" />
    <path d="M132 122l52 30-52 30z" fill="#fff" />
    <Bars x={60} y={262} width={180} height={30} count={18} color={accent} seed={3.3} />
  </>,
  audiobook: accent => <>
    <Headphones x={150} y={96} s={1.6} />
    <path d="M150 170c-34-18-74-18-108-6v80c34-12 74-12 108 6z" fill="#fff" stroke="#cfe6f7" strokeWidth="2" filter="url(#uc-shadow)" />
    <path d="M150 170c34-18 74-18 108-6v80c-34-12-74-12-108 6z" fill="#F8FCFF" stroke="#cfe6f7" strokeWidth="2" filter="url(#uc-shadow)" />
    {[0, 1, 2].map(i => <g key={i}><rect x="66" y={192 + i * 16} width="64" height="5" rx="2.5" fill={i ? '#cfe0f2' : accent} /><rect x="170" y={192 + i * 16} width="64" height="5" rx="2.5" fill="#cfe0f2" /></g>)}
  </>,
  'e-learning': accent => <>
    <path d="M150 70l120 46-120 46-120-46z" fill={BLUE} filter="url(#uc-shadow)" />
    <path d="M94 140v52c34 24 78 24 112 0v-52l-56 22z" fill={BLUE} opacity=".8" />
    <path d="M250 124v64" stroke={accent} strokeWidth="5" strokeLinecap="round" /><circle cx="250" cy="196" r="10" fill={accent} />
    <Bars x={70} y={262} width={160} height={30} count={16} color={accent} seed={0.6} />
  </>,
};

export function UseCasePop({ id, accent }) {
  const pop = POPS[id] || POPS['ai-dubbing'];
  return <svg className="uc-pop" viewBox="0 0 300 300" aria-hidden="true" focusable="false">{pop(accent)}</svg>;
}

export function UseCaseArtDefs() {
  return <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false"><defs>
      <linearGradient id="uc-screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={SKY} /><stop offset="1" stopColor={BLUE} /></linearGradient>
      <linearGradient id="uc-metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#93C5FD" /><stop offset=".5" stopColor="#E0F2FE" /><stop offset="1" stopColor="#60A5FA" /></linearGradient>
      <filter id="uc-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#2563EB" floodOpacity=".16" /></filter>
  </defs></svg>;
}

export default function UseCaseArt({ id, accent, variant = 'card' }) {
  const key = `${id}-${variant}`;
  const scene = SCENES[id] || SCENES['ai-dubbing'];
  return <svg className="uc-art" viewBox="0 0 480 600" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`uc-bg-${key}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F8FCFF" /><stop offset=".55" stopColor="#EAF6FF" /><stop offset="1" stopColor={accent} stopOpacity=".35" /></linearGradient>
      <radialGradient id={`uc-glow-${key}`} cx=".75" cy=".2" r=".6"><stop offset="0" stopColor={accent} stopOpacity=".45" /><stop offset="1" stopColor={accent} stopOpacity="0" /></radialGradient>
    </defs>
    <rect width="480" height="600" fill={`url(#uc-bg-${key})`} />
    <rect width="480" height="600" fill={`url(#uc-glow-${key})`} />
    {[90, 150, 210].map(r => <circle key={r} cx="400" cy="70" r={r} fill="none" stroke="#fff" strokeOpacity=".55" />)}
    <g opacity=".5">{Array.from({ length: 9 }, (_, i) => <circle key={i} cx={30 + i * 52} cy={30 + (i % 3) * 14} r="1.6" fill={BLUE} opacity=".35" />)}</g>
    {scene(accent)}
  </svg>;
}
