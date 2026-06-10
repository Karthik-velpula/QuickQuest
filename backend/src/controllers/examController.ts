import type { Request, Response } from "express";
import { getExam, getPublicExam, submitAttempt } from "../services/examStore.js";
import type { SubmittedAnswer } from "../types/exam.js";

export function getExamForStudent(request: Request, response: Response): void {
  const exam = getPublicExam(String(request.params.code ?? ""));
  if (!exam) {
    response.status(404).json({ message: "Exam not found or expired." });
    return;
  }
  response.json(exam);
}

export function submitStudentAttempt(request: Request, response: Response): void {
  const code = String(request.params.code ?? "");
  const { studentName = "", answers = [] } = request.body as { studentName?: string; answers?: SubmittedAnswer[] };
  const attempt = submitAttempt(code, studentName, answers);
  if (!attempt) {
    response.status(404).json({ message: "Exam not found or expired." });
    return;
  }
  const exam = getExam(code);
  const selectedByQuestion = new Map(attempt.answers.map((answer) => [answer.questionId, answer.selectedAnswer]));
  const review = exam?.questions.map((question) => {
    const selectedAnswer = selectedByQuestion.get(question.id) ?? null;
    return {
      questionId: question.id,
      question: question.question,
      options: question.options,
      selectedAnswer,
      correctAnswer: question.correctAnswer,
      status: selectedAnswer === null ? "unanswered" : selectedAnswer === question.correctAnswer ? "correct" : "wrong",
    };
  }) ?? [];

  response.status(201).json({ message: "Attempt submitted.", attempt, review });
}
