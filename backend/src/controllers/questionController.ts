import type { Request, Response } from "express";
import { extractText, hasValidSignature } from "../services/fileTextExtractor.js";
import { extractQuestions } from "../services/questionExtractor.js";
import type { Question } from "../types/question.js";

export async function uploadQuestions(request: Request, response: Response): Promise<void> {
  if (!request.file) {
    response.status(400).json({ message: "Choose a supported PDF, DOC, DOCX, PPT, or PPTX file." });
    return;
  }

  if (!hasValidSignature(request.file)) {
    response.status(400).json({ message: "The file contents do not match its extension." });
    return;
  }

  let questions: Question[];
  try {
    const text = await extractText(request.file);
    questions = extractQuestions(text);
  } catch {
    response.status(422).json({ message: "The document could not be read. It may be damaged or use an unsupported legacy encoding." });
    return;
  }

  if (!questions.length) {
    response.status(422).json({
      message: "No valid questions were found. Check that each numbered question has four A-D options.",
    });
    return;
  }

  response.json({ questions, count: questions.length });
}
