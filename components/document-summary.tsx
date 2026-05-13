"use client";

import { useState } from "react";
import { ChevronDown, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type DocumentSummaryProps = {
  documentId: string;
  initialSummary: string | null;
  onSummaryChange?: (summary: string) => void;
};

// Collapsible summary panel. Renders the pre-computed summary that was
// generated at ingestion. Users can regenerate on demand.
export function DocumentSummary({
  documentId,
  initialSummary,
  onSummaryChange,
}: DocumentSummaryProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [open, setOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  async function regenerate() {
    setRegenerating(true);
    try {
      const response = await fetch(`/api/summary/${documentId}`, {
        method: "POST",
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Couldn't regenerate summary.");
      }

      const data = (await response.json()) as { summary: string };
      setSummary(data.summary);
      onSummaryChange?.(data.summary);
      toast.success("Summary regenerated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Summary</span>
          {!summary && <span className="text-xs text-slate-500">Not yet generated</span>}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-slate-200/60 px-4 py-4">
          {summary ? (
            <div className="prose-sm prose-slate max-h-64 max-w-none overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
              {summary}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No summary was generated for this document. Click regenerate to create one.
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={regenerate}
              disabled={regenerating}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:border-blue-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-3 w-3 ${regenerating ? "animate-spin" : ""}`} />
              {regenerating ? "Regenerating..." : summary ? "Regenerate" : "Generate"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
