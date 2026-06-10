import { useRef, useState } from "react";
import { BrandHeader } from "../components/BrandHeader";
import { uploadQuestionFile } from "../services/questionService";
import type { Question } from "../types/exam";

interface UploadPageProps {
  onReady: (questions: Question[]) => void;
}

export function UploadPage({ onReady }: UploadPageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  const upload = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setError("");
    setLoading(true);
    try {
      onReady(await uploadQuestionFile(file));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      <BrandHeader />
      <main className="mx-auto max-w-5xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal">Assessment setup</p>
            <h2 className="mt-3 text-4xl font-bold leading-tight text-navy">Create a strictly timed aptitude examination.</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Upload a formatted question document. Questions and options are randomized before the assessment begins.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["25 seconds each", "Forward only", "No scoring"].map((item) => (
                <div key={item} className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700">{item}</div>
              ))}
            </div>
          </section>
          <section className="rounded-2xl bg-white p-8 shadow-panel">
            <h3 className="text-xl font-bold text-navy">Upload question document</h3>
            <p className="mt-2 text-sm text-slate-500">PDF, DOC, DOCX, PPT, or PPTX up to 15 MB</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-6 flex min-h-52 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-teal hover:bg-teal/5"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-teal/10 text-2xl text-teal">↑</span>
              <span className="mt-4 font-semibold text-navy">{loading ? "Extracting questions..." : "Choose a document"}</span>
              <span className="mt-1 text-xs text-slate-500">{fileName || "Questions must follow the required A-D format"}</span>
            </button>
            <input ref={inputRef} hidden type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={(event) => upload(event.target.files?.[0])} />
            {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          </section>
        </div>
      </main>
    </div>
  );
}
