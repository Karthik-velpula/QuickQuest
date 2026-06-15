import type { AnswerRecord, AttemptSummary, PublicExam, PublicExamSummary, QuestionReview } from "../types/exam";

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as unknown;
  const message = typeof data === "object" && data !== null && "message" in data ? String(data.message) : "Request failed.";
  if (!response.ok) throw new Error(message);
  return data as T;
}

export async function getPublicExam(code: string): Promise<PublicExam> {
  const response = await fetch(`/api/exams/${code}`);
  return readJson<PublicExam>(response);
}

export async function getAvailableExams(): Promise<PublicExamSummary[]> {
  const response = await fetch("/api/exams");
  const data = await readJson<{ exams: PublicExamSummary[] }>(response);
  return data.exams;
}

export async function submitAttempt(code: string, token: string, answers: AnswerRecord[]): Promise<{ attempt: AttemptSummary; review: QuestionReview[] }> {
  const response = await fetch(`/api/exams/${code}/attempts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ answers }),
  });
  const data = await readJson<{ message: string; attempt: AttemptSummary; review: QuestionReview[] }>(response);
  return { attempt: data.attempt, review: data.review };
}
