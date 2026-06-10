export function BrandHeader() {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal">Talent Assessment</p>
        <h1 className="text-lg font-bold text-navy">Aptitude Examination Portal</h1>
      </div>
      <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">Secure Session</div>
    </header>
  );
}
