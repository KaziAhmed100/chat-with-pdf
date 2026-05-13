type TranscriptMessage = {
  role: "user" | "assistant";
  text: string;
  sources?: Array<{
    n: number;
    pageNumber: number;
    content: string;
  }>;
};

type TranscriptInput = {
  documentName: string;
  pageCount: number;
  summary: string | null;
  messages: TranscriptMessage[];
};

// Format a chat session as a portable markdown document. The output is
// designed to be readable in a plain text editor, render cleanly on
// GitHub, and stand alone — recruiters and users can share it without
// needing to come back to the app.
export function buildTranscriptMarkdown(input: TranscriptInput): string {
  const { documentName, pageCount, summary, messages } = input;
  const now = new Date();
  const lines: string[] = [];

  lines.push(`# Chat with PDF — Transcript`);
  lines.push("");
  lines.push(`**Document:** ${documentName}`);
  lines.push(`**Pages:** ${pageCount}`);
  lines.push(`**Exported:** ${now.toLocaleString()}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  if (summary) {
    lines.push("## Summary");
    lines.push("");
    lines.push(summary);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  if (messages.length > 0) {
    lines.push("## Conversation");
    lines.push("");

    for (const msg of messages) {
      if (msg.role === "user") {
        lines.push(`### Question`);
        lines.push("");
        lines.push(msg.text);
        lines.push("");
      } else {
        lines.push(`### Answer`);
        lines.push("");
        lines.push(msg.text);
        lines.push("");

        if (msg.sources && msg.sources.length > 0) {
          lines.push("**Sources**");
          lines.push("");
          for (const source of msg.sources) {
            lines.push(
              `- **[${source.n}]** Page ${source.pageNumber} — ${truncate(source.content, 200)}`,
            );
          }
          lines.push("");
        }
      }
    }
  } else {
    lines.push("_No questions asked in this session._");
    lines.push("");
  }

  return lines.join("\n");
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

// Sanitize a filename so it works across operating systems. Strips
// path separators, control characters, and common reserved chars.
export function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/\.[^.]+$/, "") // drop extension
      .replace(/[/\\?%*:|"<>]/g, "-")
      .replace(/\s+/g, "_")
      .slice(0, 80) || "transcript"
  );
}
