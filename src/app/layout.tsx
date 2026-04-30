import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume Tailor — AI-assisted resume tailoring",
  description:
    "Tailor your resume to a job description with honest ATS scoring. No fake skills, no invented experience.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-ink-100 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-ink-900">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                RT
              </span>
              <span className="font-semibold">Resume Tailor</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm text-ink-700">
              <Link href="/" className="hover:text-ink-900">Home</Link>
              <Link
                href="/tailor"
                className="rounded-lg bg-ink-900 px-3 py-1.5 font-medium text-white hover:bg-ink-700"
              >
                Start tailoring
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-120px)] max-w-6xl px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-ink-100 bg-white/60">
          <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-ink-500">
            Built as a university project for the AI-Assisted Software Engineering course.
            Resumes and job descriptions are processed in-memory and not stored.
          </div>
        </footer>
      </body>
    </html>
  );
}
