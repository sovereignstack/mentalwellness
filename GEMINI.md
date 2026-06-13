# Project Agent Instructions — MindEase (PromptWars: Mental Wellness Tracker)

> Save in repo root as **`GEMINI.md`** (Antigravity) or **`AGENTS.md`** (portable) — identical content. Standing context the agent re-reads every task. Companion: `MENTAL_WELLNESS_BUILD_SPEC.md` (full spec, exact Gemini prompts, safety logic). Follow this file; consult the spec for detail.

## What we're building

MindEase: a GenAI well-being companion for Indian students preparing for high-stakes exams (NEET, JEE, CUET, CAT, GATE, UPSC). The student journals freely and logs mood; Gemini analyzes the open-ended text to surface hidden stress triggers and emotional patterns standard trackers miss, and responds as an empathetic companion with tailored, practical coping strategies and short mindfulness exercises.

Brief: _Build a GenAI solution that helps students monitor and improve mental well-being during high-stakes board/entrance exams — analyzing open-ended daily journaling and mood logs to uncover hidden stress triggers and emotional patterns, providing hyper-personalized, contextual support (coping strategies, adaptive mindfulness, motivation) while safely acting as an empathetic, always-available companion._

## SAFETY FIRST — non-negotiable, High Impact (read before anything)

This is a vulnerable-user, sensitive-health domain. Safety is both an ethical duty and a scored dimension ("safe and responsible implementation").

- This is a **well-being companion, NOT a therapist, diagnostician, or crisis service.** Never diagnose, never give clinical/medical advice, never imply it replaces professional help. Show this disclaimer at onboarding and in an always-visible footer.
- **Crisis detection is mandatory, plus an always-visible one-tap SOS.** If journal/chat text signals self-harm, suicidal ideation, or severe distress, the app must immediately and gently surface India crisis resources (e.g. Tele-MANAS 14416 / 1-800-891-4416; KIRAN 1800-599-0019; AASRA +91-9820466726) AND a short grounding exercise (e.g. 5-4-3-2-1 / box breathing), and encourage reaching a trusted person or professional. Detection runs in code on a keyword/pattern layer AND via a Gemini safety classification — never rely on the model alone; if either flags crisis, it's crisis. When crisis is detected, suppress normal "coping tip" flow and lead with care + grounding + resources. A one-tap SOS button is fixed on every screen, independent of detection.
- **Never reinforce negative spirals.** The companion validates feelings without amplifying them, avoids reflective listening that deepens rumination, and gently redirects toward support and grounding. No toxic positivity either.
- **No engagement-maximizing dark patterns.** Do not encourage dependence or "keep talking to me" loops. Encourage real-world connection and breaks.
- **Privacy is paramount.** Journals are sensitive personal data. Anonymous user ID only, no login, no third-party analytics, no sharing. Make a clear, plain-language privacy note. Let users delete their data.
- Crisis resources, disclaimers, and detection are implemented as code-level guarantees, not just prompt instructions.

## Why it's built this way (scoring rubric — optimize for this)

**Primary objective: win the leaderboard.** Build for the highest score; completeness of mapped, working features beats ambition. Evaluator scores these; tiers from the brief guide focus:

1. **Problem-statement alignment** — gating/High Impact. Every feature maps to a brief phrase; README leads with the mapping table; each mapped feature must actually work in the live build. Exam-specific framing is alignment generic apps lack.
2. **Correct use of Google services** — Antigravity (build), Cloud Run (deploy), Gemini (analysis/companion), Firestore (persistence). Name them in the README.
3. **Code Quality** — High Impact AND our weakest dimension last round (86): the single biggest opportunity. Treat as a first-class deliverable, not cleanup. Strict TypeScript (no `any`), small pure modules (`safety.ts`, `trends.ts`, `emotions.ts`) with clear boundaries, ESLint + Prettier configured and clean, robust error handling, no dead code, consistent naming, a short README architecture note. Budget a dedicated pass.
4. **Security** — High Impact; here it means safe/responsible implementation (see SAFETY) + standard hardening. Make the crisis flow visibly demonstrable.
5. **Testing** — near-100% coverage on pure modules (safety, trends, emotions); crisis-phrase fixtures.
6. **Efficiency** (quick-log skips AI; cache; PWA precache) · 7. **Accessibility** (calm UI, semantic, keyboard, AA+, reduced-motion) — needed for a perfect score.

**Two-stage evaluation — build for both.** Stage 1 (automated, drives leaderboard) checks: compiles + **live link loads**, solves **this specific** challenge, code is **modular**. Stage 2 (human jury, Top-50 gate) interacts with the **live demo** for polish, UX, and edge cases. Two non-negotiables that follow:

- **Zero-friction live preview** (make-or-break for judges): instantly usable on first click — fast load, no console errors, **no login/auth wall** (keep anonymous IDs), no broken/CORS errors; first screen meaningful immediately (mood-meter + prompt), never a cold blank state.
- **Edge cases are judged:** handle empty state, very long input, gibberish/empty input, offline, and Gemini/Firestore failure gracefully — never a crash, blank, or hung spinner.
- **No feature bloat:** strict adherence to §1 of the spec; nothing extra (no auth, no social). Cut scope and polish the core.

## Submission rules (hard constraints)

- **Max 3 attempts; only the FINAL submission counts.** Make the final build the strongest, most complete, safest version.
- Repo must be **public**, **< 10 MB**, **single branch**. No large assets/binaries; keep `node_modules` git-ignored; no committed build output.
- Deploy to **Google Cloud Run only**; live URL is a required, evaluated artifact.
- Commit and push regularly to the single branch; clean history.
- All Gemini calls **server-side**; API key never in the client bundle or repo.
- **All numbers/derived signals computed in code where possible**; Gemini does language understanding + empathetic prose, not silent scoring of risk on its own.

## Brief → feature mapping (reproduce verbatim in README.md)

| Brief phrase                              | Feature                                                                                                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monitor well-being                        | Mood-meter emotion log (~24 words, energy×pleasantness) + tags, 2-tap quick-log path, plus optional open-ended journal; stored privately.            |
| Analyze open-ended journaling             | Gemini reads each entry and returns themes, detected stressors, and an empathetic reflection.                                                        |
| Uncover hidden stress triggers & patterns | Trends view: recurring triggers, mood-over-time, correlations (e.g. "low mood clusters before mock tests") computed in code from tagged entries.     |
| Hyper-personalized contextual support     | Tailored coping strategy + a short mindfulness exercise chosen for the entry's detected state and the user's exam context.                           |
| Empathetic always-available companion     | Supportive chat/reflection turn after each entry, within strict safety bounds.                                                                       |
| Safely                                    | Continuous crisis detection + always-visible one-tap SOS (helplines + grounding), non-clinical disclaimers, anti-rumination guardrails (see SAFETY). |

## Tech stack & conventions

- One container = one Cloud Run service. Express serves the built Vite frontend as static files + `/api/*`.
- Frontend: React + Vite + TypeScript (strict), Tailwind.
- **PWA:** installable on phone + offline-capable via `vite-plugin-pwa` (Workbox). Offline scope has a safety benefit — crisis resources + grounding exercises are precached and work offline; quick-log works offline; AI analysis needs network (gentle banner when offline). See spec §2a.
- AI: Gemini (current Flash model) via `@google/genai`, server-side only.
- Persistence: Cloud Firestore (Native mode) via Firebase Admin SDK. Fallback if blocked: client-side IndexedDB/`localStorage` keyed by anonymous ID (note tradeoff in README; for sensitive data this fallback may even be preferable — see spec).
- User: no login; anonymous `userId` (UUID) in a cookie.
- Strict TypeScript, ESLint + Prettier clean. Keep all pure logic (mood scoring, trend/correlation computation, crisis keyword layer, emotion taxonomy) in standalone, fully tested modules — this is where Code Quality points live.

## Architecture

```
React SPA ──fetch /api/* (userId cookie)──▶ Express (Cloud Run container)
  POST /api/entry      crisis pre-check (code) → Gemini analyze → save → return reflection+themes
  GET  /api/trends     aggregate entries: triggers, mood series, patterns (code)
  POST /api/companion  bounded empathetic reply to a follow-up message (safety-gated)
  DELETE /api/data     wipe the user's data
  (static) serves built React app
Firestore: users/{userId}/entries/{entryId}
```

Crisis pre-check ALWAYS runs (code keyword/pattern + Gemini classification) before any normal response. Exact prompts, schemas, and the crisis flow are in the spec §7–§8.

## Screens

Onboarding (disclaimer + exam/context + privacy note, optional local-only mode) → Today (mood-meter emotion picker + tags; Quick-log OR Write-more → journal → reflection + one coping tip + one mindfulness exercise) → Trends (emotion/trigger frequencies, mood chart, hedged correlations) → always-visible one-tap SOS/Help (helplines + grounding) + Delete-my-data. Calm, low-stimulation UI; optional non-pressuring reminders (off by default). Installable PWA; crisis resources + grounding + quick-log work offline.

## Definition of done (self-check before any final deploy)

- SAFETY: disclaimer shown; one-tap SOS reachable on every screen; crisis detection works (test with sample phrases) and surfaces grounding + India helplines; coping tips suppressed in crisis; no diagnosis; anti-rumination tone; delete-data works; privacy note present.
- Every brief requirement maps to a working, tested feature; README has the mapping table, chosen vertical, approach/logic, how it works, and assumptions.
- Built in Antigravity; deployed to Cloud Run; live URL works in a fresh session.
- **Zero-friction preview:** loads fast, no console errors, no auth wall, first screen immediately meaningful (not blank); edge cases handled (empty state, very long/gibberish input, offline, API failure) — no crashes or hung spinners.
- Gemini server-side for analysis + companion; no key in client/repo.
- Firestore (or documented fallback) working; delete-data path verified.
- Repo public, single branch, < 10 MB, node_modules ignored, no secrets, `.env.example` present.
- Tests green — crisis-detection layer, mood scoring, trend/correlation logic fully covered; one smoke test per screen; PWA/offline tests (crisis resources + grounding render offline, quick-log works offline).
- Code Quality pass: strict types (no `any`), ESLint + Prettier clean, modular pure modules, robust error handling, no dead code, key modules commented, README architecture note (extra attention — weakest area last time).
- PWA: installable (manifest + service worker + icons), passes Lighthouse installability; crisis resources/grounding/quick-log usable offline; analyze/companion disabled with banner offline.
- Accessible: semantic HTML, labels, keyboard nav, AA contrast, calm motion (respects prefers-reduced-motion); inputs validated/length-capped server-side; rate limit on Gemini routes.
- This is the strongest, safest build (final submission that counts).

## Commands

```bash
npm install
npm run dev          # Vite frontend + Express API
npm test             # Vitest
npm run lint         # ESLint + Prettier check (keep clean — Code Quality is High Impact)
npm run build        # build frontend + compile server (PWA assets generated here)
docker build -t mindease .
# Deploy via Cloud Run MCP; pass GCP project ID. On Windows, execute via Command Prompt.
# Service env var: GEMINI_API_KEY. Firestore uses runtime service account (ADC).
# Check repo size before final push:  git count-objects -vH   and   du -sh .
```

## Build order

Scaffold + Dockerfile + prove Cloud Run deploy → crisis-detection module (keywords + grounding scripts + resources) + mood/trend (frequencies + correlations) + emotion mood-meter taxonomy + tests (no AI) → onboarding (disclaimer/context/privacy) + always-visible one-tap SOS shell → Today (mood-meter + tags + Quick-log/Write-more) + /api/entry (crisis pre-check + Gemini analyze) → reflection + coping tip + mindfulness + crisis card with grounding → Trends → companion (safety-gated) + Help/SOS + delete-data + optional gentle reminders → add PWA (manifest/icons/service worker, offline crisis + grounding + quick-log, install prompt) → code-quality pass (ESLint+Prettier, strict types, modularize, README architecture note) → tests + README → final Cloud Run deploy + GitHub push (public, one branch, <10MB).

## Out of scope (resist scope creep)

No accounts/auth beyond anonymous ID; no clinical features/diagnosis; no community/social feed; no wearables; no third-party analytics. A complete, polished, SAFE micro-app beats a bigger one — and safety + code quality drive the score.
