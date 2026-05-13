"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { buildTranscriptMarkdown, sanitizeFilename } from "@/lib/transcript";

type Source = {
  n: number;
  pageNumber: number;
  content: string;
};

type Message = {
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
};

type TranscriptDownloadProps = {
  documentName: string;
  pageCount: number;
  summary: string | null;
  messages: Message[];
};

// Generates the transcript and triggers a browser download. Disabled
// when there's nothing meaningful to export.
export function TranscriptDownload({
  documentName,
  pageCount,
  summary,
  messages,
}: TranscriptDownloadProps) {
  const hasContent = messages.length > 0 || summary;
  const disabled = !hasContent;

  function handleDownload() {
    try {
      const markdown = buildTranscriptMarkdown({
        documentName,
        pageCount,
        summary,
        messages,
      });

      // Create a blob, point an invisible anchor at it, click it, clean up.
      // Classic browser file-download incantation — no library needed.
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sanitizeFilename(documentName)}_transcript.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Transcript downloaded.");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Couldn't generate transcript.");
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-700 backdrop-blur-sm transition-all hover:border-blue-300 hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Download conversation transcript"
    >
      <Download className="h-3.5 w-3.5" />
      Download
    </button>
  );
}
