"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Source = {
  n: number;
  pageNumber: number;
  content: string;
};

// Inline citation badge. Tap or hover to see the excerpt and page
// number. Designed to feel like a Wikipedia citation — lightweight,
// non-intrusive, but rich on demand.
export function SourceBadge({ source }: { source: Source }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 align-text-bottom text-[10px] font-semibold text-blue-700 transition-colors hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label={`Source ${source.n}, page ${source.pageNumber}`}
        >
          {source.n}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm">
        <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="font-semibold text-slate-700">Source {source.n}</span>
          <span className="text-xs text-slate-500">Page {source.pageNumber}</span>
        </div>
        <p className="leading-relaxed text-slate-600">{source.content}</p>
      </PopoverContent>
    </Popover>
  );
}
