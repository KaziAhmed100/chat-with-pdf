import { eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, chunks } from "@/db/schema";
import { extractPdfText } from "./pdf";
import { chunkPages } from "./chunking";
import { embedTexts } from "./embeddings";
import { summarizeDocument } from "./summarize";

const MAX_PAGES = 50;

export type IngestResult = {
  documentId: string;
  filename: string;
  pageCount: number;
  chunkCount: number;
};

// Full ingestion pipeline: extract text → chunk → embed → persist →
// summarize. Summarization runs in parallel with chunk insertion so it
// doesn't extend total time — the user sees both finish together.
export async function ingestPdf(
  filename: string,
  fileSize: number,
  buffer: Uint8Array,
): Promise<IngestResult> {
  // 1. Extract text per page.
  const { pageCount, pages } = await extractPdfText(buffer);

  if (pageCount > MAX_PAGES) {
    throw new Error(`PDF has ${pageCount} pages, but the maximum is ${MAX_PAGES}.`);
  }

  // 2. Chunk the text, keeping page tagging intact.
  const docChunks = chunkPages(pages);

  if (docChunks.length === 0) {
    throw new Error("No chunks produced — the PDF appears to have no usable text.");
  }

  // 3. Embed all chunks. Slowest step (a few seconds typically).
  const embeddings = await embedTexts(docChunks.map((c) => c.content));

  // 4. Persist parent document.
  const [insertedDoc] = await db
    .insert(documents)
    .values({
      filename,
      fileSize,
      pageCount,
    })
    .returning();

  try {
    // 5. Insert chunks and generate summary in parallel. Both take a few
    //    seconds; running them concurrently saves end-to-end latency.
    const summaryPromise = summarizeDocument(pages);

    const INSERT_BATCH = 100;
    for (let i = 0; i < docChunks.length; i += INSERT_BATCH) {
      const batch = docChunks.slice(i, i + INSERT_BATCH);
      const values = batch.map((chunk, j) => ({
        documentId: insertedDoc.id,
        content: chunk.content,
        pageNumber: chunk.pageNumber,
        chunkIndex: chunk.chunkIndex,
        embedding: embeddings[i + j],
      }));
      await db.insert(chunks).values(values);
    }

    // 6. Update the document with its summary. Done as a separate query
    //    after chunks are in so we know the row still exists.
    const summary = await summaryPromise;
    await db.update(documents).set({ summary }).where(eq(documents.id, insertedDoc.id));
  } catch (error) {
    // Best-effort cleanup. Cascade delete on the foreign key handles
    // any chunks we did manage to insert.
    await db
      .delete(documents)
      .where(eq(documents.id, insertedDoc.id))
      .catch(() => {});
    throw error;
  }

  return {
    documentId: insertedDoc.id,
    filename,
    pageCount,
    chunkCount: docChunks.length,
  };
}
