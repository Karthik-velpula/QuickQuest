import { useState } from "react";
import { BrandHeader } from "../components/BrandHeader";

export function StudentEntryPage() {
  const [code, setCode] = useState("");

  const openExam = () => {
    if (code.trim()) window.location.href = `/exam/${code.trim().toUpperCase()}`;
  };

  return (
    <div className="min-h-screen bg-canvas">
      <BrandHeader />
      <main className="mx-auto grid max-w-5xl gap-10 px-6 py-14 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal">Student portal</p>
          <h2 className="mt-3 text-4xl font-bold leading-tight text-navy">Enter your exam code to begin.</h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">Your administrator will provide an exam code or direct link. Each question advances after 25 seconds.</p>
          <a className="mt-8 inline-block text-sm font-bold text-teal underline" href="/admin">Admin login</a>
        </section>
        <section className="rounded-2xl bg-white p-8 shadow-panel">
          <h3 className="text-xl font-bold text-navy">Exam code</h3>
          <input className="mt-5 w-full rounded-lg border border-slate-300 px-4 py-4 text-center text-2xl font-bold uppercase tracking-widest" value={code} onChange={(event) => setCode(event.target.value)} placeholder="ABC123" />
          <button onClick={openExam} className="mt-5 w-full rounded-lg bg-teal px-6 py-4 font-bold text-white hover:bg-teal/90">Continue</button>
        </section>
      </main>
    </div>
  );
}
