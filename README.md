# Chat with PDF

A RAG-powered document Q&A application. Upload a PDF, ask questions, and
get reasoned answers with inline citations linked to specific pages of the
source document.

**Live demo:** https://chat-with-pdf-kazi.vercel.app/
**Repo:** https://github.com/KaziAhmed100/chat-with-pdf

> Built as a portfolio project to demonstrate full-stack engineering with
> modern AI infrastructure — RAG, vector search, streaming LLM responses,
> production-grade rate limiting, and cost-aware model tiering.

## Features

- **PDF ingestion** with text extraction, recursive character chunking, and
  batched embedding via OpenAI `text-embedding-3-small`
- **Vector similarity search** over chunks using Postgres + pgvector (HNSW
  index, cosine distance)
- **Streaming chat** with Anthropic Claude Sonnet 4.5, multi-turn memory,
  and grounded answers
- **Inline page-level citations** rendered as clickable badges with excerpt
  popovers
- **Auto-generated summaries** at ingestion time using Claude Haiku 4.5
  (cost tier optimization)
- **Markdown transcript export** of the full conversation
- **Per-IP rate limiting** on LLM-calling endpoints via Upstash Redis

## Architecture

┌─────────────────────────────────────────────────────────────────────┐
│ Browser (Next.js) │
│ Upload UI · Streaming chat · Citation popovers · Transcript DL │
└────────┬────────────────────────┬──────────────────────┬────────────┘
│ │ │
▼ ▼ ▼
┌────────────────┐ ┌──────────────────┐ ┌────────────────────┐
│ POST /api/ │ │ POST /api/chat │ │ POST /api/summary │
│ upload │ │ (streaming SSE) │ │ /[documentId] │
└────────┬───────┘ └────────┬─────────┘ └──────────┬─────────┘
│ │ │
▼ ▼ ▼
┌────────────────────────────────────────────────────────────────────┐
│ Ingestion Pipeline │
│ unpdf → recursive chunker → batched OpenAI embeddings → Drizzle │
└────────┬─────────────────────────────────────────────────┬─────────┘
│ │
▼ ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│ Postgres (Neon) │ │ Anthropic Claude API │
│ • documents │ │ • Sonnet 4.5 (chat) │
│ • chunks (vector(1536)) │ │ • Haiku 4.5 (summary) │
│ • HNSW cosine index │ │ │
└─────────────────────────────┘ └─────────────────────────────┘

Rate limiting: Upstash Redis sliding window per IP

## Tech Stack

| Layer         | Choice                              | Why                                          |
| ------------- | ----------------------------------- | -------------------------------------------- |
| Framework     | Next.js 16 (App Router)             | Industry standard, full-stack in one repo    |
| Language      | TypeScript                          | Type safety end-to-end                       |
| Styling       | Tailwind CSS + shadcn/ui            | Modern, accessible, fast to iterate          |
| Database      | Postgres (Neon)                     | Single database for relational + vector data |
| Vector search | pgvector (HNSW + cosine)            | Fast approximate nearest neighbor            |
| ORM           | Drizzle                             | Type-safe, lightweight, serverless-friendly  |
| Embeddings    | OpenAI `text-embedding-3-small`     | Best quality/cost ratio (~$0.02/M tokens)    |
| Chat          | Claude Sonnet 4.5 via Vercel AI SDK | Best reasoning quality for RAG               |
| Summarization | Claude Haiku 4.5                    | ~10× cheaper for non-reasoning tasks         |
| PDF parsing   | unpdf                               | Mozilla pdf.js, serverless-ready             |
| Rate limiting | Upstash Redis (sliding window)      | Distributed, serverless-native               |
| Deployment    | Vercel                              | Tight Next.js integration                    |
| Testing       | Vitest + Testing Library            | Fast, modern test runner                     |
| CI            | GitHub Actions                      | Lint + typecheck + test on every push        |

## Design Decisions

**Same embedding model for ingest and query.** Embeddings from different
models live in different vector spaces. Mixing them silently degrades
retrieval quality — a common bug in early-stage RAG systems.

**Model tiering by task.** Claude Haiku 4.5 handles summarization (cheap,
high-volume, low reasoning needs); Sonnet 4.5 handles chat (premium
reasoning where quality matters). This pattern keeps inference costs ~10×
lower than running everything on the strongest model.

**Per-page citations, not per-chunk.** Users care about _which page_ a
fact comes from. Chunk indices are an implementation detail.

**No PDF storage.** Once we've extracted text and embedded chunks, the
binary has done its job. Throwing it away simplifies the data model,
reduces storage cost, and improves the privacy story.

**Streaming responses.** Latency to first token matters more than total
latency. Streaming the answer as it generates is the difference between
"this feels fast" and "this feels slow."

**Rate limiting on the LLM-touching endpoints only.** The expensive paths
are protected; the cheap ones (page loads, downloads) stay unrestricted.

## Security & Cost Controls

API keys are managed through environment variables and never committed to
the repository. Pre-commit hooks run [gitleaks](https://github.com/gitleaks/gitleaks)
to block accidental secret commits; `.env.example` documents required
variables without exposing values.

Spend limits are enforced at the provider level (Anthropic, OpenAI), and
the deployed app applies per-IP rate limiting on all LLM-calling endpoints.
File uploads are capped at 10 MB and 50 pages.

## Getting Started

### Prerequisites

- Node.js 22+
- A Neon Postgres database with the `vector` extension enabled
- Anthropic, OpenAI, and Upstash accounts (free tiers are sufficient)

### Setup

```bash
git clone https://github.com/KaziAhmed100/chat-with-pdf.git
cd chat-with-pdf
npm install
cp .env.example .env.local
# Fill in .env.local with your credentials
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Running tests

```bash
npm test          # one-shot
npm run test:watch  # interactive
```

## What I'd Build in v2

- **Persistent conversations.** Today chat state lives only in browser
  memory. v2 would persist conversations to Postgres so users can return.
- **Background ingestion.** Currently synchronous (up to ~15s for large
  PDFs). v2 would use a queue (Vercel Cron or QStash) with WebSocket
  status updates.
- **Multi-document Q&A.** Chat across an entire library, not one document
  at a time.
- **Semantic chunking.** Instead of recursive character splitting, use
  embeddings to detect topic boundaries. Higher quality at higher cost.
- **PDF transcript export.** Markdown is portable but plain; a styled PDF
  with proper page footers would feel more polished.
- **Authentication & per-user data isolation.** The schema is ready for it
  (we'd add a `userId` column to `documents`); the wiring is the work.

## License

MIT — see [LICENSE](./LICENSE).
