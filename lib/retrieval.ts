import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { chunks } from "@/db/schema";
import { embedTexts } from "./embeddings";

const TOP_K = 5;
const MAX_DISTANCE = 0.85;

export type RetrievedChunk = {
  id: string;
  content: string;
  pageNumber: number;
  chunkIndex: number;
  distance: number;
};

export async function retrieveRelevantChunks(
  documentId: string,
  query: string,
): Promise<RetrievedChunk[]> {
  const [queryEmbedding] = await embedTexts([query]);

  const queryVector = `[${queryEmbedding.join(",")}]`;

  // pgvector's `<=>` is cosine distance. Lower means more similar.
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

  return results.filter((r) => r.distance <= MAX_DISTANCE);
}
