import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildQuickLogEntry } from './entryFactory.js';

// Shared spies for the Firestore chain, defined before vi.mock (hoisted).
const h = vi.hoisted(() => ({
  setSpy: vi.fn(),
  entriesGet: vi.fn(), // orderBy().get() for reads
  rawGet: vi.fn(), // collection.get() for delete
  batchDelete: vi.fn(),
  batchCommit: vi.fn(),
  shouldThrow: { value: false },
}));

vi.mock('firebase-admin', () => {
  const entriesCollection = {
    doc: vi.fn(() => ({ set: h.setSpy, ref: { kind: 'entryDoc' } })),
    orderBy: vi.fn(() => ({ get: h.entriesGet })),
    get: h.rawGet,
  };
  const userDoc = { collection: vi.fn(() => entriesCollection), ref: { kind: 'userDoc' } };
  const usersCollection = { doc: vi.fn(() => userDoc) };
  const firestore = {
    collection: vi.fn(() => usersCollection),
    batch: vi.fn(() => ({ delete: h.batchDelete, commit: h.batchCommit })),
  };
  return {
    default: {
      apps: [],
      initializeApp: vi.fn(),
      firestore: () => {
        if (h.shouldThrow.value) throw new Error('no firestore');
        return firestore;
      },
    },
  };
});

const { saveEntryToDb, getEntriesFromDb, deleteUserDataFromDb } = await import('./db.js');

const sampleEntry = buildQuickLogEntry({ userId: 'u1', mood: 3, emotions: ['calm'], tags: [] });

beforeEach(() => {
  vi.clearAllMocks();
  h.setSpy.mockResolvedValue(undefined);
  h.entriesGet.mockResolvedValue({
    forEach: (cb: (doc: { data: () => unknown }) => void) =>
      [{ date: '2026-06-01', mood: 3 }].forEach((d) => cb({ data: () => d })),
  });
  h.rawGet.mockResolvedValue({
    forEach: (cb: (doc: { ref: unknown }) => void) =>
      [{ ref: 'r1' }, { ref: 'r2' }].forEach((d) => cb(d)),
  });
  h.batchCommit.mockResolvedValue(undefined);
});

describe('db with Firestore available', () => {
  it('saveEntryToDb writes the entry and returns true', async () => {
    const ok = await saveEntryToDb('u1', sampleEntry);
    expect(ok).toBe(true);
    expect(h.setSpy).toHaveBeenCalledWith(sampleEntry);
  });

  it('getEntriesFromDb returns the mapped documents', async () => {
    const entries = await getEntriesFromDb('u1');
    expect(entries).toEqual([{ date: '2026-06-01', mood: 3 }]);
  });

  it('deleteUserDataFromDb batch-deletes entries + the user doc and commits', async () => {
    const ok = await deleteUserDataFromDb('u1');
    expect(ok).toBe(true);
    // 2 entry docs + 1 user doc
    expect(h.batchDelete).toHaveBeenCalledTimes(3);
    expect(h.batchCommit).toHaveBeenCalledOnce();
  });
});

describe('db offline (Firestore unavailable)', () => {
  it('degrades gracefully: false / [] without throwing', async () => {
    vi.resetModules();
    h.shouldThrow.value = true;
    const offline = await import('./db.js');
    expect(await offline.saveEntryToDb('u1', sampleEntry)).toBe(false);
    expect(await offline.getEntriesFromDb('u1')).toEqual([]);
    expect(await offline.deleteUserDataFromDb('u1')).toBe(false);
    h.shouldThrow.value = false;
  });
});
