const ANSWER_KEY_LINE = /^\s*(?:(?:question|q)\s*)?(\d+)\s*[.)\-:]\s*([A-D])\s*$/i;

export function parseAnswerKey(rawAnswerKey: string, totalQuestions: number): Map<number, string> {
  const answers = new Map<number, string>();

  rawAnswerKey
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const match = line.match(ANSWER_KEY_LINE);
      if (match) answers.set(Number(match[1]), (match[2] as string).toUpperCase());
    });

  for (let questionNumber = 1; questionNumber <= totalQuestions; questionNumber += 1) {
    if (!answers.has(questionNumber)) {
      throw new Error(`Missing answer for question ${questionNumber}. Use lines like "1. B".`);
    }
  }

  return answers;
}
