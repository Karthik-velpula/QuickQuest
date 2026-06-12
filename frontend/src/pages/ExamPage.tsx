import { useCallback, useRef, useState } from "react";
import { FullscreenWarning } from "../components/FullscreenWarning";
import { ProgressBar } from "../components/ProgressBar";
import { Timer } from "../components/Timer";
import { useExamRestrictions } from "../hooks/useExamRestrictions";
import { useQuestionTimer } from "../hooks/useQuestionTimer";
import type { AnswerRecord, Question } from "../types/exam";

interface ExamPageProps {
  questions: Question[];
  onComplete: (answers: AnswerRecord[]) => void;
  onFullscreenExitLimit?: () => void;
}

export function ExamPage({ questions, onComplete, onFullscreenExitLimit }: ExamPageProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const answersRef = useRef<AnswerRecord[]>([]);
  const selectedRef = useRef<string | null>(null);
  const advancingRef = useRef(false);
  const question = questions[index] as Question;

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

  const { fullscreenWarning, restoreFullscreen } = useExamRestrictions(true, {
    maxFullscreenExits: 5,
    onFullscreenExitLimit: () => {
      if (advancingRef.current) return;
      onFullscreenExitLimit?.();
      goForward();
    },
  });

  const seconds = useQuestionTimer(index, goForward);
  const choose = (option: string) => {
    selectedRef.current = option;
    setSelected(option);
  };

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
        <section className="w-full max-w-4xl rounded-2xl bg-white p-5 shadow-panel sm:p-8 md:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal">Select one option</p>
          <p className="mt-3 w-fit rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">Document Question {question.questionNumber ?? index + 1}</p>
          <h2 className="mt-5 text-xl font-semibold leading-relaxed text-navy sm:text-2xl md:text-3xl">{question.question}</h2>
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
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">You can only move forward</p>
            <button onClick={goForward} className="rounded-lg bg-teal px-6 py-3 font-bold text-white hover:bg-teal/90">
              {index === questions.length - 1 ? "Submit & View Results" : "Next Question"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
