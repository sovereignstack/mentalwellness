/**
 * Centralized server configuration constants.
 * Keeping these in one place avoids magic numbers/strings scattered across routes.
 */

/** Input length caps enforced server-side (§10). */
export const MAX_JOURNAL_LENGTH = 2000;
export const MAX_MESSAGE_LENGTH = 500;
export const MAX_EMOTIONS_COUNT = 24;
export const MAX_TAGS_COUNT = 15;
export const MAX_TAG_ITEM_LENGTH = 100;
export const MAX_EXAM_LENGTH = 100;
export const MAX_CHAT_HISTORY = 20;

/** Default exam context when the student hasn't named one. */
export const DEFAULT_EXAM = 'board/entrance exams';

/** Theme label used for crisis/elevated entries (coping flow suppressed). */
export const DISTRESS_STATE_THEME = 'Distress State';

/** Rate-limit settings for the Gemini-backed routes. */
export const GEMINI_RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  max: 15, // requests per minute per IP
} as const;
