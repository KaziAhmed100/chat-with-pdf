import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = "text-embedding-3-small";
// OpenAI's embeddings endpoint accepts up to ~2048 inputs per request,
// but we keep the batch size lower to bound payload size and recover
// gracefully from partial failures.
const BATCH_SIZE = 64;

// Embed a list of text chunks. Returns vectors in the same order as the
// input — that ordering is what lets us match chunks back to embeddings
// when persisting to the database.
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  if (texts.length === 0) {
    return [];
  }

  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });

    // The API returns embeddings in the same order we sent them.
    allEmbeddings.push(...response.data.map((d) => d.embedding));
  }

  return allEmbeddings;
}
