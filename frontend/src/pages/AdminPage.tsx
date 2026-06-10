import { useMemo, useState } from "react";
import { BrandHeader } from "../components/BrandHeader";
import { createAdminExam, getAdminExam, loginAdmin, previewQuestionFile } from "../services/adminService";
import type { AdminExamSummary, Question } from "../types/exam";

export function AdminPage() {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [title, setTitle] = useState("");
  const [answerKey, setAnswerKey] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);
  const [createdCode, setCreatedCode] = useState("");
  const [lookupCode, setLookupCode] = useState("");
  const [examSummary, setExamSummary] = useState<AdminExamSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const examLink = useMemo(() => (createdCode ? `${window.location.origin}/exam/${createdCode}` : ""), [createdCode]);
  const answerLines = useMemo(() => answerKey.split("\n").map((line) => line.trim()).filter(Boolean).length, [answerKey]);

  const login = async () => {
    setError("");
    setLoading(true);
    try {
      setToken(await loginAdmin(username, password));
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const createExam = async () => {
    if (!file) {
      setError("Choose a question document first.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const created = await createAdminExam(token, file, title, answerKey);
      setCreatedCode(created.code);
      setLookupCode(created.code);
      setExamSummary(await getAdminExam(token, created.code));
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create exam.");
    } finally {
      setLoading(false);
    }
  };

  const previewFile = async (selectedFile: File | null) => {
    setFile(selectedFile);
    setPreviewQuestions([]);
    setCreatedCode("");
    setExamSummary(null);
    if (!selectedFile) return;

    setError("");
    setLoading(true);
    try {
      const questions = await previewQuestionFile(token, selectedFile);
      setPreviewQuestions(questions);
      setTitle((current) => current || selectedFile.name.replace(/\.[^.]+$/, ""));
      setAnswerKey(questions.map((_, index) => `${index + 1}. `).join("\n"));
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Unable to preview questions.");
    } finally {
      setLoading(false);
    }
  };

  const refreshAttempts = async () => {
    setError("");
    setLoading(true);
    try {
      setExamSummary(await getAdminExam(token, lookupCode));
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to load exam.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      <BrandHeader />
      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl bg-white p-8 shadow-panel">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal">Admin</p>
          <h2 className="mt-3 text-3xl font-bold text-navy">Create a temporary exam</h2>
          {!token ? (
            <div className="mt-8 grid gap-4">
              <input className="rounded-lg border border-slate-300 px-4 py-3" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" />
              <input className="rounded-lg border border-slate-300 px-4 py-3" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
              <button onClick={() => void login()} className="rounded-lg bg-teal px-5 py-3 font-bold text-white hover:bg-teal/90">{loading ? "Logging in..." : "Login"}</button>
            </div>
          ) : (
            <div className="mt-8 grid gap-5">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Exam title
                <input className="rounded-lg border border-slate-300 px-4 py-3 font-normal" value={title} onChange={(event) => setTitle(event.target.value)} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Question document
                <input className="rounded-lg border border-slate-300 px-4 py-3 font-normal" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={(event) => void previewFile(event.target.files?.[0] ?? null)} />
              </label>
              {previewQuestions.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-navy">Preview extracted by admin</p>
                      <p className="text-xs text-slate-500">{previewQuestions.length} questions found. Check this before creating the exam.</p>
                    </div>
                    <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">{previewQuestions.length} total</span>
                  </div>
                  <div className="mt-4 max-h-96 space-y-4 overflow-auto pr-2">
                    {previewQuestions.map((question, questionIndex) => (
                      <article key={`${question.question}-${questionIndex}`} className="rounded-lg bg-white p-4 text-sm shadow-sm">
                        <p className="font-bold text-navy">Q{questionIndex + 1}. {question.question}</p>
                        <ol className="mt-3 grid gap-2 text-slate-700">
                          {question.options.map((option, optionIndex) => (
                            <li key={option}>{String.fromCharCode(65 + optionIndex)}. {option}</li>
                          ))}
                        </ol>
                      </article>
                    ))}
                  </div>
                </div>
              )}
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Correct answers
                <textarea
                  className="min-h-56 rounded-lg border border-slate-300 px-4 py-3 font-mono text-sm font-normal"
                  value={answerKey}
                  onChange={(event) => setAnswerKey(event.target.value)}
                  placeholder={"1. B\n2. C\n3. A"}
                />
                {previewQuestions.length > 0 && (
                  <span className={`text-xs ${answerLines === previewQuestions.length ? "text-teal" : "text-amber-600"}`}>
                    {answerLines}/{previewQuestions.length} answer lines filled. Use one line per displayed question.
                  </span>
                )}
              </label>
              <button disabled={!previewQuestions.length} onClick={() => void createExam()} className="rounded-lg bg-teal px-5 py-3 font-bold text-white hover:bg-teal/90 disabled:opacity-40">{loading ? "Working..." : "Create exam link after checking preview"}</button>
              {examLink && (
                <div className="rounded-xl bg-teal/10 p-4">
                  <p className="text-sm font-bold text-navy">Exam code: {createdCode}</p>
                  <a className="mt-2 block break-all text-sm font-semibold text-teal underline" href={examLink}>{examLink}</a>
                </div>
              )}
            </div>
          )}
          {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </section>

        <section className="rounded-2xl bg-white p-8 shadow-panel">
          <h2 className="text-2xl font-bold text-navy">Attempts</h2>
          <div className="mt-5 flex gap-3">
            <input className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 uppercase" value={lookupCode} onChange={(event) => setLookupCode(event.target.value.toUpperCase())} placeholder="Exam code" />
            <button disabled={!token} onClick={() => void refreshAttempts()} className="rounded-lg bg-navy px-5 py-3 font-bold text-white disabled:opacity-40">Refresh</button>
          </div>
          {examSummary && (
            <div className="mt-6">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="font-bold text-navy">{examSummary.title}</p>
                <p className="text-sm text-slate-500">{examSummary.questionCount} questions · {examSummary.attempts.length} attempts</p>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-3 py-3">Student</th>
                      <th className="px-3 py-3">Attempted</th>
                      <th className="px-3 py-3">Correct</th>
                      <th className="px-3 py-3">Wrong</th>
                      <th className="px-3 py-3">Score</th>
                      <th className="px-3 py-3">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examSummary.attempts.map((attempt) => (
                      <tr key={attempt.id} className="border-b border-slate-100">
                        <td className="px-3 py-3 font-semibold text-navy">{attempt.studentName}</td>
                        <td className="px-3 py-3">{attempt.attempted}/{attempt.total}</td>
                        <td className="px-3 py-3">{attempt.correct}</td>
                        <td className="px-3 py-3">{attempt.incorrect}</td>
                        <td className="px-3 py-3">{attempt.percentage}%</td>
                        <td className="px-3 py-3">{new Date(attempt.submittedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
