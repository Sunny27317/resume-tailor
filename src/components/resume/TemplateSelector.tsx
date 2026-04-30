"use client";

import type { ResumeTemplateId } from "@/types/resume";
import { SectionCard } from "./FormPrimitives";

interface Props {
  selected: ResumeTemplateId;
  onSelect: (id: ResumeTemplateId) => void;
  error?: string;
}

const TEMPLATES: Array<{ id: ResumeTemplateId; label: string; blurb: string; bestFor: string }> = [
  {
    id: "classic-ats",
    label: "Classic ATS",
    blurb: "Minimal, monochrome, maximum compatibility with applicant tracking systems.",
    bestFor: "Best for: traditional industries, government, big-co recruiting funnels.",
  },
  {
    id: "modern-clean",
    label: "Modern Clean",
    blurb: "Slightly more visual with subtle color and generous spacing — still ATS-safe.",
    bestFor: "Best for: most tech roles, startups, design-aware recruiters.",
  },
  {
    id: "technical-engineer",
    label: "Technical / Engineer",
    blurb: "Foregrounds skills and projects; surfaces technologies inline with each role.",
    bestFor: "Best for: software, data, ML, security, and platform engineering roles.",
  },
];

export default function TemplateSelector({ selected, onSelect, error }: Props) {
  return (
    <SectionCard
      title="Template"
      description="Pick a layout. All three are single-column, ATS-friendly, and use canonical headings."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {TEMPLATES.map((t) => {
          const active = t.id === selected;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                active
                  ? "border-brand-500 bg-brand-50"
                  : "border-ink-100 bg-white hover:border-ink-200"
              }`}
            >
              <div className="text-sm font-semibold text-ink-900">{t.label}</div>
              <p className="mt-1 text-xs text-ink-700">{t.blurb}</p>
              <p className="mt-2 text-[11px] italic text-ink-500">{t.bestFor}</p>
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </SectionCard>
  );
}
