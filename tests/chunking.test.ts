import { describe, it, expect } from "vitest";
import { chunkPages } from "@/lib/chunking";

describe("chunkPages", () => {
  it("returns one chunk per page when pages are short", () => {
    const pages = [
      { pageNumber: 1, text: "Short content for page one." },
      { pageNumber: 2, text: "Short content for page two." },
    ];

    const chunks = chunkPages(pages);

    expect(chunks).toHaveLength(2);
    expect(chunks[0].pageNumber).toBe(1);
    expect(chunks[1].pageNumber).toBe(2);
    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[1].chunkIndex).toBe(1);
  });

  it("splits a long page into multiple chunks while preserving page number", () => {
    // Build a string well past the ~1000 char chunk size with natural
    // sentence boundaries so the splitter has good break points.
    const longText = Array(20)
      .fill(0)
      .map((_, i) => `This is sentence number ${i} with enough content to fill space.`)
      .join(" ");

    const pages = [{ pageNumber: 5, text: longText }];
    const chunks = chunkPages(pages);

    expect(chunks.length).toBeGreaterThan(1);
    // Every produced chunk must trace back to page 5.
    for (const chunk of chunks) {
      expect(chunk.pageNumber).toBe(5);
    }
  });

  it("skips empty pages", () => {
    const pages = [
      { pageNumber: 1, text: "Real content here." },
      { pageNumber: 2, text: "" },
      { pageNumber: 3, text: "More real content." },
    ];

    const chunks = chunkPages(pages);
    const pageNumbers = chunks.map((c) => c.pageNumber);

    expect(pageNumbers).not.toContain(2);
    expect(pageNumbers).toContain(1);
    expect(pageNumbers).toContain(3);
  });
});
