import { parseOffice } from "officeparser";

export async function parseLegacyOffice(buffer: Buffer): Promise<string> {
  const ast = await parseOffice(buffer);
  const result = await ast.to("text");
  return String(result.value);
}
