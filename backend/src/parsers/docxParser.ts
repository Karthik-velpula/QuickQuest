import mammoth from "mammoth";
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
    if (key === "w:t" || key === "t" || key === "a:t") collectText(value, output);
    else if (key !== "$") collectText(value, output);
  });
}

async function extractXmlText(xml: string): Promise<string> {
  const parsed = (await parseStringPromise(xml)) as XmlNode;
  const parts: string[] = [];
  collectText(parsed, parts);
  return parts.join("\n");
}

export async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  const zip = new AdmZip(buffer);
  const xmlEntries = zip
    .getEntries()
    .filter((entry) => /word\/(document|footer\d+|header\d+)\.xml$/.test(entry.entryName))
    .sort((a, b) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true }));

  const xmlTexts: string[] = [];
  for (const entry of xmlEntries) {
    try {
      const text = await extractXmlText(entry.getData().toString("utf8"));
      if (text.trim()) xmlTexts.push(text);
    } catch {
      // Mammoth output below remains the fallback if XML extraction fails.
    }
  }

  return [result.value, ...xmlTexts].filter(Boolean).join("\n");
}
