import type { Question } from "./question.js";

export interface StoredQuestion extends Question {
  id: string;
  correctAnswer: string;
}

export interface PublicQuestion {
  id: string;
  questionNumber?: number;
  passage?: string;
  question: string;
  options: string[];
}

export interface PublicExamSummary {
  code: string;
  title: string;
  questionCount: number;
  createdAt: string;
}

export interface AdminExamListSummary extends PublicExamSummary {
  attemptCount: number;
}

export interface Exam {
  code: string;
  title: string;
  questions: StoredQuestion[];
  createdAt: string;
  attempts: Attempt[];
}

export interface SubmittedAnswer {
  questionId: string;
  selectedAnswer: string | null;
}

export interface Attempt {
  id: string;
  rank?: number;
  studentName: string;
  submittedAt: string;
  answers: SubmittedAnswer[];
  total: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  percentage: number;
}
