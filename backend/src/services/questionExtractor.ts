import type { Question } from "../types/question.js";

const QUESTION_START = /^\s*(?:(?:question|q)\s*)?(\d+)(?:[.)]|:)?\s*(.*)$/i;
const OPTION_LINE = /^\s*([A-D])[.)]\s+(.+)$/i;
const INLINE_OPTION = /([A-D])[.)]\s*([\s\S]*?)(?=\s+[A-D][.)]\s|$)/gi;
const SLIDE_MARKER = /^\s*<<SLIDE\s+\d+>>\s*$/i;
const FALLBACK_QUESTION = /(?:^|\n)\s*(?:question\s+)?(?:q\s*)?(\d+)\s*(?:[.)]|:)?\s*([\s\S]*?)(?=(?:\n\s*(?:question\s+)?(?:q\s*)?\d+\s*(?:[.)]|:)?|\n{2,}|$))/gim;

function parseSeparatedBlock(lines: string[]): Question | null {
  const clean = lines.map((line) => line.trim()).filter(Boolean);
  if (!clean.length) return null;

  const questionLines: string[] = [];
  const options = new Map<string, string>();

  for (const line of clean) {
    const start = line.match(QUESTION_START);
    const option = line.match(OPTION_LINE);
    if (start) {
      const possibleText = start[2]?.trim() ?? "";
      if (possibleText) questionLines.push(possibleText);
    } else if (option) {
      options.set((option[1] as string).toUpperCase(), (option[2] as string).trim());
    } else if (options.size === 0) {
      questionLines.push(line);
    }
  }

  if (!questionLines.length || options.size !== 4) return null;
  const question = questionLines.join(" ").replace(/\s+/g, " ").trim();
  if (!question || /^quickquest\s*-\s*100 verbal questions$/i.test(question) || /^practice ppt$/i.test(question)) return null;

  return {
    question,
    options: ["A", "B", "C", "D"].map((key) => options.get(key) as string),
  };
}

function parseInlineBlock(block: string[]): Question | null {
  const text = block.join(" ").replace(/\s+/g, " ").trim();
  const questionMatch = text.match(QUESTION_START);
  if (!questionMatch) return null;

  const question = questionMatch[2]?.trim();
  const optionMatches = [...text.matchAll(INLINE_OPTION)];
  if (!question || optionMatches.length < 4) return null;

  const options = new Map<string, string>();
  for (const match of optionMatches) {
    const letter = (match[1] as string).toUpperCase();
    const value = (match[2] as string).trim().replace(/^[.\-:)\s]+/, "").replace(/\s+/g, " ");
    if (["A", "B", "C", "D"].includes(letter) && value) options.set(letter, value);
  }

  if (options.size !== 4) return null;
  return {
    question,
    options: ["A", "B", "C", "D"].map((key) => options.get(key) as string),
  };
}

function parseFallback(rawText: string): Question[] {
  const normalized = rawText.replace(/\r/g, "\n");
  const matches = [...normalized.matchAll(FALLBACK_QUESTION)];
  const questions: Question[] = [];

  for (const match of matches) {
    const body = (match[2] ?? "").trim();
    if (!body) continue;

    const optionMatches = [...body.matchAll(INLINE_OPTION)];
    const options = new Map<string, string>();
    for (const optionMatch of optionMatches) {
      const letter = (optionMatch[1] as string).toUpperCase();
      const value = (optionMatch[2] as string).trim().replace(/^[.\-:)\s]+/, "").replace(/\s+/g, " ");
      if (["A", "B", "C", "D"].includes(letter) && value) options.set(letter, value);
    }

    if (options.size === 4) {
      const questionText = body
        .replace(INLINE_OPTION, " ")
        .replace(/\s+/g, " ")
        .trim();
      const cleanedQuestion = questionText
        .replace(/\b([A-D])[.)]\s*$/, "")
        .trim();
      if (cleanedQuestion) {
        questions.push({
          question: cleanedQuestion,
          options: ["A", "B", "C", "D"].map((key) => options.get(key) as string),
        });
      }
    }
  }

  return questions;
}

export function extractQuestions(rawText: string): Question[] {
  const lines = rawText
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const questions: Question[] = [];
  let currentLines: string[] = [];
  let hasSeenQuestionStart = false;

  const flush = () => {
    if (!currentLines.length) return;
    const question = parseSeparatedBlock(currentLines) ?? parseInlineBlock(currentLines);
    if (question) questions.push(question);
    currentLines = [];
  };

  for (const line of lines) {
    if (SLIDE_MARKER.test(line)) continue;

    const questionStart = line.match(QUESTION_START);
    if (questionStart) {
      if (hasSeenQuestionStart) flush();
      hasSeenQuestionStart = true;
      currentLines.push(line);
      continue;
    }

    if (!hasSeenQuestionStart) continue;
    currentLines.push(line);
  }

  flush();
  if (questions.length) return questions;
  return parseFallback(rawText);
}
