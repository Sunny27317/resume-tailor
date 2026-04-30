import { describe, it, expect } from "vitest";
import {
  validateProfile,
  validateJobDescription,
  validateTemplate,
  validateAll,
} from "../src/lib/resume/validation";
import { defaultProfile } from "../src/lib/resume/defaultProfile";
import type { ResumeProfile } from "../src/types/resume";

function profileWithMinFields(): ResumeProfile {
  return {
    ...defaultProfile,
    personal: { ...defaultProfile.personal, fullName: "Jane Doe", email: "jane@example.com" },
    experience: [{
      id: "exp-1", jobTitle: "Engineer", company: "Acme",
      startDate: "2022", endDate: "Present", isCurrent: true, bullets: ["Did things."],
    }],
  };
}

describe("validateProfile", () => {
  it("requires full name and email", () => {
    const v = validateProfile(defaultProfile);
    expect(v.valid).toBe(false);
    expect(v.errors["personal.fullName"]).toBeDefined();
    expect(v.errors["personal.email"]).toBeDefined();
  });

  it("rejects an invalid email", () => {
    const p: ResumeProfile = { ...defaultProfile, personal: { ...defaultProfile.personal, fullName: "X", email: "not-an-email" } };
    const v = validateProfile(p);
    expect(v.errors["personal.email"]).toMatch(/valid/);
  });

  it("requires at least one meaningful entry", () => {
    const p: ResumeProfile = { ...defaultProfile, personal: { ...defaultProfile.personal, fullName: "X", email: "x@y.z" } };
    const v = validateProfile(p);
    expect(v.errors["profile.content"]).toBeDefined();
  });

  it("passes when minimum fields are present", () => {
    const v = validateProfile(profileWithMinFields());
    expect(v.valid).toBe(true);
  });

  it("flags experience entries that started but lack required fields", () => {
    const p = profileWithMinFields();
    p.experience.push({
      id: "exp-2", jobTitle: "", company: "", // started: had bullets typed
      startDate: "", endDate: "", isCurrent: false,
      bullets: ["typed something"],
    });
    const v = validateProfile(p);
    expect(v.errors["experience.1.company"]).toBeDefined();
    expect(v.errors["experience.1.jobTitle"]).toBeDefined();
  });
});

describe("validateJobDescription", () => {
  it("rejects empty JD", () => {
    expect(validateJobDescription("").valid).toBe(false);
  });

  it("warns on a short JD but still validates", () => {
    const v = validateJobDescription("short");
    expect(v.valid).toBe(true);
    expect(v.warnings.length).toBeGreaterThan(0);
  });

  it("rejects JDs over 50,000 chars", () => {
    const v = validateJobDescription("x".repeat(50_001));
    expect(v.valid).toBe(false);
  });
});

describe("validateTemplate", () => {
  it("accepts the three valid templates", () => {
    expect(validateTemplate("classic-ats").valid).toBe(true);
    expect(validateTemplate("modern-clean").valid).toBe(true);
    expect(validateTemplate("technical-engineer").valid).toBe(true);
  });

  it("rejects unknown templates", () => {
    expect(validateTemplate("invented-template").valid).toBe(false);
    expect(validateTemplate(undefined).valid).toBe(false);
  });
});

describe("validateAll", () => {
  it("passes with valid inputs end-to-end", () => {
    const v = validateAll(profileWithMinFields(), "x".repeat(200), "classic-ats");
    expect(v.valid).toBe(true);
  });
});
