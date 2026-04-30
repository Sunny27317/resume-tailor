/**
 * String / array / date helpers used by the form, tailoring engine,
 * preview, and exporters. All functions are pure and side-effect free.
 */

import type {
  PersonalInfo,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  CertificationEntry,
  VolunteerEntry,
  AwardEntry,
  LanguageEntry,
  SkillsProfile,
  TailoredSkillsProfile,
} from "@/types/resume";

/* ---------- string / array cleaning ---------- */

export function cleanString(input: string | undefined | null): string {
  return (input ?? "").toString().trim();
}

export function cleanStringArray(arr: ReadonlyArray<string | undefined | null> | undefined): string[] {
  if (!arr) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of arr) {
    const s = cleanString(raw);
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

/** "one\ntwo\n  three" -> ["one","two","three"] */
export function splitLinesToArray(text: string | undefined): string[] {
  if (!text) return [];
  return cleanStringArray(text.split(/\r?\n/));
}

/** "react, next.js\nvite,vitest" -> ["react","next.js","vite","vitest"] */
export function splitCommaOrLineSeparated(text: string | undefined): string[] {
  if (!text) return [];
  return cleanStringArray(text.split(/[,\n;]/));
}

/** Render an array back into the textarea form: one item per line. */
export function arrayToLines(arr: string[] | undefined): string {
  if (!arr || arr.length === 0) return "";
  return arr.join("\n");
}

/** Render an array back as a comma-separated single line. */
export function arrayToCommaList(arr: string[] | undefined): string {
  if (!arr || arr.length === 0) return "";
  return arr.join(", ");
}

/* ---------- date formatting ---------- */

export function formatDateRange(
  startDate: string | undefined,
  endDate: string | undefined,
  isCurrent: boolean | undefined,
): string {
  const start = cleanString(startDate);
  const end = isCurrent ? "Present" : cleanString(endDate);
  if (start && end) return `${start} – ${end}`;
  if (start) return start;
  if (end) return end;
  return "";
}

/* ---------- contact line ---------- */

export function formatContactLine(personal: PersonalInfo): string {
  const bits = [
    personal.email,
    personal.phone,
    personal.location,
    personal.linkedinUrl,
    personal.githubUrl,
    personal.portfolioUrl,
  ]
    .map(cleanString)
    .filter(Boolean);
  return bits.join("  •  ");
}

/* ---------- "is this entry meaningful enough to render" predicates ---------- */

export function hasMeaningfulEducation(entry: EducationEntry): boolean {
  return Boolean(cleanString(entry.institution) || cleanString(entry.degree));
}

export function hasMeaningfulExperience(entry: ExperienceEntry): boolean {
  return Boolean(cleanString(entry.jobTitle) || cleanString(entry.company));
}

export function hasMeaningfulProject(entry: ProjectEntry): boolean {
  return Boolean(cleanString(entry.name) && (cleanString(entry.description) || (entry.bullets && entry.bullets.length > 0)));
}

export function hasMeaningfulCertification(entry: CertificationEntry): boolean {
  return Boolean(cleanString(entry.name));
}

export function hasMeaningfulVolunteer(entry: VolunteerEntry): boolean {
  return Boolean(cleanString(entry.role) || cleanString(entry.organization));
}

export function hasMeaningfulAward(entry: AwardEntry): boolean {
  return Boolean(cleanString(entry.title));
}

export function hasMeaningfulLanguage(entry: LanguageEntry): boolean {
  return Boolean(cleanString(entry.language));
}

/* ---------- skills helpers ---------- */

export const SKILL_BUCKETS = [
  { key: "programmingLanguages", label: "Programming languages" },
  { key: "frameworksLibraries", label: "Frameworks & libraries" },
  { key: "toolsPlatforms", label: "Tools & platforms" },
  { key: "databases", label: "Databases" },
  { key: "cloudDevOps", label: "Cloud / DevOps" },
  { key: "cybersecurity", label: "Cybersecurity" },
  { key: "machineLearning", label: "Machine learning" },
  { key: "softSkills", label: "Soft skills" },
] as const;

export type SkillBucketKey = typeof SKILL_BUCKETS[number]["key"];

export function emptySkills(): SkillsProfile {
  return {
    programmingLanguages: [],
    frameworksLibraries: [],
    toolsPlatforms: [],
    databases: [],
    cloudDevOps: [],
    cybersecurity: [],
    machineLearning: [],
    softSkills: [],
  };
}

export function tailoredSkillsHasContent(skills: TailoredSkillsProfile): boolean {
  const indexed = skills as unknown as Record<string, string[] | undefined>;
  return SKILL_BUCKETS.some((b) => {
    const arr = indexed[b.key];
    return Array.isArray(arr) && arr.length > 0;
  });
}

/* ---------- filename safety ---------- */

export function safeFilename(personal: PersonalInfo, ext: string): string {
  const first = cleanString(personal.fullName).split(/\s+/)[0] || "Resume";
  const last = cleanString(personal.fullName).split(/\s+/).slice(1).join("_") || "Tailored";
  const base = `${first}_${last}_Tailored_Resume`.replace(/[^A-Za-z0-9_-]+/g, "_");
  return `${base}.${ext.replace(/^\./, "")}`;
}
