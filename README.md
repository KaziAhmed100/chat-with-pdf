# Chat with PDF

Chat with PDF is a Retrieval-Augmented Generation (RAG-powered) document Q&A application. With this, users can upload a PDF, ask questions, and get reasoned answers with citations from the source document.

> 🚧 **Status:** under active development. See [Roadmap](#roadmap) below.

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **LLM:** Anthropic Claude (via Vercel AI SDK)
- **Embeddings:** OpenAI `text-embedding-3-small`
- **Database:** Postgres + pgvector (Neon)
- **ORM:** Drizzle
- **Deployment:** Vercel

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Roadmap

- [x] Phase 1: Project scaffolding
- [ ] Phase 2: Database and schema
- [ ] Phase 3: PDF upload and ingestion
- [ ] Phase 4: Chat with citations
- [ ] Phase 5: Summarization and transcript export
- [ ] Phase 6: Tests, deployment, polish
