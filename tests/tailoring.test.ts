import { describe, it, expect } from "vitest";
import {
  extractKeywords,
  scoreTextAgainstKeywords,
  rankExperience,
  rankProjects,
  rankSkills,
  createTruthfulSummary,
  buildTailoredResume,
  sanitizeAgainstProfile,
} from "../src/lib/resume/tailoring";
import type { ResumeProfile, TailoredResume } from "../src/types/resume";

const FRONTEND_JD = `
Senior Frontend Engineer

We're hiring a Senior Frontend Engineer to lead our customer dashboard.

Required:
- 5+ years of TypeScript and React
- Experience with Next.js
- Strong testing practices (Jest, Playwright)

Preferred:
- GraphQL
- AWS

Responsibilities:
- Build customer-facing dashboards
- Improve front-end performance
- Mentor junior engineers
`;

const STRONG_PROFILE: ResumeProfile = {
  personal: {
    fullName: "Alex Morgan",
    email: "alex@example.com",
    phone: "+1 555 0140",
    location: "Seattle, WA",
    githubUrl: "github.com/alexmorgan",
    linkedinUrl: "linkedin.com/in/alexmorgan",
  },
  summary: { targetRole: "Senior Frontend Engineer", about: "Frontend engineer with 6 years of experience.", yearsOfExperience: "6" },
  education: [{
    id: "edu-1", institution: "UBC", degree: "B.Sc.", fieldOfStudy: "Computer Science",
    startDate: "2014", endDate: "2018", isCurrent: false,
  }],
  experience: [{
    id: "exp-1", jobTitle: "Senior Frontend Engineer", company: "Northwind Labs",
    startDate: "2022", endDate: "Present", isCurrent: true,
    bullets: [
      "Built customer-facing dashboards in Next.js used by 50k weekly users.",
      "Improved performance by 40% via code-splitting and caching.",
    ],
    technologies: ["TypeScript", "React", "Next.js"],
  }, {
    id: "exp-2", jobTitle: "Junior Backend Dev", company: "Old Co",
    startDate: "2018", endDate: "2020", isCurrent: false,
    bullets: ["Wrote internal Python tooling."],
  }],
  projects: [{
    id: "proj-1", name: "openDocs", description: "Open-source markdown documentation generator with built-in search.",
    technologies: ["TypeScript", "Vite"],
    bullets: ["Designed plugin architecture; shipped to npm with 2k weekly downloads."],
  }],
  skills: {
    programmingLanguages: ["TypeScript", "JavaScript", "Python"],
    frameworksLibraries: ["React", "Next.js", "Express"],
    toolsPlatforms: ["Git", "GitHub Actions"],
    databases: ["PostgreSQL", "Redis"],
    cloudDevOps: ["Docker"],
    cybersecurity: [],
    machineLearning: [],
    softSkills: ["Mentoring"],
  },
  certifications: [],
  volunteerWork: [],
  awards: [],
  languages: [],
};

const WEAK_PROFILE: ResumeProfile = {
  personal: {
    fullName: "Pat Backend",
    email: "pat@example.com",
    phone: "",
    location: "",
    githubUrl: "",
    linkedinUrl: "",
  },
  summary: { about: "Backend developer.", targetRole: "", yearsOfExperience: "" },
  education: [{
    id: "edu-1", institution: "State University", degree: "B.A.", fieldOfStudy: "History",
    startDate: "2010", endDate: "2014", isCurrent: false,
  }],
  experience: [{
    id: "exp-1", jobTitle: "Python Developer", company: "Co",
    startDate: "2020", endDate: "2022", isCurrent: false,
    bullets: ["Wrote Django views."],
  }],
  projects: [],
  skills: {
    programmingLanguages: ["Python"],
    frameworksLibraries: ["Django"],
    toolsPlatforms: [],
    databases: ["PostgreSQL"],
    cloudDevOps: [],
    softSkills: [],
  },
  certifications: [],
  volunteerWork: [],
  awards: [],
  languages: [],
};

describe("Keyword extraction", () => {
  it("pulls technical keywords from the JD", () => {
    const kws = extractKeywords(FRONTEND_JD);
    expect(kws).toEqual(expect.arrayContaining(["typescript", "react", "next.js"]));
  });

  it("filters out stop words", () => {
    const kws = extractKeywords(FRONTEND_JD);
    expect(kws).not.toContain("the");
    expect(kws).not.toContain("with");
  });

  it("returns an empty list for empty input", () => {
    expect(extractKeywords("")).toEqual([]);
  });
});

describe("Text scoring", () => {
  it("returns 1 when all keywords appear", () => {
    const score = scoreTextAgainstKeywords("react typescript nextjs", ["react", "typescript", "nextjs"]);
    expect(score).toBeGreaterThanOrEqual(0.99);
  });

  it("returns 0 when none appear", () => {
    expect(scoreTextAgainstKeywords("python django flask", ["react", "next.js"])).toBe(0);
  });
});

describe("Ranking", () => {
  it("ranks frontend experience above unrelated experience for a frontend JD", () => {
    const kws = extractKeywords(FRONTEND_JD);
    const ranked = rankExperience(STRONG_PROFILE.experience, kws);
    expect(ranked[0].id).toBe("exp-1");
  });

  it("ranks projects with matching tech first", () => {
    const kws = extractKeywords(FRONTEND_JD);
    const ranked = rankProjects(STRONG_PROFILE.projects, kws);
    expect(ranked[0].id).toBe("proj-1");
  });

  it("reorders skills inside each bucket so JD-matched ones come first", () => {
    const kws = extractKeywords(FRONTEND_JD);
    const tailored = rankSkills(STRONG_PROFILE.skills, kws);
    expect(tailored.programmingLanguages[0].toLowerCase()).toBe("typescript");
    expect(tailored.frameworksLibraries[0].toLowerCase()).toMatch(/react|next/);
  });
});

describe("Honest summary", () => {
  it("never invents facts not in the profile", () => {
    const kws = extractKeywords(FRONTEND_JD);
    const summary = createTruthfulSummary(STRONG_PROFILE, kws, FRONTEND_JD);
    // The profile says "6 years" — summary may include it. It must NOT mention 10 years or
    // an employer the profile doesn't list.
    expect(summary).not.toMatch(/10 years|FAANG|Google|Meta/i);
  });

  it("includes the target role when provided", () => {
    const kws = extractKeywords(FRONTEND_JD);
    const summary = createTruthfulSummary(STRONG_PROFILE, kws, FRONTEND_JD);
    expect(summary.toLowerCase()).toMatch(/senior frontend engineer/);
  });
});

describe("Build + sanitize", () => {
  it("produces a tailored resume that surfaces missing skills as gaps", () => {
    const resume = buildTailoredResume(WEAK_PROFILE, FRONTEND_JD, "classic-ats");
    // Profile has no React / Next.js / TypeScript — they must appear as missing.
    expect(resume.skills.missingFromProfile).toEqual(
      expect.arrayContaining(["typescript", "react", "next.js"]),
    );
    // And they must NOT appear inside any of the actual skill buckets.
    const allSkills = [
      ...resume.skills.programmingLanguages,
      ...resume.skills.frameworksLibraries,
    ].map((s) => s.toLowerCase());
    expect(allSkills).not.toContain("typescript");
    expect(allSkills).not.toContain("react");
  });

  it("sanitizeAgainstProfile drops experience entries the LLM invents", () => {
    const baseline = buildTailoredResume(WEAK_PROFILE, FRONTEND_JD, "classic-ats");
    const malicious: Partial<TailoredResume> = {
      experience: [
        ...WEAK_PROFILE.experience.map((e) => ({ ...e, bullets: e.bullets })),
        {
          id: "INVENTED-1",
          jobTitle: "Senior Frontend Engineer",
          company: "Google",
          startDate: "2020",
          endDate: "Present",
          isCurrent: true,
          bullets: ["Led a 10-person frontend team."],
        },
      ],
      skills: {
        ...baseline.skills,
        frameworksLibraries: ["React", "Next.js"], // not in source profile
      },
    };
    const sanitized = sanitizeAgainstProfile(malicious, WEAK_PROFILE, "classic-ats", baseline);
    expect(sanitized.experience.find((e) => e.id === "INVENTED-1")).toBeUndefined();
    expect(sanitized.experience.every((e) => WEAK_PROFILE.experience.some((s) => s.id === e.id))).toBe(true);
    // React / Next.js not in source — should be dropped from frameworks.
    expect(sanitized.skills.frameworksLibraries.map((s) => s.toLowerCase())).not.toContain("react");
    expect(sanitized.skills.frameworksLibraries.map((s) => s.toLowerCase())).not.toContain("next.js");
  });

  it("hides empty optional sections from the tailored output", () => {
    const resume = buildTailoredResume(WEAK_PROFILE, FRONTEND_JD, "classic-ats");
    expect(resume.certifications).toEqual([]);
    expect(resume.volunteerWork).toEqual([]);
    expect(resume.awards).toEqual([]);
    expect(resume.languages).toEqual([]);
  });
});
