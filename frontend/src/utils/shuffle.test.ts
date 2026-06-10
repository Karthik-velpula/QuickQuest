import { describe, expect, it } from "vitest";
import { prepareQuestions } from "./shuffle";

describe("prepareQuestions", () => {
  it("preserves questions and all four options without answer data", () => {
    const questions = [{ id: "q1", question: "Question", options: ["A", "B", "C", "D"] }];
    const prepared = prepareQuestions(questions);

    expect(prepared).toHaveLength(1);
    expect(prepared[0]?.question).toBe("Question");
    expect(prepared[0]?.options.sort()).toEqual(["A", "B", "C", "D"]);
  });
});
