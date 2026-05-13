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

## Security & Cost Controls

API keys are managed through environment variables and never committed to
the repository. Pre-commit hooks run [gitleaks](https://github.com/gitleaks/gitleaks)
to block accidental secret commits, and `.env.example` documents required
variables without exposing values.

Spend limits are enforced at the provider level (Anthropic & OpenAI), and
the deployed app applies per-IP rate limiting on all LLM-calling endpoints
(added in Phase 4).

## Roadmap

- [x] Phase 1: Project scaffolding
- [x] Phase 2: Database and schema
- [x] Phase 3: PDF upload and ingestion
- [x] Phase 4: Chat with citations
- [ ] Phase 5: Summarization and transcript export
- [ ] Phase 6: Tests, deployment, polish
