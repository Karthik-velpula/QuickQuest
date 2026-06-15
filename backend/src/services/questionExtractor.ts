import type { Question } from "../types/question.js";

const QUESTION_START = /^\s*(?:(?:question|q)\s*)?(\d+)(?:[.)]|:)?\s*(.*)$/i;
const OPTION_LINE = /^\s*([A-D])[.)]\s+(.+)$/i;
const INLINE_OPTION = /([A-D])[.)]\s*([\s\S]*?)(?=\s+[A-D][.)]\s|$)/gi;
const SLIDE_MARKER = /^\s*<<SLIDE\s+\d+>>\s*$/i;
const FALLBACK_QUESTION = /(?:^|\n)\s*(?:question\s+)?(?:q\s*)?(\d+)\s*(?:[.)]|:)?\s*([\s\S]*?)(?=(?:\n\s*(?:question\s+)?(?:q\s*)?\d+\s*(?:[.)]|:)?|\n{2,}|$))/gim;
const ERROR_DETECTION_LINE = /^\s*(\d+)[.)]\s+([\s\S]*?\(A\)[\s\S]*?\(B\)[\s\S]*?\(C\)[\s\S]*?\(D\)\s*No\s+error)\b/i;
const CLOZE_OPTION_LINE = /^\s*\((\d+)\)\s+A[.)]\s+(.+?)\s+B[.)]\s+(.+?)\s+C[.)]\s+(.+?)\s+D[.)]\s+(.+?)\s*$/i;

type NumberedQuestion = Question & { number: number };

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

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

function parseErrorDetectionLine(line: string): NumberedQuestion | null {
  const match = line.match(ERROR_DETECTION_LINE);
  if (!match) return null;

  const number = Number(match[1]);
  const body = normalizeWhitespace(match[2] ?? "");
  const question = normalizeWhitespace(body.replace(/\([A-D]\)/gi, " ").replace(/\bNo\s+error\b/i, " "));
  const optionA = normalizeWhitespace(body.match(/^([\s\S]*?)\(A\)/i)?.[1] ?? "");
  const optionB = normalizeWhitespace(body.match(/\(A\)([\s\S]*?)\(B\)/i)?.[1] ?? "");
  const optionC = normalizeWhitespace(body.match(/\(B\)([\s\S]*?)\(C\)/i)?.[1] ?? "");
  const optionD = "No error";

  if (!number || !question || !optionA || !optionB || !optionC) return null;
  return {
    number,
    questionNumber: number,
    question,
    options: [optionA, optionB, optionC, optionD],
  };
}

function parseInlineBlock(block: string[]): Question | null {
  const text = block.join(" ").replace(/\s+/g, " ").trim();
  const questionMatch = text.match(QUESTION_START);
  if (!questionMatch) return null;

  const question = (questionMatch[2] ?? "").replace(INLINE_OPTION, " ").replace(/\s+/g, " ").trim();
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

function parseClozeQuestions(rawText: string): NumberedQuestion[] {
  const normalized = rawText.replace(/\r/g, "\n");
  const passageMatch = normalized.match(/Section\s+C[\s\S]*?Passage:\s*([\s\S]*?)\n\s*Options:/i);
  const passage = passageMatch ? normalizeWhitespace(passageMatch[1] ?? "") : "";
  const questions: NumberedQuestion[] = [];

  for (const line of normalized.split("\n")) {
    const match = line.match(CLOZE_OPTION_LINE);
    if (!match) continue;

    const number = Number(match[1]);
    const options = [match[2], match[3], match[4], match[5]].map((option) => normalizeWhitespace(option ?? ""));
    if (!number || options.some((option) => !option)) continue;

    questions.push({
      number,
      questionNumber: number,
      question: passage
        ? `Cloze test: choose the most appropriate word for blank (${number}) in this passage. ${passage}`
        : `Cloze test: choose the most appropriate word for blank (${number}).`,
      options,
    });
  }

  return questions;
}

function parseReadingComprehensionQuestions(rawText: string): NumberedQuestion[] {
  const normalized = rawText.replace(/\r/g, "\n");
  const sectionMatch = normalized.match(/Section\s+[A-Z]\s*[–-]\s*Reading Comprehension\s*\(Q(\d+)–Q(\d+)\)[\s\S]*?Passage:\s*([\s\S]*?)\n\s*(?:Q\d+\.|21\.)/i);
  if (!sectionMatch) return [];

  const start = Number(sectionMatch[1]);
  const end = Number(sectionMatch[2]);
  const passage = normalizeWhitespace(sectionMatch[3] ?? "");
  const questions: NumberedQuestion[] = [];

  for (let number = start; number <= end; number += 1) {
    const questionMatch = normalized.match(new RegExp(`(?:^|\\n)\\s*${number}[.)]\\s*([\\s\\S]*?)(?=(?:\\n\\s*${number + 1}[.)])|$)`, "i"));
    if (!questionMatch) continue;

    const body = questionMatch[1] ?? "";
    const optionMatches = [...body.matchAll(INLINE_OPTION)];
    const options = new Map<string, string>();
    for (const optionMatch of optionMatches) {
      const letter = (optionMatch[1] as string).toUpperCase();
      const value = (optionMatch[2] as string).trim().replace(/^[.\-:)\s]+/, "").replace(/\s+/g, " ");
      if (["A", "B", "C", "D"].includes(letter) && value) options.set(letter, value);
    }

    const cleanedQuestion = body
      .replace(INLINE_OPTION, " ")
      .replace(/^[\s\S]*?[.)]\s*/, "")
      .replace(/\s+/g, " ")
      .trim();

    if (options.size === 4 && cleanedQuestion) {
      questions.push({
        number,
        questionNumber: number,
        passage,
        readingComprehension: true,
        question: cleanedQuestion,
        options: ["A", "B", "C", "D"].map((key) => options.get(key) as string),
      });
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

  const questions: NumberedQuestion[] = [];
  let currentLines: string[] = [];
  let currentNumber = 0;
  let hasSeenQuestionStart = false;

  const flush = () => {
    if (!currentLines.length) return;
    const joined = currentLines.join(" ");
    const errorQuestion = parseErrorDetectionLine(joined);
    if (errorQuestion) {
      questions.push(errorQuestion);
    } else {
      const question = parseSeparatedBlock(currentLines) ?? parseInlineBlock(currentLines);
      if (question) questions.push({ ...question, number: currentNumber });
    }
    currentLines = [];
    currentNumber = 0;
  };

  for (const line of lines) {
    if (SLIDE_MARKER.test(line)) continue;

    const questionStart = line.match(QUESTION_START);
    if (questionStart) {
      if (hasSeenQuestionStart) flush();
      hasSeenQuestionStart = true;
      currentNumber = Number(questionStart[1]);
      currentLines.push(line);
      continue;
    }

    if (!hasSeenQuestionStart) continue;
    currentLines.push(line);
  }

  flush();
  const byNumber = new Map<number, Question>();
  for (const question of questions) {
    if (question.number) byNumber.set(question.number, { questionNumber: question.number, question: question.question, options: question.options });
  }

  for (const question of parseClozeQuestions(rawText)) {
    byNumber.set(question.number, { questionNumber: question.number, question: question.question, options: question.options });
  }

  for (const question of parseReadingComprehensionQuestions(rawText)) {
    byNumber.set(question.number, {
      questionNumber: question.questionNumber,
      passage: question.passage,
      readingComprehension: true,
      question: question.question,
      options: question.options,
    });
  }

  if (byNumber.size) {
    return [...byNumber.entries()]
      .sort(([left], [right]) => left - right)
      .map(([, question]) => question);
  }

  return parseFallback(rawText);
}
