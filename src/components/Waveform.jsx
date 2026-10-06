import { bars } from '../lib/waveform';

export default function Waveform({ n = 24, seed = 1, active, live, height = 34 }) {
  const barList = bars(n, seed, active, live);
  return (
    <div
      style={{
        flex: '2 1 120px',
        height,
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        gap: 3,
        minWidth: 0,
      }}
    >
      {barList.map((b) => (
        <div key={b.key} style={b.style} />
      ))}
    </div>
  );
}
