# MindEase — GenAI Student Well-being Companion

> A calm, AI-powered mental wellness tracker for Indian students preparing for high-stakes board and entrance examinations (JEE, NEET, CUET, CAT, GATE, UPSC). Analyzes open-ended daily journaling and mood logs to surface hidden stress triggers and emotional patterns, and provides hyper-personalized, contextual support — coping strategies, adaptive mindfulness, and empathetic companionship — within strict safety guardrails.

**Live URL:** [https://mindease-ugc2t6exba-ew.a.run.app](https://mindease-ugc2t6exba-ew.a.run.app)

**Chosen Vertical:** Students in high-stakes Indian exam preparation (NEET, JEE, CUET, CAT, GATE, UPSC, Class 10/12 Board Exams).

---

## Brief → Feature Mapping

| Brief Phrase | Feature |
|---|---|
| **Monitor well-being** | Mood-meter emotion log (~24 words across energy×pleasantness quadrants) + context tags, with a 2-tap quick-log path, plus an optional open-ended journal — stored privately per user. |
| **Analyze open-ended journaling** | Gemini reads each entry and returns themes, detected stressors, and an empathetic reflection (structured JSON). |
| **Uncover hidden stress triggers & patterns** | Trends view computed in code from history: emotion/trigger frequencies, mood-over-time line chart, month color grid, and hedged correlations (e.g. "low-mood days clustering with mock tests / poor sleep"). |
| **Hyper-personalized contextual support** | One tailored coping strategy, one short mindfulness exercise, and a short motivational line chosen for the entry's detected state and the student's exam context — plus a **"try a guided breath now"** action that runs an interactive box-breathing exercise in-app and asks how the student feels afterwards. |
| **Empathetic always-available companion** | A bounded follow-up reflection chat after each entry, within strict safety bounds. |
| **Safely** | Continuous two-layer crisis detection (code keyword + Gemini classify) + always-visible one-tap SOS (India helplines + grounding exercises), non-clinical disclaimers, anti-rumination guardrails. |

---

## Approach & Logic

### How it works

1. **Student logs mood** by selecting emotion words from a ~24-word mood-meter grid organized by energy×pleasantness quadrants (e.g. high_unpleasant: anxious, overwhelmed; low_pleasant: calm, grateful) and optionally tagging stressors (exam pressure, mock tests, parental pressure, etc.).
2. **Two logging paths** reduce friction: a **Quick Log** (2 taps, no AI, no journal writing) and a **Full Entry** (open-ended journal → Gemini analysis). Quick logs still feed Trends.
3. **Safety pre-check runs on every entry before any AI processing** — a deterministic keyword/pattern matcher in code (`safety.ts`) PLUS a Gemini safety classification. If either flags risk → Crisis Mode. The combine rule **never downgrades** a code-level crisis based on the model.
4. **Gemini analyzes** the journal text and returns structured JSON: empathetic reflection, themes, stressors, one coping strategy, one mindfulness exercise, and one motivational line — all contextualized to the student's exam.
4a. **The app actively helps in the moment** — the mindfulness card offers a guided, animated box-breathing exercise the student can do right away, followed by a brief, non-persisted "how do you feel now?" check that responds with gentle encouragement (and a nudge toward the SOS helplines if they are still struggling).
5. **Trends are computed entirely in code** — mood averages, emotion/tag frequencies, mood direction, and low-mood co-occurrence correlations. No AI computes scores or trends.
6. **Companion chat** allows a follow-up conversation, also safety-gated.

### Assumptions

- Students are in India preparing for nationally recognized exams.
- Anonymous usage (UUID cookie) is sufficient — no accounts or login required.
- Journal text is the primary signal for AI analysis; quick logs provide structured data only.
- Crisis detection errs on the side of caution: broad keyword matching + AI classification.
- Firestore stores data under `users/{userId}/entries/{entryId}` with no cross-user access.

---

## Architecture

```
React SPA (Vite+TS+Tailwind) ──fetch /api/* (userId cookie)──▶ Express (Cloud Run)
  POST /api/entry      safety pre-check (code+Gemini) → analyze (Gemini) → save → response
  GET  /api/trends     aggregate entries → triggers, mood series, patterns (pure code)
  POST /api/companion  bounded empathetic reply, safety-gated
  DELETE /api/data     wipe all user data
  (static)             serves built React app from client/dist

Firestore: users/{userId}/entries/{entryId}
```

### Module Layout (Code-vs-AI Division)

| Module | Responsibility | AI? |
|---|---|---|
| `safety.ts` | Keyword crisis detection, crisis resources, grounding exercises, disclaimers | No — pure code, fully tested |
| `emotions.ts` | 24-word emotion taxonomy, mood scoring from emotions | No — pure code, fully tested |
| `trends.ts` | Mood averages, frequencies, direction, co-occurrence correlations | No — pure code, fully tested |
| `gemini.ts` | Gemini safety classify, entry analysis, companion chat | Yes — server-side only |
| `db.ts` | Firestore CRUD (save, fetch, delete entries) | No |
| `index.ts` | Express API routes, middleware, static serving | No |
| `shared/types.d.ts` | **Typed API contracts shared by client and server** (`Entry`, `DbEntry`, `AnalysisResult`, `TrendData`, …). Type-only, so it adds zero runtime weight; the client imports it via the `@shared` alias, the server via type-only imports. | No |
| `client/src/components/exercises/` | Reusable guided-exercise components (`BoxBreathing`, `Grounding54321`) — single source of truth used by the Today, Help/SOS, and Layout screens | No |

**Design principle:** All numbers, scores, trends, and the first-pass crisis check are computed in deterministic, testable code. Gemini does language understanding and empathetic prose generation only. Client and server share one set of TypeScript contracts (`/shared`) so the API surface stays type-safe end to end.

**Testing:** pure server modules (`safety`, `trends`, `emotions`) are unit-tested with Vitest; the React screens are covered by React Testing Library smoke tests (one per screen, plus crisis-card rendering, one-tap SOS reachability, and the guided-exercise flow). Run `npm test`.

---

## Google Services Used

| Service | Usage |
|---|---|
| **Google Antigravity** | Built the entire application in the Antigravity IDE |
| **Google Cloud Run** | Deployed as a single container serving both frontend and API |
| **Google Gemini** (gemini-2.5-flash) | Server-side journal analysis, safety classification, companion chat |
| **Google Cloud Firestore** | Persistent storage for anonymous user entries |

---

## Safety Design (Non-clinical, Vulnerable-user Domain)

MindEase is a **well-being companion, NOT a therapist, diagnostician, or crisis service.**

### Two-layer crisis detection
1. **Code layer** (`safety.ts`): regex-based keyword/pattern matching for suicidal ideation, self-harm, and severe distress indicators.
2. **Gemini layer**: AI safety classification returning `none`, `elevated`, or `crisis`.
3. **Combine rule**: `final = max(codeFlag, geminiFlag)` — crisis > elevated > none. Code-level crisis is **never downgraded** by the model.

### Crisis Mode behavior
- Suppresses normal coping tips and mindfulness exercises.
- Shows a calm crisis card with empathetic message, India helplines, and a grounding exercise.
- SOS button remains visible on every screen, independent of detection.

### India Crisis Helplines (verified, 24/7)
| Helpline | Number | Description |
|---|---|---|
| **Tele-MANAS** | 14416 (or 1-800-891-4416) | Government of India National Mental Health Helpline |
| **KIRAN** | 1800-599-0019 | Govt Mental Health Rehabilitation Helpline |
| **AASRA** | +91-9820466726 | Non-profit suicide prevention network |

### Additional safety measures
- Non-clinical disclaimer at onboarding and in persistent footer.
- Anti-rumination tone: validates feelings without amplifying distress.
- No engagement/dependency dark patterns.
- Delete-my-data action with double confirmation.

---

## Installable PWA with Offline Crisis Resources

MindEase is a Progressive Web App installable to a student's home screen:
- **Service worker** precaches the app shell, crisis resources, and grounding exercises.
- **Offline capability**: Crisis helpline numbers and grounding exercises work offline. Quick logs work offline (saved to localStorage). AI analysis is paused with a gentle banner.
- **Manifest** with proper icons for installability.

---

## Privacy

- **Anonymous IDs only** — no login, no accounts, no personal information collected.
- **No third-party analytics** or trackers.
- **Delete my data** action wipes all localStorage and Firestore records.
- Optional **local-only mode** keeps all data on the device; text is sent to the server only temporarily for AI analysis.
- Cookie stores only a random UUID for session continuity.

---

## Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/sovereignstack/mentalwellness.git
cd mentalwellness

# 2. Create server/.env
cp .env.example server/.env
# Edit server/.env and add your GEMINI_API_KEY

# 3. Install dependencies
npm install

# 4. Start development servers (frontend + backend)
npm run dev

# 5. Open http://localhost:5173 in your browser
```

### Build & Test

```bash
npm run build     # Build frontend + compile server
npm test          # Run all tests (Vitest)
npm run lint      # ESLint check
```

### Docker

```bash
docker build -t mindease .
docker run -p 8080:8080 -e GEMINI_API_KEY=your_key mindease
```

---

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript (strict) + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **AI:** Gemini 2.5 Flash via `@google/genai` (server-side only)
- **Database:** Cloud Firestore (Native mode) via Firebase Admin SDK
- **PWA:** `vite-plugin-pwa` (Workbox) for offline capability
- **Testing:** Vitest
- **Linting:** ESLint + Prettier
- **Deployment:** Google Cloud Run (multi-stage Docker build)
