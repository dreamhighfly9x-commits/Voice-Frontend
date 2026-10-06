import './LoadingIndicator.css';

export default function LoadingIndicator({ label = 'Đang tải…', fullScreen = false }) {
  return (
    <div className={`voice-loading${fullScreen ? ' voice-loading--fullscreen' : ''}`} role="status" aria-live="polite">
      <div className="voice-loader" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => (
          <div className="text" key={index}><span>LOADING</span></div>
        ))}
        <div className="line" />
      </div>
      <span className="voice-loading-label">{label}</span>
    </div>
  );
}
