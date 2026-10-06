import { describe, it, expect } from 'vitest';
import { render, screen } from '../testRender';
import Toast from './Toast';

describe('Toast', () => {
  it('toast_withMessage_rendersText', () => {
    render(<Toast message="Đã tạo và lưu bản ghi WAV." />);
    expect(screen.getByText('Đã tạo và lưu bản ghi WAV.')).toBeInTheDocument();
  });

  it('toast_withoutMessage_rendersNothing', () => {
    const { container } = render(<Toast message="" />);
    expect(container).toBeEmptyDOMElement();
  });
});
