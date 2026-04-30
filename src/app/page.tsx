import Link from "next/link";

export default function LandingPage() {
  return (
    <div>
      <section className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          Master Profile · Job Description · Tailored Resume
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
          Build your profile once. Tailor it for every job — without faking it.
        </h1>
        <p className="mt-4 text-lg text-ink-700">
          Resume Tailor takes a structured Master Profile and a job description and produces
          a clean, ATS-friendly resume in minutes. Wording is rewritten, sections are
          reordered for relevance, and missing skills are surfaced as honest gaps — never
          invented.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/tailor"
            className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            Start tailoring
          </Link>
          <a
            href="#how-it-works"
            className="rounded-xl border border-ink-200 bg-white px-6 py-3 text-sm font-semibold text-ink-900 hover:border-ink-300"
          >
            How it works
          </a>
        </div>
      </section>

      <section id="how-it-works" className="mt-16 grid gap-4 sm:grid-cols-4">
        {[
          { n: "1", title: "Master Profile", body: "Fill structured forms for personal info, experience, projects, education, skills, and more." },
          { n: "2", title: "Job Description", body: "Paste the posting. The tailoring engine extracts keywords, required skills, tools, and responsibilities." },
          { n: "3", title: "Template", body: "Pick a template — Classic ATS, Modern Clean, or Technical / Engineer." },
          { n: "4", title: "Preview & Export", body: "Review the tailored resume, then download as DOCX or PDF in one click." },
        ].map((s) => (
          <div key={s.n} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">
              {s.n}
            </div>
            <h3 className="mt-3 text-base font-semibold text-ink-900">{s.title}</h3>
            <p className="mt-1 text-sm text-ink-700">{s.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <h3 className="text-base font-semibold text-ink-900">What it won&apos;t do</h3>
          <ul className="mt-3 space-y-1 text-sm text-ink-700">
            <li>• Invent jobs, dates, employers, certifications, awards, or projects.</li>
            <li>• Add a skill that isn&apos;t already in your Master Profile.</li>
            <li>• Promise an unrealistic 100% ATS match.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <h3 className="text-base font-semibold text-ink-900">What it will do</h3>
          <ul className="mt-3 space-y-1 text-sm text-ink-700">
            <li>• Rewrite your bullets to be punchier and more action-oriented.</li>
            <li>• Reorder skills, projects, and experience by job relevance.</li>
            <li>• Surface missing requirements as honest gaps, never inserted skills.</li>
            <li>• Output ATS-readable DOCX and PDF in one click.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
