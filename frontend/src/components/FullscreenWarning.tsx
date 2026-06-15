interface FullscreenWarningProps {
  onRestore: () => void;
}

export function FullscreenWarning({ onRestore }: FullscreenWarningProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/90 p-6">
      <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-panel">
        <h2 className="text-2xl font-bold text-navy">Fullscreen mode exited</h2>
        <p className="mt-3 text-slate-600">Your timer is still running. Return to fullscreen to continue viewing the question.</p>
        <button onClick={onRestore} className="mt-6 rounded-lg bg-teal px-6 py-3 font-semibold text-white hover:bg-teal/90">
          Return to fullscreen
        </button>
      </div>
    </div>
  );
}
