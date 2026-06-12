import { useEffect, useState } from "react";
import { BrandHeader } from "../components/BrandHeader";
import { getAvailableExams } from "../services/examService";
import { clearStudentSession, getSavedStudentSession, loginStudent, registerStudent, saveStudentSession } from "../services/studentService";
import type { PublicExamSummary, StudentSession } from "../types/exam";

type AuthMode = "login" | "register";

export function StudentEntryPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [session, setSession] = useState<StudentSession | null>(() => getSavedStudentSession());
  const [exams, setExams] = useState<PublicExamSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadExams = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      setExams(await getAvailableExams());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load exams.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    void loadExams();
    const refreshId = window.setInterval(() => void loadExams(false), 10000);
    return () => window.clearInterval(refreshId);
  }, [session]);

  const authenticate = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const nextSession = mode === "register"
        ? await registerStudent(username, password, displayName)
        : await loginStudent(username, password);
      saveStudentSession(nextSession);
      setSession(nextSession);
      setPassword("");
      setSuccess(mode === "register"
        ? `Account created. You are logged in as ${nextSession.student.username}.`
        : `Welcome back, ${nextSession.student.username}.`);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to continue.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearStudentSession();
    setSession(null);
    setExams([]);
    setCode("");
    setSuccess("");
  };

  const openExam = () => {
    if (code.trim()) openExamByCode(code.trim().toUpperCase());
  };

  const openExamByCode = (examCode: string) => {
    window.location.href = `/exam/${examCode}`;
  };

  return (
    <div className="min-h-screen bg-canvas">
      <BrandHeader />
      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 sm:py-14 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal">Student portal</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-navy sm:text-4xl">Login and choose your exam.</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">Create a student account once, then login with your username and password to write available exams.</p>
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
            Use your username to login, not your full name.
          </p>
          <p className="mt-5 w-fit rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm">Student URL: /student</p>
          <div className="mt-6 flex flex-wrap gap-5">
            <a className="text-sm font-bold text-teal underline" href="/">Choose portal</a>
            <a className="text-sm font-bold text-teal underline" href="/admin">Admin login</a>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-panel sm:p-8">
          {!session ? (
            <div>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                <button onClick={() => setMode("login")} className={`rounded-lg px-4 py-3 text-sm font-bold ${mode === "login" ? "bg-white text-navy shadow-sm" : "text-slate-500"}`}>Login</button>
                <button onClick={() => setMode("register")} className={`rounded-lg px-4 py-3 text-sm font-bold ${mode === "register" ? "bg-white text-navy shadow-sm" : "text-slate-500"}`}>Create account</button>
              </div>

              <h3 className="mt-6 text-xl font-bold text-navy">{mode === "login" ? "Student login" : "New student account"}</h3>
              {mode === "register" && (
                <label className="mt-5 grid gap-2 text-sm font-semibold text-slate-700">
                  Full name
                  <input className="rounded-lg border border-slate-300 px-4 py-3 font-normal" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Enter your full name" />
                </label>
              )}
              <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
                Username
                <input className="rounded-lg border border-slate-300 px-4 py-3 font-normal" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter your username" />
              </label>
              <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
                Password
                <input className="rounded-lg border border-slate-300 px-4 py-3 font-normal" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 6 characters" type="password" />
              </label>
              <button onClick={() => void authenticate()} className="mt-5 w-full rounded-lg bg-teal px-6 py-4 font-bold text-white hover:bg-teal/90">
                {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal">Logged in as</p>
                  <h3 className="mt-1 text-xl font-bold text-navy">{session.student.displayName}</h3>
                  <p className="mt-1 text-xs text-slate-500">@{session.student.username}</p>
                </div>
                <button onClick={logout} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-navy hover:bg-slate-50">Logout</button>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="font-bold text-navy">Available exams</h4>
                  <button onClick={() => void loadExams()} className="text-sm font-bold text-teal underline">Refresh</button>
                </div>
                {loading && <p className="mt-3 text-sm text-slate-500">Loading exams...</p>}
                {!loading && exams.length === 0 && <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No exams are available yet. Ask admin to create one.</p>}
                <div className="mt-4 grid gap-3">
                  {exams.map((exam) => (
                    <article key={exam.code} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-bold text-navy">{exam.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{exam.questionCount} questions · Code {exam.code}</p>
                        </div>
                        <button onClick={() => openExamByCode(exam.code)} className="rounded-lg bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal/90">Start</button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="mt-8 border-t border-slate-200 pt-6">
                <h4 className="font-bold text-navy">Use exam code</h4>
                <input className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-4 text-center text-xl font-bold uppercase tracking-widest sm:text-2xl" value={code} onChange={(event) => setCode(event.target.value)} placeholder="ABC123" />
                <button onClick={openExam} className="mt-4 w-full rounded-lg bg-navy px-6 py-4 font-bold text-white hover:bg-navy/90">Continue</button>
              </div>
            </div>
          )}
          {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {success && <p role="status" className="mt-5 rounded-lg bg-teal/10 p-3 text-sm font-semibold text-teal">{success}</p>}
        </section>
      </main>
    </div>
  );
}
