import { describe, it, expect } from 'vitest';
import { calculateTrends } from './trends.js';

describe('Trends Module - calculateTrends', () => {
  it('should handle empty entries gracefully', () => {
    const summary = calculateTrends([]);
    expect(summary.totalEntries).toBe(0);
    expect(summary.averageMood).toBe(0);
    expect(summary.moodTrendDirection).toBe('insufficient_data');
    expect(summary.correlations.length).toBe(0);
  });

  it('should calculate correct average mood', () => {
    const entries = [
      { mood: 4, emotions: ['calm'], tags: ['sleep'], date: '2026-06-01' },
      { mood: 2, emotions: ['anxious'], tags: ['mock_test'], date: '2026-06-02' }
    ];
    const summary = calculateTrends(entries);
    expect(summary.averageMood).toBe(3);
    expect(summary.totalEntries).toBe(2);
  });

  it('should evaluate improving trend direction', () => {
    const entries = [
      { mood: 2, emotions: ['anxious'], tags: ['mock_test'], date: '2026-06-01' },
      { mood: 2, emotions: ['anxious'], tags: ['mock_test'], date: '2026-06-02' },
      { mood: 4, emotions: ['calm'], tags: ['sleep'], date: '2026-06-03' },
      { mood: 5, emotions: ['focused'], tags: ['sleep'], date: '2026-06-04' }
    ];
    const summary = calculateTrends(entries);
    expect(summary.moodTrendDirection).toBe('improving');
  });

  it('should identify co-occurrence correlations with tags and emotions on low-mood days', () => {
    const entries = [
      { mood: 1, emotions: ['drained'], tags: ['mock_test', 'sleep'], date: '2026-06-01' },
      { mood: 2, emotions: ['anxious', 'drained'], tags: ['mock_test', 'parents'], date: '2026-06-02' },
      { mood: 5, emotions: ['motivated'], tags: ['sleep'], date: '2026-06-03' }
    ];
    const summary = calculateTrends(entries);
    
    // We have 2 low-mood entries (mood <= 2)
    // mock_test occurs in both low-mood entries (100%) -> should trigger topTag correlation
    // drained occurs in both low-mood entries (100%) -> should trigger topEmotion correlation
    expect(summary.correlations.length).toBe(2);
    expect(summary.correlations[0]).toContain('mock test');
    expect(summary.correlations[1]).toContain('drained');
  });

  it('evaluates a declining trend direction', () => {
    const entries = [
      { mood: 5, emotions: ['focused'], tags: ['sleep'], date: '2026-06-01' },
      { mood: 5, emotions: ['calm'], tags: ['sleep'], date: '2026-06-02' },
      { mood: 2, emotions: ['anxious'], tags: ['mock_test'], date: '2026-06-03' },
      { mood: 1, emotions: ['drained'], tags: ['mock_test'], date: '2026-06-04' }
    ];
    expect(calculateTrends(entries).moodTrendDirection).toBe('declining');
  });

  it('evaluates a stable trend direction when the halves are close', () => {
    const entries = [
      { mood: 3, emotions: ['calm'], tags: [], date: '2026-06-01' },
      { mood: 3, emotions: ['calm'], tags: [], date: '2026-06-02' },
      { mood: 3, emotions: ['calm'], tags: [], date: '2026-06-03' },
      { mood: 3, emotions: ['calm'], tags: [], date: '2026-06-04' }
    ];
    expect(calculateTrends(entries).moodTrendDirection).toBe('stable');
  });

  it('reports insufficient_data with fewer than 4 entries', () => {
    const entries = [
      { mood: 4, emotions: ['calm'], tags: [], date: '2026-06-01' },
      { mood: 5, emotions: ['focused'], tags: [], date: '2026-06-02' },
      { mood: 3, emotions: ['rested'], tags: [], date: '2026-06-03' }
    ];
    expect(calculateTrends(entries).moodTrendDirection).toBe('insufficient_data');
  });

  it('rounds the average mood to one decimal place', () => {
    const entries = [
      { mood: 4, emotions: ['calm'], tags: [], date: '2026-06-01' },
      { mood: 3, emotions: ['calm'], tags: [], date: '2026-06-02' },
      { mood: 4, emotions: ['calm'], tags: [], date: '2026-06-03' }
    ];
    expect(calculateTrends(entries).averageMood).toBe(3.7);
  });

  it('counts emotion and tag frequencies', () => {
    const entries = [
      { mood: 4, emotions: ['calm', 'rested'], tags: ['sleep'], date: '2026-06-01' },
      { mood: 3, emotions: ['calm'], tags: ['sleep', 'focus'], date: '2026-06-02' }
    ];
    const summary = calculateTrends(entries);
    expect(summary.emotionFrequencies.calm).toBe(2);
    expect(summary.emotionFrequencies.rested).toBe(1);
    expect(summary.tagFrequencies.sleep).toBe(2);
    expect(summary.tagFrequencies.focus).toBe(1);
  });

  it('falls back to a subtle-pattern statement when no tag clears the 40% threshold', () => {
    // 3 low-mood days, each with a distinct tag/emotion → top tag is only 33% (< 40%).
    const entries = [
      { mood: 1, emotions: ['drained'], tags: ['sleep'], date: '2026-06-01' },
      { mood: 2, emotions: ['anxious'], tags: ['mock_test'], date: '2026-06-02' },
      { mood: 2, emotions: ['foggy'], tags: ['parents'], date: '2026-06-03' }
    ];
    const summary = calculateTrends(entries);
    expect(summary.correlations.length).toBe(1);
    expect(summary.correlations[0]).toContain('subtle co-occurrence');
  });

  it('returns an encouraging message when there are no low-mood days', () => {
    const entries = [
      { mood: 4, emotions: ['calm'], tags: ['sleep'], date: '2026-06-01' },
      { mood: 5, emotions: ['focused'], tags: ['focus'], date: '2026-06-02' }
    ];
    const summary = calculateTrends(entries);
    expect(summary.correlations.length).toBe(1);
    expect(summary.correlations[0]).toContain("haven't detected any low-mood");
  });
});
