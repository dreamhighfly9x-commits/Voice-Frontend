import {useCallback} from 'react';
import {DotLottieReact, setWasmUrl} from '@lottiefiles/dotlottie-react';
import wasmUrl from '@lottiefiles/dotlottie-web/dotlottie-player.wasm?url';

// Serve the renderer from our own bundle instead of the player's default CDN.
setWasmUrl(wasmUrl);

// Loaded lazily by RobotGreeting so the ~1.2 MB WASM player stays out of the main bundle.
export default function RobotPlayer({src, autoplay, loop = false, onPlayer, onStatus}) {
  // Stable ref callback so listeners are attached once per player instance.
  const bind = useCallback((player) => {
    onPlayer(player);
    if (!player) return;
    player.addEventListener('load', () => onStatus('ready'));
    player.addEventListener('loadError', () => onStatus('error'));
  }, [onPlayer, onStatus]);
  return <DotLottieReact src={src} autoplay={autoplay} loop={loop} dotLottieRefCallback={bind} aria-hidden="true"/>;
}
