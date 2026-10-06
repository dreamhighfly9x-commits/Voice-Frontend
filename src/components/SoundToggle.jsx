import './SoundToggle.css';

const VOICE = 'M3 9.5h4l5.2-4.3c.5-.4 1.3 0 1.3.7v12.2c0 .7-.8 1.1-1.3.7L7 14.5H3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1ZM16.2 8.3a.9.9 0 0 1 1.3 0 5.3 5.3 0 0 1 0 7.4.9.9 0 1 1-1.3-1.3 3.5 3.5 0 0 0 0-4.8.9.9 0 0 1 0-1.3ZM18.8 5.7a.9.9 0 0 1 1.3 0 9 9 0 0 1 0 12.6.9.9 0 1 1-1.3-1.3 7.2 7.2 0 0 0 0-10 .9.9 0 0 1 0-1.3Z';
const MUTE = 'M3 9.5h4l5.2-4.3c.5-.4 1.3 0 1.3.7v12.2c0 .7-.8 1.1-1.3.7L7 14.5H3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1ZM16.3 9.3a.9.9 0 0 1 1.3 0l1.7 1.7 1.7-1.7a.9.9 0 1 1 1.3 1.3L20.6 12.3l1.7 1.7a.9.9 0 1 1-1.3 1.3l-1.7-1.7-1.7 1.7a.9.9 0 1 1-1.3-1.3l1.7-1.7-1.7-1.7a.9.9 0 0 1 0-1.3Z';

// Adapted from Uiverse.io by catraco: mute/voice icon swap with a pop-in animation.
export default function SoundToggle({ sound, onToggle }) {
  const label = sound ? 'Tắt âm thao tác' : 'Bật âm thao tác';
  return (
    <button type="button" className="icon-button sound-toggle" onClick={onToggle}
      aria-label={label} aria-pressed={sound} title={label}>
      <svg key={sound ? 'voice' : 'mute'} className={sound ? 'voice' : 'mute'} viewBox="0 0 24 24" aria-hidden="true">
        <path d={sound ? VOICE : MUTE} />
      </svg>
    </button>
  );
}
