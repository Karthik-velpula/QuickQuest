import { BrandHeader } from "../components/BrandHeader";

export function LoginChoicePage() {
  return (
    <div className="min-h-screen bg-canvas">
      <BrandHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <section className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal">Choose portal</p>
          <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">How do you want to login?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Select admin to create and manage exams, or student to register, login, and attend available exams.
          </p>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <a href="/student" className="rounded-2xl bg-white p-8 shadow-panel transition hover:-translate-y-1 hover:shadow-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal">Student</p>
            <h3 className="mt-3 text-2xl font-bold text-navy">Student Login</h3>
            <p className="mt-3 leading-7 text-slate-600">Create an account, login with username and password, and start assigned exams.</p>
            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">URL: /student</p>
            <span className="mt-6 inline-block rounded-lg bg-teal px-5 py-3 font-bold text-white">Continue as Student</span>
          </a>

          <a href="/admin" className="rounded-2xl bg-white p-8 shadow-panel transition hover:-translate-y-1 hover:shadow-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal">Admin</p>
            <h3 className="mt-3 text-2xl font-bold text-navy">Admin Login</h3>
            <p className="mt-3 leading-7 text-slate-600">Upload question files, create exams, delete tests, and view student results.</p>
            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">URL: /admin</p>
            <span className="mt-6 inline-block rounded-lg bg-navy px-5 py-3 font-bold text-white">Continue as Admin</span>
          </a>
        </section>
      </main>
    </div>
  );
}
