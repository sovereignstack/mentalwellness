import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Today from '../components/Today';
import type { Entry } from '@shared/types';

const fullEntry: Entry = {
  id: 'test-full',
  date: '2026-06-13',
  mood: 3,
  emotions: ['anxious'],
  tags: [],
  journal: 'Mock test tomorrow and I am nervous.',
  quickLog: false,
  themes: ['mock test'],
  detectedStressors: ['mock test'],
  reflection: 'It makes sense to feel nervous before a mock test.',
  copingStrategy: 'List the three topics you feel shakiest on and review just one tonight.',
  mindfulnessExercise: 'Take five slow breaths, longer on the exhale.',
  motivation: 'One mock test does not define your preparation — keep going steadily.',
  safetyFlag: 'none',
};

describe('Today active support', () => {
  it('shows motivation and runs a guided exercise with an in-the-moment mood check', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ entry: fullEntry, savedInCloud: false, userId: 'test' }),
    }) as unknown as typeof fetch;

    render(<Today exam="JEE" localOnly={false} onEntryLogged={() => {}} />);

    await userEvent.click(screen.getByRole('button', { name: 'Anxious' }));
    await userEvent.type(
      screen.getByPlaceholderText(/Type your open-ended thoughts/i),
      'Mock test tomorrow and I am nervous.'
    );
    await userEvent.click(screen.getByRole('button', { name: /analyze & save/i }));

    // Motivation line is surfaced.
    expect(await screen.findByText(fullEntry.motivation)).toBeInTheDocument();

    // Launch the guided breath and confirm the in-the-moment check appears.
    await userEvent.click(screen.getByRole('button', { name: /try a guided breath now/i }));
    expect(screen.getByText('How do you feel now?')).toBeInTheDocument();
    expect(screen.getByText('Breathe In…')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /a little lighter/i }));
    expect(screen.getByText(/even a small shift is worth noticing/i)).toBeInTheDocument();
  });
});
