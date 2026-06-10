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
    if (key === "a:t") collectText(value, output);
    else if (key !== "$") collectText(value, output);
  });
}

export async function parsePptx(buffer: Buffer): Promise<string> {
  const zip = new AdmZip(buffer);
  const slides = zip
    .getEntries()
    .filter((entry) => /^ppt\/slides\/slide\d+\.xml$/.test(entry.entryName))
    .sort((a, b) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true }));

  const slideTexts: string[] = [];
  for (const slide of slides) {
    const parsed = (await parseStringPromise(slide.getData().toString("utf8"))) as XmlNode;
    const parts: string[] = [];
    collectText(parsed, parts);
    slideTexts.push(parts.join("\n"));
  }

  return slideTexts.join("\n\n");
}
