import { extractText, getDocumentProxy } from "unpdf";

export type PageText = {
  pageNumber: number;
  text: string;
};

export type PdfExtractionResult = {
  pageCount: number;
  pages: PageText[];
};

// Extract text from a PDF, page by page. We need per-page text (rather
// than one big string) so we can tag each chunk with the page it came
// from — that's what powers citations later.
//
// Throws if the PDF is encrypted, malformed, or has no extractable text
// (e.g. scanned image-only PDFs without OCR).
export async function extractPdfText(buffer: Uint8Array): Promise<PdfExtractionResult> {
  const pdf = await getDocumentProxy(buffer);
  const pageCount = pdf.numPages;

  // mergePages: false returns an array of strings — one per page, in
  // document order. Single round-trip into pdf.js, no per-page loop.
  const { text: pageTexts } = await extractText(pdf, { mergePages: false });

  let totalCharacters = 0;
  const pages: PageText[] = pageTexts.map((raw, i) => {
    // PDFs are notorious for weird whitespace and runs of newlines;
    // collapse anything spacey to a single space and trim the ends.
    const text = raw.replace(/\s+/g, " ").trim();
    totalCharacters += text.length;
    return { pageNumber: i + 1, text };
  });

  if (totalCharacters === 0) {
    throw new Error("No extractable text found. The PDF may be a scanned image without OCR.");
  }

  return { pageCount, pages };
}
