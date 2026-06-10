import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Document, Packer, Paragraph } from "docx";
import PDFDocument from "pdfkit";
import pptxgen from "pptxgenjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "samples");
fs.mkdirSync(outputDir, { recursive: true });

const questions = [
  {
    question: "A train travels 120 km in 2 hours. What is its average speed?",
    options: ["40 km/h", "60 km/h", "80 km/h", "100 km/h"],
  },
  {
    question: "Which number comes next in the series: 2, 6, 12, 20, 30?",
    options: ["36", "40", "42", "44"],
  },
  {
    question: "If 15% of a number is 45, what is the number?",
    options: ["250", "275", "300", "325"],
  },
  {
    question: "Choose the word most similar in meaning to 'meticulous'.",
    options: ["Careless", "Precise", "Rapid", "Ordinary"],
  },
  {
    question: "All analysts are logical. Some graduates are analysts. Which conclusion follows?",
    options: ["All graduates are logical", "Some graduates are logical", "No graduates are logical", "All logical people are analysts"],
  },
];

function linesFor(question, index) {
  return [
    `${index + 1}. ${question.question}`,
    ...question.options.map((option, optionIndex) => `${String.fromCharCode(65 + optionIndex)}. ${option}`),
  ];
}

const pdf = new PDFDocument({ margin: 54, compress: false, pdfVersion: "1.3" });
const pdfOutput = fs.createWriteStream(path.join(outputDir, "sample-questions.pdf"));
const pdfComplete = new Promise((resolve, reject) => {
  pdfOutput.on("finish", resolve);
  pdfOutput.on("error", reject);
});
pdf.pipe(pdfOutput);
pdf.fontSize(17).text("Sample Aptitude Questions", { underline: true }).moveDown();
questions.forEach((question, index) => {
  linesFor(question, index).forEach((line, lineIndex) => pdf.fontSize(lineIndex === 0 ? 12 : 11).text(line));
  pdf.moveDown();
});
pdf.end();
await pdfComplete;

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({ text: "Sample Aptitude Questions", heading: "Title" }),
      ...questions.flatMap((question, index) => [...linesFor(question, index).map((text) => new Paragraph(text)), new Paragraph("")]),
    ],
  }],
});
fs.writeFileSync(path.join(outputDir, "sample-questions.docx"), await Packer.toBuffer(doc));

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
questions.forEach((question, index) => {
  const slide = pptx.addSlide();
  slide.background = { color: "F4F7FB" };
  slide.addText(linesFor(question, index).join("\n"), {
    x: 0.8, y: 0.6, w: 11.7, h: 6.2, fontFace: "Aptos", fontSize: 20, color: "12233F", breakLine: false,
  });
});
await pptx.writeFile({ fileName: path.join(outputDir, "sample-questions.pptx") });

fs.writeFileSync(path.join(outputDir, "sample-answer-key.txt"), ["1. B", "2. C", "3. C", "4. B", "5. B"].join("\n"));

console.log(`Generated sample documents in ${outputDir}`);
