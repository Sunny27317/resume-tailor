"use client";

import { useId } from "react";

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  htmlFor?: string;
}

export function Field({ label, required, error, hint, children, htmlFor }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-ink-700">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      <div className="mt-1">{children}</div>
      {hint && !error && <p className="mt-1 text-[11px] text-ink-500">{hint}</p>}
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (v: string) => void;
}

export function TextInput({ value, onChange, className = "", ...rest }: TextInputProps) {
  const id = useId();
  return (
    <input
      id={rest.id || id}
      {...rest}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={`block w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-ink-50 disabled:opacity-60 ${className}`}
    />
  );
}

interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value: string;
  onChange: (v: string) => void;
}

export function TextArea({ value, onChange, className = "", rows, ...rest }: TextAreaProps) {
  const id = useId();
  return (
    <textarea
      id={rest.id || id}
      {...rest}
      value={value ?? ""}
      rows={rows ?? 4}
      onChange={(e) => onChange(e.target.value)}
      className={`block w-full resize-y rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-ink-50 disabled:opacity-60 ${className}`}
    />
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-ink-700">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-ink-200 text-brand-600 focus:ring-brand-100"
      />
      {label}
    </label>
  );
}

export function SectionCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          {description && <p className="mt-1 text-xs text-ink-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function EntryCard({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-ink-500">{title}</div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          Remove
        </button>
      </div>
      {children}
    </div>
  );
}

export function AddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-dashed border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:border-brand-500 hover:text-brand-700"
    >
      <span aria-hidden>＋</span>
      <span>{label}</span>
    </button>
  );
}
