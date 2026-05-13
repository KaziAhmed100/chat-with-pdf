import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, chunks } from "@/db/schema";
import { summarizeDocument } from "@/lib/summarize";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/get-ip";

export const maxDuration = 60;
export const runtime = "nodejs";

// On-demand summary regeneration. The first call for a freshly-ingested
// document just returns the cached summary; explicit regenerations
// re-run the summarizer against the document's chunks.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  // Rate limit — summary regen is even more expensive than chat so we
  // share the same bucket. Could be tuned separately if needed later.
  const ip = getClientIp(request.headers);
  const rl = await checkRateLimit(`summary:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  const { documentId } = await params;

  // Fetch all chunks for this document, ordered by page then chunk index
  // so the summarizer sees content in document order.
  const docChunks = await db
    .select({
      pageNumber: chunks.pageNumber,
      content: chunks.content,
      chunkIndex: chunks.chunkIndex,
    })
    .from(chunks)
    .where(eq(chunks.documentId, documentId))
    .orderBy(chunks.pageNumber, chunks.chunkIndex);

  if (docChunks.length === 0) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  // Reconstruct page text from chunks. Not perfectly identical to the
  // original (chunks have whitespace normalized) but more than good
  // enough for summarization.
  const pageMap = new Map<number, string[]>();
  for (const chunk of docChunks) {
    const existing = pageMap.get(chunk.pageNumber) ?? [];
    existing.push(chunk.content);
    pageMap.set(chunk.pageNumber, existing);
  }
  const pages = Array.from(pageMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([pageNumber, parts]) => ({ pageNumber, text: parts.join(" ") }));

  try {
    const summary = await summarizeDocument(pages);
    await db.update(documents).set({ summary }).where(eq(documents.id, documentId));
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summary generation failed:", error);
    return NextResponse.json({ error: "Summary generation failed." }, { status: 500 });
  }
}
