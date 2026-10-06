import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(cleanup);

// jsdom does not implement <dialog> activation behavior.
HTMLDialogElement.prototype.showModal = vi.fn(function showModal() { this.open = true; });
HTMLDialogElement.prototype.close = vi.fn(function close() { this.open = false; });

// The dotLottie player needs WASM, canvas and IntersectionObserver, none of which jsdom has.
// Tests that exercise playback mock this module themselves.
vi.mock('./components/RobotPlayer', () => ({ default: () => null }));

// jsdom doesn't implement matchMedia; page-mascot (rendered by App) needs it.
window.matchMedia ??= (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});
