import type { EmotionQuadrant } from '@shared/types';

/**
 * Mood-meter taxonomy and context tags for the Today check-in form.
 * Kept as data (separate from the component) so the UI stays presentational
 * and the ~24-word emotion set is easy to scan and maintain.
 */

export interface MoodMeterEmotion {
  word: string;
  quadrant: EmotionQuadrant;
  label: string;
  /** Tailwind classes for the unselected chip, by quadrant. */
  color: string;
}

const HIGH_UNPLEASANT = 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100/50';
const LOW_UNPLEASANT = 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200/50';
const LOW_PLEASANT = 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100/50';
const HIGH_PLEASANT = 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100/50';

export const EMOTIONS: MoodMeterEmotion[] = [
  // High Unpleasant (stressed, anxious)
  { word: 'anxious', quadrant: 'high_unpleasant', label: 'Anxious', color: HIGH_UNPLEASANT },
  {
    word: 'overwhelmed',
    quadrant: 'high_unpleasant',
    label: 'Overwhelmed',
    color: HIGH_UNPLEASANT,
  },
  { word: 'panicked', quadrant: 'high_unpleasant', label: 'Panicked', color: HIGH_UNPLEASANT },
  { word: 'frustrated', quadrant: 'high_unpleasant', label: 'Frustrated', color: HIGH_UNPLEASANT },
  { word: 'restless', quadrant: 'high_unpleasant', label: 'Restless', color: HIGH_UNPLEASANT },
  { word: 'pressured', quadrant: 'high_unpleasant', label: 'Pressured', color: HIGH_UNPLEASANT },

  // Low Unpleasant (drained, defeated)
  { word: 'drained', quadrant: 'low_unpleasant', label: 'Drained', color: LOW_UNPLEASANT },
  { word: 'hopeless', quadrant: 'low_unpleasant', label: 'Hopeless', color: LOW_UNPLEASANT },
  { word: 'lonely', quadrant: 'low_unpleasant', label: 'Lonely', color: LOW_UNPLEASANT },
  { word: 'defeated', quadrant: 'low_unpleasant', label: 'Defeated', color: LOW_UNPLEASANT },
  { word: 'foggy', quadrant: 'low_unpleasant', label: 'Foggy', color: LOW_UNPLEASANT },
  { word: 'numb', quadrant: 'low_unpleasant', label: 'Numb', color: LOW_UNPLEASANT },

  // Low Pleasant (calm, grateful)
  { word: 'calm', quadrant: 'low_pleasant', label: 'Calm', color: LOW_PLEASANT },
  { word: 'relieved', quadrant: 'low_pleasant', label: 'Relieved', color: LOW_PLEASANT },
  { word: 'content', quadrant: 'low_pleasant', label: 'Content', color: LOW_PLEASANT },
  { word: 'rested', quadrant: 'low_pleasant', label: 'Rested', color: LOW_PLEASANT },
  { word: 'grateful', quadrant: 'low_pleasant', label: 'Grateful', color: LOW_PLEASANT },
  { word: 'at_ease', quadrant: 'low_pleasant', label: 'At Ease', color: LOW_PLEASANT },

  // High Pleasant (motivated, focused)
  { word: 'motivated', quadrant: 'high_pleasant', label: 'Motivated', color: HIGH_PLEASANT },
  { word: 'hopeful', quadrant: 'high_pleasant', label: 'Hopeful', color: HIGH_PLEASANT },
  { word: 'focused', quadrant: 'high_pleasant', label: 'Focused', color: HIGH_PLEASANT },
  { word: 'confident', quadrant: 'high_pleasant', label: 'Confident', color: HIGH_PLEASANT },
  { word: 'excited', quadrant: 'high_pleasant', label: 'Excited', color: HIGH_PLEASANT },
  { word: 'proud', quadrant: 'high_pleasant', label: 'Proud', color: HIGH_PLEASANT },
];

export interface ContextTag {
  value: string;
  label: string;
}

export const TAGS: ContextTag[] = [
  { value: 'exam_pressure', label: 'Exam Pressure' },
  { value: 'mock_test', label: 'Mock Test' },
  { value: 'results', label: 'Results' },
  { value: 'parents', label: 'Parental Pressure' },
  { value: 'comparison', label: 'Peer Comparison' },
  { value: 'sleep', label: 'Poor Sleep' },
  { value: 'focus', label: 'Focus Issues' },
  { value: 'self_doubt', label: 'Self Doubt' },
  { value: 'time_management', label: 'Time Crunch' },
  { value: 'health', label: 'Health Issues' },
  { value: 'other', label: 'Other Stress' },
];

/** Optional open-ended journaling prompts shown as gentle nudges. */
export const NUDGES: string[] = [
  'How are you feeling about your studies or upcoming mock tests?',
  'What is the biggest source of pressure you are navigating today?',
  'Did you notice any positive moments in your study blocks today?',
  'Describe how you feel right now after your mock tests or study hours.',
];
