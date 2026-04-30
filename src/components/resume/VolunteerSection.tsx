"use client";

import type { VolunteerEntry } from "@/types/resume";
import {
  Field, TextInput, TextArea, Checkbox, SectionCard, EntryCard, AddButton,
} from "./FormPrimitives";
import { makeVolunteerEntry } from "@/lib/resume/defaultProfile";
import { arrayToLines, splitLinesToArray } from "@/lib/resume/formatters";

interface Props {
  value: VolunteerEntry[];
  onChange: (next: VolunteerEntry[]) => void;
}

export default function VolunteerSection({ value, onChange }: Props) {
  const updateAt = (index: number, next: Partial<VolunteerEntry>) =>
    onChange(value.map((v, i) => (i === index ? { ...v, ...next } : v)));
  const removeAt = (index: number) => onChange(value.filter((_, i) => i !== index));
  const add = () => onChange([...value, makeVolunteerEntry()]);

  return (
    <SectionCard
      title="Volunteer (optional)"
      description="Volunteer roles you've held."
      action={<AddButton label="Add volunteer entry" onClick={add} />}
    >
      {value.length === 0 && (
        <div className="rounded-lg border border-dashed border-ink-200 p-4 text-center text-xs text-ink-500">
          No volunteer entries.
        </div>
      )}
      {value.map((v, i) => (
        <EntryCard key={v.id} title={`Volunteer ${i + 1}`} onRemove={() => removeAt(i)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Role">
              <TextInput value={v.role} onChange={(val) => updateAt(i, { role: val })} placeholder="Mentor" />
            </Field>
            <Field label="Organization">
              <TextInput value={v.organization} onChange={(val) => updateAt(i, { organization: val })} placeholder="Code for Good" />
            </Field>
            <Field label="Start date">
              <TextInput value={v.startDate ?? ""} onChange={(val) => updateAt(i, { startDate: val })} placeholder="Jan 2022" />
            </Field>
            <Field label="End date">
              <TextInput
                value={v.isCurrent ? "Present" : (v.endDate ?? "")}
                onChange={(val) => updateAt(i, { endDate: val })}
                disabled={!!v.isCurrent}
              />
            </Field>
          </div>
          <Checkbox
            label="Currently volunteering here"
            checked={!!v.isCurrent}
            onChange={(val) => updateAt(i, { isCurrent: val, endDate: val ? "" : v.endDate })}
          />
          <Field label="Description (optional)">
            <TextArea value={v.description ?? ""} onChange={(val) => updateAt(i, { description: val })} rows={2} />
          </Field>
          <Field label="Bullets" hint="One per line. Optional.">
            <TextArea
              value={arrayToLines(v.bullets)}
              onChange={(val) => updateAt(i, { bullets: splitLinesToArray(val) })}
              rows={3}
            />
          </Field>
        </EntryCard>
      ))}
    </SectionCard>
  );
}
