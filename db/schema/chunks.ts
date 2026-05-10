import { pgTable, uuid, text, integer, vector, index } from "drizzle-orm/pg-core";
import { documents } from "./documents";

// Each PDF gets split into ~500–1000 token chunks at ingestion time.
// Each chunk stores its text, the page it came from, and the embedding we use for similarity search.

export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),

    // The chunk's actual text content — what we stuff into the LLM prompt when this chunk is retrieved.
    content: text("content").notNull(),

    // Page number this chunk originated from. Used for citations in the UI.
    pageNumber: integer("page_number").notNull(),

    // Position of this chunk within the document, useful for displaying chunks in order or debugging retrieval.
    chunkIndex: integer("chunk_index").notNull(),

    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  },
  (table) => [
    // HNSW index for fast approximate nearest-neighbor search.
    // Cosine distance is the standard choice for OpenAI embeddings.
    index("chunks_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
    // Speeds up "all chunks for this document" lookups.
    index("chunks_document_id_idx").on(table.documentId),
  ],
);

export type Chunk = typeof chunks.$inferSelect;
export type NewChunk = typeof chunks.$inferInsert;
