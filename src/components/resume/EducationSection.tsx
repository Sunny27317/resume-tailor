"use client";

import type { EducationEntry } from "@/types/resume";
import {
  Field, TextInput, TextArea, Checkbox, SectionCard, EntryCard, AddButton,
} from "./FormPrimitives";
import { makeEducationEntry } from "@/lib/resume/defaultProfile";
import { arrayToLines, splitLinesToArray, splitCommaOrLineSeparated, arrayToCommaList } from "@/lib/resume/formatters";

interface Props {
  value: EducationEntry[];
  onChange: (next: EducationEntry[]) => void;
  errors: Record<string, string>;
}

export default function EducationSection({ value, onChange, errors }: Props) {
  const updateAt = (index: number, next: Partial<EducationEntry>) =>
    onChange(value.map((e, i) => (i === index ? { ...e, ...next } : e)));

  const removeAt = (index: number) => onChange(value.filter((_, i) => i !== index));
  const add = () => onChange([...value, makeEducationEntry()]);

  return (
    <SectionCard
      title="Education"
      description="One card per school. Add as many as you need."
      action={<AddButton label="Add education" onClick={add} />}
    >
      {value.length === 0 && (
        <div className="rounded-lg border border-dashed border-ink-200 p-4 text-center text-xs text-ink-500">
          No education entries yet. Click &ldquo;Add education&rdquo; to start.
        </div>
      )}
      {value.map((e, i) => (
        <EntryCard key={e.id} title={`Education ${i + 1}`} onRemove={() => removeAt(i)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Institution" required error={errors[`education.${i}.institution`]}>
              <TextInput value={e.institution} onChange={(v) => updateAt(i, { institution: v })} placeholder="University of Toronto" />
            </Field>
            <Field label="Degree" required error={errors[`education.${i}.degree`]}>
              <TextInput value={e.degree} onChange={(v) => updateAt(i, { degree: v })} placeholder="B.Sc." />
            </Field>
            <Field label="Field of study">
              <TextInput value={e.fieldOfStudy} onChange={(v) => updateAt(i, { fieldOfStudy: v })} placeholder="Computer Science" />
            </Field>
            <Field label="Location">
              <TextInput value={e.location ?? ""} onChange={(v) => updateAt(i, { location: v })} placeholder="Toronto, ON" />
            </Field>
            <Field label="Start date">
              <TextInput value={e.startDate} onChange={(v) => updateAt(i, { startDate: v })} placeholder="Sep 2017" />
            </Field>
            <Field label="End date">
              <TextInput
                value={e.isCurrent ? "Present" : e.endDate}
                onChange={(v) => updateAt(i, { endDate: v })}
                placeholder="May 2021"
                disabled={e.isCurrent}
              />
            </Field>
          </div>
          <div className="mt-3">
            <Checkbox
              label="I'm currently studying here"
              checked={e.isCurrent}
              onChange={(v) => updateAt(i, { isCurrent: v, endDate: v ? "" : e.endDate })}
            />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="GPA / grade (optional)">
              <TextInput value={e.grade ?? ""} onChange={(v) => updateAt(i, { grade: v })} placeholder="3.8 / 4.0" />
            </Field>
            <Field label="Relevant coursework" hint="Comma- or line-separated. Optional.">
              <TextArea
                value={arrayToCommaList(e.relevantCoursework)}
                onChange={(v) => updateAt(i, { relevantCoursework: splitCommaOrLineSeparated(v) })}
                rows={2}
                placeholder="Algorithms, Operating Systems, Distributed Systems"
              />
            </Field>
          </div>
          <Field label="Achievements" hint="One per line. Optional.">
            <TextArea
              value={arrayToLines(e.achievements)}
              onChange={(v) => updateAt(i, { achievements: splitLinesToArray(v) })}
              rows={3}
              placeholder={"Dean's list 2019\nCo-led the AI student club"}
            />
          </Field>
        </EntryCard>
      ))}
    </SectionCard>
  );
}
