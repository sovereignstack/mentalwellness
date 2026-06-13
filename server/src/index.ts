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
import { CRISIS_COPY } from './safety.js';
import { deriveMoodFromEmotions } from './emotions.js';
import { calculateTrends } from './trends.js';
import { saveEntryToDb, getEntriesFromDb, deleteUserDataFromDb } from './db.js';
import { analyzeEntry, companionChat } from './gemini.js';
import { determineSafetyFlag } from './safetyFlag.js';
import { buildCrisisEntry, buildQuickLogEntry, buildFullLogEntry } from './entryFactory.js';
import { sanitizeStringArray, sanitizeText } from './validation.js';
import {
  MAX_JOURNAL_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_EMOTIONS_COUNT,
  MAX_TAGS_COUNT,
  MAX_EXAM_LENGTH,
  MAX_CHAT_HISTORY,
  DEFAULT_EXAM,
  GEMINI_RATE_LIMIT,
} from './config.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathModule.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const isProduction = process.env.NODE_ENV === 'production';

/* ------------------------------------------------------------------ */
/* Security: HTTP headers via helmet (§10 hardening)                  */
/* In production the SPA is served same-origin, so we enforce a        */
/* Content-Security-Policy. In dev, Vite injects inline scripts/HMR,   */
/* so CSP is relaxed to avoid breaking the dev server.                 */
/* ------------------------------------------------------------------ */
app.use(
  helmet({
    contentSecurityPolicy: isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            // Tailwind/recharts emit inline style attributes; Google Fonts CSS is loaded from the CDN.
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'self'"],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
  })
);

// The SPA and API share one origin in production, so cross-origin requests are
// only needed in local dev (Vite :5173 proxies to the API). Lock CORS down in prod.
app.use(cors(isProduction ? { origin: false, credentials: true } : { origin: true, credentials: true }));
app.use(express.json({ limit: '50kb' })); // Cap request body size
app.use(cookieParser());

/* ------------------------------------------------------------------ */
/* Rate limiting on AI-powered routes (§10: rate limit Gemini routes) */
/* ------------------------------------------------------------------ */
const geminiLimiter = rateLimit({
  windowMs: GEMINI_RATE_LIMIT.windowMs,
  max: GEMINI_RATE_LIMIT.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment before trying again.' },
});

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
    const exam = sanitizeText(req.body.exam, MAX_EXAM_LENGTH) || DEFAULT_EXAM;
    const localOnly = req.body.localOnly === true;

    const mood = deriveMoodFromEmotions(emotions);
    const base = { userId, mood, emotions, tags };

    // Two-layer crisis pre-check before any normal processing (§7).
    const safetyFlag = await determineSafetyFlag(journal);

    // Build the entry for the matching logging path.
    let entryData;
    if (safetyFlag !== 'none') {
      // Crisis/elevated: suppress coping/mindfulness/motivation, lead with care (§8).
      entryData = buildCrisisEntry({ ...base, journal, safetyFlag });
    } else if (journal.length === 0) {
      // Quick log: no journal, zero Gemini calls (§2).
      entryData = buildQuickLogEntry(base);
    } else {
      // Full entry: one Gemini analysis call (§7a).
      const analysis = await analyzeEntry(journal, exam, mood, tags);
      entryData = buildFullLogEntry({ ...base, journal, analysis });
    }

    // Persist to Firestore unless the user chose local-only mode.
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
    const exam = sanitizeText(req.body.exam, MAX_EXAM_LENGTH) || DEFAULT_EXAM;
    const history = Array.isArray(req.body.history) ? req.body.history.slice(-MAX_CHAT_HISTORY) : [];

    if (!newMessage) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    // Re-run the same two-layer safety pre-check on every message (§7b).
    const safetyFlag = await determineSafetyFlag(newMessage);
    if (safetyFlag !== 'none') {
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

// Exported so route tests can drive the app with supertest without binding a port.
export { app };

// Vitest sets NODE_ENV='test'; only bind a port outside the test runner.
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`MindEase server listening on port ${PORT}`);
  });
}
