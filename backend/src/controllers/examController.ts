import type { Request, Response } from "express";
import { getExamQuestions, getPublicExam, getStudentByToken, listPublicExams, submitAttempt } from "../services/examStore.js";
import type { SubmittedAnswer } from "../types/exam.js";

export async function listExamsForStudents(_request: Request, response: Response): Promise<void> {
  response.json({ exams: await listPublicExams() });
}

export async function getExamForStudent(request: Request, response: Response): Promise<void> {
  const exam = await getPublicExam(String(request.params.code ?? ""));
  if (!exam) {
    response.status(404).json({ message: "Exam not found or expired." });
    return;
  }
  response.json(exam);
}

export async function submitStudentAttempt(request: Request, response: Response): Promise<void> {
  const code = String(request.params.code ?? "");
  const token = request.header("authorization")?.replace(/^Bearer\s+/i, "");
  const student = await getStudentByToken(token);
  if (!student) {
    response.status(401).json({ message: "Student login required before submitting exam." });
    return;
  }
  const { answers = [] } = request.body as { answers?: SubmittedAnswer[] };
  const attempt = await submitAttempt(code, `${student.displayName} (${student.username})`, answers);
  if (!attempt) {
    response.status(404).json({ message: "Exam not found or expired." });
    return;
  }
  const exam = await getExamQuestions(code);
  const selectedByQuestion = new Map(attempt.answers.map((answer) => [answer.questionId, answer.selectedAnswer]));
  const review = exam?.questions.map((question) => {
    const selectedAnswer = selectedByQuestion.get(question.id) ?? null;
    return {
      questionId: question.id,
      questionNumber: question.questionNumber,
      passage: question.passage,
      question: question.question,
      options: question.options,
      selectedAnswer,
      correctAnswer: question.correctAnswer,
      status: selectedAnswer === null ? "unanswered" : selectedAnswer === question.correctAnswer ? "correct" : "wrong",
    };
  }) ?? [];

  response.status(201).json({ message: "Attempt submitted.", attempt, review });
}
