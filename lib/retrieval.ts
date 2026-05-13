import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { chunks } from "@/db/schema";
import { embedTexts } from "./embeddings";

const TOP_K = 5;

export type RetrievedChunk = {
  id: string;
  content: string;
  pageNumber: number;
  chunkIndex: number;
  distance: number;
};

// Find the most relevant chunks for a query, scoped to a single document.
//
// We don't filter by distance threshold — the document is already small
// (single PDF, ~50 pages max) and we trust the LLM to acknowledge when
// retrieved chunks aren't directly relevant. Filtering on threshold
// caused false-negative "no document found" responses when users asked
// questions outside the document's exact topics.
export async function retrieveRelevantChunks(
  documentId: string,
  query: string,
): Promise<RetrievedChunk[]> {
  const [queryEmbedding] = await embedTexts([query]);
  const queryVector = `[${queryEmbedding.join(",")}]`;

  const distanceExpr = sql<number>`${chunks.embedding} <=> ${queryVector}::vector`;

  const results = await db
    .select({
      id: chunks.id,
      content: chunks.content,
      pageNumber: chunks.pageNumber,
      chunkIndex: chunks.chunkIndex,
      distance: distanceExpr,
    })
    .from(chunks)
    .where(eq(chunks.documentId, documentId))
    .orderBy(distanceExpr)
    .limit(TOP_K);

  return results;
}
