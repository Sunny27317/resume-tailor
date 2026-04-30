"use client";

import type { CertificationEntry } from "@/types/resume";
import {
  Field, TextInput, SectionCard, EntryCard, AddButton,
} from "./FormPrimitives";
import { makeCertificationEntry } from "@/lib/resume/defaultProfile";

interface Props {
  value: CertificationEntry[];
  onChange: (next: CertificationEntry[]) => void;
}

export default function CertificationsSection({ value, onChange }: Props) {
  const updateAt = (index: number, next: Partial<CertificationEntry>) =>
    onChange(value.map((c, i) => (i === index ? { ...c, ...next } : c)));
  const removeAt = (index: number) => onChange(value.filter((_, i) => i !== index));
  const add = () => onChange([...value, makeCertificationEntry()]);

  return (
    <SectionCard
      title="Certifications (optional)"
      description="Professional certifications you've earned."
      action={<AddButton label="Add certification" onClick={add} />}
    >
      {value.length === 0 && (
        <div className="rounded-lg border border-dashed border-ink-200 p-4 text-center text-xs text-ink-500">
          No certifications. Add one if you have any worth listing.
        </div>
      )}
      {value.map((c, i) => (
        <EntryCard key={c.id} title={`Certification ${i + 1}`} onRemove={() => removeAt(i)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <TextInput value={c.name} onChange={(v) => updateAt(i, { name: v })} placeholder="AWS Certified Developer" />
            </Field>
            <Field label="Issuer">
              <TextInput value={c.issuer} onChange={(v) => updateAt(i, { issuer: v })} placeholder="AWS" />
            </Field>
            <Field label="Date earned">
              <TextInput value={c.dateEarned ?? ""} onChange={(v) => updateAt(i, { dateEarned: v })} placeholder="2023" />
            </Field>
            <Field label="Credential URL (optional)">
              <TextInput value={c.credentialUrl ?? ""} onChange={(v) => updateAt(i, { credentialUrl: v })} placeholder="credly.com/badge/..." />
            </Field>
          </div>
        </EntryCard>
      ))}
    </SectionCard>
  );
}
