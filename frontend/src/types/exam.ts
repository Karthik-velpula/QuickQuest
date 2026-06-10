export interface Question {
  id: string;
  question: string;
  options: string[];
}

export interface PublicExam {
  code: string;
  title: string;
  questions: Question[];
}

export interface AnswerRecord {
  questionId: string;
  selectedAnswer: string | null;
}

export interface AttemptSummary {
  id: string;
  studentName: string;
  submittedAt: string;
  total: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  percentage: number;
}

export interface QuestionReview {
  questionId: string;
  question: string;
  options: string[];
  selectedAnswer: string | null;
  correctAnswer: string;
  status: "correct" | "wrong" | "unanswered";
}

export interface AdminExamSummary {
  code: string;
  title: string;
  questionCount: number;
  createdAt: string;
  attempts: AttemptSummary[];
}
