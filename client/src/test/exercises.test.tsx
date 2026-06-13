import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoxBreathing, Grounding54321 } from '../components/exercises';

describe('BoxBreathing', () => {
  it('renders the first breathing phase and an aria-live region', () => {
    render(<BoxBreathing />);
    expect(screen.getByText('Breathe In…')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('auto-starts and exposes a pause control by default', async () => {
    render(<BoxBreathing />);
    const toggle = screen.getByRole('button', { name: /pause/i });
    expect(toggle).toBeInTheDocument();
    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: /resume breathing/i })).toBeInTheDocument();
  });
});

describe('Grounding54321', () => {
  it('renders the 5-4-3-2-1 grounding script', () => {
    render(<Grounding54321 />);
    expect(screen.getByText('5-4-3-2-1 Grounding Method')).toBeInTheDocument();
    expect(screen.getByText(/5 things you can SEE/i)).toBeInTheDocument();
  });
});
