import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Today from '../components/Today';
import type { Entry } from '@shared/types';

const crisisEntry: Entry = {
  id: 'test-crisis',
  date: '2026-06-13',
  mood: 1,
  emotions: ['hopeless'],
  tags: [],
  journal: 'I feel hopeless',
  quickLog: false,
  themes: ['Distress State'],
  detectedStressors: ['emotional pressure'],
  reflection: 'It sounds like you are going through an incredibly difficult time right now.',
  copingStrategy: '',
  mindfulnessExercise: '',
  motivation: '',
  safetyFlag: 'crisis',
};

describe('Today crisis flow', () => {
  it('renders the crisis card with helplines and suppresses coping tips when flagged', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ entry: crisisEntry, savedInCloud: false, userId: 'test' }),
    }) as unknown as typeof fetch;

    render(<Today exam="JEE" localOnly={false} onEntryLogged={() => {}} />);

    // Pick an emotion, then quick-log to trigger the (mocked) crisis response.
    await userEvent.click(screen.getByRole('button', { name: 'Hopeless' }));
    await userEvent.click(screen.getByRole('button', { name: /quick log/i }));

    expect(await screen.findByText('Support is Available')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /call 14416/i })).toBeInTheDocument();
    // Coping/mindfulness cards must NOT appear in crisis mode.
    expect(screen.queryByText('Coping Strategy')).not.toBeInTheDocument();
  });
});
