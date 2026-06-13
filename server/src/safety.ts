import type { SafetyLevel } from '../../shared/types.js';

export type { SafetyLevel };

export interface Helpline {
  name: string;
  number: string;
  hours: string;
  description: string;
}

export interface GroundingExercise {
  id: string;
  name: string;
  steps: string[];
}

export const CRISIS_RESOURCES: Helpline[] = [
  {
    name: 'Tele-MANAS',
    number: '14416',
    hours: '24/7',
    description: 'National Mental Health Helpline of India. Free and confidential support.',
  },
  {
    name: 'KIRAN',
    number: '1800-599-0019',
    hours: '24/7',
    description: 'Mental Health Rehabilitation Helpline run by the Govt of India.',
  },
  {
    name: 'AASRA',
    number: '+91-9820466726',
    hours: '24/7',
    description: 'A non-profit organization providing support to individuals in distress.',
  },
];

export const GROUNDING_EXERCISES: GroundingExercise[] = [
  {
    id: '54321',
    name: '5-4-3-2-1 Senses Technique',
    steps: [
      'Look around you and name 5 things you can SEE (e.g. a chair, a pen, a clock).',
      'Name 4 things you can feel or TOUCH (e.g. the desk under your hands, your shirt on your shoulders).',
      'Name 3 things you can HEAR (e.g. traffic outside, the hum of a fan, birds chirping).',
      'Name 2 things you can SMELL (e.g. soap, coffee, fresh rain).',
      'Name 1 thing you can TASTE (e.g. toothpaste, water, mint).',
    ],
  },
  {
    id: 'box_breathing',
    name: 'Box Breathing (4-4-4-4)',
    steps: [
      'Exhale completely. Inhale slowly through your nose for 4 seconds.',
      'Hold your breath gently for 4 seconds.',
      'Exhale slowly and smoothly through your mouth for 4 seconds.',
      'Hold your lungs empty for 4 seconds.',
      'Repeat this cycle 4 times.',
    ],
  },
];

export const DISCLAIMER =
  'Disclaimer: MindEase is an AI well-being companion designed to provide supportive reflection and coping strategies. It is NOT a therapist, medical device, or diagnostic service. It does not provide clinical treatment or medical advice. If you are experiencing severe distress, please contact professional medical services or reach out to one of the helplines listed below.';

export const CRISIS_COPY =
  'It sounds like you are going through an incredibly difficult time right now. Please know that you are not alone, and there is support available. We care about your well-being. Please take a slow, deep breath, and consider reaching out to a professional or a trusted person in your life. Here are free, confidential 24/7 helplines in India and some grounding exercises to help you feel safer right now.';

// Local keyword pattern matching lists
const CRISIS_KEYWORDS = [
  /\bsuicid/i,
  /\bself-harm/i,
  /\bkill(ing)?\s+myself\b/i,
  /\bend\s+my\s+life\b/i,
  /\bwant\s+to\s+die\b/i,
  /\bcut\s+my\b/i,
  /\boverdose\b/i,
  /\bhang\s+myself\b/i,
  /\bjumping\s+off\b/i,
  /\bpoison\b/i,
  /\bharm\s+myself\b/i,
  /\bdose\s+of\s+pills\b/i,
  /\bend\s+it\s+all\b/i,
];

const ELEVATED_KEYWORDS = [
  /\bhopeless\b/i,
  /\bworthless\b/i,
  /\bgive up\b/i,
  /\bcan't go on\b/i,
  /\bcan't take it anymore\b/i,
  /\bhate my life\b/i,
  /\bno reason to live\b/i,
  /\bcompletely empty\b/i,
  /\bdepressed\b/i,
  /\bpanic attack\b/i,
  /\bwant to scream\b/i,
  /\btoo much pressure\b/i,
  /\bparents will kill me\b/i,
  /\bfailed my life\b/i,
];

/**
 * Screen input text for distress or crisis indicators.
 * Broad checks to err on the side of caution.
 */
export function screenText(text: string): SafetyLevel {
  if (!text || typeof text !== 'string') {
    return 'none';
  }

  // Check crisis keywords first
  for (const regex of CRISIS_KEYWORDS) {
    if (regex.test(text)) {
      return 'crisis';
    }
  }

  // Check elevated keywords second
  for (const regex of ELEVATED_KEYWORDS) {
    if (regex.test(text)) {
      return 'elevated';
    }
  }

  return 'none';
}
