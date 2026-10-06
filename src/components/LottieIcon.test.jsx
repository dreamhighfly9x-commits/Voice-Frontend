import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const fakePlayer = { setLoop: vi.fn(), play: vi.fn(), stop: vi.fn(), setFrame: vi.fn() };
const playerProps = [];

vi.mock('./RobotPlayer', async () => {
  const { useEffect } = await import('react');
  return {
    default: function FakePlayer(props) {
      playerProps.push(props);
      // oxlint-disable-next-line react-hooks/exhaustive-deps -- mimic a single load per mount
      useEffect(() => { props.onPlayer(fakePlayer); props.onStatus('ready'); }, []);
      return null;
    },
  };
});

import LottieIcon from './LottieIcon';

function setReducedMotion(reduce) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({ matches: reduce && query.includes('reduce'), media: query, addEventListener() {}, removeEventListener() {} }));
}

afterEach(() => { playerProps.length = 0; vi.clearAllMocks(); });

describe('LottieIcon', () => {
  it('lottieIcon_inactive_staysOnFirstFrameWithoutAutoplay', async () => {
    setReducedMotion(false);
    render(<LottieIcon src="/animations/ai-generate.lottie" />);
    await waitFor(() => expect(fakePlayer.setFrame).toHaveBeenCalledWith(0));
    expect(playerProps[0].autoplay).toBe(false);
    expect(fakePlayer.play).not.toHaveBeenCalled();
  });

  it('lottieIcon_becomesActive_loopsAnimation', async () => {
    setReducedMotion(false);
    const { rerender } = render(<LottieIcon src="/a.lottie" />);
    await waitFor(() => expect(fakePlayer.setFrame).toHaveBeenCalled());
    rerender(<LottieIcon src="/a.lottie" active />);
    await waitFor(() => expect(fakePlayer.play).toHaveBeenCalled());
    expect(fakePlayer.setLoop).toHaveBeenCalledWith(true);
  });

  it('lottieIcon_reducedMotion_neverPlays', async () => {
    setReducedMotion(true);
    const { rerender } = render(<LottieIcon src="/a.lottie" />);
    await waitFor(() => expect(playerProps.length).toBeGreaterThan(0));
    rerender(<LottieIcon src="/a.lottie" active />);
    expect(fakePlayer.play).not.toHaveBeenCalled();
  });
});
