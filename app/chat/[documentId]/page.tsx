import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { getDocument } from "@/lib/documents";

// Stub for the chat page. Phase 4 will replace this with the actual
// chat UI; for now it just proves end-to-end that ingestion worked
// and the document is retrievable.
export default async function ChatPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const doc = await getDocument(documentId);

  if (!doc) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Upload another document
      </Link>

      <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-8 backdrop-blur-sm">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileText className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-slate-900">{doc.filename}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {doc.pageCount} pages · Ready for questions
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
          <p className="text-sm text-slate-600">
            Document indexed and ready. Chat interface coming in the next phase.
          </p>
        </div>
      </div>
    </main>
  );
}
