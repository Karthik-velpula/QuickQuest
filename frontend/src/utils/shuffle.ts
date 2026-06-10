import type { Question } from "../types/exam";

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex] as T, copy[index] as T];
  }
  return copy;
}

export function prepareQuestions(questions: Question[]): Question[] {
  return shuffle(questions).map((question) => ({ ...question, options: shuffle(question.options) }));
}
