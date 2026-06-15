import { BrandHeader } from "../components/BrandHeader";

interface InstructionsPageProps {
  count: number;
  onStart: () => void;
}

export function InstructionsPage({ count, onStart }: InstructionsPageProps) {
  return (
    <div className="min-h-screen bg-canvas">
      <BrandHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="rounded-2xl bg-white p-5 shadow-panel sm:p-10">
          <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal">{count} questions ready</span>
          <h2 className="mt-5 text-2xl font-bold text-navy sm:text-3xl">Read before you begin</h2>
          <ol className="mt-6 space-y-4 text-slate-600">
            <li><strong className="text-navy">1.</strong> Every question remains on screen for exactly 25 seconds.</li>
            <li><strong className="text-navy">2.</strong> You may select one option before time expires.</li>
            <li><strong className="text-navy">3.</strong> You can click Next Question to move forward early, or wait for automatic advance.</li>
            <li><strong className="text-navy">4.</strong> You cannot return to a previous question.</li>
            <li><strong className="text-navy">5.</strong> The exam opens in fullscreen. Leaving fullscreen triggers a warning while the timer continues.</li>
            <li><strong className="text-navy">6.</strong> Refreshing or closing this page clears the active assessment.</li>
          </ol>
          <button
            onClick={onStart}
            className="mt-9 w-full rounded-lg bg-teal px-6 py-4 text-base font-bold text-white shadow-lg shadow-teal/20 hover:bg-teal/90"
          >
            Enter fullscreen and start exam
          </button>
        </section>
      </main>
    </div>
  );
}
