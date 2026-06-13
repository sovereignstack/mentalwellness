import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock the external integrations; keep screenText (safety.ts) real so the
// code-layer crisis detection and the combine rule are genuinely exercised.
const m = vi.hoisted(() => ({
  safetyClassify: vi.fn(),
  analyzeEntry: vi.fn(),
  companionChat: vi.fn(),
  saveEntryToDb: vi.fn(),
  getEntriesFromDb: vi.fn(),
  deleteUserDataFromDb: vi.fn(),
}));

vi.mock('./gemini.js', () => ({
  safetyClassify: m.safetyClassify,
  analyzeEntry: m.analyzeEntry,
  companionChat: m.companionChat,
}));

vi.mock('./db.js', () => ({
  saveEntryToDb: m.saveEntryToDb,
  getEntriesFromDb: m.getEntriesFromDb,
  deleteUserDataFromDb: m.deleteUserDataFromDb,
}));

const { app } = await import('./index.js');

beforeEach(() => {
  vi.clearAllMocks();
  m.safetyClassify.mockResolvedValue('none');
  m.analyzeEntry.mockResolvedValue({
    reflection: 'r',
    themes: ['t'],
    detectedStressors: ['s'],
    copingStrategy: 'review one topic',
    mindfulnessExercise: 'breathe',
    motivation: 'keep going',
  });
  m.companionChat.mockResolvedValue('a gentle reply');
  m.saveEntryToDb.mockResolvedValue(true);
  m.getEntriesFromDb.mockResolvedValue([]);
  m.deleteUserDataFromDb.mockResolvedValue(true);
});

describe('POST /api/entry', () => {
  it('analyzes a safe full entry and returns coping + motivation', async () => {
    const res = await request(app)
      .post('/api/entry')
      .send({ emotions: ['anxious'], tags: ['mock_test'], journal: 'Nervous about my mock test tomorrow.' });
    expect(res.status).toBe(200);
    expect(res.body.entry.safetyFlag).toBe('none');
    expect(res.body.entry.copingStrategy).toBe('review one topic');
    expect(res.body.entry.motivation).toBe('keep going');
    expect(m.analyzeEntry).toHaveBeenCalledOnce();
  });

  it('flags crisis from the code keyword layer and suppresses coping tips', async () => {
    const res = await request(app)
      .post('/api/entry')
      .send({ emotions: ['hopeless'], tags: [], journal: 'I want to end my life' });
    expect(res.body.entry.safetyFlag).toBe('crisis');
    expect(res.body.entry.copingStrategy).toBe('');
    expect(res.body.entry.mindfulnessExercise).toBe('');
    expect(m.analyzeEntry).not.toHaveBeenCalled();
  });

  it('flags crisis from Gemini even when the keyword layer is clean (combine rule end-to-end)', async () => {
    m.safetyClassify.mockResolvedValueOnce('crisis');
    const res = await request(app)
      .post('/api/entry')
      .send({ emotions: ['drained'], tags: [], journal: 'Just another ordinary study day.' });
    expect(res.body.entry.safetyFlag).toBe('crisis');
    expect(m.analyzeEntry).not.toHaveBeenCalled();
  });

  it('quick-logs without a journal and makes zero Gemini calls', async () => {
    const res = await request(app)
      .post('/api/entry')
      .send({ emotions: ['calm'], tags: ['sleep'], journal: '' });
    expect(res.body.entry.quickLog).toBe(true);
    expect(m.safetyClassify).not.toHaveBeenCalled();
    expect(m.analyzeEntry).not.toHaveBeenCalled();
  });

  it('caps an oversized journal to the configured limit', async () => {
    const res = await request(app)
      .post('/api/entry')
      .send({ emotions: ['focused'], tags: [], journal: 'a'.repeat(5000) });
    expect(res.body.entry.journal.length).toBe(2000);
  });
});

describe('POST /api/companion', () => {
  it('returns a bounded reply for a safe message', async () => {
    const res = await request(app).post('/api/companion').send({ newMessage: 'I feel tired today' });
    expect(res.body.reply).toBe('a gentle reply');
    expect(res.body.safetyFlag).toBe('none');
  });

  it('returns crisis copy (and skips the chat model) when flagged', async () => {
    m.safetyClassify.mockResolvedValueOnce('crisis');
    const res = await request(app).post('/api/companion').send({ newMessage: 'ordinary message' });
    expect(res.body.safetyFlag).toBe('crisis');
    expect(m.companionChat).not.toHaveBeenCalled();
  });

  it('rejects an empty message with 400', async () => {
    const res = await request(app).post('/api/companion').send({ newMessage: '   ' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/trends', () => {
  it('computes trends from the stored entries', async () => {
    m.getEntriesFromDb.mockResolvedValueOnce([
      { mood: 2, emotions: ['anxious'], tags: ['mock_test'], date: '2026-06-01' },
      { mood: 4, emotions: ['calm'], tags: ['sleep'], date: '2026-06-02' },
    ]);
    const res = await request(app).get('/api/trends');
    expect(res.status).toBe(200);
    expect(res.body.entriesCount).toBe(2);
    expect(res.body.trends.totalEntries).toBe(2);
  });
});

describe('DELETE /api/data', () => {
  it('wipes the user data and clears the cookie', async () => {
    const res = await request(app).delete('/api/data').set('Cookie', ['userId=abc123']);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(m.deleteUserDataFromDb).toHaveBeenCalledWith('abc123');
    expect(String(res.headers['set-cookie'])).toMatch(/userId=;/);
  });
});
