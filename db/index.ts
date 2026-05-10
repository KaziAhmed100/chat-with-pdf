import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to .env.local");
}

// Neon's HTTP driver — perfect for serverless because each request opens a fresh connection over HTTPS.
const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
