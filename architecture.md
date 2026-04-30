# Architecture

## 1. System architecture

Resume Tailor is a single-process Next.js application. Resumes are never persisted; the Master Profile lives only in the active browser session.

```
┌────────────────────────────────────────────────────────────┐
│                         Browser                            │
│                                                            │
│   /             →  Landing page                            │
│   /tailor       →  ResumeTailorApp (4-step wizard)         │
│                                                            │
│   Components (src/components/resume/):                     │
│     StepIndicator                                          │
│     ProfileForm                                            │
│       ├─ PersonalInfoForm                                  │
│       ├─ SummaryForm                                       │
│       ├─ ExperienceSection                                 │
│       ├─ EducationSection                                  │
│       ├─ ProjectsSection                                   │
│       ├─ SkillsSection                                     │
│       ├─ CertificationsSection                             │
│       ├─ VolunteerSection                                  │
│       ├─ AwardsSection                                     │
│       └─ LanguagesSection                                  │
│     JobDescriptionStep                                     │
│     TemplateSelector                                       │
│     ResumePreview (3 templates)                            │
│     DownloadButtons                                        │
│                                                            │
│   Client-side exporters (src/lib/resume/):                 │
│     exportResumeToPdf  (jspdf)                             │
│     exportResumeToDocx (docx)                              │
└──────────┬─────────────────────────────────────────────────┘
           │ POST { profile, jobDescription, templateId }
           ▼
┌──────────────────────────────────────────────────────────┐
│  /api/tailor-resume   (src/app/api/tailor-resume)        │
│                                                          │
│  zod validation                                          │
│  ↓                                                       │
│  buildTailoredResume()  ← deterministic baseline         │
│  ↓                                                       │
│  if OPENAI_API_KEY:                                      │
│     OpenAI Chat Completions (json_object mode)           │
│     → sanitizeAgainstProfile(candidate, profile, …)      │
│  else:                                                   │
│     return baseline                                      │
└──────────────────────────────────────────────────────────┘
```

## 2. Frontend structure

App Router under `src/app/`:

| Path | Purpose |
|---|---|
| `app/layout.tsx` | Global shell, header, footer, Tailwind import. |
| `app/page.tsx` | Landing page. |
| `app/tailor/page.tsx` | Wizard page — renders `<ResumeTailorApp />`. |
| `app/api/tailor-resume/route.ts` | Tailoring API (POST only). |

The 4-step wizard owns all state at `<ResumeTailorApp />`. Section components are stateless and accept `value` + `onChange` only — easier to reason about and trivially testable.

## 3. Backend / API structure

A single Route Handler, `runtime: "nodejs"`:

- `POST /api/tailor-resume` — validates with zod, runs `buildTailoredResume` as the deterministic baseline, optionally calls OpenAI to refine, and returns the sanitised result.

DOCX and PDF exports are intentionally **client-side**. There's no upload to the server, no persistence, and the exporter functions take a structured `TailoredResume` rather than re-parsing anything.

## 4. Data flow

```
  Master Profile ─┐
                  │
  Job Description ┼─► /api/tailor-resume ─► TailoredResume
                  │                         (with skills.missingFromProfile)
  Template ID    ─┘                          │
                                             ▼
                              UI renders ResumePreview + DownloadButtons
                                             │
                       User clicks "Download DOCX" or "Download PDF"
                                             │
                                             ▼
                  exportResumeToDocx(resume)   exportResumeToPdf(resume)
                  (docx + file-saver)          (jspdf + file-saver)
                                             │
                                             ▼
                                  Browser downloads the file
```

## 5. Main components & modules

### `src/types/resume.ts`
The canonical schema. `ResumeProfile` is the user's structured source of truth; `TailoredResume` is the engine's output. Both deliberately share most of their shape so a profile→tailored transformation is mostly reordering and summary rewriting, never invention.

### `src/lib/resume/defaultProfile.ts`
Empty-profile factory and per-entry constructors (`makeExperienceEntry`, etc.). All entries get a stable ID via `crypto.randomUUID()` with a non-cryptographic fallback.

### `src/lib/resume/formatters.ts`
Shared utilities used across forms, the engine, the preview, and the exporters: string/array cleaning, date range formatting, contact-line composition, "is this entry meaningful enough to render" predicates, skill-bucket metadata, safe filename generation.

### `src/lib/resume/validation.ts`
Profile / JD / template validators. Returns a flat `Record<string, string>` of field-keyed messages so the form can render inline errors.

### `src/lib/resume/tailoring.ts`
The deterministic tailoring engine:
- `extractKeywords(jd)` — TF-weighted keyword extraction with stop-word filtering and tech-token boosting.
- `scoreTextAgainstKeywords(text, keywords)` — normalised relevance score in [0, 1].
- `rankExperience` / `rankProjects` — stable sorts by relevance, falling back to original order on ties.
- `rankSkills` — reorders each bucket so JD-matched skills come first; produces `missingFromProfile` for honest gap reporting.
- `createTruthfulSummary` — generates a 2–3 sentence summary using only profile-sourced facts.
- `buildTailoredResume` — the end-to-end entrypoint.
- `sanitizeAgainstProfile` — the structural defence against LLM fabrication. Filters every LLM-suggested entry and skill against the original profile by ID and by skill bucket.

### `src/lib/resume/exportPdf.ts`
Client-side PDF via jsPDF. Tracks a y-cursor, paginates manually before content overflows, and applies template-specific typography (font, color, casing).

### `src/lib/resume/exportDocx.ts`
Client-side DOCX via the `docx` library's `Packer.toBlob()`. Same content traversal as the PDF exporter so the two formats stay visually consistent. Empty sections are skipped.

### `src/app/api/tailor-resume/route.ts`
The orchestrator. Always builds the deterministic baseline, optionally refines with OpenAI in JSON-output mode, sanitizes the LLM response, and returns a `TailorResumeResponse` containing the resume, the source ("openai" or "deterministic"), and any warnings.

### `src/components/resume/ResumeTailorApp.tsx`
Holds all wizard state. Step navigation gates on per-step validation. The `Generate` button calls the API and surfaces loading / success / error states.

## 6. Tailoring pipeline (deterministic)

1. **Extract keywords** from the JD with line-level weighting (lines under "Required" weigh 3×, "Preferred" weigh 2×, etc.).
2. **Rank experience entries** by relevance score (job title + bullets + technologies vs. keywords).
3. **Rank projects** the same way.
4. **Reorder skills** within each bucket — JD-matched first, then everything else.
5. **Identify missing skills** — JD keywords not present anywhere in the profile's skill buckets — surfaced as `skills.missingFromProfile` and rendered as the "honest gaps" panel.
6. **Rewrite the summary** in 2–3 sentences using profile facts: about-paragraph + headline experience + JD-aligned skills + target role.
7. **Filter out empty entries** (`hasMeaningfulExperience`, `hasMeaningfulProject`, etc.) so the resume never renders blank cards.

## 7. Tailoring pipeline (with LLM)

When `OPENAI_API_KEY` is set, the API additionally:
1. Sends the structured profile JSON, the JD, and the template ID to `gpt-4o-mini`.
2. Uses `response_format: { type: "json_object" }` and a system prompt declaring the data as untrusted with strict no-fabrication rules.
3. Parses the response. On any failure (network, parse, validation), falls back to the deterministic baseline with a warning.
4. **Sanitizes against the profile.** Every entry the LLM returns is matched by ID against the source profile — anything without a corresponding source entry is dropped. Every skill is filtered against the source bucket — anything not present is dropped. The "missing skills" list is taken from the deterministic engine, not the LLM, so the LLM cannot decide what counts as missing.

## 8. Export pipeline (DOCX / PDF)

```
TailoredResume ──┬─► exportResumeToDocx (docx → Packer.toBlob → file-saver)
                 │
                 └─► exportResumeToPdf  (jspdf → output('blob') → file-saver)
```

Both run **in the browser**. Files use the canonical headings (Summary, Skills, Experience, Projects, Education, Certifications, Volunteer, Awards, Languages) and skip any section that has no content.

Filenames are sanitized: `{First}_{Last}_Tailored_Resume.{pdf|docx}` with non-alphanumerics stripped.

## 9. Architecture decisions and trade-offs

| Decision | Alternative considered | Why we chose this |
|---|---|---|
| Structured Master Profile as source of truth | Free-text resume paste | Makes the no-fabrication guarantee enforceable in code, not just by prompting. |
| Always run deterministic engine; LLM is optional refinement | LLM-only | The deterministic engine is the safety net that lets us catch LLM fabrication. |
| Sanitize LLM output by ID against the profile | Trust the LLM with the prompt | Prompts are best-effort; ID-based filtering is enforced. |
| Client-side PDF/DOCX export | Server-side | No upload of resume content beyond what the user already pasted; simpler deployment. |
| `jspdf` for PDF | `@react-pdf/renderer` or Puppeteer | jsPDF is small, browser-native, and avoids the headless-Chromium operational pain. |
| `docx` for DOCX | Server-side rendering via Word automation | `docx` runs identically in browser and Node. |
| 4-step wizard | Single long form | Reduces cognitive load; per-step validation is much clearer. |
| Per-section forms with `value` + `onChange` only | Form library (react-hook-form, formik) | Lighter, no library learning curve, easier to test. |
| `runtime: "nodejs"` on the API route | Edge runtime | The OpenAI SDK depends on Node-specific behaviour. |
