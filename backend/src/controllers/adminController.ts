import type { Request, Response } from "express";
import PDFDocument from "pdfkit";
import { login } from "../services/authService.js";
import { clearExamResults, createExam, deleteExam, getExam, listAdminExams } from "../services/examStore.js";
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

export async function clearAdminExamResults(request: Request, response: Response): Promise<void> {
  const cleared = await clearExamResults(String(request.params.code ?? ""));
  if (!cleared) {
    response.status(404).json({ message: "Exam not found or has no results." });
    return;
  }
  response.json({ message: "Exam results cleared." });
}

export async function downloadAdminExamPdf(request: Request, response: Response): Promise<void> {
  const exam = await getExam(String(request.params.code ?? ""));
  if (!exam) {
    response.status(404).json({ message: "Exam not found or expired." });
    return;
  }

  response.setHeader("Content-Type", "application/pdf");
  response.setHeader("Content-Disposition", `attachment; filename="${exam.title.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "exam"}_results.pdf"`);

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(response);

  doc.fontSize(18).fillColor("#0f172a").text(exam.title, { align: "left" });
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor("#475569").text(`Code: ${exam.code}`);
  doc.text(`Questions: ${exam.questions.length}`);
  doc.text(`Attempts: ${exam.attempts.length}`);
  doc.text(`Created: ${new Date(exam.createdAt).toLocaleString()}`);
  doc.moveDown(1);

  const tableTop = doc.y;
  const cols = [40, 80, 200, 280, 340, 400, 470, 540];
  const headers = ["Rank", "Student", "Attempted", "Correct", "Wrong", "Score", "Submitted"];

  doc.fontSize(9).fillColor("#334155");
  headers.forEach((header, index) => doc.text(header, cols[index], tableTop, { width: index === 1 ? 110 : 60 }));
  doc.moveTo(40, tableTop + 14).lineTo(555, tableTop + 14).strokeColor("#cbd5e1").stroke();

  let rowY = tableTop + 22;
  exam.attempts.forEach((attempt, index) => {
    const scoreColor = attempt.percentage < 50 ? "#dc2626" : "#0f766e";
    doc.fillColor("#0f172a").text(`#${attempt.rank ?? "-"}`, cols[0], rowY, { width: 30 });
    doc.text(attempt.studentName, cols[1], rowY, { width: 110 });
    doc.text(`${attempt.attempted}/${attempt.total}`, cols[2], rowY, { width: 50 });
    doc.text(String(attempt.correct), cols[3], rowY, { width: 40 });
    doc.text(String(attempt.incorrect), cols[4], rowY, { width: 40 });
    doc.fillColor(scoreColor).text(`${attempt.percentage}%`, cols[5], rowY, { width: 45 });
    doc.fillColor("#0f172a").text(new Date(attempt.submittedAt).toLocaleString(), cols[6], rowY, { width: 75 });
    rowY += 18;
    if (rowY > 750) {
      doc.addPage();
      rowY = 40;
    }
  });

  doc.end();
}
