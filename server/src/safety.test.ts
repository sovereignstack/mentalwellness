import { describe, it, expect } from 'vitest';
import {
  screenText,
  CRISIS_RESOURCES,
  GROUNDING_EXERCISES,
  CRISIS_COPY,
  DISCLAIMER,
} from './safety.js';

describe('Safety Module - screenText', () => {
  // Crisis-level detection fixtures
  it('should flag explicit suicide/self-harm phrases as crisis', () => {
    expect(screenText('I want to suicide')).toBe('crisis');
    expect(screenText('feel like killing myself today')).toBe('crisis');
    expect(screenText('I want to end my life, too much pain')).toBe('crisis');
    expect(screenText('thinking about self-harm')).toBe('crisis');
    expect(screenText('I just want to end it all')).toBe('crisis');
    expect(screenText('going to hang myself')).toBe('crisis');
    expect(screenText('taking an overdose seems like the only way')).toBe('crisis');
    expect(screenText('I want to harm myself badly')).toBe('crisis');
  });

  // Elevated-level detection fixtures
  it('should flag strong hopelessness or overload as elevated', () => {
    expect(screenText('I feel so hopeless about my JEE results')).toBe('elevated');
    expect(screenText('I want to give up completely')).toBe('elevated');
    expect(screenText('Parents will kill me if I fail mock test')).toBe('elevated');
    expect(screenText('I am having a panic attack right now')).toBe('elevated');
    expect(screenText('I feel completely empty inside')).toBe('elevated');
    expect(screenText('I feel worthless as a student')).toBe('elevated');
    expect(screenText('I failed my life, there is no hope')).toBe('elevated');
  });

  // Normal / none detection
  it('should return none for normal entries', () => {
    expect(screenText('I studied for 6 hours today and feel tired but fine')).toBe('none');
    expect(screenText('')).toBe('none');
    expect(screenText('Just finished a chemistry mock test')).toBe('none');
    expect(screenText('Feeling nervous about tomorrow exam but prepared')).toBe('none');
    expect(screenText('Had a good study session, covered organic chemistry')).toBe('none');
  });

  // Edge cases
  it('should handle edge cases safely', () => {
    expect(screenText(null as unknown as string)).toBe('none');
    expect(screenText(undefined as unknown as string)).toBe('none');
    expect(screenText(123 as unknown as string)).toBe('none');
    expect(screenText('   ')).toBe('none'); // whitespace only
  });

  // Very long input
  it('should handle very long input without crashing', () => {
    const longText = 'I studied hard today. '.repeat(500);
    expect(screenText(longText)).toBe('none');
  });

  // Crisis detection should be case-insensitive
  it('should be case-insensitive for crisis keywords', () => {
    expect(screenText('I WANT TO SUICIDE')).toBe('crisis');
    expect(screenText('Self-Harm is on my mind')).toBe('crisis');
    expect(screenText('HOPELESS about everything')).toBe('elevated');
  });

  // Combine rule: crisis should never be downgraded
  it('should verify that crisis + elevated both exist as keywords ensuring the combine rule works', () => {
    // If a text contains both crisis and elevated keywords, crisis should win
    const text = 'I feel hopeless and I want to end my life';
    expect(screenText(text)).toBe('crisis'); // crisis keyword takes priority
  });

  // Crisis response should suppress coping tips
  it('should verify crisis copy does not contain coping tips', () => {
    // CRISIS_COPY should contain empathetic care + helpline direction, NOT tips
    expect(CRISIS_COPY).not.toContain('coping');
    expect(CRISIS_COPY).not.toContain('mindfulness');
    expect(CRISIS_COPY).toContain('support');
    expect(CRISIS_COPY).toContain('helpline');
  });
});

describe('Safety Module - Resources', () => {
  it('should expose Indian helpline resources with correct numbers', () => {
    expect(CRISIS_RESOURCES.length).toBeGreaterThanOrEqual(3);

    const teleManas = CRISIS_RESOURCES.find((r) => r.name === 'Tele-MANAS');
    expect(teleManas).toBeDefined();
    expect(teleManas?.number).toBe('14416');

    const kiran = CRISIS_RESOURCES.find((r) => r.name === 'KIRAN');
    expect(kiran).toBeDefined();
    expect(kiran?.number).toBe('1800-599-0019');

    const aasra = CRISIS_RESOURCES.find((r) => r.name === 'AASRA');
    expect(aasra).toBeDefined();
    expect(aasra?.number).toBe('+91-9820466726');
  });

  it('should provide at least 2 grounding exercise scripts', () => {
    expect(GROUNDING_EXERCISES.length).toBeGreaterThanOrEqual(2);
    expect(GROUNDING_EXERCISES[0].id).toBe('54321');
    expect(GROUNDING_EXERCISES[0].steps.length).toBeGreaterThan(0);
    expect(GROUNDING_EXERCISES[1].id).toBe('box_breathing');
    expect(GROUNDING_EXERCISES[1].steps.length).toBeGreaterThan(0);
  });

  it('should have a non-clinical disclaimer', () => {
    expect(DISCLAIMER).toContain('NOT');
    expect(DISCLAIMER).toContain('therapist');
    expect(DISCLAIMER).toContain('professional');
  });
});
