"use client";

import type { ProjectEntry } from "@/types/resume";
import {
  Field, TextInput, TextArea, SectionCard, EntryCard, AddButton,
} from "./FormPrimitives";
import { makeProjectEntry } from "@/lib/resume/defaultProfile";
import { arrayToLines, splitLinesToArray, arrayToCommaList, splitCommaOrLineSeparated } from "@/lib/resume/formatters";

interface Props {
  value: ProjectEntry[];
  onChange: (next: ProjectEntry[]) => void;
  errors: Record<string, string>;
}

export default function ProjectsSection({ value, onChange, errors }: Props) {
  const updateAt = (index: number, next: Partial<ProjectEntry>) =>
    onChange(value.map((p, i) => (i === index ? { ...p, ...next } : p)));

  const removeAt = (index: number) => onChange(value.filter((_, i) => i !== index));
  const add = () => onChange([...value, makeProjectEntry()]);

  return (
    <SectionCard
      title="Projects"
      description="Projects you've built — personal, open source, or coursework."
      action={<AddButton label="Add project" onClick={add} />}
    >
      {value.length === 0 && (
        <div className="rounded-lg border border-dashed border-ink-200 p-4 text-center text-xs text-ink-500">
          No projects yet. Click &ldquo;Add project&rdquo; to start.
        </div>
      )}
      {value.map((p, i) => (
        <EntryCard key={p.id} title={`Project ${i + 1}`} onRemove={() => removeAt(i)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Project name" required error={errors[`projects.${i}.name`]}>
              <TextInput value={p.name} onChange={(v) => updateAt(i, { name: v })} placeholder="openDocs" />
            </Field>
            <Field label="Technologies" hint="Comma- or line-separated.">
              <TextInput
                value={arrayToCommaList(p.technologies)}
                onChange={(v) => updateAt(i, { technologies: splitCommaOrLineSeparated(v) })}
                placeholder="TypeScript, Vite, Lunr"
              />
            </Field>
          </div>
          <Field label="Description" required error={errors[`projects.${i}.description`]}>
            <TextArea
              value={p.description}
              onChange={(v) => updateAt(i, { description: v })}
              rows={2}
              placeholder="Open-source markdown documentation generator with built-in search."
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="GitHub URL (optional)">
              <TextInput value={p.githubUrl ?? ""} onChange={(v) => updateAt(i, { githubUrl: v })} placeholder="github.com/user/project" />
            </Field>
            <Field label="Demo URL (optional)">
              <TextInput value={p.demoUrl ?? ""} onChange={(v) => updateAt(i, { demoUrl: v })} placeholder="project.dev" />
            </Field>
          </div>
          <Field label="Bullets" hint="One bullet per line. Optional.">
            <TextArea
              value={arrayToLines(p.bullets)}
              onChange={(v) => updateAt(i, { bullets: splitLinesToArray(v) })}
              rows={4}
              placeholder={"Designed plugin architecture; shipped to npm with 2k weekly downloads."}
            />
          </Field>
        </EntryCard>
      ))}
    </SectionCard>
  );
}
