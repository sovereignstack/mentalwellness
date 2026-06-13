/**
 * Canonical API contracts shared between the React client and the Express server.
 *
 * These are type-only declarations (no runtime values), so they are fully erased
 * at build time — the client imports them via the `@shared` Vite alias and the
 * server via type-only imports, with no bundling or emit cost on either side.
 */

/** Result of the two-layer crisis screen (code keyword layer + Gemini classify). */
export type SafetyLevel = 'none' | 'elevated' | 'crisis';

/** Mood-meter quadrants: energy (high/low) × pleasantness (pleasant/unpleasant). */
export type EmotionQuadrant =
  | 'high_unpleasant'
  | 'high_pleasant'
  | 'low_unpleasant'
  | 'low_pleasant';

/** User-selectable exam-context stressor tags. */
export type MoodTag =
  | 'exam_pressure'
  | 'mock_test'
  | 'results'
  | 'parents'
  | 'comparison'
  | 'sleep'
  | 'focus'
  | 'self_doubt'
  | 'time_management'
  | 'health'
  | 'other';

/** Structured analysis Gemini returns for a full journal entry (§7a). */
export interface AnalysisResult {
  reflection: string;
  themes: string[];
  detectedStressors: string[];
  copingStrategy: string;
  mindfulnessExercise: string;
  /** One short, exam-contextual encouraging line (brief: "motivation"). */
  motivation: string;
}

/** A logged check-in as presented to the client. */
export interface Entry {
  id: string;
  date: string;
  mood: number;
  emotions: string[];
  tags: string[];
  journal: string;
  quickLog: boolean;
  themes: string[];
  detectedStressors: string[];
  reflection: string;
  copingStrategy: string;
  mindfulnessExercise: string;
  motivation: string;
  safetyFlag: SafetyLevel;
}

/** Server-side persisted entry: a client Entry plus ownership and timestamp. */
export interface DbEntry extends Entry {
  userId: string;
  createdAt: string;
}

/** Direction of the mood trend over the user's history. */
export type TrendDirection = 'improving' | 'declining' | 'stable' | 'insufficient_data';

/** Aggregated, code-computed trends surfaced on the Trends screen (§6). */
export interface TrendData {
  averageMood: number;
  moodTrendDirection: TrendDirection;
  emotionFrequencies: Record<string, number>;
  tagFrequencies: Record<string, number>;
  correlations: string[];
  totalEntries: number;
}
