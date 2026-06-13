import { describe, it, expect } from 'vitest';
import { combineSafety } from './safetyFlag.js';

describe('combineSafety', () => {
  it('returns the more severe of the two layers', () => {
    expect(combineSafety('none', 'elevated')).toBe('elevated');
    expect(combineSafety('elevated', 'crisis')).toBe('crisis');
    expect(combineSafety('none', 'crisis')).toBe('crisis');
  });

  it('NEVER downgrades a code-level crisis based on the model (key safety invariant)', () => {
    expect(combineSafety('crisis', 'none')).toBe('crisis');
    expect(combineSafety('crisis', 'elevated')).toBe('crisis');
  });

  it('keeps a code-level elevated when the model says none', () => {
    expect(combineSafety('elevated', 'none')).toBe('elevated');
  });

  it('returns none only when both layers are none', () => {
    expect(combineSafety('none', 'none')).toBe('none');
  });
});
