import type { SafetyLevel } from '../../shared/types.js';
import { screenText } from './safety.js';
import { safetyClassify } from './gemini.js';

/**
 * Two-layer crisis detection (§7): a deterministic code keyword layer plus a
 * Gemini classification. The combine rule takes the more severe of the two and
 * NEVER downgrades a code-level crisis based on the model.
 */

/** Severity ordering for the combine rule. */
const SEVERITY: Record<SafetyLevel, number> = { none: 0, elevated: 1, crisis: 2 };

/**
 * Combine the code-layer and model-layer results, returning the more severe.
 * Pure and synchronous — the core safety invariant, unit-tested directly.
 */
export function combineSafety(code: SafetyLevel, model: SafetyLevel): SafetyLevel {
  return SEVERITY[code] >= SEVERITY[model] ? code : model;
}

/**
 * Run both safety layers over the text and combine them.
 * Empty text is treated as safe without calling the model.
 */
export async function determineSafetyFlag(text: string): Promise<SafetyLevel> {
  if (!text.trim()) return 'none';
  const codeSafety = screenText(text);
  const geminiSafety = await safetyClassify(text);
  return combineSafety(codeSafety, geminiSafety);
}
