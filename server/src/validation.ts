import { MAX_TAG_ITEM_LENGTH } from './config.js';

/**
 * Server-side input sanitization helpers (§10: validate + length-cap).
 * Pure functions — no Express coupling — so they are easy to unit-test.
 */

/**
 * Coerce an unknown value into a clean string array: drops non-strings,
 * caps the number of items, trims each, and caps each item's length.
 */
export function sanitizeStringArray(arr: unknown, maxItems: number): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((item): item is string => typeof item === 'string')
    .slice(0, maxItems)
    .map((s) => s.trim().slice(0, MAX_TAG_ITEM_LENGTH));
}

/**
 * Coerce an unknown value into a trimmed, length-capped string.
 * Non-strings become an empty string.
 */
export function sanitizeText(text: unknown, maxLength: number): string {
  if (typeof text !== 'string') return '';
  return text.trim().slice(0, maxLength);
}
