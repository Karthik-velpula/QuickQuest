import type { Request, Response } from "express";
import { clearEmailExamResults, createEmailExam, deleteEmailExam, getEmailExam, listEmailExams, submitEmailExam } from "../services/examStore.js";

export async function createEmailExamFromAdmin(request: Request, response: Response): Promise<void> {
  const { title = "Email Writing Assessment", prompt = "", modelAnswer = "" } = request.body as {
    title?: string;
    prompt?: string;
    modelAnswer?: string;
  };
  if (!String(prompt).trim()) {
    response.status(400).json({ message: "Email prompt is required." });
    return;
  }

  const exam = await createEmailExam(String(title), String(prompt), String(modelAnswer).trim() || null);
  response.status(201).json({
    code: exam.code,
    title: exam.title,
    examUrl: `/email-exam/${exam.code}`,
    createdAt: exam.createdAt,
  });
}

export async function listAdminEmailExams(_request: Request, response: Response): Promise<void> {
  response.json({ exams: await listEmailExams() });
}

export async function clearAdminEmailExamResults(request: Request, response: Response): Promise<void> {
  const cleared = await clearEmailExamResults(String(request.params.code ?? ""));
  if (!cleared) {
    response.status(404).json({ message: "Email exam not found or has no results." });
    return;
  }
  response.json({ message: "Email exam results cleared." });
}

export async function deleteAdminEmailExam(request: Request, response: Response): Promise<void> {
  const deleted = await deleteEmailExam(String(request.params.code ?? ""));
  if (!deleted) {
    response.status(404).json({ message: "Email exam not found." });
    return;
  }
  response.json({ message: "Email exam deleted." });
}

export async function getEmailExamForStudent(request: Request, response: Response): Promise<void> {
  const exam = await getEmailExam(String(request.params.code ?? ""));
  if (!exam) {
    response.status(404).json({ message: "Email exam not found or expired." });
    return;
  }
  response.json(exam);
}

export async function submitEmailExamForStudent(request: Request, response: Response): Promise<void> {
  const { code } = request.params;
  const { studentName = "Anonymous Student", answer = "" } = request.body as { studentName?: string; answer?: string };
  if (!String(answer).trim()) {
    response.status(400).json({ message: "Email answer is required." });
    return;
  }
  const submitted = await submitEmailExam(String(code ?? ""), String(studentName), String(answer));
  if (!submitted) {
    response.status(404).json({ message: "Email exam not found or expired." });
    return;
  }
  response.status(201).json({ message: "Email answer submitted.", ...submitted });
}
