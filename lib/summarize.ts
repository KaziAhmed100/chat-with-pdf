import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import type { PageText } from "./pdf";

// Maximum characters we send to the summarizer. Claude Haiku has a huge
// context window, but bigger inputs cost more and add latency. 60k chars
// (~15k tokens) comfortably covers a 50-page PDF; for longer docs we
// truncate from the middle to preserve introductions and conclusions.
const MAX_SUMMARY_INPUT = 60_000;

// Prepare the document text for summarization. We tag each section with
// its page number so the model can produce a more structured summary;
// for oversize documents we keep the beginning and end (where most
// PDFs put their thesis and conclusion) and trim the middle.
function buildSummaryInput(pages: PageText[]): string {
  const fullText = pages.map((p) => `[Page ${p.pageNumber}]\n${p.text}`).join("\n\n");

  if (fullText.length <= MAX_SUMMARY_INPUT) {
    return fullText;
  }

  // Take roughly the first 45% and last 45% — leaves a ~10% gap that the
  // model will see as a notation gap.
  const half = Math.floor(MAX_SUMMARY_INPUT * 0.45);
  const start = fullText.slice(0, half);
  const end = fullText.slice(-half);
  return `${start}\n\n[... document truncated for length ...]\n\n${end}`;
}

// Generate a concise summary of a PDF. Called once at ingestion time and
// cached in the documents.summary column — never re-run unless the user
// explicitly asks for a regeneration (a feature we expose in the UI).
export async function summarizeDocument(pages: PageText[]): Promise<string> {
  const input = buildSummaryInput(pages);

  // Haiku is plenty for summarization, ~10x cheaper than Sonnet, and
  // finishes in 2–4 seconds for a typical document. Reserve Sonnet for
  // the actual Q&A where reasoning quality matters more.
  const { text } = await generateText({
    model: anthropic("claude-haiku-4-5"),
    temperature: 0.3,
    system: `You are a precise document summarizer. Produce a clear, well-
structured summary in markdown that a busy reader could skim in 30 seconds.

Follow this format exactly:

**Overview** (2-3 sentences capturing the document's purpose and scope)

**Key Points**
- 4-6 bullet points with the most important takeaways
- Each bullet should stand alone and be informative

**Notable Details**
- 2-3 specific facts, figures, or quotes worth surfacing

Do not invent anything not present in the document. If a section doesn't
apply (e.g. no specific figures in the doc), omit that section.`,
    prompt: `Summarize the following document:\n\n${input}`,
  });

  return text.trim();
}
