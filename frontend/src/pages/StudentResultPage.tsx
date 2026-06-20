import type { AttemptSummary, QuestionReview } from "../types/exam";

interface StudentResultPageProps {
  result: AttemptSummary;
  review: QuestionReview[];
  onDone: () => void;
}

export function StudentResultPage({ result, review, onDone }: StudentResultPageProps) {
  const reviewItems = review.filter((item) => item.status !== "correct");
  const lowScore = result.percentage < 50;
  const metrics = [
    ["Total Questions", result.total],
    ["Attempted", result.attempted],
    ["Unanswered", result.unanswered],
    ["Correct", result.correct],
    ["Incorrect", result.incorrect],
    ["Score", `${result.correct}/${result.total}`],
  ];

  return (
    <div className="min-h-screen bg-canvas px-4 py-8 sm:px-6 sm:py-12">
      <main className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white shadow-panel">
        <section className="bg-navy px-5 py-8 text-white sm:px-8 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-300">Exam submitted</p>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Your result</h1>
          <p className="mt-2 text-sm text-slate-300">Student: {result.studentName}</p>
        </section>
        <section className="grid gap-6 p-5 sm:gap-8 sm:p-8 md:grid-cols-[0.8fr_1.2fr]">
          <div className="grid place-items-center rounded-2xl bg-teal/5 p-6 text-center sm:p-8">
            <div>
              <p className={`text-5xl font-bold sm:text-6xl ${lowScore ? "text-red-600" : "text-teal"}`}>{result.percentage}%</p>
              <p className={`mt-2 text-sm font-bold uppercase tracking-widest ${lowScore ? "text-red-500" : "text-slate-500"}`}>Percentage</p>
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
        <section className="border-t border-slate-200 p-5 sm:p-8">
          <h2 className="text-xl font-bold text-navy sm:text-2xl">Review wrong and unanswered questions</h2>
          {reviewItems.length === 0 ? (
            <p className="mt-4 rounded-xl bg-teal/10 p-4 font-semibold text-teal">Great work. No wrong or unanswered questions.</p>
          ) : (
            <div className="mt-5 grid gap-4">
              {reviewItems.map((item, index) => (
                <article key={item.questionId} className="rounded-xl border border-slate-200 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">Document Q{item.questionNumber ?? index + 1}</p>
                      {item.passage && (
                        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-6 text-slate-600">
                          <p className="mb-2 font-bold uppercase tracking-[0.18em] text-slate-400">Passage</p>
                          {item.passage.split(/\n+/).map((line, lineIndex) => (
                            <p key={`${line}-${lineIndex}`}>{line}</p>
                          ))}
                        </div>
                      )}
                      <h3 className="mt-2 font-bold leading-7 text-navy">Q{index + 1}. {item.question}</h3>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${item.status === "wrong" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                      {item.status}
                    </span>
                  </div>
                  {item.readingComprehension ? (
                    <div className="mt-4 grid gap-3 text-sm">
                      <div className="rounded-lg border border-teal bg-teal/10 px-4 py-3 text-teal">
                        <p className="text-xs font-bold uppercase tracking-wider">Your answer</p>
                        <p className="mt-1 text-base font-semibold">{item.selectedAnswer ?? "Unanswered"}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 px-4 py-3 text-slate-700">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Correct answer</p>
                        <p className="mt-1 text-base font-semibold">{item.correctAnswer}</p>
                      </div>
                    </div>
                  ) : (
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
                  )}
                  {item.selectedAnswer === null && <p className="mt-3 text-sm font-semibold text-amber-700">You did not answer this question.</p>}
                </article>
              ))}
            </div>
          )}
        </section>
        <section className="border-t border-slate-200 p-5 sm:p-8">
          <button onClick={onDone} className="rounded-lg bg-teal px-6 py-3 font-bold text-white hover:bg-teal/90">
            Finish
          </button>
        </section>
      </main>
    </div>
  );
}
