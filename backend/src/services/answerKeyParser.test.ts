import { describe, expect, it } from "vitest";
import { parseAnswerKey } from "./answerKeyParser.js";

describe("parseAnswerKey", () => {
  it("parses numbered answer lines", () => {
    expect(parseAnswerKey("1. B\nQ2: C\n3-D", 3)).toEqual(new Map([[1, "B"], [2, "C"], [3, "D"]]));
  });

  it("requires every answer", () => {
    expect(() => parseAnswerKey("1. A", 2)).toThrow("Missing answer for question 2");
  });
});
