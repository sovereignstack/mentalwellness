import { describe, it, expect } from 'vitest';
import { deriveMoodFromEmotions, EMOTION_TAXONOMY } from './emotions.js';

describe('Emotions Module - deriveMoodFromEmotions', () => {
  it('should return 3 (neutral) for empty or invalid lists', () => {
    expect(deriveMoodFromEmotions([])).toBe(3);
    expect(deriveMoodFromEmotions(['invalid_emotion'])).toBe(3);
  });

  it('should calculate correct average for low_unpleasant words', () => {
    // low_unpleasant words map to 1
    expect(deriveMoodFromEmotions(['drained', 'hopeless'])).toBe(1);
  });

  it('should calculate correct average for high_unpleasant words', () => {
    // high_unpleasant words map to 2
    expect(deriveMoodFromEmotions(['anxious', 'overwhelmed'])).toBe(2);
  });

  it('should calculate correct average for low_pleasant words', () => {
    // low_pleasant words map to 4
    expect(deriveMoodFromEmotions(['calm', 'relieved'])).toBe(4);
  });

  it('should calculate correct average for high_pleasant words', () => {
    // high_pleasant words map to 5
    expect(deriveMoodFromEmotions(['motivated', 'focused'])).toBe(5);
  });

  it('should average mixed emotions correctly', () => {
    // calm (4) + anxious (2) -> 3
    expect(deriveMoodFromEmotions(['calm', 'anxious'])).toBe(3);

    // motivated (5) + calm (4) -> 4.5 -> rounded to 5
    expect(deriveMoodFromEmotions(['motivated', 'calm'])).toBe(5);
  });

  it('should verify the complete taxonomy exists', () => {
    expect(EMOTION_TAXONOMY.length).toBe(24); // ~24 words quadrant
  });
});
