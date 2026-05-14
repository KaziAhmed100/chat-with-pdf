import { describe, it, expect } from "vitest";
import { buildTranscriptMarkdown, sanitizeFilename } from "@/lib/transcript";

describe("buildTranscriptMarkdown", () => {
  it("renders a complete transcript with summary, Q&A, and sources", () => {
    const output = buildTranscriptMarkdown({
      documentName: "example.pdf",
      pageCount: 10,
      summary: "**Overview** Example document.",
      messages: [
        { role: "user", text: "What is this about?" },
        {
          role: "assistant",
          text: "It is about examples [1].",
          sources: [{ n: 1, pageNumber: 3, content: "Example content from page 3." }],
        },
      ],
    });

    expect(output).toContain("# Chat with PDF — Transcript");
    expect(output).toContain("**Document:** example.pdf");
    expect(output).toContain("## Summary");
    expect(output).toContain("**Overview** Example document.");
    expect(output).toContain("### Question");
    expect(output).toContain("What is this about?");
    expect(output).toContain("### Answer");
    expect(output).toContain("Page 3");
  });

  it("handles an empty session gracefully", () => {
    const output = buildTranscriptMarkdown({
      documentName: "empty.pdf",
      pageCount: 1,
      summary: null,
      messages: [],
    });

    expect(output).toContain("No questions asked");
    expect(output).not.toContain("## Summary");
  });
});

describe("sanitizeFilename", () => {
  it("removes the file extension and spaces", () => {
    expect(sanitizeFilename("Some Document.pdf")).toBe("Some_Document");
  });

  it("strips path separators and reserved characters", () => {
    expect(sanitizeFilename("bad/name:file?.pdf")).toBe("bad-name-file-");
  });

  it("falls back to a default when input is empty", () => {
    expect(sanitizeFilename("")).toBe("transcript");
  });
});
