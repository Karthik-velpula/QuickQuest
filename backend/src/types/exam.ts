import type { Question } from "./question.js";

export interface StoredQuestion extends Question {
  id: string;
  correctAnswer: string;
}

export interface PublicQuestion {
  id: string;
  question: string;
  options: string[];
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
