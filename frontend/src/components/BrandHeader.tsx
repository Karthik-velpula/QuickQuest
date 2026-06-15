export function BrandHeader() {
  return (
    <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal">QuickQuest</p>
        <h1 className="text-lg font-bold text-navy">Online Examination Portal</h1>
      </div>
      <div className="w-fit rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">Secure Session</div>
    </header>
  );
}
