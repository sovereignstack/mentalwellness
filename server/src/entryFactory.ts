import crypto from 'crypto';
import type { AnalysisResult, DbEntry, SafetyLevel } from '../../shared/types.js';
import { CRISIS_COPY } from './safety.js';
import { DISTRESS_STATE_THEME } from './config.js';

/**
 * Factory functions that build a persisted `DbEntry` for each logging path.
 * Each encodes one rule set (crisis suppression, quick-log, full analysis) and
 * is unit-tested in isolation, keeping the route handler thin.
 */

const QUICK_LOG_REFLECTION =
  'Your quick mood log has been saved. Remember to take steady breaks and be gentle with yourself.';

interface BaseEntryInput {
  userId: string;
  mood: number;
  emotions: string[];
  tags: string[];
}

/** Shared id/owner/timestamp fields for every entry. */
function baseFields(input: BaseEntryInput) {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    userId: input.userId,
    date: now.toISOString().split('T')[0],
    mood: input.mood,
    emotions: input.emotions,
    tags: input.tags,
    createdAt: now.toISOString(),
  };
}

/** Crisis/elevated entry — coping, mindfulness, and motivation are suppressed (§8). */
export function buildCrisisEntry(
  input: BaseEntryInput & { journal: string; safetyFlag: Exclude<SafetyLevel, 'none'> }
): DbEntry {
  return {
    ...baseFields(input),
    journal: input.journal,
    quickLog: input.journal.length === 0,
    themes: [DISTRESS_STATE_THEME],
    detectedStressors: input.tags.length > 0 ? input.tags : ['emotional pressure'],
    reflection: CRISIS_COPY,
    copingStrategy: '',
    mindfulnessExercise: '',
    motivation: '',
    safetyFlag: input.safetyFlag,
  };
}

/** Quick-log entry — no journal, no Gemini call (§2: zero AI for quick-log). */
export function buildQuickLogEntry(input: BaseEntryInput): DbEntry {
  return {
    ...baseFields(input),
    journal: '',
    quickLog: true,
    themes: [],
    detectedStressors: [],
    reflection: QUICK_LOG_REFLECTION,
    copingStrategy: '',
    mindfulnessExercise: '',
    motivation: '',
    safetyFlag: 'none',
  };
}

/** Full entry — passes the Gemini analysis (incl. motivation) straight through. */
export function buildFullLogEntry(
  input: BaseEntryInput & { journal: string; analysis: AnalysisResult }
): DbEntry {
  const { analysis } = input;
  return {
    ...baseFields(input),
    journal: input.journal,
    quickLog: false,
    themes: analysis.themes,
    detectedStressors: analysis.detectedStressors,
    reflection: analysis.reflection,
    copingStrategy: analysis.copingStrategy,
    mindfulnessExercise: analysis.mindfulnessExercise,
    motivation: analysis.motivation,
    safetyFlag: 'none',
  };
}
