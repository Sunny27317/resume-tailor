"use client";

import type { ExperienceEntry } from "@/types/resume";
import {
  Field, TextInput, TextArea, Checkbox, SectionCard, EntryCard, AddButton,
} from "./FormPrimitives";
import { makeExperienceEntry } from "@/lib/resume/defaultProfile";
import { arrayToLines, splitLinesToArray, arrayToCommaList, splitCommaOrLineSeparated } from "@/lib/resume/formatters";

interface Props {
  value: ExperienceEntry[];
  onChange: (next: ExperienceEntry[]) => void;
  errors: Record<string, string>;
}

export default function ExperienceSection({ value, onChange, errors }: Props) {
  const updateAt = (index: number, next: Partial<ExperienceEntry>) =>
    onChange(value.map((e, i) => (i === index ? { ...e, ...next } : e)));

  const removeAt = (index: number) => onChange(value.filter((_, i) => i !== index));
  const add = () => onChange([...value, makeExperienceEntry()]);

  return (
    <SectionCard
      title="Experience"
      description="Roles you've held. Bullets — one per line — describe your impact."
      action={<AddButton label="Add experience" onClick={add} />}
    >
      {value.length === 0 && (
        <div className="rounded-lg border border-dashed border-ink-200 p-4 text-center text-xs text-ink-500">
          No experience entries yet. Click &ldquo;Add experience&rdquo; to start.
        </div>
      )}
      {value.map((e, i) => (
        <EntryCard key={e.id} title={`Experience ${i + 1}`} onRemove={() => removeAt(i)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Job title" required error={errors[`experience.${i}.jobTitle`]}>
              <TextInput value={e.jobTitle} onChange={(v) => updateAt(i, { jobTitle: v })} placeholder="Software Engineer" />
            </Field>
            <Field label="Company" required error={errors[`experience.${i}.company`]}>
              <TextInput value={e.company} onChange={(v) => updateAt(i, { company: v })} placeholder="Acme Corp" />
            </Field>
            <Field label="Location">
              <TextInput value={e.location ?? ""} onChange={(v) => updateAt(i, { location: v })} placeholder="Remote" />
            </Field>
            <div />
            <Field label="Start date">
              <TextInput value={e.startDate} onChange={(v) => updateAt(i, { startDate: v })} placeholder="Jan 2022" />
            </Field>
            <Field label="End date">
              <TextInput
                value={e.isCurrent ? "Present" : e.endDate}
                onChange={(v) => updateAt(i, { endDate: v })}
                placeholder="Dec 2023"
                disabled={e.isCurrent}
              />
            </Field>
          </div>
          <div className="mt-2">
            <Checkbox
              label="I currently work here"
              checked={e.isCurrent}
              onChange={(v) => updateAt(i, { isCurrent: v, endDate: v ? "" : e.endDate })}
            />
          </div>
          <Field label="Description (optional)" hint="A short context line above your bullets.">
            <TextArea value={e.description ?? ""} onChange={(v) => updateAt(i, { description: v })} rows={2} />
          </Field>
          <Field label="Bullets" hint="One bullet per line. Action verb first; quantify when you can.">
            <TextArea
              value={arrayToLines(e.bullets)}
              onChange={(v) => updateAt(i, { bullets: splitLinesToArray(v) })}
              rows={5}
              placeholder={"Built customer dashboard in Next.js used by 12k weekly users.\nReduced p95 API latency by 38%."}
            />
          </Field>
          <Field label="Technologies (optional)" hint="Comma- or line-separated.">
            <TextArea
              value={arrayToCommaList(e.technologies)}
              onChange={(v) => updateAt(i, { technologies: splitCommaOrLineSeparated(v) })}
              rows={2}
              placeholder="TypeScript, React, Next.js, PostgreSQL"
            />
          </Field>
        </EntryCard>
      ))}
    </SectionCard>
  );
}
