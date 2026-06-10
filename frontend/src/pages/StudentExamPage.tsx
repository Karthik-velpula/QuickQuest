import { useEffect, useState } from "react";
import { BrandHeader } from "../components/BrandHeader";
import { getPublicExam, submitAttempt } from "../services/examService";
import type { AnswerRecord, AttemptSummary, PublicExam, QuestionReview } from "../types/exam";
import { prepareQuestions } from "../utils/shuffle";
import { ExamPage } from "./ExamPage";
import { InstructionsPage } from "./InstructionsPage";
import { StudentResultPage } from "./StudentResultPage";

type Stage = "loading" | "join" | "instructions" | "exam" | "complete";

interface StudentExamPageProps {
  code: string;
}

export function StudentExamPage({ code }: StudentExamPageProps) {
  const [stage, setStage] = useState<Stage>("loading");
  const [exam, setExam] = useState<PublicExam | null>(null);
  const [studentName, setStudentName] = useState("");
  const [result, setResult] = useState<AttemptSummary | null>(null);
  const [review, setReview] = useState<QuestionReview[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void getPublicExam(code)
      .then((loadedExam) => {
        setExam({ ...loadedExam, questions: prepareQuestions(loadedExam.questions) });
        setStage("join");
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load exam.");
        setStage("join");
      });
  }, [code]);

  const start = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // The exam can continue; its fullscreen warning offers another user-initiated attempt.
    }
    setStage("exam");
  };

  const complete = async (answers: AnswerRecord[]) => {
    try {
      const submitted = await submitAttempt(code, studentName, answers);
      setResult(submitted.attempt);
      setReview(submitted.review);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit attempt.");
    }
    setStage("complete");
  };

  if (stage === "instructions" && exam) return <InstructionsPage count={exam.questions.length} onStart={() => void start()} />;
  if (stage === "exam" && exam) return <ExamPage questions={exam.questions} onComplete={(answers) => void complete(answers)} />;
  if (stage === "complete" && result) return <StudentResultPage result={result} review={review} onDone={() => { window.location.href = "/"; }} />;
  if (stage === "complete") {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas px-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-panel">
          <h1 className="text-2xl font-bold text-navy">Submission issue</h1>
          <p className="mt-3 text-slate-600">{error || "Your attempt could not be submitted."}</p>
          <button onClick={() => { window.location.href = "/"; }} className="mt-6 rounded-lg bg-teal px-6 py-3 font-bold text-white">Finish</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <BrandHeader />
      <main className="mx-auto max-w-xl px-6 py-12">
        <section className="rounded-2xl bg-white p-8 shadow-panel">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal">Exam code {code}</p>
          <h2 className="mt-3 text-3xl font-bold text-navy">{exam?.title ?? "Loading exam..."}</h2>
          {error ? (
            <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
          ) : (
            <div className="mt-7 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Your name
                <input className="rounded-lg border border-slate-300 px-4 py-3 font-normal" value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="Enter your name" />
              </label>
              <button disabled={!exam} onClick={() => setStage("instructions")} className="rounded-lg bg-teal px-6 py-4 font-bold text-white hover:bg-teal/90 disabled:opacity-40">Continue to instructions</button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
