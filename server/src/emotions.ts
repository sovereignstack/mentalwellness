import type { EmotionQuadrant } from '../../shared/types.js';

export type { EmotionQuadrant };

export interface Emotion {
  word: string;
  quadrant: EmotionQuadrant;
  label: string;
}

export const EMOTION_TAXONOMY: Emotion[] = [
  // High Unpleasant (Stressed, Frustrated, Pressured)
  { word: 'anxious', quadrant: 'high_unpleasant', label: 'Anxious' },
  { word: 'overwhelmed', quadrant: 'high_unpleasant', label: 'Overwhelmed' },
  { word: 'panicked', quadrant: 'high_unpleasant', label: 'Panicked' },
  { word: 'frustrated', quadrant: 'high_unpleasant', label: 'Frustrated' },
  { word: 'restless', quadrant: 'high_unpleasant', label: 'Restless' },
  { word: 'pressured', quadrant: 'high_unpleasant', label: 'Pressured' },

  // Low Unpleasant (Drained, Defeated, Lonely)
  { word: 'drained', quadrant: 'low_unpleasant', label: 'Drained' },
  { word: 'hopeless', quadrant: 'low_unpleasant', label: 'Hopeless' },
  { word: 'lonely', quadrant: 'low_unpleasant', label: 'Lonely' },
  { word: 'defeated', quadrant: 'low_unpleasant', label: 'Defeated' },
  { word: 'foggy', quadrant: 'low_unpleasant', label: 'Foggy' },
  { word: 'numb', quadrant: 'low_unpleasant', label: 'Numb' },

  // Low Pleasant (Calm, Relieved, Grateful)
  { word: 'calm', quadrant: 'low_pleasant', label: 'Calm' },
  { word: 'relieved', quadrant: 'low_pleasant', label: 'Relieved' },
  { word: 'content', quadrant: 'low_pleasant', label: 'Content' },
  { word: 'rested', quadrant: 'low_pleasant', label: 'Rested' },
  { word: 'grateful', quadrant: 'low_pleasant', label: 'Grateful' },
  { word: 'at_ease', quadrant: 'low_pleasant', label: 'At Ease' },

  // High Pleasant (Motivated, Focused, Confident)
  { word: 'motivated', quadrant: 'high_pleasant', label: 'Motivated' },
  { word: 'hopeful', quadrant: 'high_pleasant', label: 'Hopeful' },
  { word: 'focused', quadrant: 'high_pleasant', label: 'Focused' },
  { word: 'confident', quadrant: 'high_pleasant', label: 'Confident' },
  { word: 'excited', quadrant: 'high_pleasant', label: 'Excited' },
  { word: 'proud', quadrant: 'high_pleasant', label: 'Proud' }
];

/**
 * Derives a scalar mood score (1–5) based on the emotions selected.
 * 1: Low Unpleasant (Drained/Hopeless)
 * 2: High Unpleasant (Anxious/Pressured)
 * 3: Mixed or neutral (if empty or completely balanced)
 * 4: Low Pleasant (Calm/Grateful)
 * 5: High Pleasant (Focused/Proud)
 */
export function deriveMoodFromEmotions(emotionWords: string[]): 1 | 2 | 3 | 4 | 5 {
  if (!emotionWords || emotionWords.length === 0) {
    return 3;
  }

  let totalScore = 0;
  let count = 0;

  for (const word of emotionWords) {
    const found = EMOTION_TAXONOMY.find(e => e.word === word);
    if (found) {
      count++;
      switch (found.quadrant) {
        case 'low_unpleasant':
          totalScore += 1;
          break;
        case 'high_unpleasant':
          totalScore += 2;
          break;
        case 'low_pleasant':
          totalScore += 4;
          break;
        case 'high_pleasant':
          totalScore += 5;
          break;
      }
    }
  }

  if (count === 0) {
    return 3;
  }

  const average = totalScore / count;
  const rounded = Math.round(average);
  
  if (rounded >= 1 && rounded <= 5) {
    return rounded as 1 | 2 | 3 | 4 | 5;
  }
  return 3;
}
