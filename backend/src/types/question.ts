export interface Question {
  questionNumber?: number;
  passage?: string;
  readingComprehension?: boolean;
  question: string;
  options: string[];
}
