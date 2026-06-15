const ANSWER_KEY_LINE = /^\s*(?:(?:question|q)\s*)?(\d+)\s*[.)\-:–—]\s*([A-D])\s*$/i;
const COMPACT_KEY_LINE = /(?:^|\s|\|)\s*(?:(?:question|q)\s*)?(\d+)\s*[.)\-:–—>]+\s*([A-D])\b/gi;

export function parseAnswerKey(rawAnswerKey: string, totalQuestions: number): Map<number, string> {
  const answers = new Map<number, string>();
  const normalized = rawAnswerKey.replace(/[–—]/g, "-");

  normalized
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const match = line.match(ANSWER_KEY_LINE);
      if (match) answers.set(Number(match[1]), (match[2] as string).toUpperCase());
    });

  for (const match of normalized.matchAll(COMPACT_KEY_LINE)) {
    answers.set(Number(match[1]), (match[2] as string).toUpperCase());
  }

  for (let questionNumber = 1; questionNumber <= totalQuestions; questionNumber += 1) {
    if (!answers.has(questionNumber)) {
      throw new Error(`Missing answer for question ${questionNumber}. Use lines like "1. B" or "1–B | 2–A".`);
    }
  }

  return answers;
}
