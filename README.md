# Resume Tailor

> A Next.js web app that turns a structured **Master Profile** + a **Job Description** into a clean, ATS-friendly **Tailored Resume** you can download as DOCX and PDF.

Built as the term project for the **AI-Assisted Software Engineering** course. The deliverable is intentionally evaluated along two axes: a working web app *and* clear evidence of intentional AI orchestration across the entire SDLC. See `ai-orchestration.md` and `model-interaction-notes.md` for the AI-side story.

---

## 1. Problem statement

Generic AI resume rewriters hallucinate skills, certifications, and metrics — which fails the candidate at the human-review stage. Hand-tailoring a resume for every job is also slow.

Resume Tailor splits the problem cleanly:

1. **You** maintain a structured Master Profile of facts (jobs, projects, education, skills) once.
2. **The app** rewrites wording and reorders sections to match each job, using a deterministic engine + an optional LLM refinement pass.
3. **The app refuses** to add anything that isn't already in your profile. Missing requirements are surfaced as **honest gaps**, never inserted as fake skills.

## 2. Target users

- Students and early-career applicants tailoring their first resumes.
- Mid-career professionals applying across many roles each week.
- Anyone who refuses to lie on a resume but still wants the leverage of AI tailoring.

## 3. Main features

- **4-step wizard:** Master Profile → Job Description → Template → Preview & Export.
- **Structured Master Profile** with full sections for personal info, summary, education, experience, projects, skills (8 buckets), certifications, volunteer work, awards, and languages — each with full add / edit / remove support.
- **Three templates:** Classic ATS, Modern Clean, Technical / Engineer.
- **Deterministic tailoring engine** that ranks experience and projects by JD relevance, reorders skills, and rewrites the summary using only profile-sourced facts.
- **Optional LLM refinement** via `OPENAI_API_KEY` — wrapped in a structural sanitization pass that drops any LLM-suggested fact not present in the source profile.
- **Honest gap panel** in the preview surfacing JD requirements not in the profile.
- **DOCX export** via `docx`, **PDF export** via `jspdf` — both client-side, both produce real, editable files.
- **Empty sections are omitted** from the resume entirely.
- **Works fully without an OpenAI key** — the deterministic engine produces a complete result.

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Required by the course brief; co-located API route. |
| Language | TypeScript (strict) | Type-safe contracts between forms, engine, and exporters. |
| Styling | Tailwind CSS | Fast, consistent, utility-first. |
| State | React `useState` + immutable updates | The brief explicitly asks for this. |
| Validation | Zod (API), local validators (UI) | Defensive at boundaries. |
| LLM | OpenAI `gpt-4o-mini` (default) | Cheap, JSON-mode capable. Optional. |
| DOCX | `docx` | Pure JS, runs in the browser via `Packer.toBlob`. |
| PDF | `jspdf` | Lightweight, browser-native PDF. |
| File saving | `file-saver` | Cross-browser blob download. |
| Tests | Vitest | Fast, ESM-native. |

## 5. Architecture summary

```
[Browser]
   │
   │  4-step wizard
   ▼
[ResumeTailorApp]                   src/components/resume/ResumeTailorApp.tsx
   │
   │  POST /api/tailor-resume       { profile, jobDescription, templateId }
   ▼
[Tailor Resume Route]               src/app/api/tailor-resume/route.ts
   │
   ├─► buildTailoredResume()        deterministic baseline (always runs)
   │
   ├─► OpenAI Chat Completions      optional LLM refinement
   │
   └─► sanitizeAgainstProfile()     filters out any LLM-suggested fact
                                    not present in the source profile

[Browser]
   │
   ├─► exportResumeToPdf()          jspdf, client-side
   └─► exportResumeToDocx()         docx, client-side
```

Full diagram + decisions live in `architecture.md`.

## 6. Run locally

```bash
git clone <this repo>
cd resume-tailor
npm install
cp .env.example .env.local        # optional; leave OPENAI_API_KEY blank to use deterministic tailoring
npm run dev                       # http://localhost:3000
```

Other scripts:

```bash
npm run build       # production build
npm run start       # serve production build
npm run lint        # next lint
npm run typecheck   # tsc --noEmit
npm test            # vitest run (no API key needed)
```

## 7. Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | No | If set, the API route asks the LLM to refine the deterministic baseline. If unset, the deterministic engine alone produces the resume. |
| `OPENAI_MODEL` | No | Defaults to `gpt-4o-mini`. |

## 8. AI tools & their roles

A multi-tool AI orchestration was used; full breakdown in `ai-orchestration.md`. Summary:

| Tool | Role in the SDLC |
|---|---|
| **ChatGPT (GPT-4)** | Initial planning, requirements brainstorming, persona drafting, README drafting. |
| **Claude (Sonnet)** | Primary code generation; large file generation; refactors; the orchestrator that produced this scaffold. |
| **Cursor (Claude/GPT-4)** | Inline edits, autocomplete during local iteration. |
| **Gemini** | Independent review of the prompt template and the sanitization pass; surfaced two over-claiming risks we then patched. |
| **OpenAI gpt-4o-mini** | The optional runtime LLM the deployed product calls. |

Why multiple tools: **division of labor + cross-checking**. ChatGPT for spec, Claude for big code, Gemini for adversarial review, Cursor for fast in-editor edits, and OpenAI's small model at runtime for cost.

## 9. Screenshots

Expected to live under `screenshots/`:

- `screenshots/final-product/` — landing page, each of the four wizard steps, downloaded DOCX preview, downloaded PDF preview.
- `screenshots/ai-prompts/` — screenshots of representative prompts in ChatGPT / Claude / Cursor / Gemini.
- `screenshots/development-iterations/` — before/after of at least three meaningful AI iterations (e.g. fabrication patch, prompt-injection patch, summary rewrite).

Add your captured PNGs here before submission.

## 10. Testing summary

- **Automated** (`npm test`): unit tests for `tailoring`, `validation`, and `formatters`.
- **Manual**: see `testing.md` for the full per-step test plan including prompt-injection attempts, empty optional sections, missing required fields, and download verification.

## 11. Engineering reflection

**What went well.** Splitting the data contract (Master Profile) from the tailoring contract (TailoredResume) made the no-fabrication guarantee provable in code, not just by prompting. The deterministic engine doubles as the LLM's safety net — anything the LLM tries to add that isn't in the profile is silently dropped by `sanitizeAgainstProfile`.

**What was hard.** The first version of the app accepted a pasted resume blob and let the LLM extract structure. That made the no-fabrication guarantee impossible to enforce — the LLM had license to "interpret" the blob and quietly add things. The refactor to a structured Master Profile is what made honest tailoring tractable.

**Where AI helped most.** Drafting the typed schema, scaffolding the section forms (10 forms with the same shape), and writing the docs.

**Where AI hurt.** The LLM repeatedly tried to invent skills and metrics during tailoring. Caught by the verification pass and codified in the prompt with the "do not invent" rules.

## 12. Limitations and future improvements

- The Master Profile lives only in the active browser session. Adding accounts + persisted profiles would require thinking carefully about resume PII (see `security.md`).
- The deterministic ranking is a heuristic — keyword overlap with stop-word filtering. A real ranker would use TF-IDF or BM25.
- The PDF exporter uses jsPDF's built-in fonts (Helvetica). Custom fonts would need embedding.
- The LLM client supports OpenAI only; provider abstraction is a future task.
