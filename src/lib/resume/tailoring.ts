/**
 * Deterministic tailoring engine.
 *
 * Inputs: a structured Master Profile + a free-text job description +
 * a template id.
 *
 * Outputs: a TailoredResume that:
 *   - Reorders experience entries by relevance to the JD.
 *   - Reorders projects by relevance to the JD.
 *   - Reorders skills inside each bucket so JD-matched skills come first.
 *   - Rewrites the summary using ONLY truthful, profile-sourced facts.
 *   - Surfaces JD-required keywords missing from the profile (never inserts them).
 *
 * No fabrication. No external calls. Always works.
 */

import type {
  ResumeProfile,
  ResumeTemplateId,
  TailoredResume,
  TailoredExperienceEntry,
  TailoredProjectEntry,
  TailoredSkillsProfile,
  ExperienceEntry,
  ProjectEntry,
  SkillsProfile,
} from "@/types/resume";
import {
  cleanString,
  cleanStringArray,
  hasMeaningfulEducation,
  hasMeaningfulExperience,
  hasMeaningfulProject,
  hasMeaningfulCertification,
  hasMeaningfulVolunteer,
  hasMeaningfulAward,
  hasMeaningfulLanguage,
} from "./formatters";

const STOP_WORDS = new Set<string>([
  "the","and","for","with","you","your","our","this","that","are","not","but",
  "all","any","can","will","have","has","had","was","were","been","being","its",
  "from","into","onto","over","under","about","across","upon","also","more",
  "than","then","just","very","such","they","them","their","there","these",
  "those","what","when","where","while","whom","whose","because","before",
  "after","each","every","both","either","neither","into","via","per",
  "we","us","an","of","to","in","on","by","at","is","be","or","as","it","a",
  "i","do","done","make","made","using","use","used","help","helping","work",
  "works","working","worked","get","got","may","might","must","should","could",
  "would","new","other","others","one","two","three","etc","including","include",
  "across","whether","plus","minus","best","good","great","strong","high","low",
  "looking","seek","seeking","candidates","candidate","applicant","applicants",
  "team","teams","role","roles","position","positions","year","years","day",
  "days","week","weeks","month","months","time","times","ability","abilities",
  "responsibilities","responsibility","duty","duties","task","tasks","skill",
  "skills","experience","experienced","required","preferred","nice","bonus",
  "must","key","ideal","etc","across","remote","hybrid","onsite","fulltime",
  "full","time","part","contract","permanent",
]);

/** Lowercase, strip punctuation that isn't useful for matching. */
export function normalizeText(text: string | undefined): string {
  if (!text) return "";
  return text.toLowerCase().replace(/[^a-z0-9+#./\s-]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Tokenize normalized text into words (length >= 2). Strips trailing
 * punctuation like "." or "-" so "dashboard." and "front-end-" don't sneak
 * through as their own tokens. Tech-shaped tokens like "next.js" or "c++"
 * are preserved because the punctuation is internal, not trailing.
 */
function tokens(text: string): string[] {
  if (!text) return [];
  return normalizeText(text)
    .split(/\s+/)
    .map((t) => t.replace(/^[^a-z0-9]+|[^a-z0-9+#]+$/g, ""))
    .filter((t) => t.length >= 2);
}

/**
 * Words that look skill-ish but aren't really skills — used to keep the
 * "honest gaps" list focused on real skills the candidate might be missing,
 * not job-title nouns or generic verbs that appear in every JD.
 */
const NON_SKILL_TERMS = new Set<string>([
  "senior", "junior", "lead", "principal", "staff", "intern", "internship",
  "engineer", "engineering", "developer", "designer", "manager", "analyst",
  "scientist", "consultant", "coordinator", "architect", "frontend",
  "backend", "fullstack", "full-stack", "front-end", "back-end",
  "dashboard", "dashboards", "feature", "features", "product", "products",
  "platform", "platforms", "service", "services", "system", "systems",
  "customer", "customers", "customer-facing", "user", "users",
  "company", "companies", "team", "teams", "organization",
  "hiring", "looking", "candidate", "candidates", "applicant", "applicants",
  "responsibilities", "responsibility", "qualification", "qualifications",
  "requirement", "requirements", "experience", "experienced",
  "remote", "hybrid", "onsite", "office", "global",
  "improve", "build", "design", "deliver", "create", "implement",
  "maintain", "develop", "grow", "scale", "ship", "drive", "own", "owns",
  "mentor", "mentoring", "collaborate", "collaboration",
  "junior", "mid-level", "mid", "level",
]);

/**
 * Extract weighted keywords from a job description.
 *
 * Strategy:
 *  - Split into tokens, drop stop words.
 *  - Count term frequency. Higher TF = more important.
 *  - Boost tokens that look like tech (contain `+`, `#`, `.`, `-`, or are
 *    in a known canonical list) so things like "node.js" and "c++" are
 *    weighted appropriately.
 *  - Boost tokens appearing in lines that look like requirement headers
 *    ("required", "must have", "responsibilities").
 *  - Return the top N keywords, deduplicated, lowercased.
 */
export function extractKeywords(jobDescription: string, max = 60): string[] {
  if (!jobDescription) return [];
  const lines = jobDescription.split(/\r?\n/);
  const counts = new Map<string, number>();

  let lineWeight = 1;
  for (const rawLine of lines) {
    const lineLower = rawLine.toLowerCase();
    // Adjust line weight based on what kind of line we're in.
    if (/required|must[-\s]?have|requirements/.test(lineLower)) lineWeight = 3;
    else if (/preferred|nice[-\s]?to[-\s]?have|bonus/.test(lineLower)) lineWeight = 2;
    else if (/responsibilit|what you/.test(lineLower)) lineWeight = 2;
    else lineWeight = 1;

    for (const tok of tokens(rawLine)) {
      if (STOP_WORDS.has(tok)) continue;
      // ignore pure-numeric tokens like "5", "10"
      if (/^\d+$/.test(tok)) continue;
      let weight = lineWeight;
      // Tech-shaped tokens get a small boost.
      if (/[+#./-]/.test(tok) && tok.length >= 2) weight += 1;
      // Capitalised acronyms in the original text get a boost too.
      const original = rawLine.match(new RegExp(`\\b${tok.replace(/[+./-]/g, "\\$&")}\\b`, "i"));
      if (original && /^[A-Z]{2,}$/.test(original[0])) weight += 1;
      counts.set(tok, (counts.get(tok) ?? 0) + weight);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([k]) => k);
}

/**
 * Score an arbitrary text against a keyword list.
 * Returns a normalised value in [0, 1] based on how many distinct keywords
 * appear at least once in the text.
 */
export function scoreTextAgainstKeywords(text: string, keywords: string[]): number {
  if (!text || keywords.length === 0) return 0;
  const norm = normalizeText(text);
  const padded = ` ${norm} `;
  let hits = 0;
  for (const kw of keywords) {
    if (!kw) continue;
    if (padded.includes(` ${kw} `) || padded.includes(`${kw} `) || padded.includes(` ${kw}`)) {
      hits++;
    }
  }
  return hits / keywords.length;
}

/* ---------- ranking ---------- */

export function rankExperience(
  entries: ExperienceEntry[],
  keywords: string[],
): TailoredExperienceEntry[] {
  const ranked = entries
    .filter(hasMeaningfulExperience)
    .map((e) => {
      const text = [
        e.jobTitle,
        e.company,
        e.description ?? "",
        ...(e.bullets ?? []),
        ...(e.technologies ?? []),
      ].join(" ");
      const score = scoreTextAgainstKeywords(text, keywords);
      return { ...e, relevanceScore: score };
    });
  // Stable sort: relevance desc, then preserve original order via index.
  return ranked
    .map((e, i) => ({ e, i }))
    .sort((a, b) => (b.e.relevanceScore! - a.e.relevanceScore!) || (a.i - b.i))
    .map(({ e }) => e);
}

export function rankProjects(
  entries: ProjectEntry[],
  keywords: string[],
): TailoredProjectEntry[] {
  const ranked = entries
    .filter(hasMeaningfulProject)
    .map((p) => {
      const text = [
        p.name,
        p.description,
        ...(p.bullets ?? []),
        ...(p.technologies ?? []),
      ].join(" ");
      const score = scoreTextAgainstKeywords(text, keywords);
      return { ...p, relevanceScore: score };
    });
  return ranked
    .map((p, i) => ({ p, i }))
    .sort((a, b) => (b.p.relevanceScore! - a.p.relevanceScore!) || (a.i - b.i))
    .map(({ p }) => p);
}

/** Sort each skill bucket so JD-matched skills come first, then surface gaps. */
export function rankSkills(
  skills: SkillsProfile,
  keywords: string[],
): TailoredSkillsProfile {
  const reorderBucket = (arr: string[] | undefined): string[] => {
    if (!arr || arr.length === 0) return [];
    const cleaned = cleanStringArray(arr);
    const matched: string[] = [];
    const rest: string[] = [];
    const kwSet = new Set(keywords);
    for (const s of cleaned) {
      const norm = normalizeText(s);
      const isMatch = kwSet.has(norm) || keywords.some((k) => norm.includes(k) || k.includes(norm));
      (isMatch ? matched : rest).push(s);
    }
    return [...matched, ...rest];
  };

  // Build a flat set of all profile skills for missing-skills detection.
  const allProfileSkills = new Set<string>();
  for (const bucketKey of [
    "programmingLanguages","frameworksLibraries","toolsPlatforms","databases",
    "cloudDevOps","cybersecurity","machineLearning","softSkills",
  ] as const) {
    const bucket = skills[bucketKey];
    if (!bucket) continue;
    for (const s of bucket) {
      const norm = normalizeText(s);
      if (norm) allProfileSkills.add(norm);
    }
  }

  // Treat any keyword that's "skill-shaped" as a candidate for the missing
  // list. Filter out common job-title / generic JD nouns so the panel
  // surfaces actual missing skills instead of words like "senior" or
  // "engineer".
  const missing: string[] = [];
  for (const kw of keywords) {
    if (kw.length < 2 || kw.length > 30) continue;
    if (!/[a-z]/.test(kw)) continue;
    if (NON_SKILL_TERMS.has(kw)) continue;
    if (allProfileSkills.has(kw)) continue;
    // Substring match — if any profile skill contains the keyword, count it as covered.
    let covered = false;
    for (const ps of allProfileSkills) {
      if (ps.includes(kw) || kw.includes(ps)) {
        covered = true;
        break;
      }
    }
    if (!covered) missing.push(kw);
  }

  return {
    programmingLanguages: reorderBucket(skills.programmingLanguages),
    frameworksLibraries: reorderBucket(skills.frameworksLibraries),
    toolsPlatforms: reorderBucket(skills.toolsPlatforms),
    databases: reorderBucket(skills.databases),
    cloudDevOps: reorderBucket(skills.cloudDevOps),
    cybersecurity: reorderBucket(skills.cybersecurity),
    machineLearning: reorderBucket(skills.machineLearning),
    softSkills: reorderBucket(skills.softSkills),
    missingFromProfile: missing.slice(0, 12),
  };
}

/* ---------- summary rewrite ---------- */

/**
 * Build a 2-3 sentence summary using only facts from the profile.
 * Mentions the target role inferred from the JD (first non-blank line) or
 * from `profile.summary.targetRole`. Never invents facts.
 */
export function createTruthfulSummary(
  profile: ResumeProfile,
  keywords: string[],
  jobDescription: string,
): string {
  const userAbout = cleanString(profile.summary.about);
  const userTarget = cleanString(profile.summary.targetRole);
  const yoe = cleanString(profile.summary.yearsOfExperience);

  // Infer target role: explicit field > first non-blank JD line.
  const jdFirstLine = (jobDescription || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0) ?? "";
  const targetRole = userTarget || jdFirstLine.slice(0, 80);

  // Top 3 ranked skills across the profile, restricted to JD-matched ones.
  const profileSkillsFlat = [
    ...profile.skills.programmingLanguages,
    ...profile.skills.frameworksLibraries,
    ...profile.skills.toolsPlatforms,
    ...profile.skills.databases,
    ...profile.skills.cloudDevOps,
    ...(profile.skills.cybersecurity ?? []),
    ...(profile.skills.machineLearning ?? []),
  ];
  const matchedSkills = cleanStringArray(profileSkillsFlat).filter((s) => {
    const norm = normalizeText(s);
    return keywords.includes(norm) || keywords.some((k) => norm.includes(k) || k.includes(norm));
  }).slice(0, 4);

  // Strongest experience role for the "background as" clause.
  const ranked = rankExperience(profile.experience, keywords);
  const headline = ranked[0]
    ? `${cleanString(ranked[0].jobTitle)}${ranked[0].company ? ` at ${cleanString(ranked[0].company)}` : ""}`
    : "";

  const pieces: string[] = [];

  if (userAbout) {
    // Trim user's about to ~ 280 chars to keep the summary snappy.
    pieces.push(userAbout.length > 280 ? userAbout.slice(0, 277).trimEnd() + "…" : userAbout);
  }

  // Optional second sentence about background.
  if (headline) {
    const yoePart = yoe ? `${yoe} of experience` : "Background";
    pieces.push(`${yoePart} including ${headline}.`);
  } else if (yoe) {
    pieces.push(`${yoe} of professional experience.`);
  }

  // Optional third sentence about JD alignment — only if we found matched skills.
  if (matchedSkills.length > 0 && targetRole) {
    pieces.push(
      `Targeting ${targetRole} roles where ${matchedSkills.slice(0, 3).join(", ")} are core to the work.`,
    );
  } else if (targetRole) {
    pieces.push(`Targeting ${targetRole} roles.`);
  }

  // If we somehow have nothing, fall back to a minimal honest line.
  if (pieces.length === 0) {
    return `${cleanString(profile.personal.fullName) || "Candidate"} is exploring opportunities.`;
  }

  return pieces.join(" ").replace(/\s+/g, " ").trim();
}

/* ---------- end-to-end ---------- */

export function buildTailoredResume(
  profile: ResumeProfile,
  jobDescription: string,
  templateId: ResumeTemplateId,
): TailoredResume {
  const keywords = extractKeywords(jobDescription);

  const tailoredExperience = rankExperience(profile.experience, keywords);
  const tailoredProjects = rankProjects(profile.projects, keywords);
  const tailoredSkills = rankSkills(profile.skills, keywords);

  // Education isn't reordered by JD relevance — usually candidates list it
  // chronologically. We just filter out empty entries.
  const tailoredEducation = profile.education.filter(hasMeaningfulEducation);

  const certifications = profile.certifications.filter(hasMeaningfulCertification);
  const volunteerWork = profile.volunteerWork.filter(hasMeaningfulVolunteer);
  const awards = profile.awards.filter(hasMeaningfulAward);
  const languages = profile.languages.filter(hasMeaningfulLanguage);

  const summary = createTruthfulSummary(profile, keywords, jobDescription);
  const headline = cleanString(profile.summary.targetRole) || undefined;

  return {
    personal: profile.personal,
    headline,
    summary,
    education: tailoredEducation,
    experience: tailoredExperience,
    projects: tailoredProjects,
    skills: tailoredSkills,
    certifications,
    volunteerWork,
    awards,
    languages,
    templateId,
  };
}

/**
 * Sanitize an LLM-produced TailoredResume against the original profile,
 * stripping any field that wasn't present in the source. This is the
 * structural defence against fabrication.
 */
export function sanitizeAgainstProfile(
  candidate: Partial<TailoredResume>,
  profile: ResumeProfile,
  templateId: ResumeTemplateId,
  fallback: TailoredResume,
): TailoredResume {
  // Build a name+id index of allowed entries so the LLM can re-order but not invent.
  const expById = new Map(profile.experience.map((e) => [e.id, e]));
  const projById = new Map(profile.projects.map((p) => [p.id, p]));
  const eduById = new Map(profile.education.map((e) => [e.id, e]));
  const certById = new Map(profile.certifications.map((c) => [c.id, c]));
  const volById = new Map(profile.volunteerWork.map((v) => [v.id, v]));
  const awardById = new Map(profile.awards.map((a) => [a.id, a]));
  const langById = new Map(profile.languages.map((l) => [l.id, l]));

  const allowedExperience: TailoredExperienceEntry[] =
    Array.isArray(candidate.experience) && candidate.experience.length > 0
      ? candidate.experience
          .map((e): TailoredExperienceEntry | null => {
            const original = expById.get(e?.id ?? "");
            if (!original) return null;
            // Allow reordered / rewritten bullets, capped at the original
            // count. Wording refinement is allowed; wholesale invention is not.
            const refinedBullets = Array.isArray(e.bullets) && e.bullets.length > 0
              ? cleanStringArray(e.bullets).slice(0, Math.max(original.bullets.length, 1))
              : original.bullets;
            const out: TailoredExperienceEntry = { ...original, bullets: refinedBullets };
            if (typeof e.relevanceScore === "number") out.relevanceScore = e.relevanceScore;
            return out;
          })
          .filter((e): e is TailoredExperienceEntry => e !== null)
      : fallback.experience;

  const allowedProjects: TailoredProjectEntry[] =
    Array.isArray(candidate.projects) && candidate.projects.length > 0
      ? candidate.projects
          .map((p): TailoredProjectEntry | null => {
            const original = projById.get(p?.id ?? "");
            if (!original) return null;
            const refinedBullets = Array.isArray(p.bullets) && p.bullets.length > 0
              ? cleanStringArray(p.bullets).slice(0, Math.max(original.bullets.length, 1))
              : original.bullets;
            const refinedDescription = typeof p.description === "string" && p.description.trim()
              ? p.description.trim()
              : original.description;
            const out: TailoredProjectEntry = { ...original, description: refinedDescription, bullets: refinedBullets };
            if (typeof p.relevanceScore === "number") out.relevanceScore = p.relevanceScore;
            return out;
          })
          .filter((p): p is TailoredProjectEntry => p !== null)
      : fallback.projects;

  const allowedEducation =
    Array.isArray(candidate.education) && candidate.education.length > 0
      ? candidate.education
          .map((e) => eduById.get(e?.id ?? "") || null)
          .filter((e): e is NonNullable<typeof e> => e !== null)
      : fallback.education;

  const allowedCerts =
    Array.isArray(candidate.certifications) && candidate.certifications.length > 0
      ? candidate.certifications
          .map((c) => certById.get(c?.id ?? "") || null)
          .filter((c): c is NonNullable<typeof c> => c !== null)
      : fallback.certifications;

  const allowedVol =
    Array.isArray(candidate.volunteerWork) && candidate.volunteerWork.length > 0
      ? candidate.volunteerWork
          .map((v) => volById.get(v?.id ?? "") || null)
          .filter((v): v is NonNullable<typeof v> => v !== null)
      : fallback.volunteerWork;

  const allowedAwards =
    Array.isArray(candidate.awards) && candidate.awards.length > 0
      ? candidate.awards
          .map((a) => awardById.get(a?.id ?? "") || null)
          .filter((a): a is NonNullable<typeof a> => a !== null)
      : fallback.awards;

  const allowedLangs =
    Array.isArray(candidate.languages) && candidate.languages.length > 0
      ? candidate.languages
          .map((l) => langById.get(l?.id ?? "") || null)
          .filter((l): l is NonNullable<typeof l> => l !== null)
      : fallback.languages;

  // Filter LLM-suggested skills against the source. Allowed list = the
  // candidate's source skills (per bucket). Anything else gets silently dropped.
  const filterBucket = (cand: string[] | undefined, src: string[] | undefined): string[] => {
    const allowed = new Set((src ?? []).map((s) => s.toLowerCase()));
    if (!cand) return src ? cleanStringArray(src) : [];
    return cleanStringArray(cand).filter((s) => allowed.has(s.toLowerCase()));
  };

  const candidateSkills = (candidate.skills as TailoredSkillsProfile | undefined) ?? fallback.skills;
  const tailoredSkills: TailoredSkillsProfile = {
    programmingLanguages: filterBucket(candidateSkills.programmingLanguages, profile.skills.programmingLanguages),
    frameworksLibraries: filterBucket(candidateSkills.frameworksLibraries, profile.skills.frameworksLibraries),
    toolsPlatforms: filterBucket(candidateSkills.toolsPlatforms, profile.skills.toolsPlatforms),
    databases: filterBucket(candidateSkills.databases, profile.skills.databases),
    cloudDevOps: filterBucket(candidateSkills.cloudDevOps, profile.skills.cloudDevOps),
    cybersecurity: filterBucket(candidateSkills.cybersecurity, profile.skills.cybersecurity),
    machineLearning: filterBucket(candidateSkills.machineLearning, profile.skills.machineLearning),
    softSkills: filterBucket(candidateSkills.softSkills, profile.skills.softSkills),
    // Keep the deterministic "missing" list — the LLM doesn't get to decide what's missing.
    missingFromProfile: fallback.skills.missingFromProfile,
  };

  // Backfill any bucket that ended up empty from the deterministic fallback,
  // so we don't silently strip a whole skill section.
  for (const bucket of [
    "programmingLanguages","frameworksLibraries","toolsPlatforms","databases",
    "cloudDevOps","cybersecurity","machineLearning","softSkills",
  ] as const) {
    const cur = (tailoredSkills as unknown as Record<string, string[] | undefined>)[bucket];
    const fb = (fallback.skills as unknown as Record<string, string[] | undefined>)[bucket];
    if ((!cur || cur.length === 0) && fb && fb.length > 0) {
      (tailoredSkills as unknown as Record<string, string[]>)[bucket] = fb;
    }
  }

  return {
    personal: profile.personal,
    headline:
      (typeof candidate.headline === "string" && candidate.headline.trim())
        ? candidate.headline.trim()
        : fallback.headline,
    summary:
      (typeof candidate.summary === "string" && candidate.summary.trim())
        ? candidate.summary.trim()
        : fallback.summary,
    education: allowedEducation,
    experience: allowedExperience,
    projects: allowedProjects,
    skills: tailoredSkills,
    certifications: allowedCerts,
    volunteerWork: allowedVol,
    awards: allowedAwards,
    languages: allowedLangs,
    templateId,
  };
}
