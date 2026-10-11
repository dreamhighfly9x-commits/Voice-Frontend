import { useCallback, useEffect, useRef, useState } from 'react';
import UseCaseSlideCard, { SlideMedia, WaveIcon } from './UseCaseSlideCard';
import { UseCaseArtDefs } from './UseCaseArt';
import { USE_CASE_SLIDES } from './useCaseSlides';
import UseCaseIcon, { AiSparkle } from './UseCaseIcons';

const INTERVAL_MS = 5500;
const SWIPE_PX = 40;

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true);
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return;
    const update = () => setReduced(query.matches);
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

function offsetOf(i, current, total) {
  const raw = (i - current + total) % total;
  return raw > total / 2 ? raw - total : raw;
}

const Chevron = ({ dir }) => <svg viewBox="0 0 24 24" aria-hidden="true"><path d={dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} /></svg>;

export default function UseCaseImageSlider({ slides = USE_CASE_SLIDES }) {
  const total = slides.length;
  const [current, setCurrent] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const reducedMotion = useReducedMotion();
  const root = useRef(null);
  const dialog = useRef(null);
  const pointerStart = useRef(null);
  const swiped = useRef(false);

  const go = useCallback(step => setCurrent(c => (c + step + total) % total), [total]);
  const playing = !hovered && !focused && !expanded && inView && pageVisible && !reducedMotion && total > 1;

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => go(1), INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [playing, current, go]);

  useEffect(() => {
    const node = root.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  const openExpand = () => { setExpanded(true); dialog.current?.showModal?.(); };
  const closeExpand = () => dialog.current?.close?.();

  const onKeyDown = event => {
    if (event.target.closest('dialog')) return;
    if (event.key === 'ArrowRight') go(1);
    else if (event.key === 'ArrowLeft') go(-1);
    else if (event.key === 'Home') setCurrent(0);
    else if (event.key === 'End') setCurrent(total - 1);
    else return;
    event.preventDefault();
  };
  const onPointerDown = event => { pointerStart.current = { x: event.clientX, y: event.clientY }; swiped.current = false; };
  const onPointerUp = event => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(event.clientY - start.y)) { swiped.current = true; go(dx < 0 ? 1 : -1); }
  };
  // A swipe that ends over a side card must not also select it.
  const onClickCapture = event => { if (swiped.current) { event.stopPropagation(); swiped.current = false; } };

  const slide = slides[current];
  return <section
    ref={root}
    className={`uc-slider ${playing ? 'is-playing' : 'is-paused'}`}
    aria-roledescription="carousel"
    aria-label="Ứng dụng thực tế của DreamHigh Voice"
    tabIndex={0}
    onKeyDown={onKeyDown}
    onPointerEnter={event => event.pointerType === 'mouse' && setHovered(true)}
    onPointerLeave={() => setHovered(false)}
    onFocus={() => setFocused(true)}
    onBlur={event => !event.currentTarget.contains(event.relatedTarget) && setFocused(false)}
    style={{ '--accent': slide.accent, '--interval': `${INTERVAL_MS}ms` }}
  >
    <UseCaseArtDefs />
    <div className="uc-slider-glow" aria-hidden="true" />
    <div className="uc-stage" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { pointerStart.current = null; }} onClickCapture={onClickCapture} aria-live={playing ? 'off' : 'polite'}>
      {slides.map((item, i) => <UseCaseSlideCard key={item.id} slide={item} index={i} total={total} offset={offsetOf(i, current, total)} eager={i === 0} onSelect={setCurrent} onExpand={openExpand} />)}
    </div>

    <div className="uc-dock">
      <button type="button" className="uc-dock-btn" onClick={() => go(-1)} aria-label="Slide trước"><Chevron dir="left" /></button>
      <span className="uc-dock-thumb" aria-hidden="true"><SlideMedia slide={slide} variant="thumb" /></span>
      <span className="uc-dock-text" key={slide.id}><strong>{slide.title}</strong><small>{slide.category}</small><small>AI Text to Speech</small></span>
      <a className="uc-dock-btn" href="/register" aria-label={`Thử ${slide.title} với DreamHigh Voice`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" /></svg></a>
      <button type="button" className="uc-dock-btn" onClick={() => go(1)} aria-label="Slide tiếp theo"><Chevron dir="right" /></button>
    </div>
    <div className="uc-dots">{slides.map((item, i) => <button type="button" key={item.id} className={i === current ? 'uc-dot is-active' : 'uc-dot'} onClick={() => setCurrent(i)} aria-label={`Chuyển tới slide ${i + 1}: ${item.title}`} aria-current={i === current ? 'true' : undefined} title={item.title} style={{ '--accent': item.accent }}><span className="uc-dot-icon"><UseCaseIcon id={item.id} /><AiSparkle /></span><span className="uc-dot-bar" /></button>)}</div>

    <dialog ref={dialog} className="uc-dialog" aria-label={slide.title} onClose={() => setExpanded(false)} onClick={event => event.target === event.currentTarget && closeExpand()}>
      {expanded && <div className="uc-dialog-card" style={{ '--accent': slide.accent }}>
        <div className="uc-dialog-media"><SlideMedia slide={slide} variant="dialog" eager /></div>
        <div className="uc-dialog-body">
          <span className="uc-card-meta"><WaveIcon />{slide.category}</span>
          <h3>{slide.title}</h3>
          <p>{slide.description}</p>
          <a className="hh-btn hh-btn-primary" href="/register">Thử ngay với DreamHigh Voice</a>
        </div>
        <button type="button" className="uc-dialog-close" onClick={closeExpand} aria-label="Đóng">✕</button>
      </div>}
    </dialog>
  </section>;
}
