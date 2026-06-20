import { useEffect, useState } from "react";
import { BrandHeader } from "../components/BrandHeader";
import { getEmailExam, submitEmailExam } from "../services/emailExamService";
import { getSavedStudentSession } from "../services/studentService";
import type { EmailExamSummary } from "../types/exam";

interface EmailExamPageProps {
  code: string;
}

export function EmailExamPage({ code }: EmailExamPageProps) {
  const [exam, setExam] = useState<EmailExamSummary | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<null | { score: number; grammar: string[]; tone: string; clarity: string; relevance: string; correctness: string; overallFeedback: string }>(null);
  const session = getSavedStudentSession();

  useEffect(() => {
    void getEmailExam(code)
      .then(setExam)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load email exam."))
      .finally(() => setLoading(false));
  }, [code]);

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const submitted = await submitEmailExam(code, session?.student.displayName ?? session?.student.username ?? "Anonymous Student", answer);
      setResult(submitted.feedback);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit email.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <p className="text-slate-600">Loading email exam...</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-canvas px-4 py-8">
        <BrandHeader />
        <main className="mx-auto mt-8 max-w-3xl rounded-2xl bg-white p-6 shadow-panel">
          <h1 className="text-2xl font-bold text-navy">Email evaluation</h1>
          <p className="mt-3 text-4xl font-bold text-teal">{result.score}%</p>
          <div className="mt-6 grid gap-3 text-sm text-slate-700">
            <p><strong>Grammar:</strong> {result.grammar.join(" · ")}</p>
            <p><strong>Tone:</strong> {result.tone}</p>
            <p><strong>Clarity:</strong> {result.clarity}</p>
            <p><strong>Relevance:</strong> {result.relevance}</p>
            <p><strong>Correctness:</strong> {result.correctness}</p>
            <p><strong>Feedback:</strong> {result.overallFeedback}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <BrandHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <section className="rounded-2xl bg-white p-6 shadow-panel">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal">Email exam</p>
          <h1 className="mt-3 text-2xl font-bold text-navy">{exam?.title ?? "Email writing"}</h1>
          <p className="mt-4 rounded-xl bg-slate-50 p-4 text-slate-700 whitespace-pre-wrap">{exam?.prompt}</p>
          <textarea
            className="mt-5 min-h-72 w-full rounded-xl border border-slate-300 p-4 text-base outline-none focus:border-teal"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Write your email here..."
          />
          <button onClick={() => void submit()} disabled={submitting} className="mt-5 rounded-lg bg-teal px-6 py-3 font-bold text-white disabled:opacity-40">
            {submitting ? "Checking..." : "Submit email"}
          </button>
          {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </section>
      </main>
    </div>
  );
}
