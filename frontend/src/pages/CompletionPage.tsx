interface CompletionPageProps {
  onReset: () => void;
}

export function CompletionPage({ onReset }: CompletionPageProps) {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-6 py-12">
      <main className="w-full max-w-xl rounded-2xl bg-white p-10 text-center shadow-panel">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-teal/10 text-4xl font-bold text-teal">✓</div>
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.24em] text-teal">Assessment complete</p>
        <h1 className="mt-3 text-3xl font-bold text-navy">All questions have been displayed.</h1>
        <p className="mt-4 leading-7 text-slate-600">This assessment does not calculate or display results.</p>
        <button onClick={onReset} className="mt-8 rounded-lg bg-teal px-7 py-3 font-bold text-white hover:bg-teal/90">
          Upload another document
        </button>
      </main>
    </div>
  );
}
