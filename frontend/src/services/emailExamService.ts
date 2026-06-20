import type { EmailExamListSummary, EmailExamResult, EmailExamSummary } from "../types/exam";

const API = "/api";

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as unknown;
  const message = typeof data === "object" && data !== null && "message" in data ? String(data.message) : "Request failed.";
  if (!response.ok) throw new Error(message);
  return data as T;
}

export async function createEmailExam(token: string, title: string, prompt: string, modelAnswer: string): Promise<{ code: string; title: string; examUrl: string; createdAt: string }> {
  const response = await fetch(`${API}/email-exams/admin/create`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ title, prompt, modelAnswer }),
  });
  return readJson<{ code: string; title: string; examUrl: string; createdAt: string }>(response);
}

export async function getEmailExam(code: string): Promise<EmailExamSummary> {
  const response = await fetch(`${API}/email-exams/${code}`);
  return readJson<EmailExamSummary>(response);
}

export async function submitEmailExam(code: string, studentName: string, answer: string): Promise<EmailExamResult> {
  const response = await fetch(`${API}/email-exams/${code}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentName, answer }),
  });
  const data = await readJson<{ feedback: EmailExamResult["feedback"] }>(response);
  return { feedback: data.feedback };
}

export async function getAdminEmailExams(token: string): Promise<EmailExamListSummary[]> {
  const response = await fetch(`${API}/email-exams/admin`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await readJson<{ exams: Array<{ code: string; title: string; createdAt: string }> }>(response);
  return data.exams.map((exam) => ({ ...exam, examType: "email" }));
}

export async function clearAdminEmailExamResults(token: string, code: string): Promise<void> {
  const response = await fetch(`${API}/email-exams/admin/${code}/results`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  await readJson<{ message: string }>(response);
}

export async function deleteAdminEmailExam(token: string, code: string): Promise<void> {
  const response = await fetch(`${API}/email-exams/admin/${code}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  await readJson<{ message: string }>(response);
}
