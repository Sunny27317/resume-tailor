"use client";

import type { TailoredResume } from "@/types/resume";
import {
  cleanString,
  formatContactLine,
  formatDateRange,
  SKILL_BUCKETS,
  tailoredSkillsHasContent,
} from "@/lib/resume/formatters";

/**
 * On-screen tailored resume preview. Three visual templates, all single
 * column and ATS-friendly. Empty sections are skipped entirely.
 */

interface Props {
  resume: TailoredResume;
}

interface TemplateChrome {
  page: string;
  name: string;
  headline: string;
  contact: string;
  sectionHeading: string;
  bodyText: string;
  bullet: string;
  meta: string;
  divider: string;
  uppercaseHeading: boolean;
}

const TEMPLATE_CHROME: Record<TailoredResume["templateId"], TemplateChrome> = {
  "classic-ats": {
    page: "bg-white text-ink-900 font-serif",
    name: "text-2xl font-bold tracking-tight text-center",
    headline: "text-sm italic text-ink-500 text-center",
    contact: "text-xs text-ink-500 text-center",
    sectionHeading: "text-xs font-bold tracking-wider text-ink-900 border-b border-ink-200 pb-1",
    bodyText: "text-[13px] leading-relaxed",
    bullet: "list-disc pl-5 text-[13px] leading-relaxed",
    meta: "text-[11px] italic text-ink-500",
    divider: "border-ink-200",
    uppercaseHeading: true,
  },
  "modern-clean": {
    page: "bg-white text-ink-900 font-sans",
    name: "text-3xl font-bold tracking-tight text-ink-900",
    headline: "text-sm italic text-brand-700",
    contact: "text-xs text-ink-500",
    sectionHeading: "text-sm font-semibold text-brand-700 border-b border-brand-100 pb-1",
    bodyText: "text-[13.5px] leading-relaxed",
    bullet: "list-disc pl-5 text-[13.5px] leading-relaxed",
    meta: "text-[11.5px] italic text-ink-500",
    divider: "border-brand-100",
    uppercaseHeading: false,
  },
  "technical-engineer": {
    page: "bg-white text-ink-900 font-sans",
    name: "text-2xl font-bold tracking-tight",
    headline: "text-sm italic text-ink-500",
    contact: "text-xs text-ink-500",
    sectionHeading: "text-xs font-bold uppercase tracking-wider text-ink-900 border-b border-ink-300 pb-1",
    bodyText: "text-[13px] leading-relaxed",
    bullet: "list-disc pl-5 text-[13px] leading-relaxed",
    meta: "text-[11px] italic text-ink-500",
    divider: "border-ink-300",
    uppercaseHeading: true,
  },
};

export default function ResumePreview({ resume }: Props) {
  const chrome = TEMPLATE_CHROME[resume.templateId];
  const contact = formatContactLine(resume.personal);

  // The technical-engineer template puts Skills + Projects above Experience
  // because that's where reviewers' eyes go first for engineering roles.
  const isTechnical = resume.templateId === "technical-engineer";

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-900">Tailored resume preview</h3>
        <span className="text-xs text-ink-500">Template: {labelFor(resume.templateId)}</span>
      </div>

      <article className={`mx-auto max-w-3xl rounded-xl border border-ink-100 p-8 ${chrome.page}`}>
        {/* Header */}
        <header
          className={
            resume.templateId === "modern-clean"
              ? "border-b border-brand-100 pb-4"
              : "text-center"
          }
        >
          <h1 className={chrome.name}>{cleanString(resume.personal.fullName) || "Your Name"}</h1>
          {resume.headline && <p className={chrome.headline}>{resume.headline}</p>}
          {contact && <p className={`${chrome.contact} mt-1`}>{contact}</p>}
        </header>

        {/* Summary */}
        {cleanString(resume.summary) && (
          <Section chrome={chrome} title="Summary">
            <p className={chrome.bodyText}>{resume.summary}</p>
          </Section>
        )}

        {/* Skills (early on technical template) */}
        {isTechnical && tailoredSkillsHasContent(resume.skills) && (
          <SkillsBlock chrome={chrome} resume={resume} />
        )}

        {/* Projects (early on technical template) */}
        {isTechnical && resume.projects.length > 0 && (
          <ProjectsBlock chrome={chrome} resume={resume} />
        )}

        {/* Experience */}
        {resume.experience.length > 0 && (
          <Section chrome={chrome} title="Experience">
            {resume.experience.map((e) => (
              <div key={e.id} className="mb-4 last:mb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <div className={`${chrome.bodyText} font-semibold`}>
                    {cleanString(e.jobTitle)}
                    {e.company && <span className="font-normal text-ink-500"> — {cleanString(e.company)}</span>}
                  </div>
                  <div className={chrome.meta}>
                    {[formatDateRange(e.startDate, e.endDate, e.isCurrent), cleanString(e.location)]
                      .filter(Boolean).join("  •  ")}
                  </div>
                </div>
                {e.description && <p className={`${chrome.bodyText} mt-1`}>{e.description}</p>}
                {e.bullets && e.bullets.length > 0 && (
                  <ul className={`${chrome.bullet} mt-1`}>
                    {e.bullets.map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                )}
                {e.technologies && e.technologies.length > 0 && (
                  <p className={`${chrome.meta} mt-1`}>Tech: {e.technologies.join(", ")}</p>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Skills (after experience for non-technical templates) */}
        {!isTechnical && tailoredSkillsHasContent(resume.skills) && (
          <SkillsBlock chrome={chrome} resume={resume} />
        )}

        {/* Projects (after experience for non-technical templates) */}
        {!isTechnical && resume.projects.length > 0 && (
          <ProjectsBlock chrome={chrome} resume={resume} />
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <Section chrome={chrome} title="Education">
            {resume.education.map((ed) => (
              <div key={ed.id} className="mb-3 last:mb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <div className={`${chrome.bodyText} font-semibold`}>
                    {cleanString(ed.degree)}
                    {ed.fieldOfStudy && <> in {cleanString(ed.fieldOfStudy)}</>}
                    {ed.institution && <>, {cleanString(ed.institution)}</>}
                  </div>
                  <div className={chrome.meta}>
                    {[formatDateRange(ed.startDate, ed.endDate, ed.isCurrent), cleanString(ed.location), cleanString(ed.grade)]
                      .filter(Boolean).join("  •  ")}
                  </div>
                </div>
                {ed.relevantCoursework && ed.relevantCoursework.length > 0 && (
                  <p className={`${chrome.bodyText} mt-1`}>Coursework: {ed.relevantCoursework.join(", ")}</p>
                )}
                {ed.achievements && ed.achievements.length > 0 && (
                  <ul className={`${chrome.bullet} mt-1`}>
                    {ed.achievements.map((a, j) => <li key={j}>{a}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Certifications */}
        {resume.certifications.length > 0 && (
          <Section chrome={chrome} title="Certifications">
            <ul className={chrome.bullet}>
              {resume.certifications.map((c) => (
                <li key={c.id}>
                  {[cleanString(c.name), cleanString(c.issuer), cleanString(c.dateEarned)].filter(Boolean).join("  •  ")}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Volunteer */}
        {resume.volunteerWork.length > 0 && (
          <Section chrome={chrome} title="Volunteer">
            {resume.volunteerWork.map((v) => (
              <div key={v.id} className="mb-3 last:mb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <div className={`${chrome.bodyText} font-semibold`}>
                    {cleanString(v.role)}
                    {v.organization && <span className="font-normal text-ink-500"> — {cleanString(v.organization)}</span>}
                  </div>
                  <div className={chrome.meta}>{formatDateRange(v.startDate, v.endDate, v.isCurrent)}</div>
                </div>
                {v.description && <p className={`${chrome.bodyText} mt-1`}>{v.description}</p>}
                {v.bullets && v.bullets.length > 0 && (
                  <ul className={`${chrome.bullet} mt-1`}>
                    {v.bullets.map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Awards */}
        {resume.awards.length > 0 && (
          <Section chrome={chrome} title="Awards">
            <ul className={chrome.bullet}>
              {resume.awards.map((a) => (
                <li key={a.id}>
                  <span className="font-semibold">{cleanString(a.title)}</span>
                  {(a.issuer || a.date) && (
                    <span className="text-ink-500"> — {[cleanString(a.issuer), cleanString(a.date)].filter(Boolean).join(", ")}</span>
                  )}
                  {a.description && <div className="text-ink-700">{a.description}</div>}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Languages */}
        {resume.languages.length > 0 && (
          <Section chrome={chrome} title="Languages">
            <p className={chrome.bodyText}>
              {resume.languages
                .map((l) => `${cleanString(l.language)}${l.proficiency ? ` (${cleanString(l.proficiency)})` : ""}`)
                .filter(Boolean)
                .join("  •  ")}
            </p>
          </Section>
        )}
      </article>

      {/* Honest gap panel */}
      {resume.skills.missingFromProfile && resume.skills.missingFromProfile.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-semibold">Honest gaps surfaced (not added to resume)</div>
          <p className="mt-1">
            The job description asks for terms not currently represented in your profile:{" "}
            {resume.skills.missingFromProfile.join(", ")}. We deliberately did not invent them.
            Add them to your Master Profile if you actually have the skill, or address the gap
            in your cover letter or interview.
          </p>
        </div>
      )}
    </div>
  );
}

function labelFor(id: TailoredResume["templateId"]): string {
  switch (id) {
    case "classic-ats": return "Classic ATS";
    case "modern-clean": return "Modern Clean";
    case "technical-engineer": return "Technical / Engineer";
  }
}

function Section({
  chrome,
  title,
  children,
}: {
  chrome: TemplateChrome;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <h2 className={chrome.sectionHeading}>{chrome.uppercaseHeading ? title.toUpperCase() : title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function SkillsBlock({ chrome, resume }: { chrome: TemplateChrome; resume: TailoredResume }) {
  return (
    <Section chrome={chrome} title="Skills">
      <div className="space-y-1">
        {SKILL_BUCKETS.map((bucket) => {
          const arr = (resume.skills as unknown as Record<string, string[] | undefined>)[bucket.key];
          if (!arr || arr.length === 0) return null;
          return (
            <div key={bucket.key} className={chrome.bodyText}>
              <span className="font-semibold">{bucket.label}:</span> {arr.join(", ")}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function ProjectsBlock({ chrome, resume }: { chrome: TemplateChrome; resume: TailoredResume }) {
  return (
    <Section chrome={chrome} title="Projects">
      {resume.projects.map((p) => {
        const links = [p.githubUrl, p.demoUrl].map(cleanString).filter(Boolean);
        return (
          <div key={p.id} className="mb-3 last:mb-0">
            <div className={`${chrome.bodyText} font-semibold`}>{p.name}</div>
            {p.description && <p className={`${chrome.bodyText} mt-0.5`}>{p.description}</p>}
            {p.bullets && p.bullets.length > 0 && (
              <ul className={`${chrome.bullet} mt-1`}>
                {p.bullets.map((b, j) => <li key={j}>{b}</li>)}
              </ul>
            )}
            {p.technologies && p.technologies.length > 0 && (
              <p className={`${chrome.meta} mt-1`}>Tech: {p.technologies.join(", ")}</p>
            )}
            {links.length > 0 && (
              <p className={`${chrome.meta} mt-1`}>{links.join("  •  ")}</p>
            )}
          </div>
        );
      })}
    </Section>
  );
}
