import { describe, expect, it } from "vitest";
import { extractQuestions } from "./questionExtractor.js";

describe("extractQuestions", () => {
  it("extracts a question with four options and no answer line", () => {
    const questions = extractQuestions(`
      1. What is 2 + 2?
      A. 3
      B. 4
      C. 5
      D. 6
    `);
    expect(questions).toEqual([{ question: "What is 2 + 2?", options: ["3", "4", "5", "6"] }]);
  });

  it("accepts compact Q1 question numbering", () => {
    const questions = extractQuestions(`
      Q1. Choose the correct synonym.
      A. First
      B. Second
      C. Third
      D. Fourth
    `);
    expect(questions).toHaveLength(1);
  });

  it("extracts inline slide-style text", () => {
    const questions = extractQuestions(`
      <<SLIDE 1>>
      Q1. Choose the correct synonym of 'Abundant'. A. Scarce B. Plentiful C. Tiny D. Weak
    `);
    expect(questions).toHaveLength(1);
    expect(questions[0]?.options).toEqual(["Scarce", "Plentiful", "Tiny", "Weak"]);
  });
});
