"use client";

import type { PersonalInfo } from "@/types/resume";
import { Field, TextInput, SectionCard } from "./FormPrimitives";

interface Props {
  value: PersonalInfo;
  onChange: (next: PersonalInfo) => void;
  errors: Record<string, string>;
}

export default function PersonalInfoForm({ value, onChange, errors }: Props) {
  const update = <K extends keyof PersonalInfo>(key: K, v: PersonalInfo[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <SectionCard
      title="Personal info"
      description="Your name, contact details, and professional links."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required error={errors["personal.fullName"]}>
          <TextInput value={value.fullName} onChange={(v) => update("fullName", v)} placeholder="Jane Doe" />
        </Field>
        <Field label="Email" required error={errors["personal.email"]}>
          <TextInput type="email" value={value.email} onChange={(v) => update("email", v)} placeholder="jane@example.com" />
        </Field>
        <Field label="Phone">
          <TextInput value={value.phone} onChange={(v) => update("phone", v)} placeholder="+1 555 0140" />
        </Field>
        <Field label="Location">
          <TextInput value={value.location} onChange={(v) => update("location", v)} placeholder="Toronto, ON" />
        </Field>
        <Field label="GitHub URL">
          <TextInput value={value.githubUrl} onChange={(v) => update("githubUrl", v)} placeholder="github.com/janedoe" />
        </Field>
        <Field label="LinkedIn URL">
          <TextInput value={value.linkedinUrl} onChange={(v) => update("linkedinUrl", v)} placeholder="linkedin.com/in/janedoe" />
        </Field>
        <Field label="Portfolio URL (optional)">
          <TextInput value={value.portfolioUrl ?? ""} onChange={(v) => update("portfolioUrl", v)} placeholder="janedoe.dev" />
        </Field>
      </div>
    </SectionCard>
  );
}
