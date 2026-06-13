import { describe, it, expect } from 'vitest';
import { screenText, CRISIS_RESOURCES, GROUNDING_EXERCISES } from './safety.js';

describe('Safety Module - screenText', () => {
  it('should flag explicit suicide/self-harm thoughts as crisis', () => {
    expect(screenText('I want to suicide')).toBe('crisis');
    expect(screenText('feel like killing myself today')).toBe('crisis');
    expect(screenText('I want to end my life, too much pain')).toBe('crisis');
    expect(screenText('thinking about self-harm')).toBe('crisis');
    expect(screenText('I just want to end it all')).toBe('crisis');
  });

  it('should flag strong hopelessness or overload as elevated', () => {
    expect(screenText('I feel so hopeless about my JEE results')).toBe('elevated');
    expect(screenText('I want to give up completely')).toBe('elevated');
    expect(screenText('Parents will kill me if I fail mock test')).toBe('elevated');
    expect(screenText('I am having a panic attack right now')).toBe('elevated');
  });

  it('should return none for normal entries', () => {
    expect(screenText('I studied for 6 hours today and feel tired but fine')).toBe('none');
    expect(screenText('')).toBe('none');
    expect(screenText('Just finished a chemistry mock test')).toBe('none');
  });

  it('should expose Indian helpline resources', () => {
    expect(CRISIS_RESOURCES.length).toBeGreaterThan(0);
    const teleManas = CRISIS_RESOURCES.find(r => r.name === 'Tele-MANAS');
    expect(teleManas).toBeDefined();
    expect(teleManas?.number).toBe('14416');
  });

  it('should provide grounding scripts', () => {
    expect(GROUNDING_EXERCISES.length).toBeGreaterThan(0);
    expect(GROUNDING_EXERCISES[0].id).toBe('54321');
  });
});
