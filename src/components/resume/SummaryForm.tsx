"use client";

import type { ProfileSummary } from "@/types/resume";
import { Field, TextArea, TextInput, SectionCard } from "./FormPrimitives";

interface Props {
  value: ProfileSummary;
  onChange: (next: ProfileSummary) => void;
}

export default function SummaryForm({ value, onChange }: Props) {
  const update = <K extends keyof ProfileSummary>(key: K, v: ProfileSummary[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <SectionCard
      title="About"
      description="A short paragraph the tailoring engine can adapt for each job. Used as your summary."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Target role (optional)" hint="What you generally apply for. Used as a fallback headline.">
          <TextInput value={value.targetRole ?? ""} onChange={(v) => update("targetRole", v)} placeholder="Senior Frontend Engineer" />
        </Field>
        <Field label="Years of experience (optional)">
          <TextInput value={value.yearsOfExperience ?? ""} onChange={(v) => update("yearsOfExperience", v)} placeholder="4" />
        </Field>
      </div>
      <Field
        label="About paragraph"
        hint="2-3 sentences in your voice. The tailoring engine will adapt the wording per job; it never invents new facts."
      >
        <TextArea
          value={value.about}
          onChange={(v) => update("about", v)}
          rows={4}
          placeholder="Software engineer with 4 years of experience shipping production TypeScript apps. Strong on React, Node.js, and cloud-native deployment workflows."
        />
      </Field>
    </SectionCard>
  );
}
