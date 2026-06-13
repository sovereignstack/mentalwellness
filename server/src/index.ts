import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pathModule from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';

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

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

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
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/**
 * Endpoint to submit a mood/journal entry.
 * Runs keyword screening and Gemini safety classification.
 */
app.post('/api/entry', async (req, res) => {
  try {
    const userId = getOrCreateUserId(req, res);
    const {
      emotions = [],
      tags = [],
      journal = '',
      exam = 'board/entrance exams',
      localOnly = false,
    } = req.body;

    // 1. Derive mood score from chosen emotions (fallback to 3 if none)
    const mood = deriveMoodFromEmotions(emotions);

    // 2. Perform safety checks on journal text
    let safetyFlag: SafetyLevel = 'none';

    if (journal.trim().length > 0) {
      // Layer 1: Code-level keyword check
      const codeSafety = screenText(journal);
      
      // Layer 2: Gemini safety classification
      const geminiSafety = await safetyClassify(journal);

      // Combine: crisis > elevated > none
      if (codeSafety === 'crisis' || geminiSafety === 'crisis') {
        safetyFlag = 'crisis';
      } else if (codeSafety === 'elevated' || geminiSafety === 'elevated') {
        safetyFlag = 'elevated';
      }
    }

    // 3. Process entry based on safety level
    let entryData: DbEntry;

    if (safetyFlag === 'crisis' || safetyFlag === 'elevated') {
      // In crisis/elevated mode, we suppress coping tips and normal AI reflections.
      entryData = {
        id: crypto.randomUUID(),
        userId,
        date: new Date().toISOString().split('T')[0],
        mood,
        emotions,
        tags,
        journal,
        quickLog: journal.trim().length === 0,
        themes: ['Distress State'],
        detectedStressors: tags.length > 0 ? tags : ['emotional pressure'],
        reflection: CRISIS_COPY,
        copingStrategy: '', // Suppressed in crisis
        mindfulnessExercise: '', // Suppressed in crisis
        safetyFlag,
        createdAt: new Date().toISOString(),
      };
    } else {
      // Safety level: none
      if (journal.trim().length === 0) {
        // Quick Log path: skip Gemini entirely
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
          reflection: 'Your quick mood log has been saved. Remember to take steady breaks and be gentle with yourself.',
          copingStrategy: '',
          mindfulnessExercise: '',
          safetyFlag: 'none',
          createdAt: new Date().toISOString(),
        };
      } else {
        // Full Log path: run Gemini analysis
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
    }

    // 4. Save to Firestore if NOT localOnly
    let savedInCloud = false;
    if (!localOnly) {
      savedInCloud = await saveEntryToDb(userId, entryData);
    }

    res.json({
      entry: entryData,
      savedInCloud,
      userId,
    });
  } catch (error) {
    console.error('Error in POST /api/entry:', error);
    res.status(500).json({ error: 'Internal server error while processing entry.' });
  }
});

/**
 * Endpoint to fetch aggregated trends.
 */
app.get('/api/trends', async (req, res) => {
  try {
    const userId = getOrCreateUserId(req, res);
    const entries = await getEntriesFromDb(userId);
    const trends = calculateTrends(entries);
    res.json({ trends, entriesCount: entries.length });
  } catch (error) {
    console.error('Error in GET /api/trends:', error);
    res.status(500).json({ error: 'Internal server error while computing trends.' });
  }
});

/**
 * Companion follow-up chat endpoint.
 * Runs safety checks first.
 */
app.post('/api/companion', async (req, res) => {
  try {
    const { history = [], newMessage = '', exam = 'board/entrance exams' } = req.body;

    if (!newMessage.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    // 1. Safety screening of follow-up chat
    const codeSafety = screenText(newMessage);
    const geminiSafety = await safetyClassify(newMessage);
    const safetyFlag: SafetyLevel = 
      (codeSafety === 'crisis' || geminiSafety === 'crisis') ? 'crisis' :
      (codeSafety === 'elevated' || geminiSafety === 'elevated') ? 'elevated' : 'none';

    if (safetyFlag === 'crisis' || safetyFlag === 'elevated') {
      return res.json({
        reply: CRISIS_COPY,
        safetyFlag,
      });
    }

    // 2. Generate chatbot reply
    const reply = await companionChat(history, newMessage, exam);
    res.json({
      reply,
      safetyFlag: 'none',
    });
  } catch (error) {
    console.error('Error in POST /api/companion:', error);
    res.status(500).json({ error: 'Internal server error during companion response.' });
  }
});

/**
 * Wipes all user database records and resets anonymous ID cookie.
 */
app.delete('/api/data', async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (userId) {
      await deleteUserDataFromDb(userId);
    }
    res.clearCookie('userId');
    res.json({ success: true, message: 'All local session and cloud records wiped successfully.' });
  } catch (error) {
    console.error('Error in DELETE /api/data:', error);
    res.status(500).json({ error: 'Failed to wipe data.' });
  }
});

// Serve client static files if present (in production)
const clientDist = pathModule.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

// Catch-all to serve index.html for React Router SPA behavior
app.get('*', (req, res) => {
  res.sendFile(pathModule.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('MindEase Backend Running - Client Build Pending');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
