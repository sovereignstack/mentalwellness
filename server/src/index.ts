import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pathModule from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Imports from our modular files
import { screenText, CRISIS_COPY, SafetyLevel } from './safety.js';
import { deriveMoodFromEmotions } from './emotions.js';
import { calculateTrends } from './trends.js';
import { saveEntryToDb, getEntriesFromDb, deleteUserDataFromDb, DbEntry } from './db.js';
import { safetyClassify, analyzeEntry, companionChat } from './gemini.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathModule.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

/* ------------------------------------------------------------------ */
/* Security: HTTP headers via helmet (§10 hardening)                  */
/* ------------------------------------------------------------------ */
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled to allow inline Vite scripts in dev
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50kb' })); // Cap request body size
app.use(cookieParser());

/* ------------------------------------------------------------------ */
/* Rate limiting on AI-powered routes (§10: rate limit Gemini routes) */
/* ------------------------------------------------------------------ */
const geminiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment before trying again.' },
});

/* ------------------------------------------------------------------ */
/* Input validation constants (§10: validate + length-cap server-side)*/
/* ------------------------------------------------------------------ */
const MAX_JOURNAL_LENGTH = 2000;
const MAX_MESSAGE_LENGTH = 500;
const MAX_EMOTIONS_COUNT = 24;
const MAX_TAGS_COUNT = 15;

/**
 * Validates and sanitizes an array of strings, enforcing length limits.
 */
function sanitizeStringArray(arr: unknown, maxItems: number): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((item): item is string => typeof item === 'string')
    .slice(0, maxItems)
    .map((s) => s.trim().slice(0, 100)); // Cap each item at 100 chars
}

/**
 * Validates and sanitizes a text string, enforcing length limits.
 */
function sanitizeText(text: unknown, maxLength: number): string {
  if (typeof text !== 'string') return '';
  return text.trim().slice(0, maxLength);
}

// Helper to get or set anonymous userId cookie
function getOrCreateUserId(req: express.Request, res: express.Response): string {
  let userId = req.cookies.userId;
  if (!userId) {
    userId = crypto.randomUUID();
    // Set cookie to last for 1 year
    res.cookie('userId', userId, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }
  return userId;
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/**
 * POST /api/entry — Submit a mood/journal entry.
 * Runs keyword screening and Gemini safety classification before analysis.
 * Rate-limited to prevent Gemini API abuse.
 */
app.post('/api/entry', geminiLimiter, async (req, res) => {
  try {
    const userId = getOrCreateUserId(req, res);

    // Validate and sanitize all inputs server-side (§10)
    const emotions = sanitizeStringArray(req.body.emotions, MAX_EMOTIONS_COUNT);
    const tags = sanitizeStringArray(req.body.tags, MAX_TAGS_COUNT);
    const journal = sanitizeText(req.body.journal, MAX_JOURNAL_LENGTH);
    const exam = sanitizeText(req.body.exam, 100) || 'board/entrance exams';
    const localOnly = req.body.localOnly === true;

    // 1. Derive mood score from chosen emotions (fallback to 3 if none)
    const mood = deriveMoodFromEmotions(emotions);

    // 2. Perform safety checks on journal text
    let safetyFlag: SafetyLevel = 'none';

    if (journal.length > 0) {
      // Layer 1: Code-level keyword check (deterministic, always runs first)
      const codeSafety = screenText(journal);

      // Layer 2: Gemini safety classification
      const geminiSafety = await safetyClassify(journal);

      // Combine: crisis > elevated > none (never downgrade code-level flag)
      if (codeSafety === 'crisis' || geminiSafety === 'crisis') {
        safetyFlag = 'crisis';
      } else if (codeSafety === 'elevated' || geminiSafety === 'elevated') {
        safetyFlag = 'elevated';
      }
    }

    // 3. Process entry based on safety level
    let entryData: DbEntry;

    if (safetyFlag === 'crisis' || safetyFlag === 'elevated') {
      // In crisis/elevated mode, suppress coping tips and normal AI reflections (§8).
      entryData = {
        id: crypto.randomUUID(),
        userId,
        date: new Date().toISOString().split('T')[0],
        mood,
        emotions,
        tags,
        journal,
        quickLog: journal.length === 0,
        themes: ['Distress State'],
        detectedStressors: tags.length > 0 ? tags : ['emotional pressure'],
        reflection: CRISIS_COPY,
        copingStrategy: '', // Suppressed in crisis (§8)
        mindfulnessExercise: '', // Suppressed in crisis (§8)
        safetyFlag,
        createdAt: new Date().toISOString(),
      };
    } else if (journal.length === 0) {
      // Quick Log path: skip Gemini entirely (§2 — zero AI calls for quick-log)
      entryData = {
        id: crypto.randomUUID(),
        userId,
        date: new Date().toISOString().split('T')[0],
        mood,
        emotions,
        tags,
        journal: '',
        quickLog: true,
        themes: [],
        detectedStressors: [],
        reflection:
          'Your quick mood log has been saved. Remember to take steady breaks and be gentle with yourself.',
        copingStrategy: '',
        mindfulnessExercise: '',
        safetyFlag: 'none',
        createdAt: new Date().toISOString(),
      };
    } else {
      // Full Log path: run Gemini analysis (§7a)
      const analysis = await analyzeEntry(journal, exam, mood, tags);
      entryData = {
        id: crypto.randomUUID(),
        userId,
        date: new Date().toISOString().split('T')[0],
        mood,
        emotions,
        tags,
        journal,
        quickLog: false,
        themes: analysis.themes,
        detectedStressors: analysis.detectedStressors,
        reflection: analysis.reflection,
        copingStrategy: analysis.copingStrategy,
        mindfulnessExercise: analysis.mindfulnessExercise,
        safetyFlag: 'none',
        createdAt: new Date().toISOString(),
      };
    }

    // 4. Save to Firestore if NOT localOnly
    let savedInCloud = false;
    if (!localOnly) {
      savedInCloud = await saveEntryToDb(userId, entryData);
    }

    res.json({ entry: entryData, savedInCloud, userId });
  } catch (error) {
    console.error('Error in POST /api/entry:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Internal server error while processing entry.' });
  }
});

/**
 * GET /api/trends — Fetch aggregated mood trends.
 * All computation is pure code (no AI). See trends.ts.
 */
app.get('/api/trends', async (req, res) => {
  try {
    const userId = getOrCreateUserId(req, res);
    const entries = await getEntriesFromDb(userId);
    const trends = calculateTrends(entries);
    res.json({ trends, entriesCount: entries.length });
  } catch (error) {
    console.error('Error in GET /api/trends:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Internal server error while computing trends.' });
  }
});

/**
 * POST /api/companion — Companion follow-up chat.
 * Runs safety checks on every message first (§7b).
 * Rate-limited to prevent Gemini API abuse.
 */
app.post('/api/companion', geminiLimiter, async (req, res) => {
  try {
    const newMessage = sanitizeText(req.body.newMessage, MAX_MESSAGE_LENGTH);
    const exam = sanitizeText(req.body.exam, 100) || 'board/entrance exams';
    const history = Array.isArray(req.body.history) ? req.body.history.slice(-20) : []; // Cap history

    if (!newMessage) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    // 1. Safety screening of follow-up chat (§7b: re-run safety pre-check)
    const codeSafety = screenText(newMessage);
    const geminiSafety = await safetyClassify(newMessage);
    const safetyFlag: SafetyLevel =
      codeSafety === 'crisis' || geminiSafety === 'crisis'
        ? 'crisis'
        : codeSafety === 'elevated' || geminiSafety === 'elevated'
          ? 'elevated'
          : 'none';

    if (safetyFlag === 'crisis' || safetyFlag === 'elevated') {
      return res.json({ reply: CRISIS_COPY, safetyFlag });
    }

    // 2. Generate chatbot reply
    const reply = await companionChat(history, newMessage, exam);
    res.json({ reply, safetyFlag: 'none' });
  } catch (error) {
    console.error(
      'Error in POST /api/companion:',
      error instanceof Error ? error.message : error
    );
    res.status(500).json({ error: 'Internal server error during companion response.' });
  }
});

/**
 * DELETE /api/data — Wipes all user database records and resets anonymous ID cookie.
 * Supports the "Delete my data" privacy feature (§0, §5).
 */
app.delete('/api/data', async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (userId) {
      await deleteUserDataFromDb(userId);
    }
    res.clearCookie('userId');
    res.json({
      success: true,
      message: 'All local session and cloud records wiped successfully.',
    });
  } catch (error) {
    console.error('Error in DELETE /api/data:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to wipe data.' });
  }
});

// Serve client static files if present (in production)
const clientDist = pathModule.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

// Catch-all to serve index.html for React Router SPA behavior
app.get('*', (_req, res) => {
  res.sendFile(pathModule.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('MindEase Backend Running - Client Build Pending');
    }
  });
});

app.listen(PORT, () => {
  console.log(`MindEase server listening on port ${PORT}`);
});
