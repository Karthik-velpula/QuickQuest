import type { Request, Response } from "express";
import { login } from "../services/authService.js";
import { createExam, deleteExam, getExam, listAdminExams } from "../services/examStore.js";
import { extractText, hasValidSignature } from "../services/fileTextExtractor.js";
import { extractQuestions } from "../services/questionExtractor.js";

export function adminLogin(request: Request, response: Response): void {
  const { username, password } = request.body as { username?: string; password?: string };
  const token = login(username ?? "", password ?? "");
  if (!token) {
    response.status(401).json({ message: "Invalid admin credentials." });
    return;
  }
  response.json({ token });
}

export async function previewQuestionsFromUpload(request: Request, response: Response): Promise<void> {
  if (!request.file) {
    response.status(400).json({ message: "Choose a supported PDF, DOC, DOCX, PPT, or PPTX file." });
    return;
  }
  if (!hasValidSignature(request.file)) {
    response.status(400).json({ message: "The file contents do not match its extension." });
    return;
  }

  try {
    const text = await extractText(request.file);
    const questions = extractQuestions(text);
    if (!questions.length) {
      response.status(422).json({ message: "No valid questions were found. Check that each numbered question has four A-D options." });
      return;
    }
    response.json({ count: questions.length, questions });
  } catch {
    response.status(422).json({ message: "The document could not be read. It may be damaged or use an unsupported legacy encoding." });
  }
}

export async function createExamFromUpload(request: Request, response: Response): Promise<void> {
  if (!request.file) {
    response.status(400).json({ message: "Choose a supported PDF, DOC, DOCX, PPT, or PPTX file." });
    return;
  }
  if (!hasValidSignature(request.file)) {
    response.status(400).json({ message: "The file contents do not match its extension." });
    return;
  }

  const { title = "Online Assessment", answerKey = "" } = request.body as { title?: string; answerKey?: string };
  try {
    const text = await extractText(request.file);
    const questions = extractQuestions(text);
    if (!questions.length) {
      response.status(422).json({ message: "No valid questions were found. Check that each numbered question has four A-D options." });
      return;
    }

    const exam = await createExam(title, questions, answerKey);
    response.status(201).json({
      code: exam.code,
      title: exam.title,
      questionCount: exam.questions.length,
      examUrl: `/exam/${exam.code}`,
    });
  } catch (error) {
    response.status(422).json({ message: error instanceof Error ? error.message : "Unable to create exam." });
  }
}

export async function getAdminExam(request: Request, response: Response): Promise<void> {
  const exam = await getExam(String(request.params.code ?? ""));
  if (!exam) {
    response.status(404).json({ message: "Exam not found or expired." });
    return;
  }
  response.json({
    code: exam.code,
    title: exam.title,
    questionCount: exam.questions.length,
    createdAt: exam.createdAt,
    attempts: exam.attempts,
  });
}

export async function listAdminCreatedExams(_request: Request, response: Response): Promise<void> {
  response.json({ exams: await listAdminExams() });
}

export async function deleteAdminExam(request: Request, response: Response): Promise<void> {
  const deleted = await deleteExam(String(request.params.code ?? ""));
  if (!deleted) {
    response.status(404).json({ message: "Exam not found." });
    return;
  }
  response.json({ message: "Exam deleted." });
}
