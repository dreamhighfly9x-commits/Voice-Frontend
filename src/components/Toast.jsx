import Icon from './Icon';
import LottieIcon from './LottieIcon';
import { prefersReducedMotion } from '../lib/reducedMotion';

const CHECKED = import.meta.env.BASE_URL + 'animations/checked.lottie';

export default function Toast({ message, success = false }) {
  if (!message) return null;
  return (
    <div
      style={{
        position: 'fixed',
        right: 26,
        bottom: 26,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        background: 'var(--contrast)',
        color: 'var(--contrastInk)',
        borderRadius: 14,
        padding: '13px 17px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.22)',
        animation: 'toastIn .28s cubic-bezier(.2,.9,.3,1.2) both',
      }}
    >
      {success && !prefersReducedMotion()
        ? <LottieIcon src={CHECKED} once size={40} className="toast-checked" />
        : <Icon path="M5 12.5l4.5 4.5L19 7.5" size={17} style={{ strokeWidth: 2 }} />}
      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{message}</span>
    </div>
  );
}
