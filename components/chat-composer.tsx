"use client";

import { useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

type ChatComposerProps = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
};

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  disabled = false,
  isStreaming = false,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea as the user types, capped at ~5 lines.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter inserts a newline. Standard chat convention.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) onSubmit();
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm backdrop-blur-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about the document..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent px-2 py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60"
        />
        <button
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          aria-label="Send message"
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
