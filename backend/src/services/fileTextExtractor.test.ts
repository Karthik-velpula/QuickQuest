import { describe, expect, it } from "vitest";
import { hasValidSignature } from "./fileTextExtractor.js";

function file(name: string, bytes: number[]): Express.Multer.File {
  return { originalname: name, buffer: Buffer.from(bytes) } as Express.Multer.File;
}

describe("hasValidSignature", () => {
  it("accepts matching signatures and rejects renamed text", () => {
    expect(hasValidSignature(file("questions.pdf", [0x25, 0x50, 0x44, 0x46]))).toBe(true);
    expect(hasValidSignature(file("questions.docx", [0x50, 0x4b, 0x03, 0x04]))).toBe(true);
    expect(hasValidSignature(file("questions.pdf", [0x68, 0x65, 0x6c, 0x6c, 0x6f]))).toBe(false);
  });
});
