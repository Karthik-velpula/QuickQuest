import { useEffect, useMemo, useState } from "react";
import { BrandHeader } from "../components/BrandHeader";
import { clearAdminExamResults, createAdminExam, deleteAdminExam, getAdminExam, getAdminExams, loginAdmin, previewQuestionFile } from "../services/adminService";
import type { AdminExamListSummary, AdminExamSummary, Question } from "../types/exam";

export function AdminPage() {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [answerKey, setAnswerKey] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);
  const [createdCode, setCreatedCode] = useState("");
  const [lookupCode, setLookupCode] = useState("");
  const [examSummary, setExamSummary] = useState<AdminExamSummary | null>(null);
  const [createdTests, setCreatedTests] = useState<AdminExamListSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshingResults, setRefreshingResults] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const examLink = useMemo(() => (createdCode ? `${window.location.origin}/exam/${createdCode}` : ""), [createdCode]);
  const answerLines = useMemo(() => {
    const normalized = answerKey.replace(/[–—]/g, "-");
    const lineCount = normalized.split("\n").map((line) => line.trim()).filter(Boolean).length;
    const compactCount = (normalized.match(/(?:^|\s|\|)\s*(?:\d+)\s*[.)\-:>]+\s*[A-D]\b/gi) ?? []).length;
    return Math.max(lineCount, compactCount);
  }, [answerKey]);
  const getScoreTone = (percentage: number) => (percentage < 50 ? "text-red-600" : "text-teal");

  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));

  useEffect(() => {
    if (!token || !lookupCode || !examSummary) return;
    const interval = window.setInterval(() => {
      void refreshAttempts();
    }, 10000);
    return () => window.clearInterval(interval);
  }, [token, lookupCode, examSummary]);

  const login = async () => {
    setError("");
    setLoading(true);
    try {
      const adminToken = await loginAdmin(username, password);
      setToken(adminToken);
      setCreatedTests(await getAdminExams(adminToken));
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
      setCreatedTests(await getAdminExams(token));
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
    setRefreshingResults(true);
    try {
      setExamSummary(await getAdminExam(token, lookupCode));
      setLastRefreshedAt(new Date().toLocaleTimeString());
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to load exam.");
    } finally {
      setRefreshingResults(false);
    }
  };

  const logout = () => {
    setToken("");
    setPassword("");
    setCreatedTests([]);
    setExamSummary(null);
    setCreatedCode("");
    setLookupCode("");
    setPreviewQuestions([]);
    setFile(null);
    setError("");
  };

  const refreshCreatedTests = async () => {
    setError("");
    setLoading(true);
    try {
      setCreatedTests(await getAdminExams(token));
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to load created tests.");
    } finally {
      setLoading(false);
    }
  };

  const showResults = async (code: string) => {
    setLookupCode(code);
    setError("");
    setLoading(true);
    try {
      setExamSummary(await getAdminExam(token, code));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load results.");
    } finally {
      setLoading(false);
    }
  };

  const downloadResultsPdf = async (code: string) => {
    setLookupCode(code);
    setError("");
    setLoading(true);
    try {
      const summary = await getAdminExam(token, code);
      const html = `
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${summary.title} Results</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 32px; color: #1f2937; }
              h1 { margin: 0 0 8px; color: #0f172a; }
              .meta { color: #64748b; margin-bottom: 24px; }
              table { width: 100%; border-collapse: collapse; margin-top: 16px; }
              th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 8px; text-align: left; font-size: 14px; }
              th { background: #f8fafc; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
              .high { color: #0f766e; font-weight: 700; }
              .low { color: #dc2626; font-weight: 700; }
            </style>
          </head>
          <body>
            <h1>${summary.title}</h1>
            <div class="meta">Code: ${summary.code} · Questions: ${summary.questionCount} · Attempts: ${summary.attempts.length} · Created: ${formatDateTime(createdTests.find((test) => test.code === summary.code)?.createdAt ?? new Date().toISOString())}</div>
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student</th>
                  <th>Attempted</th>
                  <th>Correct</th>
                  <th>Wrong</th>
                  <th>Score</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                ${summary.attempts
                  .map(
                    (attempt) => `
                      <tr>
                        <td>#${attempt.rank ?? "-"}</td>
                        <td>${attempt.studentName}</td>
                        <td>${attempt.attempted}/${attempt.total}</td>
                        <td>${attempt.correct}</td>
                        <td>${attempt.incorrect}</td>
                        <td class="${attempt.percentage < 50 ? "low" : "high"}">${attempt.percentage}%</td>
                        <td>${new Date(attempt.submittedAt).toLocaleString()}</td>
                      </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>
            <script>
              window.onload = () => {
                window.print();
                setTimeout(() => window.close(), 250);
              };
            </script>
          </body>
        </html>`;
      const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900");
      if (!printWindow) {
        setError("Popup blocked. Allow popups to download the PDF.");
        return;
      }
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to prepare PDF.");
    } finally {
      setLoading(false);
    }
  };

  const removeExam = async (code: string) => {
    if (!window.confirm(`Delete exam ${code}? This will also delete its questions and results.`)) return;
    setError("");
    setLoading(true);
    try {
      await deleteAdminExam(token, code);
      setCreatedTests((tests) => tests.filter((test) => test.code !== code));
      if (lookupCode === code) setLookupCode("");
      if (examSummary?.code === code) setExamSummary(null);
      if (createdCode === code) setCreatedCode("");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete exam.");
    } finally {
      setLoading(false);
    }
  };

  const clearResults = async (code: string) => {
    if (!window.confirm(`Clear all results for exam ${code}? The exam and questions will stay, but student attempts will be removed.`)) return;
    setError("");
    setLoading(true);
    try {
      await clearAdminExamResults(token, code);
      if (lookupCode === code) {
        setExamSummary(await getAdminExam(token, code));
        setLastRefreshedAt(new Date().toLocaleTimeString());
      }
      setCreatedTests(await getAdminExams(token));
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Unable to clear results.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      <BrandHeader />
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl bg-white p-5 shadow-panel sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal">Admin</p>
              <h2 className="mt-3 text-2xl font-bold text-navy sm:text-3xl">Create a temporary exam</h2>
              <p className="mt-3 w-fit rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">Admin URL: /admin</p>
              {!token && <a className="mt-3 inline-block text-sm font-bold text-teal underline" href="/">Choose student or admin login</a>}
            </div>
            {token && (
              <button onClick={logout} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-navy hover:bg-slate-50">
                Logout
              </button>
            )}
          </div>
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
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">Document Q{question.questionNumber ?? questionIndex + 1}</p>
                        {question.passage && (
                          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-6 text-slate-600">
                            <p className="mb-2 font-bold uppercase tracking-[0.18em] text-slate-400">Passage</p>
                            {question.passage.split(/\n+/).map((line, lineIndex) => (
                              <p key={`${line}-${lineIndex}`}>{line}</p>
                            ))}
                          </div>
                        )}
                        <p className="mt-2 font-bold text-navy">Q{questionIndex + 1}. {question.question}</p>
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
                    {answerLines}/{previewQuestions.length} answers detected. Use one line per question, or compact form like 1–B | 2–C.
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

        <section className="rounded-2xl bg-white p-5 shadow-panel sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-navy">Created MCQ tests</h2>
              <p className="mt-1 text-sm text-slate-500">Delete tests or open results from here.</p>
            </div>
            <button disabled={!token} onClick={() => void refreshCreatedTests()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-navy disabled:opacity-40">Refresh</button>
          </div>

          {token && (
            <div className="mt-5 grid gap-3">
              {createdTests.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No tests created yet.</p>
              ) : (
                createdTests.map((test) => (
                  <article key={test.code} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-bold text-navy">{test.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Code {test.code} · {test.questionCount} questions · {test.attemptCount} attempts
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Created {formatDateTime(test.createdAt)}
                        </p>
                        <a className="mt-2 block break-all text-xs font-semibold text-teal underline" href={`${window.location.origin}/exam/${test.code}`}>
                          {window.location.origin}/exam/{test.code}
                        </a>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => void showResults(test.code)} className="rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white">Show results</button>
                        <button onClick={() => void downloadResultsPdf(test.code)} className="rounded-lg border border-teal px-4 py-2 text-sm font-bold text-teal hover:bg-teal/10">Download PDF</button>
                        <button onClick={() => void clearResults(test.code)} className="rounded-lg border border-amber-200 px-4 py-2 text-sm font-bold text-amber-700 hover:bg-amber-50">Clear results</button>
                        <button onClick={() => void removeExam(test.code)} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50">Delete</button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          <div className="mt-8 border-t border-slate-200 pt-8">
            <h2 className="text-2xl font-bold text-navy">Results</h2>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 uppercase" value={lookupCode} onChange={(event) => setLookupCode(event.target.value.toUpperCase())} placeholder="Exam code" />
              <button disabled={!token || refreshingResults} onClick={() => void refreshAttempts()} className="rounded-lg bg-navy px-5 py-3 font-bold text-white disabled:opacity-40">
                {refreshingResults ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            {lookupCode && (
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {refreshingResults
                  ? "Refreshing results now..."
                  : lastRefreshedAt
                    ? `Last refreshed at ${lastRefreshedAt}`
                    : "Press Refresh to load the latest results."}
              </p>
            )}
          </div>
          {examSummary && (
            <div className="mt-6">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="font-bold text-navy">{examSummary.title}</p>
                <p className="text-sm text-slate-500">{examSummary.questionCount} questions · {examSummary.attempts.length} attempts</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Created {formatDateTime(createdTests.find((test) => test.code === examSummary.code)?.createdAt ?? new Date().toISOString())}</p>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-3 py-3">Rank</th>
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
                        <td className="px-3 py-3 font-bold text-teal">#{attempt.rank ?? "-"}</td>
                        <td className="px-3 py-3 font-semibold text-navy">{attempt.studentName}</td>
                        <td className="px-3 py-3">{attempt.attempted}/{attempt.total}</td>
                        <td className="px-3 py-3">{attempt.correct}</td>
                        <td className="px-3 py-3">{attempt.incorrect}</td>
                        <td className={`px-3 py-3 font-bold ${getScoreTone(attempt.percentage)}`}>{attempt.percentage}%</td>
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
