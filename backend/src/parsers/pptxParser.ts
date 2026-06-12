import AdmZip from "adm-zip";
import { parseStringPromise } from "xml2js";

type XmlNode = string | number | XmlNode[] | { [key: string]: XmlNode };

function collectText(node: XmlNode | undefined, output: string[]): void {
  if (node === undefined || node === null) return;
  if (typeof node === "string" || typeof node === "number") {
    output.push(String(node));
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((item) => collectText(item, output));
    return;
  }
  Object.entries(node).forEach(([key, value]) => {
    if (key === "a:t" || key === "t") collectText(value, output);
    else if (key !== "$") collectText(value, output);
  });
}

async function extractXmlText(xml: string): Promise<string> {
  const parsed = (await parseStringPromise(xml)) as XmlNode;
  const parts: string[] = [];
  collectText(parsed, parts);
  return parts.join("\n");
}

export async function parsePptx(buffer: Buffer): Promise<string> {
  const zip = new AdmZip(buffer);
  const slides = zip
    .getEntries()
    .filter((entry) => /^ppt\/slides\/slide\d+\.xml$/.test(entry.entryName))
    .sort((a, b) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true }));
  const notes = zip
    .getEntries()
    .filter((entry) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(entry.entryName))
    .sort((a, b) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true }));

  const slideTexts: string[] = [];
  for (const slide of slides) {
    const text = await extractXmlText(slide.getData().toString("utf8"));
    slideTexts.push(text);
  }

  for (const note of notes) {
    const text = await extractXmlText(note.getData().toString("utf8"));
    if (text.trim()) slideTexts.push(text);
  }

  return slideTexts
    .map((text, index) => `<<SLIDE ${index + 1}>>\n${text}`)
    .join("\n\n");
}
