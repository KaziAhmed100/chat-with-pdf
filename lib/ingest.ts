import { db } from "@/db";
import { documents, chunks } from "@/db/schema";
import { extractPdfText } from "./pdf";
import { chunkPages } from "./chunking";
import { embedTexts } from "./embeddings";

const MAX_PAGES = 50;

export type IngestResult = {
  documentId: string;
  filename: string;
  pageCount: number;
  chunkCount: number;
};

// Full ingestion pipeline: extract text → chunk → embed → persist.
// Throws if anything goes wrong; the API route handler turns those into
// user-friendly HTTP responses.
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

  // 3. Embed all chunks. This is the slowest step (a few seconds for a
  //    typical document). Batched internally for throughput.
  const embeddings = await embedTexts(docChunks.map((c) => c.content));

  // 4. Persist atomically. The neon-http driver doesn't support multi-
  //    statement transactions in a single round-trip, but we get
  //    consistency by inserting the parent first and using its ID as the
  //    foreign key on every chunk row. If the chunk insert fails, the
  //    caller can clean up the parent.
  const [insertedDoc] = await db
    .insert(documents)
    .values({
      filename,
      fileSize,
      pageCount,
    })
    .returning();

  try {
    // Insert chunks in batches to avoid query size limits.
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
  } catch (error) {
    // Best-effort cleanup if chunk inserts fail. Cascade delete on the
    // foreign key takes care of anything we did manage to insert.
    await db
      .delete(documents)
      .where({ id: insertedDoc.id } as never)
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
