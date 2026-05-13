import { NextResponse } from "next/server";
import { z } from "zod";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { retrieveRelevantChunks, type RetrievedChunk } from "@/lib/retrieval";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/get-ip";

export const maxDuration = 60;
export const runtime = "nodejs";

const requestSchema = z.object({
  documentId: z.string().uuid(),
  // useChat sends the entire UI message history. We accept it loosely
  // and convert via convertToCoreMessages below.
  messages: z.array(z.unknown()),
});

// System prompt design notes:
// - We're explicit about citation format because consistency matters when
//   we parse [1], [2], etc. on the client.
// - "I don't know" honesty is reinforced — RAG without this hallucinates.
// - Tone instructions are minimal; Claude's defaults are already good.
function buildSystemPrompt(retrieved: RetrievedChunk[]): string {
  const sources = retrieved
    .map((chunk, i) => `[${i + 1}] (page ${chunk.pageNumber})\n${chunk.content}`)
    .join("\n\n");

  return `You are a helpful assistant answering questions about a specific PDF
document. Excerpts from the document are provided below as numbered sources.

Rules:

1. Answer using ONLY the information in the sources below. If the sources
   don't contain enough information to answer, say so directly — explain
   what the document does cover and suggest a related question the user
   could ask. Never claim "no document was provided."

2. Cite every factual claim using square-bracket numbers like [1] or [2,3]
   that match the source numbers. Place citations immediately after the
   relevant sentence or phrase.

3. Be concise. Prefer direct answers over restating the question.

4. If the question is conversational (e.g. "thanks", "hi"), respond naturally
   without forcing citations.

Sources:

${sources}`;
}

export async function POST(request: Request) {
  // Rate limit first — cheapest possible reject.
  const ip = getClientIp(request.headers);
  const rl = await checkRateLimit(`chat:${ip}`);
  if (!rl.success) {
    const retryInSeconds = Math.ceil((rl.reset - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: "Too many requests. Please slow down.",
        retryAfter: retryInSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryInSeconds.toString(),
          "X-RateLimit-Limit": rl.limit.toString(),
          "X-RateLimit-Remaining": rl.remaining.toString(),
        },
      },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { documentId, messages } = parsed.data;
  const uiMessages = messages as UIMessage[];

  // Find the latest user message — that's the one we retrieve against.
  const lastUserMessage = [...uiMessages].reverse().find((m) => m.role === "user");
  const queryText = extractTextFromMessage(lastUserMessage);

  if (!queryText) {
    return NextResponse.json({ error: "No user question provided." }, { status: 400 });
  }

  // Retrieve relevant chunks for this query, scoped to the document.
  const retrieved = await retrieveRelevantChunks(documentId, queryText);

  // Build the conversation: system prompt with sources + entire history.
  // Keeping the full history is what enables follow-up questions to work.
  const modelMessages = await convertToModelMessages(uiMessages);

  const result = streamText({
    model: anthropic("claude-sonnet-4-5"),
    system: buildSystemPrompt(retrieved),
    messages: modelMessages,
    temperature: 0.2,
    // Custom data goes back in the response stream — we attach the
    // sources so the UI can render citation badges with page info.
    experimental_telemetry: { isEnabled: false },
  });

  // Attach source metadata as a custom data part so the client can
  // render citations alongside the streamed text.
  const sourcesData = retrieved.map((chunk, i) => ({
    n: i + 1,
    pageNumber: chunk.pageNumber,
    content: chunk.content,
  }));

  return result.toUIMessageStreamResponse({
    messageMetadata: () => ({ sources: sourcesData }),
  });
}

// UIMessage parts can be text, tool calls, or other types — we only care
// about text for retrieval purposes.
function extractTextFromMessage(message: UIMessage | undefined): string {
  if (!message) return "";
  if (!Array.isArray(message.parts)) return "";
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join(" ")
    .trim();
}
