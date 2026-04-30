"use client";

import type { AwardEntry } from "@/types/resume";
import {
  Field, TextInput, TextArea, SectionCard, EntryCard, AddButton,
} from "./FormPrimitives";
import { makeAwardEntry } from "@/lib/resume/defaultProfile";

interface Props {
  value: AwardEntry[];
  onChange: (next: AwardEntry[]) => void;
}

export default function AwardsSection({ value, onChange }: Props) {
  const updateAt = (index: number, next: Partial<AwardEntry>) =>
    onChange(value.map((a, i) => (i === index ? { ...a, ...next } : a)));
  const removeAt = (index: number) => onChange(value.filter((_, i) => i !== index));
  const add = () => onChange([...value, makeAwardEntry()]);

  return (
    <SectionCard
      title="Awards (optional)"
      description="Recognitions you've received."
      action={<AddButton label="Add award" onClick={add} />}
    >
      {value.length === 0 && (
        <div className="rounded-lg border border-dashed border-ink-200 p-4 text-center text-xs text-ink-500">
          No awards.
        </div>
      )}
      {value.map((a, i) => (
        <EntryCard key={a.id} title={`Award ${i + 1}`} onRemove={() => removeAt(i)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title">
              <TextInput value={a.title} onChange={(v) => updateAt(i, { title: v })} placeholder="Hackathon Winner" />
            </Field>
            <Field label="Issuer (optional)">
              <TextInput value={a.issuer ?? ""} onChange={(v) => updateAt(i, { issuer: v })} placeholder="HackTheNorth" />
            </Field>
            <Field label="Date (optional)">
              <TextInput value={a.date ?? ""} onChange={(v) => updateAt(i, { date: v })} placeholder="2023" />
            </Field>
          </div>
          <Field label="Description (optional)">
            <TextArea value={a.description ?? ""} onChange={(v) => updateAt(i, { description: v })} rows={2} />
          </Field>
        </EntryCard>
      ))}
    </SectionCard>
  );
}
