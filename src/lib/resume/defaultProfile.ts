/**
 * Default empty Master Profile + factory helpers for new dynamic entries.
 *
 * Every dynamic entry needs a stable ID. We use `crypto.randomUUID()` when
 * available (Node 19+, all modern browsers) and a non-cryptographic fallback
 * otherwise. The IDs are only used as React keys and as relational handles
 * inside the form, so a fallback is fine.
 */

import type {
  ResumeProfile,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  CertificationEntry,
  VolunteerEntry,
  AwardEntry,
  LanguageEntry,
} from "@/types/resume";

export function makeId(): string {
  if (typeof globalThis !== "undefined") {
    const c: { randomUUID?: () => string } | undefined =
      (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto;
    if (c && typeof c.randomUUID === "function") {
      try {
        return c.randomUUID();
      } catch {
        /* fall through */
      }
    }
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const defaultProfile: ResumeProfile = {
  personal: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    githubUrl: "",
    linkedinUrl: "",
    portfolioUrl: "",
  },
  summary: {
    targetRole: "",
    about: "",
    yearsOfExperience: "",
  },
  education: [],
  experience: [],
  projects: [],
  skills: {
    programmingLanguages: [],
    frameworksLibraries: [],
    toolsPlatforms: [],
    databases: [],
    cloudDevOps: [],
    cybersecurity: [],
    machineLearning: [],
    softSkills: [],
  },
  certifications: [],
  volunteerWork: [],
  awards: [],
  languages: [],
};

export function makeEducationEntry(): EducationEntry {
  return {
    id: makeId(),
    institution: "",
    degree: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    location: "",
    grade: "",
    relevantCoursework: [],
    achievements: [],
  };
}

export function makeExperienceEntry(): ExperienceEntry {
  return {
    id: makeId(),
    jobTitle: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
    bullets: [],
    technologies: [],
  };
}

export function makeProjectEntry(): ProjectEntry {
  return {
    id: makeId(),
    name: "",
    description: "",
    technologies: [],
    githubUrl: "",
    demoUrl: "",
    bullets: [],
  };
}

export function makeCertificationEntry(): CertificationEntry {
  return {
    id: makeId(),
    name: "",
    issuer: "",
    dateEarned: "",
    credentialUrl: "",
  };
}

export function makeVolunteerEntry(): VolunteerEntry {
  return {
    id: makeId(),
    role: "",
    organization: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
    bullets: [],
  };
}

export function makeAwardEntry(): AwardEntry {
  return {
    id: makeId(),
    title: "",
    issuer: "",
    date: "",
    description: "",
  };
}

export function makeLanguageEntry(): LanguageEntry {
  return {
    id: makeId(),
    language: "",
    proficiency: "",
  };
}
