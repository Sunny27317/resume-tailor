/**
 * Validation for the Master Profile, the job description, and the
 * tailoring request. Returns a flat `Record<string, string>` of
 * field-keyed messages so the form can render inline errors.
 */

import type { ResumeProfile, ResumeTemplateId } from "@/types/resume";
import {
  cleanString,
  hasMeaningfulEducation,
  hasMeaningfulExperience,
  hasMeaningfulProject,
} from "./formatters";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  warnings: string[];
}

/* ---------- Profile (Step 1) ---------- */

export function validateProfile(profile: ResumeProfile): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  if (!cleanString(profile.personal.fullName)) {
    errors["personal.fullName"] = "Full name is required.";
  }
  const email = cleanString(profile.personal.email);
  if (!email) {
    errors["personal.email"] = "Email is required.";
  } else if (!EMAIL_RE.test(email)) {
    errors["personal.email"] = "Email doesn't look valid.";
  }

  // Per-entry shape checks for entries the user has actually started.
  profile.education.forEach((entry, i) => {
    const hasInstitution = !!cleanString(entry.institution);
    const hasDegree = !!cleanString(entry.degree);
    if (hasInstitution || hasDegree || cleanString(entry.fieldOfStudy)) {
      if (!hasInstitution) errors[`education.${i}.institution`] = "Institution is required.";
      if (!hasDegree) errors[`education.${i}.degree`] = "Degree is required.";
    }
  });

  profile.experience.forEach((entry, i) => {
    const hasCompany = !!cleanString(entry.company);
    const hasTitle = !!cleanString(entry.jobTitle);
    if (hasCompany || hasTitle || (entry.bullets && entry.bullets.length > 0)) {
      if (!hasCompany) errors[`experience.${i}.company`] = "Company is required.";
      if (!hasTitle) errors[`experience.${i}.jobTitle`] = "Job title is required.";
    }
  });

  profile.projects.forEach((entry, i) => {
    const hasName = !!cleanString(entry.name);
    const hasDesc = !!cleanString(entry.description);
    if (hasName || hasDesc || (entry.bullets && entry.bullets.length > 0)) {
      if (!hasName) errors[`projects.${i}.name`] = "Project name is required.";
      if (!hasDesc) errors[`projects.${i}.description`] = "Project description is required.";
    }
  });

  // At least one of: meaningful education, experience, or project entry.
  const meaningful =
    profile.education.some(hasMeaningfulEducation) ||
    profile.experience.some(hasMeaningfulExperience) ||
    profile.projects.some(hasMeaningfulProject);
  if (!meaningful) {
    errors["profile.content"] =
      "Add at least one Education, Experience, or Project entry before generating.";
  }

  if (!cleanString(profile.summary.about)) {
    warnings.push("A short About paragraph is recommended — it gives the tailoring engine more to work with.");
  }

  return { valid: Object.keys(errors).length === 0, errors, warnings };
}

/* ---------- Job description (Step 2) ---------- */

export function validateJobDescription(jd: string): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];
  const trimmed = cleanString(jd);
  if (!trimmed) {
    errors["jobDescription"] = "Paste a job description before continuing.";
  } else if (trimmed.length > 50_000) {
    errors["jobDescription"] = "Job description is too long (max 50,000 characters).";
  } else if (trimmed.length < 100) {
    warnings.push(
      "Short job description — tailoring quality is best when the JD is at least a few paragraphs.",
    );
  }
  return { valid: Object.keys(errors).length === 0, errors, warnings };
}

/* ---------- Template (Step 3) ---------- */

const VALID_TEMPLATES: ResumeTemplateId[] = ["classic-ats", "modern-clean", "technical-engineer"];

export function validateTemplate(templateId: ResumeTemplateId | string | undefined): ValidationResult {
  const errors: Record<string, string> = {};
  if (!templateId || !VALID_TEMPLATES.includes(templateId as ResumeTemplateId)) {
    errors["templateId"] = "Pick a template before generating.";
  }
  return { valid: Object.keys(errors).length === 0, errors, warnings: [] };
}

/* ---------- Combined (used by the API and Step 4) ---------- */

export function validateAll(
  profile: ResumeProfile,
  jd: string,
  templateId: ResumeTemplateId | string,
): ValidationResult {
  const a = validateProfile(profile);
  const b = validateJobDescription(jd);
  const c = validateTemplate(templateId);
  return {
    valid: a.valid && b.valid && c.valid,
    errors: { ...a.errors, ...b.errors, ...c.errors },
    warnings: [...a.warnings, ...b.warnings, ...c.warnings],
  };
}
