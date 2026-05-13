import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { getDocument } from "@/lib/documents";
import { Chat } from "@/components/chat";

// Per-document chat page. The Chat component is a client component;
// everything around it stays server-rendered for fast initial load.
export default async function ChatPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const doc = await getDocument(documentId);

  if (!doc) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Upload another document
      </Link>

      <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white/70 px-4 py-3 backdrop-blur-sm">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-slate-900">{doc.filename}</h1>
          <p className="text-xs text-slate-500">{doc.pageCount} pages</p>
        </div>
      </div>

      <Chat documentId={documentId} />
    </main>
  );
}
