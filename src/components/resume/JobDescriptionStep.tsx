"use client";

import { useId } from "react";
import { SectionCard } from "./FormPrimitives";

interface Props {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  warning?: string;
}

export default function JobDescriptionStep({ value, onChange, error, warning }: Props) {
  const id = useId();
  return (
    <SectionCard
      title="Job description"
      description="Paste the full posting. The tailoring engine extracts keywords, required skills, tools, and responsibilities from this text."
    >
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={14}
        placeholder="Paste the entire job description here…"
        className="block w-full resize-y rounded-xl border border-ink-100 bg-ink-50 p-3 font-mono text-sm leading-relaxed text-ink-900 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-500">{value.length.toLocaleString()} characters</span>
        {value.length > 50_000 && <span className="text-red-600">Too long (max 50,000 chars)</span>}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {warning && !error && <p className="text-xs text-amber-700">{warning}</p>}
    </SectionCard>
  );
}
