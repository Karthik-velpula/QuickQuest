export interface Question {
  id: string;
  questionNumber?: number;
  passage?: string;
  question: string;
  options: string[];
}

export interface PublicExam {
  code: string;
  title: string;
  questions: Question[];
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

export interface StudentProfile {
  username: string;
  displayName: string;
}

export interface StudentSession {
  token: string;
  student: StudentProfile;
}

export interface AnswerRecord {
  questionId: string;
  selectedAnswer: string | null;
}

export interface AttemptSummary {
  id: string;
  rank?: number;
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
  questionNumber?: number;
  passage?: string;
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
