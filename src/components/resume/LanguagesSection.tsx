"use client";

import type { LanguageEntry } from "@/types/resume";
import {
  Field, TextInput, SectionCard, EntryCard, AddButton,
} from "./FormPrimitives";
import { makeLanguageEntry } from "@/lib/resume/defaultProfile";

interface Props {
  value: LanguageEntry[];
  onChange: (next: LanguageEntry[]) => void;
}

const PROFICIENCIES = ["Native", "Fluent", "Professional", "Conversational", "Basic"];

export default function LanguagesSection({ value, onChange }: Props) {
  const updateAt = (index: number, next: Partial<LanguageEntry>) =>
    onChange(value.map((l, i) => (i === index ? { ...l, ...next } : l)));
  const removeAt = (index: number) => onChange(value.filter((_, i) => i !== index));
  const add = () => onChange([...value, makeLanguageEntry()]);

  return (
    <SectionCard
      title="Languages (optional)"
      description="Languages you speak and your proficiency."
      action={<AddButton label="Add language" onClick={add} />}
    >
      {value.length === 0 && (
        <div className="rounded-lg border border-dashed border-ink-200 p-4 text-center text-xs text-ink-500">
          No languages.
        </div>
      )}
      {value.map((l, i) => (
        <EntryCard key={l.id} title={`Language ${i + 1}`} onRemove={() => removeAt(i)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Language">
              <TextInput value={l.language} onChange={(v) => updateAt(i, { language: v })} placeholder="Spanish" />
            </Field>
            <Field label="Proficiency" hint={`e.g. ${PROFICIENCIES.join(", ")}`}>
              <TextInput value={l.proficiency} onChange={(v) => updateAt(i, { proficiency: v })} placeholder="Conversational" />
            </Field>
          </div>
        </EntryCard>
      ))}
    </SectionCard>
  );
}
