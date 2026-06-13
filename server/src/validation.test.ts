import { describe, it, expect } from 'vitest';
import { sanitizeStringArray, sanitizeText } from './validation.js';

describe('sanitizeStringArray', () => {
  it('returns [] for non-array input', () => {
    expect(sanitizeStringArray(undefined, 5)).toEqual([]);
    expect(sanitizeStringArray('nope', 5)).toEqual([]);
    expect(sanitizeStringArray({ a: 1 }, 5)).toEqual([]);
  });

  it('drops non-string items', () => {
    expect(sanitizeStringArray(['a', 1, null, 'b', {}], 10)).toEqual(['a', 'b']);
  });

  it('caps the number of items', () => {
    expect(sanitizeStringArray(['a', 'b', 'c', 'd'], 2)).toEqual(['a', 'b']);
  });

  it('trims and caps each item length at 100 chars', () => {
    const long = 'x'.repeat(150);
    const [item] = sanitizeStringArray([`  ${long}  `], 5);
    expect(item.length).toBe(100);
    expect(sanitizeStringArray(['  hello  '], 5)).toEqual(['hello']);
  });
});

describe('sanitizeText', () => {
  it("returns '' for non-string input", () => {
    expect(sanitizeText(undefined, 100)).toBe('');
    expect(sanitizeText(42, 100)).toBe('');
    expect(sanitizeText(['a'], 100)).toBe('');
  });

  it('trims whitespace', () => {
    expect(sanitizeText('  hi  ', 100)).toBe('hi');
  });

  it('caps to maxLength', () => {
    expect(sanitizeText('abcdef', 3)).toBe('abc');
  });
});
