import type { AttemptSummary, QuestionReview } from "../types/exam";

interface StudentResultPageProps {
  result: AttemptSummary;
  review: QuestionReview[];
  onDone: () => void;
}

export function StudentResultPage({ result, review, onDone }: StudentResultPageProps) {
  const reviewItems = review.filter((item) => item.status !== "correct");
  const metrics = [
    ["Total Questions", result.total],
    ["Attempted", result.attempted],
    ["Unanswered", result.unanswered],
    ["Correct", result.correct],
    ["Incorrect", result.incorrect],
    ["Score", `${result.correct}/${result.total}`],
  ];

  return (
    <div className="min-h-screen bg-canvas px-6 py-12">
      <main className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white shadow-panel">
        <section className="bg-navy px-8 py-10 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-300">Exam submitted</p>
          <h1 className="mt-3 text-3xl font-bold">Your result</h1>
          <p className="mt-2 text-sm text-slate-300">Student: {result.studentName}</p>
        </section>
        <section className="grid gap-8 p-8 md:grid-cols-[0.8fr_1.2fr]">
          <div className="grid place-items-center rounded-2xl bg-teal/5 p-8 text-center">
            <div>
              <p className="text-6xl font-bold text-teal">{result.percentage}%</p>
              <p className="mt-2 text-sm font-bold uppercase tracking-widest text-slate-500">Percentage</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-navy">{value}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="border-t border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-navy">Review wrong and unanswered questions</h2>
          {reviewItems.length === 0 ? (
            <p className="mt-4 rounded-xl bg-teal/10 p-4 font-semibold text-teal">Great work. No wrong or unanswered questions.</p>
          ) : (
            <div className="mt-5 grid gap-4">
              {reviewItems.map((item, index) => (
                <article key={item.questionId} className="rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-bold leading-7 text-navy">Q{index + 1}. {item.question}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${item.status === "wrong" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm">
                    {item.options.map((option, optionIndex) => {
                      const isCorrect = option === item.correctAnswer;
                      const isSelected = option === item.selectedAnswer;
                      return (
                        <div
                          key={option}
                          className={`rounded-lg border px-4 py-3 ${
                            isCorrect ? "border-teal bg-teal/10 text-teal" : isSelected ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 text-slate-600"
                          }`}
                        >
                          <span className="font-bold">{String.fromCharCode(65 + optionIndex)}.</span> {option}
                          {isCorrect && <span className="ml-2 font-bold">(Correct answer)</span>}
                          {isSelected && !isCorrect && <span className="ml-2 font-bold">(Your answer)</span>}
                        </div>
                      );
                    })}
                  </div>
                  {item.selectedAnswer === null && <p className="mt-3 text-sm font-semibold text-amber-700">You did not answer this question.</p>}
                </article>
              ))}
            </div>
          )}
        </section>
        <section className="border-t border-slate-200 p-8">
          <button onClick={onDone} className="rounded-lg bg-teal px-6 py-3 font-bold text-white hover:bg-teal/90">
            Finish
          </button>
        </section>
      </main>
    </div>
  );
}
