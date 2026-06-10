import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Attempt, Exam, PublicQuestion, SubmittedAnswer } from "../types/exam.js";
import type { Question } from "../types/question.js";
import { parseAnswerKey } from "./answerKeyParser.js";

const exams = new Map<string, Exam>();
const optionLetters = ["A", "B", "C", "D"] as const;
const dataFile = path.resolve(process.env.DATA_FILE ?? "data/exams.json");

function loadStore(): void {
  try {
    if (!fs.existsSync(dataFile)) return;
    const saved = JSON.parse(fs.readFileSync(dataFile, "utf8")) as Exam[];
    saved.forEach((exam) => exams.set(exam.code, exam));
  } catch (error) {
    console.error("Unable to load exam store:", error);
  }
}

function saveStore(): void {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify([...exams.values()], null, 2));
}

loadStore();

function generateCode(): string {
  let code = "";
  do {
    code = crypto.randomBytes(3).toString("hex").toUpperCase();
  } while (exams.has(code));
  return code;
}

export function createExam(title: string, questions: Question[], rawAnswerKey: string): Exam {
  const answerKey = parseAnswerKey(rawAnswerKey, questions.length);
  const code = generateCode();
  const exam: Exam = {
    code,
    title: title.trim() || "Aptitude Assessment",
    createdAt: new Date().toISOString(),
    attempts: [],
    questions: questions.map((question, index) => {
      const answerLetter = answerKey.get(index + 1) as string;
      const optionIndex = optionLetters.indexOf(answerLetter as (typeof optionLetters)[number]);
      const correctAnswer = question.options[optionIndex];
      if (!correctAnswer) throw new Error(`Invalid answer for question ${index + 1}.`);
      return {
        id: `q${index + 1}`,
        question: question.question,
        options: question.options,
        correctAnswer,
      };
    }),
  };
  exams.set(code, exam);
  saveStore();
  return exam;
}

export function getExam(code: string): Exam | undefined {
  return exams.get(code.toUpperCase());
}

export function getPublicExam(code: string): { code: string; title: string; questions: PublicQuestion[] } | undefined {
  const exam = getExam(code);
  if (!exam) return undefined;
  return {
    code: exam.code,
    title: exam.title,
    questions: exam.questions.map(({ id, question, options }) => ({ id, question, options })),
  };
}

export function submitAttempt(code: string, studentName: string, answers: SubmittedAnswer[]): Attempt | undefined {
  const exam = getExam(code);
  if (!exam) return undefined;

  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer.selectedAnswer]));
  const normalizedAnswers = exam.questions.map((question) => ({
    questionId: question.id,
    selectedAnswer: answerByQuestion.get(question.id) ?? null,
  }));

  const attempted = normalizedAnswers.filter((answer) => answer.selectedAnswer !== null).length;
  const correct = normalizedAnswers.filter((answer) => {
    const question = exam.questions.find((item) => item.id === answer.questionId);
    return question?.correctAnswer === answer.selectedAnswer;
  }).length;
  const total = exam.questions.length;
  const attempt = {
    id: crypto.randomUUID(),
    studentName: studentName.trim() || "Anonymous Student",
    submittedAt: new Date().toISOString(),
    answers: normalizedAnswers,
    total,
    attempted,
    correct,
    incorrect: attempted - correct,
    unanswered: total - attempted,
    percentage: total ? Number(((correct / total) * 100).toFixed(1)) : 0,
  };
  exam.attempts.push(attempt);
  saveStore();
  return attempt;
}
