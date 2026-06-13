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
});
