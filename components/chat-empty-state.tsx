"use client";

import { Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "What is this document about?",
  "Summarize the key points.",
  "What are the main conclusions?",
];

export function ChatEmptyState({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Sparkles className="h-5 w-5" />
      </div>
      <h2 className="text-base font-semibold text-slate-900">Ready when you are</h2>
      <p className="mt-1 text-sm text-slate-500">Ask anything about the document.</p>

      <div className="mt-6 flex w-full max-w-md flex-col gap-2">
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="rounded-lg border border-slate-200 bg-white/70 px-4 py-2.5 text-left text-sm text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:border-blue-300 hover:bg-white hover:text-slate-900"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
