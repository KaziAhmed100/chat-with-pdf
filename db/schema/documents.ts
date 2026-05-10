import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";

// One row per uploaded PDF.
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  filename: text("filename").notNull(),
  fileSize: integer("file_size").notNull(),
  pageCount: integer("page_count").notNull(),

  // Pre-computed once at ingestion time so we don't re-summarize on every request.
  summary: text("summary"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
