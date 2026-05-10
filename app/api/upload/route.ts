import { NextResponse } from "next/server";
import { z } from "zod";
import { ingestPdf } from "@/lib/ingest";

// 10 MB cap. This is a defense-in-depth check — the UI also enforces it,
// but never trust the client.
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_MIME = "application/pdf";

// Vercel functions can run up to 60 seconds on the Pro tier and 10 on
// Hobby. Embedding a 50-page PDF typically finishes in 3–8 seconds, so
// we're well within budget on either plan.
export const maxDuration = 60;
export const runtime = "nodejs";

const fileSchema = z.object({
  name: z.string().min(1).max(500),
  size: z.number().int().positive().max(MAX_FILE_SIZE),
  type: z.literal(ACCEPTED_MIME),
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Validate metadata before reading the buffer — fail fast on
    // wrong-type or oversized uploads without burning memory.
    const meta = fileSchema.safeParse({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!meta.success) {
      return NextResponse.json(
        {
          error: "Invalid file. Must be a PDF under 10 MB.",
          details: meta.error.flatten(),
        },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const result = await ingestPdf(file.name, file.size, buffer);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Upload failed:", error);
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
