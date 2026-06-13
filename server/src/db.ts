import admin from 'firebase-admin';
import type { DbEntry } from '../../shared/types.js';

export type { DbEntry };

// Initialize Firebase Admin SDK.
// In Google Cloud Run, it utilizes Application Default Credentials (ADC) automatically.
try {
  if (admin.apps.length === 0) {
    // If running in development without environment credentials,
    // we specify the project ID.
    admin.initializeApp({
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'promptwars-499219',
    });
    console.log('Firebase Admin SDK initialized successfully.');
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
}

let firestoreInstance: admin.firestore.Firestore | null = null;
try {
  firestoreInstance = admin.firestore();
  // Set settings if needed
} catch (error) {
  console.error('Failed to obtain Firestore database reference:', error);
}

export const db = firestoreInstance;

/**
 * Saves a journal entry to Cloud Firestore.
 */
export async function saveEntryToDb(userId: string, entry: DbEntry): Promise<boolean> {
  if (!db) {
    console.warn('Database is offline. Entry not persisted in Cloud.');
    return false;
  }
  try {
    const docRef = db.collection('users').doc(userId).collection('entries').doc(entry.id);
    await docRef.set(entry);
    return true;
  } catch (error) {
    console.error(`Error saving entry for user ${userId}:`, error);
    return false;
  }
}

/**
 * Fetches all entries for a specific anonymous user ID.
 */
export async function getEntriesFromDb(userId: string): Promise<DbEntry[]> {
  if (!db) {
    console.warn('Database is offline. Cannot fetch entries from Cloud.');
    return [];
  }
  try {
    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('entries')
      .orderBy('date', 'desc')
      .get();

    const entries: DbEntry[] = [];
    snapshot.forEach((doc) => {
      entries.push(doc.data() as DbEntry);
    });
    return entries;
  } catch (error) {
    console.error(`Error fetching entries for user ${userId}:`, error);
    return [];
  }
}

/**
 * Deletes all entries and the user profile data.
 */
export async function deleteUserDataFromDb(userId: string): Promise<boolean> {
  if (!db) {
    console.warn('Database is offline. Cannot delete entries from Cloud.');
    return false;
  }
  try {
    const entriesRef = db.collection('users').doc(userId).collection('entries');
    const snapshot = await entriesRef.get();

    const batch = db.batch();
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Also delete the main user doc if there's one
    batch.delete(db.collection('users').doc(userId));

    await batch.commit();
    console.log(`Deleted all Firestore entries for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error deleting user data for ${userId}:`, error);
    return false;
  }
}
