import type { Question } from "../types/exam";

interface UploadResponse {
  questions: Question[];
  count: number;
}

export async function uploadQuestionFile(file: File): Promise<Question[]> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/questions/upload", { method: "POST", body: formData });
  const data = (await response.json()) as UploadResponse | { message: string };
  if (!response.ok) throw new Error("message" in data ? data.message : "Upload failed.");
  return (data as UploadResponse).questions;
}
