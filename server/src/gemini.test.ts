import { describe, it, expect, vi, beforeEach } from 'vitest';

// Shared mock for the SDK's generateContent, defined before vi.mock (hoisted).
const { mockGenerate } = vi.hoisted(() => ({ mockGenerate: vi.fn() }));

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerate },
  })),
}));

// Ensure a key is present so the client initializes (the SDK itself is mocked).
process.env.GEMINI_API_KEY = 'test-key';

const { safetyClassify, analyzeEntry, companionChat } = await import('./gemini.js');

beforeEach(() => {
  mockGenerate.mockReset();
});

describe('safetyClassify', () => {
  it('parses a crisis classification', async () => {
    mockGenerate.mockResolvedValueOnce({ text: '{"risk":"crisis"}' });
    expect(await safetyClassify('I want to end my life')).toBe('crisis');
  });

  it('fails safe to none on malformed JSON', async () => {
    mockGenerate.mockResolvedValueOnce({ text: 'not json at all' });
    expect(await safetyClassify('something')).toBe('none');
  });

  it('returns none for empty text without calling the model', async () => {
    expect(await safetyClassify('   ')).toBe('none');
    expect(mockGenerate).not.toHaveBeenCalled();
  });
});

describe('analyzeEntry', () => {
  const valid = {
    reflection: 'r',
    themes: ['mock test'],
    detectedStressors: ['mock test'],
    copingStrategy: 'review one topic',
    mindfulnessExercise: 'breathe slowly',
    motivation: 'steady effort counts',
  };

  it('returns the parsed analysis including motivation', async () => {
    mockGenerate.mockResolvedValueOnce({ text: JSON.stringify(valid) });
    const result = await analyzeEntry('hard day', 'JEE', 2, ['mock_test']);
    expect(result.motivation).toBe('steady effort counts');
    expect(result.copingStrategy).toBe('review one topic');
  });

  it('fills a fallback motivation when the model omits it', async () => {
    const { motivation, ...withoutMotivation } = valid;
    void motivation;
    mockGenerate.mockResolvedValueOnce({ text: JSON.stringify(withoutMotivation) });
    const result = await analyzeEntry('hard day', 'JEE', 2, []);
    expect(result.motivation.length).toBeGreaterThan(0);
    expect(result.reflection).toBe('r');
  });

  it('returns the full fallback on malformed JSON', async () => {
    mockGenerate.mockResolvedValueOnce({ text: '<<<not json>>>' });
    const result = await analyzeEntry('hard day', 'JEE', 2, []);
    expect(result.reflection).toContain('Thank you for sharing');
    expect(result.motivation.length).toBeGreaterThan(0);
  });

  it('returns the fallback for an empty journal without calling the model', async () => {
    const result = await analyzeEntry('   ', 'JEE', 3, []);
    expect(result.reflection).toContain('Thank you for sharing');
    expect(mockGenerate).not.toHaveBeenCalled();
  });
});

describe('companionChat', () => {
  it('returns the model reply', async () => {
    mockGenerate.mockResolvedValueOnce({ text: 'You are doing your best.' });
    const reply = await companionChat([], 'I am tired', 'JEE');
    expect(reply).toBe('You are doing your best.');
  });

  it('returns a fallback reply when the model errors', async () => {
    mockGenerate.mockRejectedValueOnce(new Error('network'));
    const reply = await companionChat([], 'I am tired', 'JEE');
    expect(reply.length).toBeGreaterThan(0);
  });
});
