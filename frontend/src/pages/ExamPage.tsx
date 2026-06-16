import { useCallback, useEffect, useRef, useState } from "react";
import { FullscreenWarning } from "../components/FullscreenWarning";
import { ProgressBar } from "../components/ProgressBar";
import { Timer } from "../components/Timer";
import { useExamRestrictions } from "../hooks/useExamRestrictions";
import { useQuestionTimer } from "../hooks/useQuestionTimer";
import type { AnswerRecord, Question } from "../types/exam";

interface ExamPageProps {
  questions: Question[];
  onComplete: (answers: AnswerRecord[]) => void;
}

export function ExamPage({ questions, onComplete }: ExamPageProps) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"normal" | "reading">("normal");
  const [readingSecondsLeft, setReadingSecondsLeft] = useState(60);
  const [selected, setSelected] = useState<string | null>(null);
  const answersRef = useRef<AnswerRecord[]>([]);
  const selectedRef = useRef<string | null>(null);
  const advancingRef = useRef(false);
  const rcReadingDoneRef = useRef(false);
  const readingStartedRef = useRef(false);
  const { fullscreenWarning, restoreFullscreen } = useExamRestrictions(true);
  const question = questions[index] as Question;
  const isReadingQuestion = Boolean(question.readingComprehension);

  const rcQuestions = questions.filter((item) => item.readingComprehension);
  const readingPassage = rcQuestions[0]?.passage ?? "";

  useEffect(() => {
    if (!isReadingQuestion || rcReadingDoneRef.current) {
      setPhase("normal");
      readingStartedRef.current = false;
      return;
    }

    if (readingStartedRef.current) return;
    readingStartedRef.current = true;
    setPhase("reading");
    setReadingSecondsLeft(60);
    advancingRef.current = true;

    const deadline = Date.now() + 60_000;
    const interval = window.setInterval(() => {
      setReadingSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 100);
    const timeout = window.setTimeout(() => {
      rcReadingDoneRef.current = true;
      readingStartedRef.current = false;
      setPhase("normal");
      advancingRef.current = false;
    }, 60_000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [index, isReadingQuestion]);

  const goForward = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;

    const nextAnswers = [...answersRef.current, { questionId: question.id, selectedAnswer: selectedRef.current }];
    answersRef.current = nextAnswers;
    if (index === questions.length - 1) {
      if (document.fullscreenElement) void document.exitFullscreen();
      onComplete(nextAnswers);
      return;
    }
    selectedRef.current = null;
    setSelected(null);
    setIndex((current) => current + 1);
    window.setTimeout(() => {
      advancingRef.current = false;
    }, 0);
  }, [index, onComplete, question.id, questions.length]);

  const seconds = useQuestionTimer(index, goForward, phase === "normal" && !isReadingQuestion);
  const choose = (option: string) => {
    selectedRef.current = option;
    setSelected(option);
  };

  useEffect(() => {
    if (!question.readingComprehension) {
      setPhase("normal");
      readingStartedRef.current = false;
      advancingRef.current = false;
    }
  }, [index, question.readingComprehension]);

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {fullscreenWarning && <FullscreenWarning onRestore={() => void restoreFullscreen()} />}
      <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Online Examination</p>
          <p className="mt-1 text-lg font-bold text-navy">Question {index + 1} of {questions.length}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-teal">Document Q{question.questionNumber ?? index + 1}</p>
        </div>
        <Timer seconds={seconds} />
      </header>
      <ProgressBar current={index + 1} total={questions.length} />
      <main className="grid flex-1 place-items-center px-4 py-6 sm:px-6 sm:py-10">
        <section className="w-full max-w-6xl rounded-2xl bg-white p-5 shadow-panel sm:p-8 md:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal">Select one option</p>
          <p className="mt-3 w-fit rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">Document Question {question.questionNumber ?? index + 1}</p>
          {phase === "reading" && isReadingQuestion ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Reading time</p>
              <p className="mt-2 text-3xl font-bold text-navy">01:{String(readingSecondsLeft).padStart(2, "0")}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Read the passage carefully. Questions will appear one by one after this 1 minute reading period.
              </p>
              <div className="mt-5 space-y-4 text-[15px] leading-8 text-slate-700">
                {readingPassage.split(/\n+/).map((line, lineIndex) => (
                  <p key={`${line}-${lineIndex}`}>{line}</p>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-6">
              <section>
                <h2 className="text-xl font-semibold leading-relaxed text-navy sm:text-2xl md:text-3xl">{question.question}</h2>
                <div className="mt-9 grid gap-4">
                  {question.options.map((option, optionIndex) => (
                    <label
                      key={option}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition sm:items-center sm:gap-4 sm:p-5 ${
                        selected === option ? "border-teal bg-teal/5" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input type="radio" name={`question-${index}`} checked={selected === option} onChange={() => choose(option)} className="h-5 w-5 accent-teal" />
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span className="text-base font-medium text-slate-700">{option}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>
          )}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">You can only move forward</p>
            {phase === "reading" && isReadingQuestion ? (
              <button disabled className="rounded-lg bg-slate-300 px-6 py-3 font-bold text-white">
                Reading...
              </button>
            ) : (
              <button onClick={goForward} className="rounded-lg bg-teal px-6 py-3 font-bold text-white hover:bg-teal/90">
                {index === questions.length - 1 ? "Submit Exam" : "Next Question"}
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
