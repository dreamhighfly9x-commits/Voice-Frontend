import { useEffect, useRef, useState } from 'react';

// Swap the file via public/landing-config.json (introVideo / introPoster / introCaptions).
// introAutoplay: true plays muted + inline once visible, never under reduced motion.
export default function HeroVideoPlayer({ src, poster, captions, autoplayMuted = false }) {
  const video = useRef(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = video.current;
    if (!autoplayMuted || !el || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) { if (!el.paused && el.muted) el.pause(); return; }
      if (!el.paused) return;
      el.muted = true;
      setMuted(true);
      el.play().catch(() => {});
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [autoplayMuted, src]);

  const play = () => {
    const el = video.current;
    if (!el) return;
    el.play().catch(() => setStarted(false));
  };
  const toggleMute = () => {
    const el = video.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  };

  return <figure className="hv-frame">
    <div className="hv-screen">
      {src && !failed ? <>
        <video
          ref={video}
          className="hv-video"
          src={src}
          poster={poster || undefined}
          controls
          playsInline
          preload="metadata"
          aria-label="Video giới thiệu DreamHigh Voice"
          onPlay={() => setStarted(true)}
          onVolumeChange={event => setMuted(event.currentTarget.muted)}
          onError={() => setFailed(true)}
        >{captions && <track kind="captions" src={captions} srcLang="vi" label="Tiếng Việt" default />}</video>
        {!started && <button type="button" className="hv-play" onClick={play} aria-label="Phát video giới thiệu"><span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" /></svg></span></button>}
        {started && muted && <button type="button" className="hv-unmute" onClick={toggleMute}>Bật âm thanh</button>}
      </> : <div className="hv-fallback" role="img" aria-label="Video giới thiệu DreamHigh Voice sắp ra mắt">
        <span className="hv-fallback-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" /></svg></span>
        <strong>Video giới thiệu sắp ra mắt</strong>
        <p>{failed ? 'Video hiện chưa phát được. Vui lòng thử lại sau.' : 'Studio · Chọn giọng · Generate · Nghe kết quả'}</p>
      </div>}
    </div>
    <figcaption className="hv-label"><span className="hv-label-dot" aria-hidden="true" />DreamHigh Voice — AI Voice Studio</figcaption>
  </figure>;
}
