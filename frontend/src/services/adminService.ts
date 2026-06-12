import type { AdminExamListSummary, AdminExamSummary } from "../types/exam";
import type { Question } from "../types/exam";

const API = "/api";

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as unknown;
  const message = typeof data === "object" && data !== null && "message" in data ? String(data.message) : "Request failed.";
  if (!response.ok) throw new Error(message);
  return data as T;
}

export async function loginAdmin(username: string, password: string): Promise<string> {
  const response = await fetch(`${API}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await readJson<{ token: string }>(response);
  return data.token;
}

export async function createAdminExam(token: string, file: File, title: string, answerKey: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  formData.append("answerKey", answerKey);

  const response = await fetch(`${API}/admin/exams`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return readJson<{ code: string; title: string; questionCount: number; examUrl: string }>(response);
}

export async function previewQuestionFile(token: string, file: File): Promise<Question[]> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API}/admin/questions/preview`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await readJson<{ count: number; questions: Question[] }>(response);
  return data.questions;
}

export async function getAdminExam(token: string, code: string): Promise<AdminExamSummary> {
  const response = await fetch(`${API}/admin/exams/${code}`, { headers: { Authorization: `Bearer ${token}` } });
  return readJson<AdminExamSummary>(response);
}

export async function getAdminExams(token: string): Promise<AdminExamListSummary[]> {
  const response = await fetch(`${API}/admin/exams`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await readJson<{ exams: AdminExamListSummary[] }>(response);
  return data.exams;
}

export async function deleteAdminExam(token: string, code: string): Promise<void> {
  const response = await fetch(`${API}/admin/exams/${code}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  await readJson<{ message: string }>(response);
}
