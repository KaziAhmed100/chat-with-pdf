"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Source = {
  n: number;
  pageNumber: number;
  content: string;
};

// Inline citation badge styled like an academic footnote. Shows the
// page number directly (rather than an opaque source index) so readers
// can scan citations without needing to click. The popover surfaces
// just enough of the source text to verify the claim — never the full
// chunk, which is overwhelming.
export function SourceBadge({ source }: { source: Source }) {
  const excerpt = truncateAtSentence(source.content, 220);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="ml-0.5 inline-flex h-5 items-center rounded-md bg-blue-100 px-1.5 align-text-bottom text-[10px] font-semibold tracking-wide text-blue-700 uppercase transition-colors hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label={`Source from page ${source.pageNumber}`}
        >
          p.{source.pageNumber}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" side="top" align="start">
        <div className="mb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          Page {source.pageNumber}
        </div>
        <p className="text-xs leading-relaxed text-slate-700">{excerpt}</p>
      </PopoverContent>
    </Popover>
  );
}

// Cut text at the last sentence boundary before `max` characters. Falls
// back to a word boundary, then to a hard cut, depending on what the
// content allows. This produces excerpts that read like proper quotations
// rather than mid-word truncations.
function truncateAtSentence(text: string, max: number): string {
  if (text.length <= max) return text;

  const truncated = text.slice(0, max);

  // Prefer ending at a sentence boundary (.!?) — most readable.
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf(". "),
    truncated.lastIndexOf("! "),
    truncated.lastIndexOf("? "),
  );
  if (lastSentenceEnd > max * 0.5) {
    return truncated.slice(0, lastSentenceEnd + 1) + " …";
  }

  // Fall back to last word boundary.
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace) + " …";
  }

  return truncated + "…";
}
