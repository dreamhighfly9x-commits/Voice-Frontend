import { render, screen } from '@testing-library/react';
import { it, expect } from 'vitest';
import UserAvatar from './UserAvatar';

it('updates the avatar after profile refresh and falls back after removal', () => {
  const { rerender } = render(<UserAvatar user={{name:'Dream'}}/>);
  expect(screen.getByText('D')).toBeInTheDocument();
  rerender(<UserAvatar user={{name:'Dream',avatar:'data:image/png;base64,one'}}/>);
  expect(screen.getByRole('img')).toHaveAttribute('src','data:image/png;base64,one');
  rerender(<UserAvatar user={{name:'Dream',avatar:'data:image/png;base64,two'}}/>);
  expect(screen.getByRole('img')).toHaveAttribute('src','data:image/png;base64,two');
  rerender(<UserAvatar user={{name:'Dream',avatar:''}}/>);
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});
