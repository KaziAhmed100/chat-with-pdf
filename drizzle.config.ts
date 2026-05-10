import { config } from "dotenv";
import type { Config } from "drizzle-kit";

// Load .env.local explicitly. Drizzle Kit runs as a CLI outside Next.js,
config({ path: ".env.local" });

// Drizzle Kit reads this to know where the schema lives, where to write migrations, and how to connect to the DB. It uses the same DATABASE_URL our app uses.
export default {
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Useful in dev so we can see what SQL Drizzle Kit is about to run.
  verbose: true,
  strict: true,
} satisfies Config;
