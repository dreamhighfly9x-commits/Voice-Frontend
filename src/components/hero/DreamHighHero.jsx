import { useEffect, useRef } from 'react';
import HeroBackgroundEffects from './HeroBackgroundEffects';
import HeroHeadline from './HeroHeadline';
import HeroVideoPlayer from './HeroVideoPlayer';
import UseCaseImageSlider from './UseCaseImageSlider';
import './DreamHighHero.css';

export default function DreamHighHero({ config = {} }) {
  const section = useRef(null);

  // Light parallax: exposes scroll progress (0..1) through the hero as --hero-scroll.
  useEffect(() => {
    const node = section.current;
    if (!node || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      if (rect.bottom < 0) return;
      node.style.setProperty('--hero-scroll', Math.min(1, Math.max(0, -rect.top / rect.height)).toFixed(3));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, []);

  return <section id="intro" ref={section} className="dh-hero" aria-labelledby="dh-hero-title">
    <HeroBackgroundEffects />
    <div className="dh-hero-inner">
      <div className="dh-hero-left">
        <div className="dh-hero-copy"><HeroHeadline /></div>
        <div className="dh-hero-video"><HeroVideoPlayer src={config.introVideo} poster={config.introPoster} captions={config.introCaptions} autoplayMuted={config.introAutoplay === true} /></div>
      </div>
      <div className="dh-hero-right"><UseCaseImageSlider /></div>
    </div>
  </section>;
}
