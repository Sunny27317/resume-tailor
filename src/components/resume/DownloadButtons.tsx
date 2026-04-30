"use client";

import { useState } from "react";
import type { TailoredResume } from "@/types/resume";
import { exportResumeToPdf } from "@/lib/resume/exportPdf";
import { exportResumeToDocx } from "@/lib/resume/exportDocx";

interface Props {
  resume: TailoredResume;
}

export default function DownloadButtons({ resume }: Props) {
  const [busy, setBusy] = useState<"pdf" | "docx" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function downloadPdf() {
    setBusy("pdf");
    setError(null);
    try {
      await exportResumeToPdf(resume);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "PDF export failed.");
    } finally {
      setBusy(null);
    }
  }

  async function downloadDocx() {
    setBusy("docx");
    setError(null);
    try {
      await exportResumeToDocx(resume);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "DOCX export failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-ink-900">Download tailored resume</div>
          <div className="text-xs text-ink-500">
            Both formats use ATS-friendly headings; empty sections are omitted.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadDocx}
            disabled={busy !== null}
            className="rounded-xl bg-ink-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-ink-700 disabled:opacity-60"
          >
            {busy === "docx" ? "Building DOCX…" : "Download DOCX"}
          </button>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={busy !== null}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
          >
            {busy === "pdf" ? "Building PDF…" : "Download PDF"}
          </button>
        </div>
      </div>
      {error && (
        <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
    </div>
  );
}
