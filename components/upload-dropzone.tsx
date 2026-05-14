"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useUpload } from "@/lib/hooks/useUpload";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// The sample PDF lives in /public so it's served as a static file. We
// fetch it client-side and feed it through the same upload pipeline as
// a real upload — same validation, same ingestion, same chat experience.
const SAMPLE_PDF_PATH = "/impact-of-ai-in-healthcare.pdf";
const SAMPLE_PDF_NAME = "Impact of AI in Healthcare.pdf";

export function UploadDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { stage, progress, upload } = useUpload();

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File is too large. Maximum size is 10 MB.");
        return;
      }

      const result = await upload(file);
      if (result) {
        toast.success(`Processed ${result.pageCount} pages. Opening chat...`);
        router.push(`/chat/${result.documentId}`);
      }
    },
    [upload, router],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  // Fetch the sample PDF and feed it into the same handler the real
  // upload path uses. Lets visitors who don't have a PDF handy still
  // experience the app end-to-end.
  const handleSamplePdf = useCallback(async () => {
    try {
      const response = await fetch(SAMPLE_PDF_PATH);
      if (!response.ok) throw new Error("Couldn't load sample.");
      const blob = await response.blob();
      const file = new File([blob], SAMPLE_PDF_NAME, { type: "application/pdf" });
      await handleFile(file);
    } catch {
      toast.error("Couldn't load the sample PDF.");
    }
  }, [handleFile]);

  const isLoading = stage === "uploading" || stage === "processing";

  return (
    <div className="mx-auto w-full max-w-xl">
      <div
        onClick={() => !isLoading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isLoading) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`group relative cursor-pointer rounded-2xl border-2 border-dashed bg-white/70 p-12 text-center backdrop-blur-sm transition-all ${
          isDragging
            ? "border-blue-500 bg-blue-50/70"
            : "border-slate-300 hover:border-blue-400 hover:bg-white"
        } ${isLoading ? "pointer-events-none opacity-80" : ""}`}
        role="button"
        tabIndex={0}
        aria-label="Upload PDF"
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isLoading) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleSelect}
          className="hidden"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p className="text-sm font-medium text-slate-700">{progress}</p>
            <p className="text-xs text-slate-500">This usually takes 5–15 seconds.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Drop your PDF here</p>
              <p className="mt-1 text-sm text-slate-500">or click to browse</p>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <FileText className="h-3.5 w-3.5" />
              PDF only · Up to 10 MB · 50 pages max
            </p>
          </div>
        )}
      </div>

      {!isLoading && (
        <div className="mt-4 flex items-center justify-center">
          <button
            onClick={handleSamplePdf}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1.5 text-xs font-medium text-slate-600 backdrop-blur-sm transition-all hover:bg-white hover:text-slate-900"
          >
            <Sparkles className="h-3 w-3 text-blue-500" />
            Try with a sample PDF (Impact of AI in Healthcare)
          </button>
        </div>
      )}
    </div>
  );
}
