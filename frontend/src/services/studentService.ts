import type { StudentSession } from "../types/exam";

const API = "/api";
const SESSION_KEY = "quickquest.studentSession";
const PENDING_EXAM_KEY = "quickquest.pendingExamPath";

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as unknown;
  const message = typeof data === "object" && data !== null && "message" in data ? String(data.message) : "Request failed.";
  if (!response.ok) throw new Error(message);
  return data as T;
}

export async function registerStudent(username: string, password: string, displayName: string): Promise<StudentSession> {
  const response = await fetch(`${API}/students/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, displayName }),
  });
  return readJson<StudentSession>(response);
}

export async function loginStudent(username: string, password: string): Promise<StudentSession> {
  const response = await fetch(`${API}/students/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return readJson<StudentSession>(response);
}

export function saveStudentSession(session: StudentSession): void {
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSavedStudentSession(): StudentSession | null {
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StudentSession;
  } catch {
    window.sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearStudentSession(): void {
  window.sessionStorage.removeItem(SESSION_KEY);
}

export function savePendingExamPath(path: string): void {
  window.sessionStorage.setItem(PENDING_EXAM_KEY, path);
}

export function getPendingExamPath(): string | null {
  return window.sessionStorage.getItem(PENDING_EXAM_KEY);
}

export function clearPendingExamPath(): void {
  window.sessionStorage.removeItem(PENDING_EXAM_KEY);
}
