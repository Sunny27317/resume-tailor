/**
 * Client-side PDF exporter.
 *
 * Uses jsPDF to lay out a single-column ATS-friendly resume with the
 * selected template's typography. Handles page breaks by tracking the
 * current y-cursor and starting a new page before content overflows.
 */

import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";
import type { TailoredResume } from "@/types/resume";
import {
  cleanString,
  formatContactLine,
  formatDateRange,
  safeFilename,
  SKILL_BUCKETS,
  tailoredSkillsHasContent,
} from "./formatters";

interface TemplateStyle {
  /** Font family name passed to jsPDF (Helvetica, Times, Courier are built-in). */
  font: "helvetica" | "times" | "courier";
  /** Body font size in points. */
  bodyPt: number;
  /** Section heading font size in points. */
  headingPt: number;
  /** Name (top of resume) font size in points. */
  namePt: number;
  /** RGB color for headings. */
  headingColor: [number, number, number];
  /** Should section headings be uppercase. */
  uppercaseHeadings: boolean;
  /** Should headings have an underline rule beneath them. */
  underlineHeadings: boolean;
}

const TEMPLATE_STYLES: Record<TailoredResume["templateId"], TemplateStyle> = {
  "classic-ats": {
    font: "helvetica",
    bodyPt: 10.5,
    headingPt: 11,
    namePt: 18,
    headingColor: [0, 0, 0],
    uppercaseHeadings: true,
    underlineHeadings: true,
  },
  "modern-clean": {
    font: "helvetica",
    bodyPt: 10.5,
    headingPt: 12,
    namePt: 22,
    headingColor: [42, 85, 230], // brand-600
    uppercaseHeadings: false,
    underlineHeadings: true,
  },
  "technical-engineer": {
    font: "helvetica",
    bodyPt: 10,
    headingPt: 11,
    namePt: 18,
    headingColor: [15, 22, 38],
    uppercaseHeadings: true,
    underlineHeadings: true,
  },
};

const PAGE_W = 612; // US Letter width in points
const PAGE_H = 792; // US Letter height in points
const MARGIN_X = 48;
const MARGIN_TOP = 48;
const MARGIN_BOTTOM = 56;

export async function exportResumeToPdf(resume: TailoredResume): Promise<void> {
  const style = TEMPLATE_STYLES[resume.templateId];
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  doc.setFont(style.font, "normal");

  let cursorY = MARGIN_TOP;
  const lineHeightFor = (pt: number) => pt * 1.25;

  // --- helpers --------------------------------------------------------

  const ensureSpace = (needed: number) => {
    if (cursorY + needed > PAGE_H - MARGIN_BOTTOM) {
      doc.addPage();
      cursorY = MARGIN_TOP;
    }
  };

  const writeText = (
    text: string,
    opts: {
      x?: number;
      align?: "left" | "center" | "right";
      bold?: boolean;
      italic?: boolean;
      sizePt?: number;
      color?: [number, number, number];
      maxWidth?: number;
      indent?: number;
    } = {},
  ) => {
    if (!text) return;
    const sizePt = opts.sizePt ?? style.bodyPt;
    const lh = lineHeightFor(sizePt);
    const fontStyle = opts.bold && opts.italic ? "bolditalic" : opts.bold ? "bold" : opts.italic ? "italic" : "normal";
    doc.setFont(style.font, fontStyle);
    doc.setFontSize(sizePt);
    if (opts.color) doc.setTextColor(opts.color[0], opts.color[1], opts.color[2]);
    else doc.setTextColor(15, 22, 38);

    const indent = opts.indent ?? 0;
    const x = opts.align === "center" ? PAGE_W / 2 : opts.align === "right" ? PAGE_W - MARGIN_X : MARGIN_X + indent;
    const maxWidth = opts.maxWidth ?? (PAGE_W - MARGIN_X * 2 - indent);
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    for (const line of lines) {
      ensureSpace(lh);
      doc.text(line, x, cursorY, { align: opts.align ?? "left" });
      cursorY += lh;
    }
  };

  const writeBullet = (text: string) => {
    if (!text) return;
    const sizePt = style.bodyPt;
    const lh = lineHeightFor(sizePt);
    doc.setFont(style.font, "normal");
    doc.setFontSize(sizePt);
    doc.setTextColor(15, 22, 38);
    const indent = 16;
    const bulletX = MARGIN_X + 4;
    const textX = MARGIN_X + indent;
    const maxWidth = PAGE_W - MARGIN_X * 2 - indent;
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    for (let i = 0; i < lines.length; i++) {
      ensureSpace(lh);
      if (i === 0) doc.text("•", bulletX, cursorY);
      doc.text(lines[i], textX, cursorY);
      cursorY += lh;
    }
  };

  const writeHeading = (label: string) => {
    cursorY += 6;
    ensureSpace(lineHeightFor(style.headingPt) + 6);
    const text = style.uppercaseHeadings ? label.toUpperCase() : label;
    doc.setFont(style.font, "bold");
    doc.setFontSize(style.headingPt);
    doc.setTextColor(style.headingColor[0], style.headingColor[1], style.headingColor[2]);
    doc.text(text, MARGIN_X, cursorY);
    cursorY += lineHeightFor(style.headingPt) - 2;
    if (style.underlineHeadings) {
      doc.setDrawColor(199, 208, 221); // ink-200
      doc.setLineWidth(0.7);
      doc.line(MARGIN_X, cursorY, PAGE_W - MARGIN_X, cursorY);
      cursorY += 4;
    }
    doc.setTextColor(15, 22, 38);
  };

  // --- header ---------------------------------------------------------

  const name = cleanString(resume.personal.fullName) || "Candidate";
  writeText(name, { align: "center", bold: true, sizePt: style.namePt });
  if (resume.headline) {
    writeText(resume.headline, { align: "center", italic: true, sizePt: style.bodyPt + 0.5, color: [92, 106, 130] });
  }
  const contact = formatContactLine(resume.personal);
  if (contact) {
    writeText(contact, { align: "center", sizePt: style.bodyPt - 1, color: [92, 106, 130] });
  }

  // --- summary --------------------------------------------------------

  if (cleanString(resume.summary)) {
    writeHeading("Summary");
    writeText(resume.summary);
  }

  // --- skills ---------------------------------------------------------

  if (tailoredSkillsHasContent(resume.skills)) {
    writeHeading("Skills");
    for (const bucket of SKILL_BUCKETS) {
      const arr = (resume.skills as unknown as Record<string, string[] | undefined>)[bucket.key];
      if (!arr || arr.length === 0) continue;
      writeText(`${bucket.label}: ${arr.join(", ")}`);
    }
  }

  // --- experience -----------------------------------------------------

  if (resume.experience.length > 0) {
    writeHeading("Experience");
    for (const e of resume.experience) {
      const head = `${cleanString(e.jobTitle)}${e.company ? ` — ${cleanString(e.company)}` : ""}`;
      const meta = [formatDateRange(e.startDate, e.endDate, e.isCurrent), cleanString(e.location)]
        .filter(Boolean).join("  •  ");
      writeText(head, { bold: true });
      if (meta) writeText(meta, { italic: true, color: [92, 106, 130], sizePt: style.bodyPt - 0.5 });
      if (e.description) writeText(e.description);
      for (const b of e.bullets ?? []) writeBullet(b);
      if (e.technologies && e.technologies.length > 0) {
        writeText(`Tech: ${e.technologies.join(", ")}`, { italic: true, color: [92, 106, 130], sizePt: style.bodyPt - 0.5 });
      }
      cursorY += 4;
    }
  }

  // --- projects (technical-engineer template puts these earlier; we always show after experience for consistency) ---

  if (resume.projects.length > 0) {
    writeHeading("Projects");
    for (const p of resume.projects) {
      writeText(p.name, { bold: true });
      if (p.description) writeText(p.description);
      for (const b of p.bullets ?? []) writeBullet(b);
      if (p.technologies && p.technologies.length > 0) {
        writeText(`Tech: ${p.technologies.join(", ")}`, { italic: true, color: [92, 106, 130], sizePt: style.bodyPt - 0.5 });
      }
      const links = [p.githubUrl, p.demoUrl].map(cleanString).filter(Boolean);
      if (links.length > 0) {
        writeText(links.join("  •  "), { sizePt: style.bodyPt - 0.5, color: [42, 85, 230] });
      }
      cursorY += 4;
    }
  }

  // --- education ------------------------------------------------------

  if (resume.education.length > 0) {
    writeHeading("Education");
    for (const ed of resume.education) {
      const head = `${cleanString(ed.degree)}${ed.fieldOfStudy ? ` in ${cleanString(ed.fieldOfStudy)}` : ""}, ${cleanString(ed.institution)}`;
      const meta = [formatDateRange(ed.startDate, ed.endDate, ed.isCurrent), cleanString(ed.location), cleanString(ed.grade)]
        .filter(Boolean).join("  •  ");
      writeText(head, { bold: true });
      if (meta) writeText(meta, { italic: true, color: [92, 106, 130], sizePt: style.bodyPt - 0.5 });
      if (ed.relevantCoursework && ed.relevantCoursework.length > 0) {
        writeText(`Coursework: ${ed.relevantCoursework.join(", ")}`);
      }
      for (const a of ed.achievements ?? []) writeBullet(a);
      cursorY += 4;
    }
  }

  // --- certifications -------------------------------------------------

  if (resume.certifications.length > 0) {
    writeHeading("Certifications");
    for (const c of resume.certifications) {
      const parts = [cleanString(c.name), cleanString(c.issuer), cleanString(c.dateEarned)].filter(Boolean).join("  •  ");
      writeText(parts);
    }
  }

  // --- volunteer ------------------------------------------------------

  if (resume.volunteerWork.length > 0) {
    writeHeading("Volunteer");
    for (const v of resume.volunteerWork) {
      const head = `${cleanString(v.role)}${v.organization ? ` — ${cleanString(v.organization)}` : ""}`;
      const meta = formatDateRange(v.startDate, v.endDate, v.isCurrent);
      writeText(head, { bold: true });
      if (meta) writeText(meta, { italic: true, color: [92, 106, 130], sizePt: style.bodyPt - 0.5 });
      if (v.description) writeText(v.description);
      for (const b of v.bullets ?? []) writeBullet(b);
      cursorY += 4;
    }
  }

  // --- awards ---------------------------------------------------------

  if (resume.awards.length > 0) {
    writeHeading("Awards");
    for (const a of resume.awards) {
      const parts = [cleanString(a.title), cleanString(a.issuer), cleanString(a.date)].filter(Boolean).join("  •  ");
      writeText(parts, { bold: true });
      if (a.description) writeText(a.description);
    }
  }

  // --- languages ------------------------------------------------------

  if (resume.languages.length > 0) {
    writeHeading("Languages");
    const formatted = resume.languages
      .map((l) => `${cleanString(l.language)}${l.proficiency ? ` (${cleanString(l.proficiency)})` : ""}`)
      .filter(Boolean);
    if (formatted.length > 0) writeText(formatted.join("  •  "));
  }

  // --- save -----------------------------------------------------------

  const blob = doc.output("blob");
  saveAs(blob, safeFilename(resume.personal, "pdf"));
}
