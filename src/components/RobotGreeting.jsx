import {useEffect, useState} from 'react';
import './RobotGreeting.css';

const DEFAULT_SRC = import.meta.env.BASE_URL + 'animations/robot-hello.lottie';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

// Waving robot: plays once on mount (skipped under reduced motion), "Chào lại" replays from the start.
export default function RobotGreeting({src = DEFAULT_SRC, label = 'Robot vẫy tay chào', className = ''}) {
  const [Player, setPlayer] = useState(null);
  const [player, setPlayerInstance] = useState(null);
  const [status, setStatus] = useState('loading');
  const [autoplay] = useState(() => !prefersReducedMotion());

  useEffect(() => {
    let active = true;
    import('./RobotPlayer')
      .then((module) => { if (active) setPlayer(() => module.default); })
      .catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, []);

  function replay() {
    if (!player) return;
    player.stop();
    player.setFrame(0);
    player.play();
  }

  return (
    <div className={`robot-greeting ${className}`.trim()} data-status={status}>
      <div className="robot-greeting-stage" role="img" aria-label={label}>
        {Player && status !== 'error' && <Player src={src} autoplay={autoplay} onPlayer={setPlayerInstance} onStatus={setStatus}/>}
      </div>
      <button type="button" className="robot-greeting-replay" onClick={replay} disabled={status !== 'ready'}>Chào lại</button>
    </div>
  );
}
