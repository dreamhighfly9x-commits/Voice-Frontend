import { useEffect, useRef } from 'react';

// Subtle WebAudio hover/click feedback, ported from the prototype.
// Only fires on elements that are actually tappable (cursor:pointer|grab),
// skips inputs/textareas, and waits for the first user gesture before the
// AudioContext is created (browsers block audio before that).
export function useUiSound(enabled) {
  const ctxRef = useRef(null);
  const lastHoverRef = useRef(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    const ensureCtx = () => {
      if (!ctxRef.current) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctxRef.current = new AC();
      }
      if (ctxRef.current && ctxRef.current.state === 'suspended') {
        ctxRef.current.resume();
      }
      return ctxRef.current;
    };

    const blip = (freq, dur, vol, type) => {
      if (!enabledRef.current) return;
      const c = ensureCtx();
      if (!c || c.state !== 'running') return;
      const o = c.createOscillator();
      const g = c.createGain();
      const t = c.currentTime;
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      o.frequency.exponentialRampToValueAtTime(freq * 0.82, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(c.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    };

    const isTappable = (el) => {
      let n = el;
      let depth = 0;
      while (n && n.nodeType === 1 && depth++ < 6) {
        if (n.tagName === 'INPUT' || n.tagName === 'TEXTAREA') return null;
        const cs = getComputedStyle(n);
        if (cs.cursor === 'pointer' || cs.cursor === 'grab') return n;
        n = n.parentElement;
      }
      return null;
    };

    const onOver = (e) => {
      const t = isTappable(e.target);
      if (!t || t === lastHoverRef.current) return;
      lastHoverRef.current = t;
      blip(1180, 0.05, 0.022, 'sine');
    };
    const onOut = (e) => {
      if (lastHoverRef.current && !lastHoverRef.current.contains(e.relatedTarget)) {
        lastHoverRef.current = null;
      }
    };
    const onDown = (e) => {
      ensureCtx();
      if (!isTappable(e.target)) return;
      blip(760, 0.07, 0.05, 'triangle');
      setTimeout(() => blip(1520, 0.05, 0.03, 'sine'), 34);
    };

    document.addEventListener('pointerover', onOver, true);
    document.addEventListener('pointerout', onOut, true);
    document.addEventListener('pointerdown', onDown, true);
    return () => {
      document.removeEventListener('pointerover', onOver, true);
      document.removeEventListener('pointerout', onOut, true);
      document.removeEventListener('pointerdown', onDown, true);
    };
  }, []);

  return {
    ping: (freq = 1320, dur = 0.08, vol = 0.05, type = 'sine') => {
      if (!enabledRef.current) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!ctxRef.current && AC) ctxRef.current = new AC();
      if (ctxRef.current && ctxRef.current.state === 'suspended') ctxRef.current.resume();
      const c = ctxRef.current;
      if (!c) return;
      const o = c.createOscillator();
      const g = c.createGain();
      const t = c.currentTime;
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(c.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
  };
}
