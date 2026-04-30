"use client";

import { useState, useMemo } from "react";
import type {
  ResumeProfile,
  ResumeTemplateId,
  TailoredResume,
  TailorResumeResponse,
} from "@/types/resume";
import { defaultProfile } from "@/lib/resume/defaultProfile";
import {
  validateProfile,
  validateJobDescription,
  validateTemplate,
  validateAll,
} from "@/lib/resume/validation";
import StepIndicator from "./StepIndicator";
import ProfileForm from "./ProfileForm";
import JobDescriptionStep from "./JobDescriptionStep";
import TemplateSelector from "./TemplateSelector";
import ResumePreview from "./ResumePreview";
import dynamic from "next/dynamic";
const DownloadButtons = dynamic(() => import("./DownloadButtons"), { ssr: false });

type Status = "idle" | "loading" | "ready" | "error";

export default function ResumeTailorApp() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [profile, setProfile] = useState<ResumeProfile>(defaultProfile);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplateId>("classic-ats");
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(null);
  const [tailoringSource, setTailoringSource] = useState<TailorResumeResponse["source"] | null>(null);
  const [tailoringWarnings, setTailoringWarnings] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState<string | null>(null);

  // Live per-step validation snapshots — drive the Next button + step jumps.
  const profileValidation = useMemo(() => validateProfile(profile), [profile]);
  const jdValidation = useMemo(() => validateJobDescription(jobDescription), [jobDescription]);
  const templateValidation = useMemo(() => validateTemplate(selectedTemplate), [selectedTemplate]);

  const furthestUnlocked = useMemo(() => {
    if (!profileValidation.valid) return 1;
    if (!jdValidation.valid) return 2;
    if (!templateValidation.valid) return 3;
    return tailoredResume ? 4 : 4;
  }, [profileValidation, jdValidation, templateValidation, tailoredResume]);

  function goToStep(n: number) {
    // Clear errors when navigating; re-validate on Next.
    setErrors({});
    setTopError(null);
    setCurrentStep(Math.min(Math.max(n, 1), 4));
  }

  function next() {
    if (currentStep === 1) {
      setErrors(profileValidation.errors);
      if (!profileValidation.valid) {
        setTopError("Fix the highlighted fields before continuing.");
        return;
      }
    }
    if (currentStep === 2) {
      setErrors(jdValidation.errors);
      if (!jdValidation.valid) {
        setTopError(jdValidation.errors["jobDescription"] || "Job description is required.");
        return;
      }
    }
    if (currentStep === 3) {
      setErrors(templateValidation.errors);
      if (!templateValidation.valid) {
        setTopError(templateValidation.errors["templateId"] || "Pick a template.");
        return;
      }
    }
    setErrors({});
    setTopError(null);
    setCurrentStep((s) => Math.min(s + 1, 4));
  }

  function back() {
    setErrors({});
    setTopError(null);
    setCurrentStep((s) => Math.max(s - 1, 1));
  }

  async function generate() {
    const all = validateAll(profile, jobDescription, selectedTemplate);
    setErrors(all.errors);
    if (!all.valid) {
      setTopError("Fix the highlighted fields before generating.");
      return;
    }
    setStatus("loading");
    setTopError(null);
    setTailoredResume(null);
    try {
      const res = await fetch("/api/tailor-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, jobDescription, templateId: selectedTemplate }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Tailoring request failed.");
      }
      const json = (await res.json()) as TailorResumeResponse;
      setTailoredResume(json.resume);
      setTailoringSource(json.source);
      setTailoringWarnings(json.warnings);
      setStatus("ready");
    } catch (err: unknown) {
      setStatus("error");
      setTopError(err instanceof Error ? err.message : "Tailoring failed.");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink-900">Tailor your resume</h1>
        <p className="mt-1 text-sm text-ink-700">
          Build your Master Profile once. Tailor it for each job. Download a polished resume.
        </p>
      </header>

      <StepIndicator
        current={currentStep}
        furthestUnlocked={furthestUnlocked}
        onStepClick={goToStep}
      />

      {topError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {topError}
        </div>
      )}

      {profileValidation.warnings.length > 0 && currentStep === 1 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          {profileValidation.warnings.map((w, i) => <div key={i}>· {w}</div>)}
        </div>
      )}
      {jdValidation.warnings.length > 0 && currentStep === 2 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          {jdValidation.warnings.map((w, i) => <div key={i}>· {w}</div>)}
        </div>
      )}

      {/* Step content */}
      {currentStep === 1 && (
        <ProfileForm profile={profile} onChange={setProfile} errors={errors} />
      )}
      {currentStep === 2 && (
        <JobDescriptionStep
          value={jobDescription}
          onChange={setJobDescription}
          error={errors["jobDescription"]}
          warning={jdValidation.warnings[0]}
        />
      )}
      {currentStep === 3 && (
        <TemplateSelector
          selected={selectedTemplate}
          onSelect={setSelectedTemplate}
          error={errors["templateId"]}
        />
      )}
      {currentStep === 4 && (
        <div className="space-y-4">
          {!tailoredResume && status !== "loading" && (
            <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-ink-900">Generate your tailored resume</h3>
                  <p className="text-xs text-ink-500">
                    Uses the deterministic tailoring engine; if OPENAI_API_KEY is set, also calls the LLM and reconciles the output.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={generate}
                  className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
                >
                  Generate resume
                </button>
              </div>
            </div>
          )}
          {status === "loading" && (
            <div className="rounded-2xl border border-ink-100 bg-white p-10 text-center shadow-card">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-ink-100 border-t-brand-600" />
              <p className="mt-4 text-sm text-ink-700">Generating your tailored resume…</p>
            </div>
          )}
          {status === "ready" && tailoredResume && (
            <>
              {tailoringWarnings.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  {tailoringWarnings.map((w, i) => <div key={i}>· {w}</div>)}
                </div>
              )}
              {tailoringSource && (
                <div className="text-xs text-ink-500">
                  Source: <span className="font-medium text-ink-700">{tailoringSource === "openai" ? "OpenAI + verification" : "Deterministic engine"}</span>
                </div>
              )}
              <ResumePreview resume={tailoredResume} />
              <DownloadButtons resume={tailoredResume} />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={generate}
                  className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 hover:border-ink-300"
                >
                  Re-generate
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step navigation */}
      <div className="flex items-center justify-between border-t border-ink-100 pt-4">
        <button
          type="button"
          onClick={back}
          disabled={currentStep === 1}
          className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 hover:border-ink-300 disabled:opacity-40"
        >
          ← Back
        </button>
        {currentStep < 4 && (
          <button
            type="button"
            onClick={next}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            {currentStep === 3 ? "Continue to preview" : "Next →"}
          </button>
        )}
      </div>
    </div>
  );
}
