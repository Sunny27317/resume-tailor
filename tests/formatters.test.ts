import { describe, it, expect } from "vitest";
import {
  cleanString,
  cleanStringArray,
  splitLinesToArray,
  splitCommaOrLineSeparated,
  arrayToLines,
  arrayToCommaList,
  formatDateRange,
  formatContactLine,
  hasMeaningfulEducation,
  hasMeaningfulExperience,
  hasMeaningfulProject,
  safeFilename,
} from "../src/lib/resume/formatters";

describe("string cleaning", () => {
  it("trims and falls back to empty", () => {
    expect(cleanString("  hi  ")).toBe("hi");
    expect(cleanString(undefined)).toBe("");
    expect(cleanString(null)).toBe("");
  });

  it("dedupes case-insensitively", () => {
    expect(cleanStringArray(["React", "react", " REACT ", ""])).toEqual(["React"]);
  });
});

describe("array splitters", () => {
  it("splits lines and trims", () => {
    expect(splitLinesToArray("a\nb\n  c  \n")).toEqual(["a", "b", "c"]);
  });

  it("splits commas and newlines", () => {
    expect(splitCommaOrLineSeparated("react, next.js\nnode")).toEqual(["react", "next.js", "node"]);
  });

  it("round-trips through arrayToLines / arrayToCommaList", () => {
    expect(arrayToLines(["a", "b"])).toBe("a\nb");
    expect(arrayToCommaList(["a", "b"])).toBe("a, b");
    expect(arrayToLines([])).toBe("");
    expect(arrayToCommaList(undefined)).toBe("");
  });
});

describe("date formatting", () => {
  it("uses Present when isCurrent", () => {
    expect(formatDateRange("Jan 2022", "Dec 2023", true)).toBe("Jan 2022 – Present");
  });

  it("returns the start alone when end is missing", () => {
    expect(formatDateRange("Jan 2022", "", false)).toBe("Jan 2022");
  });

  it("returns empty for fully empty input", () => {
    expect(formatDateRange("", "", false)).toBe("");
  });
});

describe("contact line", () => {
  it("joins non-empty bits with bullets", () => {
    const out = formatContactLine({
      fullName: "Jane",
      email: "j@x.z",
      phone: "555",
      location: "",
      githubUrl: "g/j",
      linkedinUrl: "",
    });
    expect(out).toBe("j@x.z  •  555  •  g/j");
  });

  it("returns empty when nothing to show", () => {
    expect(formatContactLine({ fullName: "X", email: "", phone: "", location: "", githubUrl: "", linkedinUrl: "" })).toBe("");
  });
});

describe("meaningful entry predicates", () => {
  it("detects meaningful entries", () => {
    expect(hasMeaningfulEducation({ id: "1", institution: "U", degree: "BSc", fieldOfStudy: "", startDate: "", endDate: "", isCurrent: false })).toBe(true);
    expect(hasMeaningfulEducation({ id: "1", institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", isCurrent: false })).toBe(false);
    expect(hasMeaningfulExperience({ id: "1", jobTitle: "Eng", company: "Co", startDate: "", endDate: "", isCurrent: false, bullets: [] })).toBe(true);
    expect(hasMeaningfulProject({ id: "1", name: "X", description: "Y", technologies: [], bullets: [] })).toBe(true);
    expect(hasMeaningfulProject({ id: "1", name: "X", description: "", technologies: [], bullets: [] })).toBe(false);
  });
});

describe("safeFilename", () => {
  it("produces a clean filename", () => {
    expect(safeFilename({ fullName: "Jane Doe", email: "", phone: "", location: "", githubUrl: "", linkedinUrl: "" }, "pdf"))
      .toBe("Jane_Doe_Tailored_Resume.pdf");
  });

  it("strips unsafe characters", () => {
    expect(safeFilename({ fullName: "<script>", email: "", phone: "", location: "", githubUrl: "", linkedinUrl: "" }, "docx"))
      .toMatch(/_Tailored_Resume\.docx$/);
  });
});
