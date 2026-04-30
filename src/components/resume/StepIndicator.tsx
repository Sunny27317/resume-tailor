"use client";

interface Step {
  id: number;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { id: 1, label: "Master Profile", description: "Your structured source of truth" },
  { id: 2, label: "Job Description", description: "Paste the target posting" },
  { id: 3, label: "Template", description: "Pick a layout" },
  { id: 4, label: "Preview & Export", description: "Generate and download" },
];

export default function StepIndicator({
  current,
  onStepClick,
  furthestUnlocked,
}: {
  current: number;
  furthestUnlocked: number;
  onStepClick?: (n: number) => void;
}) {
  return (
    <ol className="grid gap-2 sm:grid-cols-4">
      {STEPS.map((s) => {
        const state = s.id < current ? "done" : s.id === current ? "active" : "future";
        const clickable = onStepClick && s.id <= furthestUnlocked;
        const inner = (
          <div
            className={`rounded-xl border p-3 text-left transition-colors ${
              state === "active"
                ? "border-brand-500 bg-brand-50"
                : state === "done"
                ? "border-ink-100 bg-white"
                : "border-ink-100 bg-ink-50/50"
            } ${clickable ? "hover:border-brand-500" : ""}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                  state === "done"
                    ? "bg-accent-500 text-white"
                    : state === "active"
                    ? "bg-brand-600 text-white"
                    : "bg-ink-100 text-ink-500"
                }`}
              >
                {state === "done" ? "✓" : s.id}
              </span>
              <span
                className={`text-sm font-semibold ${
                  state === "future" ? "text-ink-500" : "text-ink-900"
                }`}
              >
                {s.label}
              </span>
            </div>
            <div className="mt-1 pl-8 text-[11px] text-ink-500">{s.description}</div>
          </div>
        );
        return (
          <li key={s.id}>
            {clickable ? (
              <button
                type="button"
                onClick={() => onStepClick?.(s.id)}
                className="block w-full"
              >
                {inner}
              </button>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ol>
  );
}
