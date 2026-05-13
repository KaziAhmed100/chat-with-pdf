"use client";

import { SourceBadge } from "./source-badge";

type Source = {
  n: number;
  pageNumber: number;
  content: string;
};

// Splits a message's text on citation markers like [1], [2,3] and
// renders the markers as clickable SourceBadge components inline.
// Returns React nodes ready to drop into a paragraph.
function renderWithCitations(text: string, sources: Source[]) {
  const sourceMap = new Map(sources.map((s) => [s.n, s]));
  const parts: React.ReactNode[] = [];

  // Match [1], [12], or [1, 2, 3]. We accept comma-separated lists so a
  // model can attribute one claim to multiple sources naturally.
  const regex = /\[(\d+(?:\s*,\s*\d+)*)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const numbers = match[1].split(",").map((n) => parseInt(n.trim(), 10));
    for (const n of numbers) {
      const source = sourceMap.get(n);
      if (source) {
        parts.push(<SourceBadge key={`s-${key++}`} source={source} />);
      }
      // If the model cites a number we don't have a source for, we
      // silently drop the marker rather than render a broken badge or
      // a styled-out-of-place "[5]". The surrounding sentence still
      // reads correctly.
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

type ChatMessageProps = {
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
};

export function ChatMessage({ role, text, sources = [] }: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 text-white shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800">
          {renderWithCitations(text, sources)}
        </p>
      </div>
    </div>
  );
}
