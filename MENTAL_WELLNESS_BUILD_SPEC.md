# Build Spec — "MindEase" (Mental Wellness Tracker)

PromptWars submission spec. Build inside Antigravity, deploy to Google Cloud Run, push to a public GitHub repo (single branch, < 10 MB). Read `GEMINI.md` / `AGENT_BUILD_RULES.md` first. **Safety is the top priority alongside problem-statement alignment** — this is a vulnerable-user domain.

**Problem statement:** _Build a GenAI solution that helps students monitor and improve their mental well-being during high-stakes board/entrance exams (NEET, JEE, CUET, CAT, GATE, UPSC). Analyze open-ended daily journaling and mood logs to uncover hidden stress triggers and emotional patterns standard trackers miss; provide hyper-personalized, contextual support (coping strategies, adaptive mindfulness, motivation) while safely acting as an empathetic, always-available companion._

---

## Scoring strategy — how this wins (read first)

Goal: top of the leaderboard. The evaluator scores fixed dimensions; here is where the points are and how this build targets each. Optimize in this order.

- **Problem-statement alignment (High, gating).** Every feature maps 1:1 to a brief phrase (§1), and the README leads with that mapping table. Exam-specific framing (mock tests, results, parental pressure) is alignment most generic apps can't show. _Win move:_ make the mapping table the first thing in the README, and make sure each listed feature actually works in the live build.
- **Safe & responsible implementation (High — scored as "Security" here).** This is a vulnerable-user domain; safety is both ethics and points. Two-layer crisis detection, always-visible one-tap SOS, grounding + India helplines (precached so they work offline), non-clinical disclaimers, privacy-first design. _Win move:_ demonstrate the crisis flow visibly; a reviewer should see it work.
- **Code Quality (High — and the dimension we scored lowest on last round, 86).** This is the single biggest opportunity. See §10 for concrete standards: strict TypeScript, small pure modules with clear boundaries (`safety.ts`, `trends.ts`, `emotions.ts`), ESLint + Prettier configured and clean, no dead code, consistent naming, errors handled, a short architecture note in the README. _Win move:_ treat code quality as a first-class deliverable, not cleanup — budget a dedicated pass (milestone 8).
- **Testing (Medium).** High coverage on the pure logic (safety detection, trends/correlations, emotion taxonomy) — these are deterministic and cheap to cover well. _Win move:_ aim for near-100% on pure modules; include crisis-phrase fixtures.
- **Efficiency (Medium).** Minimal Gemini calls (quick-log skips AI entirely), cached trends, small bundle, PWA precache.
- **Accessibility (Low, but needed for a perfect score).** Calm low-stimulation UI, semantic HTML, keyboard nav, AA+ contrast, screen-reader-friendly mood meter, reduced-motion.
- **Correct use of Google services.** Antigravity (built-with), Cloud Run (deploy), Gemini (analysis/companion), Firestore (persistence) — name them in the README.

Completeness beats ambition: a polished build where every mapped feature works, the crisis flow is visible, and the code is clean will outscore a larger half-finished one.

**Two-stage evaluation — build for both audiences.** Stage 1 is an automated AI engine that drives the leaderboard and checks three things: (a) it compiles and the **live link loads**, (b) it **solves this specific challenge** (not something tangential), (c) the **code is logical and modular**. Stage 2 is a human jury (the Top-50 gate) that interacts with the **live demo** to test functional polish, UX, and edge cases. Both reward the same core build qualities below:

- **Zero-friction live preview (make-or-break for human judges).** The deployed app must be instantly usable the second the link is clicked: fast first load, no errors in console, **no login/auth wall to see the core experience** (we already use anonymous IDs — keep it that way), no broken links, no CORS errors. The first screen must show something meaningful immediately (e.g. the mood-meter and a friendly prompt), never a cold blank state. A slow or broken link tanks the score regardless of code quality.
- **Edge-case handling is explicitly judged.** Handle gracefully: empty states (no entries yet), very long journal text, gibberish/empty input, offline, and Gemini/Firestore failure — never a crash, blank screen, or spinner that hangs. Always show a sensible fallback.
- **No feature bloat.** The AI evaluator rewards strict adherence to the problem statement. Do not add anything outside §1 (no auth, no social feed, no extras). A perfectly executed core always outscores a bloated, buggy app. When in doubt, cut scope and polish what's mapped.

---

## 0. Safety charter (High Impact — implement as code guarantees, not just prompts)

MindEase is a **well-being companion, not a therapist, diagnostician, or crisis line.** These are hard requirements, scored under "safe and responsible implementation":

- **Disclaimer** at onboarding and in a persistent footer: not a substitute for professional help; if in crisis, contact a professional or helpline.
- **Crisis detection runs on every entry and companion message, BEFORE normal processing**, via two layers: (1) a code keyword/pattern matcher, (2) a Gemini safety classification. If either flags risk → enter Crisis Mode.
- **Crisis Mode:** suppress coping-tip/mindfulness flow; respond with brief, warm, non-judgmental care; surface India resources prominently: **Tele-MANAS 14416 (or 1-800-891-4416), KIRAN 1800-599-0019, AASRA +91-9820466726**; encourage contacting a trusted person/professional. Never give methods, never minimize, never diagnose. (Verify these numbers are current at build time and cite in README.)
- **Anti-rumination tone:** validate feelings without amplifying; do not mirror back distress in a way that deepens it; gently steer toward grounding, perspective, and support. Avoid toxic positivity.
- **No dependency/engagement dark patterns:** encourage breaks, real-world connection, sleep. Never "keep talking to me."
- **Privacy:** journals are sensitive. Anonymous ID, no login, no third-party analytics/trackers, no data sharing. Plain-language privacy note. A working **Delete my data** action.
- Keep a single `safety.ts` module owning the keyword layer, crisis copy, and resource list — testable and auditable.

---

## 1. Concept & brief → feature mapping (alignment — High Impact)

A calm daily companion: the student logs mood and journals freely; Gemini reads the open text, reflects empathetically, names likely stressors, and offers one tailored coping strategy + one short mindfulness exercise fitted to their exam context. Over time, a Trends view surfaces hidden patterns. Reproduce this table in the README:

| Brief phrase                          | Feature                                                                                                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monitor well-being                    | Mood-meter emotion log (~24 words across energy×pleasantness quadrants) + context tags, with a 2-tap quick-log path, plus an optional open-ended journal — stored privately per user. |
| Analyze open-ended journaling         | Gemini reads each entry → empathetic reflection + detected themes + likely stressors (structured JSON).                                                                               |
| Uncover hidden triggers & patterns    | Trends view computed in code from history: emotion/trigger frequencies, mood-over-time, and correlations (e.g. low-mood days clustering with mock tests / poor sleep).                |
| Hyper-personalized contextual support | One coping strategy + one mindfulness exercise selected for the entry's detected state and the student's exam/timeline.                                                               |
| Empathetic always-available companion | A bounded follow-up reflection turn after each entry.                                                                                                                                 |
| Safely                                | Continuous crisis detection + always-visible one-tap SOS (helplines + grounding exercise), non-clinical disclaimers, anti-rumination guardrails (§0).                                 |

**Chosen vertical (state in README):** students in high-stakes Indian exam preparation.

---

## 2. Tech stack & architecture

One container = one Cloud Run service.

- **Frontend:** React + Vite + TypeScript (strict), Tailwind. Calm, low-stimulation visual design (soft palette, generous spacing, minimal motion).
- **PWA:** installable on phone + offline-capable via `vite-plugin-pwa` (Workbox). See §2a — the offline scope has a real safety benefit (crisis resources work offline).
- **Backend:** Node.js + Express + TypeScript, serving static frontend + `/api/*`.
- **AI:** Gemini (current Flash model) via `@google/genai`, **server-side only**.
- **Persistence:** Cloud Firestore (Native mode) via Firebase Admin SDK. **Note:** because journals are sensitive, a privacy-forward alternative is client-only storage (IndexedDB) with nothing leaving the device except the text sent for analysis. Default to Firestore for the demo's persistence/Google-services credit, but document the choice and offer delete. State the tradeoff in README.
- **User:** no login; anonymous `userId` (UUID) in a cookie.

```
React SPA ──fetch /api/* (userId cookie)──▶ Express (Cloud Run container)
  POST /api/entry      safety pre-check (code+Gemini) → analyze (Gemini) → save → reflection+themes+support
  GET  /api/trends     aggregate entries → triggers, mood series, patterns (pure code)
  POST /api/companion  bounded empathetic reply, safety-gated
  DELETE /api/data     wipe user's data
  (static) serves built React app
Firestore: users/{userId}/entries/{entryId}

Pure code (no AI): safety keyword layer, mood scoring, trend/correlation computation.
```

**Design rule:** trends, correlations, and the first-pass crisis check are computed in code — explainable and unit-testable. Gemini does language understanding and empathetic prose. This also concentrates testable logic where Code Quality/Testing are scored.

## 2a. PWA & offline (installable phone app — with a safety benefit)

Make the app a Progressive Web App so a student can install it to their home screen and open it like a native app. Cloud Run serves HTTPS by default (satisfies the PWA secure-context requirement), and `vite-plugin-pwa` generates the service worker + manifest with minimal effort — low cost, real polish and functionality points.

- **Tooling:** `vite-plugin-pwa` (Workbox), `registerType: 'autoUpdate'`, prompt to refresh on new version so users aren't stuck on a stale shell.
- **Manifest:** `name` "MindEase", short_name "MindEase", `display: standalone`, `start_url: "/"`, calm `theme_color`/`background_color`, icons 192 + 512 + maskable 512, `apple-touch-icon` for iOS.
- **Offline scope (meaningful, not decorative):**
  - **Crisis resources + grounding/breathing exercises are precached and fully available offline.** This is a safety win — a student in distress with poor connectivity can still reach helpline numbers and a grounding exercise. The SOS button works offline.
  - Past entries and the Trends view work offline from the local cache.
  - **Quick-log works offline** (saved locally; syncs when back online).
  - AI analysis (journal reflection) and the companion reply require network — when offline, show a gentle banner and offer quick-log + grounding instead; disable the analyze/companion actions with a tooltip.
- **Caching strategy:** precache the app shell + the static safety/grounding content; NetworkFirst (short timeout) for `GET /api/*`; never cache `POST` analysis calls.
- **Install prompt:** capture `beforeinstallprompt` → subtle "Install app" button (hidden once installed/unsupported); on iOS Safari show an "Add to Home Screen via Share" hint.
- **Verify with Lighthouse:** pass installability (manifest, service worker, HTTPS, icons).

---

## 3. Data model

```ts
type MoodTag =
  | 'exam_pressure'
  | 'mock_test'
  | 'results'
  | 'parents'
  | 'comparison'
  | 'sleep'
  | 'focus'
  | 'self_doubt'
  | 'time_management'
  | 'health'
  | 'other';

// Curated emotion "mood meter" (~24 words) grouped by quadrant of
// energy (high/low) × pleasantness (pleasant/unpleasant). Lets a student
// name what they feel — better than a bare 1–5 scale, and richer signal for analysis.
type EmotionQuadrant = 'high_unpleasant' | 'high_pleasant' | 'low_unpleasant' | 'low_pleasant';
type Emotion = { word: string; quadrant: EmotionQuadrant };
// e.g. high_unpleasant: anxious, overwhelmed, panicked, frustrated, restless, pressured
//      low_unpleasant:  drained, hopeless, lonely, defeated, foggy, numb
//      low_pleasant:    calm, relieved, content, rested, grateful, at ease
//      high_pleasant:   motivated, hopeful, focused, confident, excited, proud

type Entry = {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mood: 1 | 2 | 3 | 4 | 5; // quick scalar (derived from emotion quadrant or picked directly)
  emotions: string[]; // chosen mood-meter words
  tags: MoodTag[]; // user-selected context
  journal: string; // open-ended text (OPTIONAL — quick-log entries may omit it)
  quickLog: boolean; // true if logged without a journal entry
  // AI-derived (only when journal present):
  themes: string[];
  detectedStressors: string[];
  reflection: string; // empathetic response shown to user
  copingStrategy: string;
  mindfulnessExercise: string;
  safetyFlag: 'none' | 'elevated' | 'crisis';
  createdAt: string;
};
```

**Two logging paths (reduce friction):** a **quick log** (pick emotion(s) + tags, ~2 taps, no writing) and a **full entry** (adds the journal → triggers AI analysis). Quick logs still feed Trends; only full entries call Gemini.

---

## 4. Safety module (`src/safety.ts`) — pure, fully tested

Modelled on the approach of established India-built wellbeing apps: continuous distress screening, one-tap SOS, grounding + helplines, and a clear "not a crisis service" stance.

- `screenText(text): 'none' | 'elevated' | 'crisis'` — keyword/pattern layer (broad, err toward caution; documented, not exhaustive). Covers explicit self-harm/suicidal phrasing → `crisis`; strong hopelessness/overwhelm → `elevated`. (Hopelessness/worthlessness is a key real-world distress signal — screen for it.)
- `CRISIS_RESOURCES` — the India helpline list (name, number, hours). Single source of truth used by UI + API.
- `GROUNDING_EXERCISES` — 2–3 short, vetted grounding/breathing scripts (e.g. 5-4-3-2-1 senses, box breathing) shown in Crisis Mode alongside helplines — not just phone numbers.
- `CRISIS_COPY` / `DISCLAIMER` — vetted, gentle copy. Disclaimer states plainly: not a crisis service, not a substitute for professional help.
- The API combines `screenText` with a Gemini safety classification; **if either says crisis → crisis.** Never downgrade a code-level crisis flag based on the model.
- **One-tap SOS** is always available from every screen (see §5), independent of detection — a user in distress must never have to navigate to find help.

---

## 5. Screens

Calm, uncluttered (soft palette, rounded cards, generous whitespace, minimal motion). A warm, optional companion character can soften the tone. **A visually distinct but non-alarming one-tap SOS button is fixed on every screen**, plus a disclaimer footer.

1. **Onboarding:** warm intro + **disclaimer**, a short context step (which exam, rough timeline, optional name/initial), and the **privacy note** (incl. optional local-only mode — see §2). No account.
2. **Today:** the **mood-meter** emotion selector (quadrant grid of ~24 words) + context tags. Two clear actions: **Quick log** (save mood+tags, done) or **Write more** (open the journal → AI analysis). After a full entry: the **empathetic reflection**, one **coping strategy**, one **mindfulness exercise**. Optional journaling prompt if the user wants a nudge. If `elevated`/`crisis`, the Crisis card replaces the normal support card.
3. **Trends:** mood line over time + a month color-grid; most-frequent emotions and triggers; plain-language, hedged pattern callouts computed in code (e.g. "Your lower-mood days often tag mock_test and sleep") — the "uncover hidden patterns" deliverable. Read-only, encouraging, non-clinical framing.
4. **Help / SOS (always one tap away):** crisis resources (tappable `tel:` links), grounding exercises, disclaimer, and **Delete my data**.

Optional: gentle, **non-pressuring** check-in reminders (off by default; never guilt-based, no punishing streaks).

---

## 6. Trends logic (pure code)

From the user's entries: average mood and trend; emotion-word frequency (by quadrant) and tag frequency (top stressors); **co-occurrence / correlation** of low mood (≤2) with tags and emotions to produce simple, hedged pattern statements ("often", never deterministic claims) — modelled on the "which factors affect your mood" correlation reports users value in established trackers. No diagnosis, no clinical language. All unit-tested.

---

## 7. Gemini integration — exact calls (server-side)

Always JSON-only where structured; parse defensively. The safety pre-check happens first.

### 7a. Analyze entry (`/api/entry`)

Step 1 (code): `screenText(journal)`.
Step 2 (Gemini safety classify) — cheap, strict:

```
Classify the following student journal text for immediate safety risk.
Return ONLY JSON: {"risk":"none"|"elevated"|"crisis"}.
"crisis" = any sign of self-harm, suicidal thoughts, or intent to harm.
"elevated" = severe hopelessness/overwhelm without explicit self-harm. Text: <journal>
```

Combine: `final = max(codeFlag, geminiFlag)` (crisis > elevated > none).

- If `crisis` or `elevated` → return Crisis/Support-with-resources response from `safety.ts`; still save the entry with the flag; DO NOT generate normal coping tips for `crisis`.
- Else Step 3 (Gemini analyze + support), ONE call:

```
You are a warm, supportive well-being companion for an Indian student preparing for <exam>.
You are NOT a therapist and must not diagnose or give medical advice.
Read the journal entry and respond with empathy, then help gently.
Validate feelings without amplifying distress; encourage healthy steps, rest, and real-world support.
Return ONLY JSON:
{ "reflection": <2-3 warm sentences acknowledging their feelings, no clichés, no toxic positivity>,
  "themes": [<short topic tags>],
  "detectedStressors": [<likely stressors evident in the text>],
  "copingStrategy": <ONE specific, practical, exam-context coping action>,
  "mindfulnessExercise": <ONE short exercise, <60 words, e.g. a breathing or grounding micro-practice> }
Mood the user self-reported: <mood>/5. Context tags: <tags>.
```

### 7b. Companion follow-up (`/api/companion`)

Re-run the safety pre-check on the user's message first (same combine rule). If safe, a bounded supportive reply:

```
Continue as the same warm, non-clinical companion. Keep it brief, validating, and gently
constructive. Do not diagnose, do not give medical advice, do not encourage dependence —
suggest real-world support and breaks where natural. User said: <message>
```

No Gemini call computes trends, scores, or resource lists — those are code.

---

## 8. Crisis flow (must work end-to-end; test it)

On any `elevated`/`crisis` flag, the UI shows a calm card: a short caring message (from `safety.ts`), a **grounding exercise** the user can do right now (e.g. 5-4-3-2-1 or box breathing), the India helplines (tappable `tel:` links), and a nudge to reach a trusted person. Normal coping/mindfulness UI is hidden for `crisis`. The **one-tap SOS** and disclaimer remain visible everywhere, independent of detection. Include test fixtures with sample phrases verifying detection, that grounding + resources render, and that coping tips are suppressed for `crisis`.

---

## 9. Testing (scored)

Vitest + RTL.

- **Safety (highest value):** `screenText` flags crisis/elevated/none on fixtures; combine rule never downgrades a code crisis; crisis response includes grounding + resources and omits coping tips; one-tap SOS reachable from every screen.
- **Trends logic:** mood averages/trend, emotion/tag frequency, correlation statements on sample data.
- **Logging paths:** quick-log saves without a journal and skips the Gemini call; full entry triggers analysis.
- **API routes** with mocked Gemini (including a mocked crisis classification).
- **Delete-data** removes all user entries.
- **One smoke test per screen**; crisis card renders on flagged entry.
- **PWA/offline:** manifest valid + service worker registers; crisis resources and grounding render offline; quick-log works offline; analyze/companion disabled with banner when offline.

Core pure modules (safety, trends) fully covered.

---

## 10. Non-functional

**Accessibility (inclusive design matters extra here):** semantic HTML; labelled inputs; keyboard-navigable; AA+ contrast; calm, minimal motion respecting `prefers-reduced-motion`; readable typography; screen-reader-friendly mood selector; crisis resources reachable by keyboard and screen reader.

**Security / responsible impl:** `GEMINI_API_KEY` from env/Secret Manager, never client/repo; validate + length-cap inputs server-side; rate limit `/api/entry` and `/api/companion`; Firestore rules scope each user to their own path; no third-party trackers/analytics; `.gitignore` (incl. `node_modules`, build output, `.env`) + `.env.example`.

**Efficiency:** quick-log entries make **zero** Gemini calls; full entries make at most two (safety classify + analyze), one for companion; cache trends; PWA precache for instant loads; small bundle to keep repo/runtime light.

**Code Quality (High Impact — our lowest dimension last round at 86; the biggest opportunity, treat as a first-class deliverable):**

- **Strict TypeScript** end to end (no `any`; typed API contracts shared between client and server).
- **Clear module boundaries:** pure logic isolated in `safety.ts`, `trends.ts`, `emotions.ts`; thin API handlers; small, focused, reusable UI components. Each pure module independently testable.
- **Small functions, single responsibility, descriptive names;** no dead code, no commented-out blocks, no unused deps.
- **ESLint + Prettier configured and passing** (commit the configs); `npm run lint` clean. Consider a pre-commit format check.
- **Consistent project structure** (e.g. `/client`, `/server`, `/shared`) and consistent import ordering.
- **Robust error handling:** every Gemini/Firestore call wrapped; graceful fallbacks; no unhandled rejections; defensive JSON parsing.
- **Meaningful comments where logic is non-obvious** (especially the safety layer); a short **Architecture** section in the README explaining the module layout and the code-vs-AI division of labour.
- Keep functions and files reasonably small; prefer composition over large components.

---

## 11. README (required sections + alignment)

Include, near the top: one-line description; **chosen vertical** (Indian high-stakes exam students); **approach and logic**; **how the solution works**; **assumptions made**; the **§1 brief→feature mapping table verbatim**; a short **Architecture** note (module layout + code-vs-AI split); Google services used (Antigravity/Cloud Run/Gemini/Firestore); the **safety design + cited, current helpline numbers**; a note that it's an **installable PWA with offline access to crisis resources**; privacy note; live Cloud Run URL + run-locally + install-to-home-screen steps.

---

## 12. Deployment & repo hygiene (Cloud Run + rules)

- Multi-stage `Dockerfile`; server listens on `process.env.PORT`.
- Deploy via Cloud Run MCP; pass GCP project ID; Windows → Command Prompt.
- Env: `GEMINI_API_KEY`; Firestore via runtime service account (ADC).
- **Repo rules:** public, single branch, **< 10 MB**. Before final push: `git count-objects -vH`, ensure `node_modules`/build output/assets are ignored, remove large files. **Max 3 attempts; only the final counts.**
- After deploy: open live URL fresh and **verify zero-friction** — loads fast, no console errors, no auth wall, first screen is immediately meaningful (not blank). Run full flow including a crisis-phrase test; test edge cases (empty state, very long input, gibberish, offline, simulated API failure); install to a phone home screen; confirm offline access to crisis resources + grounding + quick-log; run a Lighthouse PWA check; verify delete-data; fix anything broken before submitting.

---

## 13. Build sequence (milestones)

1. Scaffold Vite+React+TS + Express+TS in one repo; health route; Dockerfile; deploy a "hello" to Cloud Run to prove the pipeline; confirm repo public/single-branch.
2. `safety.ts` (keyword layer, resources, grounding scripts, copy) + `trends.ts` (frequencies + correlations) + emotion mood-meter taxonomy + full unit tests (no AI).
3. Onboarding: disclaimer + exam/context + privacy note (incl. optional local-only mode). Add the always-visible one-tap SOS shell.
4. Today screen: mood-meter selector + tags + Quick-log vs Write-more paths. `/api/entry`: safety pre-check (code + Gemini classify) + Gemini analyze; show reflection + coping + mindfulness; crisis card path with grounding.
5. Trends screen from pure logic (mood line, month grid, emotion/trigger frequencies, hedged correlations).
6. Companion follow-up (safety-gated) + Help/SOS screen (resources + grounding) + Delete-my-data + optional gentle reminders.
7. Safety review (test crisis phrases end-to-end; SOS reachable everywhere; coping suppressed in crisis), accessibility pass, security hardening, rate limiting, empty/loading/error states.
8. Add PWA (`vite-plugin-pwa`: manifest + icons incl. maskable, service worker precaching the app shell + crisis/grounding content, NetworkFirst for GET APIs, offline quick-log, install button + offline banner). Then code-quality cleanup: configure ESLint + Prettier (clean), enforce strict types, modularize, remove dead code, add the README architecture note — this was the weak dimension, give it a dedicated pass.
9. Full test suite green (incl. PWA/offline tests); README with all required sections + mapping table + architecture note + cited helplines.
10. Final deploy to Cloud Run; verify live (full flow + crisis test + SOS + offline crisis access + install-to-home-screen + Lighthouse PWA + delete-data); confirm repo public, single branch, < 10 MB; push. This is the final submission — strongest and safest version.

---

## 14. Out of scope

No accounts/auth beyond anonymous ID; no diagnosis or clinical features; no community/social feed; no wearables/integrations; no third-party analytics. A complete, polished, SAFE micro-app beats a bigger one — safety and code quality drive the score.
