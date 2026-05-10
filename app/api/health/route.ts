import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

// Simple ping endpoint that confirms (1) the app booted and (2) the database connection works. Useful during development and as a smoke test in production.
export async function GET() {
  try {
    // `SELECT 1` is the cheapest possible query — just confirms the round-trip works without touching any real tables.
    await db.execute(sql`SELECT 1`);

    return NextResponse.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
