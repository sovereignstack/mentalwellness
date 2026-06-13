import { describe, it, expect } from 'vitest';
import { buildCrisisEntry, buildQuickLogEntry, buildFullLogEntry } from './entryFactory.js';
import type { AnalysisResult } from '../../shared/types.js';

const base = { userId: 'u1', mood: 2, emotions: ['anxious'], tags: ['mock_test'] };

describe('buildCrisisEntry', () => {
  it('suppresses coping, mindfulness, and motivation and keeps the crisis flag', () => {
    const entry = buildCrisisEntry({ ...base, journal: 'I feel hopeless', safetyFlag: 'crisis' });
    expect(entry.safetyFlag).toBe('crisis');
    expect(entry.copingStrategy).toBe('');
    expect(entry.mindfulnessExercise).toBe('');
    expect(entry.motivation).toBe('');
    expect(entry.themes).toEqual(['Distress State']);
    expect(entry.userId).toBe('u1');
    expect(entry.id).toBeTruthy();
  });

  it('falls back to a default stressor when no tags are given', () => {
    const entry = buildCrisisEntry({ ...base, tags: [], journal: 'x', safetyFlag: 'elevated' });
    expect(entry.detectedStressors).toEqual(['emotional pressure']);
    expect(entry.safetyFlag).toBe('elevated');
  });
});

describe('buildQuickLogEntry', () => {
  it('flags quickLog with empty AI fields and no journal', () => {
    const entry = buildQuickLogEntry(base);
    expect(entry.quickLog).toBe(true);
    expect(entry.journal).toBe('');
    expect(entry.copingStrategy).toBe('');
    expect(entry.motivation).toBe('');
    expect(entry.safetyFlag).toBe('none');
  });
});

describe('buildFullLogEntry', () => {
  it('passes the Gemini analysis (incl. motivation) through with a safe flag', () => {
    const analysis: AnalysisResult = {
      reflection: 'r',
      themes: ['t'],
      detectedStressors: ['s'],
      copingStrategy: 'cope',
      mindfulnessExercise: 'breathe',
      motivation: 'keep going',
    };
    const entry = buildFullLogEntry({ ...base, journal: 'today was hard', analysis });
    expect(entry.quickLog).toBe(false);
    expect(entry.safetyFlag).toBe('none');
    expect(entry.copingStrategy).toBe('cope');
    expect(entry.motivation).toBe('keep going');
    expect(entry.themes).toEqual(['t']);
  });
});
