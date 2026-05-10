import { eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";

// Fetch a single document by ID. Returns null if not found, which the
// page component turns into a notFound() response.
export async function getDocument(id: string) {
  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result[0] ?? null;
}
