import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpressionTextarea from './ExpressionTextarea';

function Editor(props) {
  const [value, setValue] = useState('Xin chào bạn.');
  return <ExpressionTextarea aria-label="Nội dung" value={value} onChange={e=>setValue(e.target.value)} {...props}/>;
}
describe('Expression insertion', () => {
  it('replaces selected text and restores caret for consecutive cues', async () => {
    const user = userEvent.setup();
    render(<Editor voiceId="Adam"/>);
    const input = screen.getByRole('textbox');
    await user.click(input);
    input.setSelectionRange(4, 8);
    await user.click(screen.getByRole('button', { name: 'Chèn cười' }));
    expect(input).toHaveValue('Xin [cười] bạn.');
    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(10);
    await user.click(screen.getByRole('button', { name: 'Chèn thở dài' }));
    expect(input).toHaveValue('Xin [cười] [thở dài] bạn.');
  });
  it('appends before editor has been focused, including keyboard activation', async () => {
    const user = userEvent.setup();
    render(<Editor/>);
    screen.getByRole('button', { name: 'Chèn hắng giọng' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('textbox')).toHaveValue('Xin chào bạn. [hắng giọng] ');
  });
  it('disables cues for Qwen and while generating', () => {
    const { rerender } = render(<Editor voiceId="qwen06:ryan"/>);
    expect(screen.getByRole('button', { name: 'Chèn cười' })).toBeDisabled();
    rerender(<Editor voiceId="Adam" disabled/>);
    expect(screen.getByRole('button', { name: 'Chèn cười' })).toBeDisabled();
  });
});
