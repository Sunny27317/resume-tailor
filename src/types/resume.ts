/**
 * Master Profile + Tailored Resume schema.
 *
 * The Master Profile is the user's structured source of truth. The Tailored
 * Resume is what comes back from the tailoring engine for a specific job.
 * The shapes are deliberately close so a profile→tailored transformation
 * is mostly reordering + summary rewriting, never invention.
 */

export type ResumeTemplateId = "classic-ats" | "modern-clean" | "technical-engineer";

/* ------------------------------------------------------------------ */
/* Master Profile                                                      */
/* ------------------------------------------------------------------ */

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl?: string;
}

export interface ProfileSummary {
  targetRole?: string;
  about: string;
  yearsOfExperience?: string;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  location?: string;
  grade?: string;
  relevantCoursework?: string[];
  achievements?: string[];
}

export interface ExperienceEntry {
  id: string;
  jobTitle: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description?: string;
  bullets: string[];
  technologies?: string[];
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  demoUrl?: string;
  bullets: string[];
}

export interface SkillsProfile {
  programmingLanguages: string[];
  frameworksLibraries: string[];
  toolsPlatforms: string[];
  databases: string[];
  cloudDevOps: string[];
  cybersecurity?: string[];
  machineLearning?: string[];
  softSkills: string[];
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  dateEarned?: string;
  credentialUrl?: string;
}

export interface VolunteerEntry {
  id: string;
  role: string;
  organization: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  bullets?: string[];
}

export interface AwardEntry {
  id: string;
  title: string;
  issuer?: string;
  date?: string;
  description?: string;
}

export interface LanguageEntry {
  id: string;
  language: string;
  proficiency: string;
}

export interface ResumeProfile {
  personal: PersonalInfo;
  summary: ProfileSummary;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: SkillsProfile;
  certifications: CertificationEntry[];
  volunteerWork: VolunteerEntry[];
  awards: AwardEntry[];
  languages: LanguageEntry[];
}

/* ------------------------------------------------------------------ */
/* Tailored Resume — what the tailoring engine returns                 */
/* ------------------------------------------------------------------ */

/**
 * Tailored entries mirror the source entries but may have re-ordered
 * arrays, refined wording, or trimmed-down bullet lists. Crucially, no
 * facts are introduced that aren't in the source profile.
 */
export interface TailoredEducationEntry extends EducationEntry {}

export interface TailoredExperienceEntry extends ExperienceEntry {
  /** A relevance score 0..1 used by the preview to optionally annotate the entry. */
  relevanceScore?: number;
}

export interface TailoredProjectEntry extends ProjectEntry {
  relevanceScore?: number;
}

/** Same buckets as SkillsProfile, but each array is ranked by relevance. */
export interface TailoredSkillsProfile {
  programmingLanguages: string[];
  frameworksLibraries: string[];
  toolsPlatforms: string[];
  databases: string[];
  cloudDevOps: string[];
  cybersecurity?: string[];
  machineLearning?: string[];
  softSkills: string[];
  /** Skills that the JD asked for but the profile doesn't contain. Surfaced honestly, never inserted. */
  missingFromProfile: string[];
}

export interface TailoredResume {
  personal: PersonalInfo;
  /** Optional one-line headline used by some templates above the summary. */
  headline?: string;
  summary: string;
  education: TailoredEducationEntry[];
  experience: TailoredExperienceEntry[];
  projects: TailoredProjectEntry[];
  skills: TailoredSkillsProfile;
  certifications: CertificationEntry[];
  volunteerWork: VolunteerEntry[];
  awards: AwardEntry[];
  languages: LanguageEntry[];
  templateId: ResumeTemplateId;
}

/* ------------------------------------------------------------------ */
/* API request / response                                              */
/* ------------------------------------------------------------------ */

export interface TailorResumeRequest {
  profile: ResumeProfile;
  jobDescription: string;
  templateId: ResumeTemplateId;
}

export interface TailorResumeResponse {
  resume: TailoredResume;
  source: "openai" | "deterministic";
  warnings: string[];
}
