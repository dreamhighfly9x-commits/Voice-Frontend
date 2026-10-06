import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

const fakePlayer = { stop: vi.fn(), setFrame: vi.fn(), play: vi.fn() };
const playerProps = [];
let outcome = 'ready';

vi.mock('./RobotPlayer', async () => {
  const { useEffect } = await import('react');
  return {
    default: function FakeRobotPlayer(props) {
      playerProps.push(props);
      // oxlint-disable-next-line react-hooks/exhaustive-deps -- mimic a single load per mount
      useEffect(() => { props.onPlayer(fakePlayer); props.onStatus(outcome); }, []);
      return null;
    },
  };
});

import RobotGreeting from './RobotGreeting';

function setReducedMotion(reduce) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({ matches: reduce && query.includes('reduce'), media: query, addEventListener() {}, removeEventListener() {} }));
}

afterEach(() => { playerProps.length = 0; outcome = 'ready'; vi.clearAllMocks(); });

describe('RobotGreeting', () => {
  it('robotGreeting_defaultMotion_autoplaysOnceFromLocalFile', async () => {
    setReducedMotion(false);
    render(<RobotGreeting />);
    await waitFor(() => expect(playerProps.length).toBeGreaterThan(0));
    expect(playerProps[0].autoplay).toBe(true);
    expect(playerProps[0].src).toMatch(/animations\/robot-hello\.lottie$/);
  });

  it('robotGreeting_reducedMotion_doesNotAutoplay', async () => {
    setReducedMotion(true);
    render(<RobotGreeting />);
    await waitFor(() => expect(playerProps.length).toBeGreaterThan(0));
    expect(playerProps[0].autoplay).toBe(false);
  });

  it('robotGreeting_clickReplay_restartsFromFirstFrame', async () => {
    setReducedMotion(false);
    render(<RobotGreeting />);
    const button = screen.getByRole('button', { name: 'Chào lại' });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
    expect(fakePlayer.stop).toHaveBeenCalled();
    expect(fakePlayer.setFrame).toHaveBeenCalledWith(0);
    expect(fakePlayer.play).toHaveBeenCalled();
  });

  it('robotGreeting_loadError_keepsStageAndDisablesReplay', async () => {
    setReducedMotion(false);
    outcome = 'error';
    const { container } = render(<RobotGreeting />);
    await waitFor(() => expect(container.querySelector('.robot-greeting')).toHaveAttribute('data-status', 'error'));
    expect(screen.getByRole('img', { name: 'Robot vẫy tay chào' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chào lại' })).toBeDisabled();
  });
});
