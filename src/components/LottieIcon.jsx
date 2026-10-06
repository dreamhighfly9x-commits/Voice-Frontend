import {useEffect, useState} from 'react';
import {prefersReducedMotion} from '../lib/reducedMotion';
import './LottieIcon.css';

// Decorative Lottie: still on its first frame, loops while `active`, or plays a single time when `once`.
export default function LottieIcon({src, active = false, once = false, size = 22, width = size, height = size, className = ''}) {
  const [Player, setPlayer] = useState(null);
  const [player, setPlayerInstance] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let alive = true;
    import('./RobotPlayer')
      .then((module) => { if (alive) setPlayer(() => module.default); })
      .catch(() => { if (alive) setStatus('error'); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!player || status !== 'ready' || prefersReducedMotion()) return;
    if (once) { player.setLoop(false); player.play(); }
    else if (active) { player.setLoop(true); player.play(); }
    else { player.stop(); player.setFrame(0); }
  }, [player, status, active, once]);

  return (
    <span className={`lottie-icon ${className}`.trim()} data-status={status} style={{'--lottie-icon-w': `${width}px`, '--lottie-icon-h': `${height}px`}} aria-hidden="true">
      {Player && status !== 'error' && <Player src={src} autoplay={false} onPlayer={setPlayerInstance} onStatus={setStatus}/>}
    </span>
  );
}
