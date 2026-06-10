import path from "node:path";
import { parseDocx } from "../parsers/docxParser.js";
import { parseLegacyOffice } from "../parsers/legacyOfficeParser.js";
import { parsePdf } from "../parsers/pdfParser.js";
import { parsePptx } from "../parsers/pptxParser.js";

export const SUPPORTED_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".ppt", ".pptx"]);

export function hasValidSignature(file: Express.Multer.File): boolean {
  const extension = path.extname(file.originalname).toLowerCase();
  const header = file.buffer.subarray(0, 8);
  const isPdf = header.subarray(0, 4).toString("ascii") === "%PDF";
  const isZip = header[0] === 0x50 && header[1] === 0x4b;
  const isOle = header.equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));

  if (extension === ".pdf") return isPdf;
  if (extension === ".docx" || extension === ".pptx") return isZip;
  if (extension === ".doc" || extension === ".ppt") return isOle;
  return false;
}

export async function extractText(file: Express.Multer.File): Promise<string> {
  const extension = path.extname(file.originalname).toLowerCase();

  switch (extension) {
    case ".pdf":
      return parsePdf(file.buffer);
    case ".docx":
      return parseDocx(file.buffer);
    case ".pptx":
      return parsePptx(file.buffer);
    case ".doc":
    case ".ppt":
      return parseLegacyOffice(file.buffer);
    default:
      throw new Error("Unsupported file type.");
  }
}
