"use client";

import type { SkillsProfile } from "@/types/resume";
import { Field, TextArea, SectionCard } from "./FormPrimitives";
import {
  arrayToCommaList, splitCommaOrLineSeparated, SKILL_BUCKETS,
} from "@/lib/resume/formatters";

interface Props {
  value: SkillsProfile;
  onChange: (next: SkillsProfile) => void;
}

export default function SkillsSection({ value, onChange }: Props) {
  const update = (key: keyof SkillsProfile, raw: string) =>
    onChange({ ...value, [key]: splitCommaOrLineSeparated(raw) });

  return (
    <SectionCard
      title="Skills"
      description="Bucket your skills. Each field accepts a comma- or line-separated list."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {SKILL_BUCKETS.map((bucket) => {
          const arr = (value as unknown as Record<string, string[] | undefined>)[bucket.key] ?? [];
          const optional = bucket.key === "cybersecurity" || bucket.key === "machineLearning";
          return (
            <Field
              key={bucket.key}
              label={`${bucket.label}${optional ? " (optional)" : ""}`}
            >
              <TextArea
                value={arrayToCommaList(arr)}
                onChange={(v) => update(bucket.key as keyof SkillsProfile, v)}
                rows={2}
                placeholder={bucket.key === "programmingLanguages" ? "TypeScript, JavaScript, Python" : ""}
              />
            </Field>
          );
        })}
      </div>
    </SectionCard>
  );
}
