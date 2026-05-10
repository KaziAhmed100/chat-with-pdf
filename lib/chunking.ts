import type { PageText } from "./pdf";

export type Chunk = {
  content: string;
  pageNumber: number;
  chunkIndex: number;
};

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

// Splits in priority order. We try paragraph breaks first, then sentence-
// ish punctuation, then whitespace, then character-by-character as a last
// resort. This produces chunks that respect natural document structure
// far better than naive fixed-size splitting.
const SEPARATORS = ["\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " ", ""];

// Recursively split text using the highest-priority separator that yields
// pieces under the chunk size. This is the same algorithm LangChain's
// RecursiveCharacterTextSplitter uses; it's the de-facto standard.
function recursiveSplit(text: string, separators: string[]): string[] {
  if (text.length <= CHUNK_SIZE) {
    return [text];
  }

  const [separator, ...rest] = separators;

  // The empty-string base case means "split character by character" —
  // a guaranteed fallback when nothing else divides the text small enough.
  const splits = separator === "" ? text.split("") : text.split(separator);

  const result: string[] = [];
  for (const piece of splits) {
    if (piece.length <= CHUNK_SIZE) {
      result.push(piece);
    } else if (rest.length > 0) {
      result.push(...recursiveSplit(piece, rest));
    } else {
      // Shouldn't reach here because the empty-string separator splits
      // every string down to single characters, but keeping it for safety.
      result.push(piece);
    }
  }

  return result;
}

// Greedily merge small splits back together into chunks of roughly
// CHUNK_SIZE, with CHUNK_OVERLAP characters carried between consecutive
// chunks for context continuity.
function mergeSplits(splits: string[], separator: string): string[] {
  const chunks: string[] = [];
  const current: string[] = [];
  let currentLength = 0;

  for (const split of splits) {
    const splitLength = split.length;

    if (currentLength + splitLength + (current.length > 0 ? separator.length : 0) > CHUNK_SIZE) {
      if (current.length > 0) {
        chunks.push(current.join(separator).trim());

        // Start the next chunk with overlap from the end of the current one.
        // We pop pieces off the front until we're under the overlap budget.
        while (
          currentLength > CHUNK_OVERLAP ||
          (currentLength + splitLength + separator.length > CHUNK_SIZE && currentLength > 0)
        ) {
          const removed = current.shift();
          if (!removed) break;
          currentLength -= removed.length + separator.length;
        }
      }
    }

    current.push(split);
    currentLength += splitLength + (current.length > 1 ? separator.length : 0);
  }

  if (current.length > 0) {
    chunks.push(current.join(separator).trim());
  }

  return chunks.filter((c) => c.length > 0);
}

// Public API: take per-page text and return chunks tagged with the page
// each one came from. The page tagging is what powers citation in the UI.
export function chunkPages(pages: PageText[]): Chunk[] {
  const chunks: Chunk[] = [];
  let chunkIndex = 0;

  for (const page of pages) {
    if (!page.text) continue;

    const splits = recursiveSplit(page.text, SEPARATORS);
    const merged = mergeSplits(splits, " ");

    for (const content of merged) {
      chunks.push({
        content,
        pageNumber: page.pageNumber,
        chunkIndex: chunkIndex++,
      });
    }
  }

  return chunks;
}
