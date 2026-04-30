/**
 * Client-side DOCX exporter built with the `docx` library.
 *
 * Produces a single-column, ATS-friendly Word document with canonical
 * headings: Summary, Skills, Experience, Projects, Education, Certifications,
 * Volunteer, Awards, Languages. Empty sections are omitted entirely.
 */

import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
} from "docx";
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

function heading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 80 },
  });
}

function bulletPara(text: string): Paragraph {
  return new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { after: 40 },
  });
}

function line(
  text: string,
  opts: { bold?: boolean; italics?: boolean; color?: string; size?: number } = {},
): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        italics: opts.italics,
        color: opts.color,
        size: opts.size,
      }),
    ],
    spacing: { after: 40 },
  });
}

export async function exportResumeToDocx(resume: TailoredResume): Promise<void> {
  const children: Paragraph[] = [];

  // Header --------------------------------------------------------------
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: cleanString(resume.personal.fullName) || "Candidate",
          bold: true,
          size: 32, // half-points → 16pt
        }),
      ],
    }),
  );

  if (resume.headline) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: cleanString(resume.headline), italics: true, size: 22, color: "5C6A82" }),
        ],
      }),
    );
  }

  const contact = formatContactLine(resume.personal);
  if (contact) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: contact, size: 20, color: "5C6A82" })],
        spacing: { after: 200 },
      }),
    );
  }

  // Summary -------------------------------------------------------------
  if (cleanString(resume.summary)) {
    children.push(heading("Summary"));
    children.push(line(resume.summary));
  }

  // Skills --------------------------------------------------------------
  if (tailoredSkillsHasContent(resume.skills)) {
    children.push(heading("Skills"));
    for (const bucket of SKILL_BUCKETS) {
      const arr = (resume.skills as unknown as Record<string, string[] | undefined>)[bucket.key];
      if (!arr || arr.length === 0) continue;
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: `${bucket.label}: `, bold: true }),
            new TextRun({ text: arr.join(", ") }),
          ],
        }),
      );
    }
  }

  // Experience ----------------------------------------------------------
  if (resume.experience.length > 0) {
    children.push(heading("Experience"));
    for (const e of resume.experience) {
      const head = `${cleanString(e.jobTitle)}${e.company ? ` — ${cleanString(e.company)}` : ""}`;
      const meta = [formatDateRange(e.startDate, e.endDate, e.isCurrent), cleanString(e.location)]
        .filter(Boolean).join("  •  ");
      children.push(line(head, { bold: true }));
      if (meta) children.push(line(meta, { italics: true, color: "5C6A82", size: 20 }));
      if (e.description) children.push(line(e.description));
      for (const b of e.bullets ?? []) children.push(bulletPara(b));
      if (e.technologies && e.technologies.length > 0) {
        children.push(line(`Tech: ${e.technologies.join(", ")}`, { italics: true, color: "5C6A82", size: 20 }));
      }
    }
  }

  // Projects ------------------------------------------------------------
  if (resume.projects.length > 0) {
    children.push(heading("Projects"));
    for (const p of resume.projects) {
      children.push(line(p.name, { bold: true }));
      if (p.description) children.push(line(p.description));
      for (const b of p.bullets ?? []) children.push(bulletPara(b));
      if (p.technologies && p.technologies.length > 0) {
        children.push(line(`Tech: ${p.technologies.join(", ")}`, { italics: true, color: "5C6A82", size: 20 }));
      }
      const links = [p.githubUrl, p.demoUrl].map(cleanString).filter(Boolean);
      if (links.length > 0) {
        children.push(line(links.join("  •  "), { color: "2A55E6", size: 20 }));
      }
    }
  }

  // Education -----------------------------------------------------------
  if (resume.education.length > 0) {
    children.push(heading("Education"));
    for (const ed of resume.education) {
      const head = `${cleanString(ed.degree)}${ed.fieldOfStudy ? ` in ${cleanString(ed.fieldOfStudy)}` : ""}, ${cleanString(ed.institution)}`;
      const meta = [formatDateRange(ed.startDate, ed.endDate, ed.isCurrent), cleanString(ed.location), cleanString(ed.grade)]
        .filter(Boolean).join("  •  ");
      children.push(line(head, { bold: true }));
      if (meta) children.push(line(meta, { italics: true, color: "5C6A82", size: 20 }));
      if (ed.relevantCoursework && ed.relevantCoursework.length > 0) {
        children.push(line(`Coursework: ${ed.relevantCoursework.join(", ")}`));
      }
      for (const a of ed.achievements ?? []) children.push(bulletPara(a));
    }
  }

  // Certifications -------------------------------------------------------
  if (resume.certifications.length > 0) {
    children.push(heading("Certifications"));
    for (const c of resume.certifications) {
      const parts = [cleanString(c.name), cleanString(c.issuer), cleanString(c.dateEarned)].filter(Boolean).join("  •  ");
      children.push(line(parts));
    }
  }

  // Volunteer -----------------------------------------------------------
  if (resume.volunteerWork.length > 0) {
    children.push(heading("Volunteer"));
    for (const v of resume.volunteerWork) {
      const head = `${cleanString(v.role)}${v.organization ? ` — ${cleanString(v.organization)}` : ""}`;
      const meta = formatDateRange(v.startDate, v.endDate, v.isCurrent);
      children.push(line(head, { bold: true }));
      if (meta) children.push(line(meta, { italics: true, color: "5C6A82", size: 20 }));
      if (v.description) children.push(line(v.description));
      for (const b of v.bullets ?? []) children.push(bulletPara(b));
    }
  }

  // Awards --------------------------------------------------------------
  if (resume.awards.length > 0) {
    children.push(heading("Awards"));
    for (const a of resume.awards) {
      const parts = [cleanString(a.title), cleanString(a.issuer), cleanString(a.date)].filter(Boolean).join("  •  ");
      children.push(line(parts, { bold: true }));
      if (a.description) children.push(line(a.description));
    }
  }

  // Languages -----------------------------------------------------------
  if (resume.languages.length > 0) {
    children.push(heading("Languages"));
    const formatted = resume.languages
      .map((l) => `${cleanString(l.language)}${l.proficiency ? ` (${cleanString(l.proficiency)})` : ""}`)
      .filter(Boolean);
    if (formatted.length > 0) children.push(line(formatted.join("  •  ")));
  }

  const doc = new Document({
    creator: "Resume Tailor",
    title: `${cleanString(resume.personal.fullName) || "Candidate"} Resume`,
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, safeFilename(resume.personal, "docx"));
}
