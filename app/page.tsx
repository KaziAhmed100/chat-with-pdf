import { FileText, MessageSquare, Download } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-white/60 px-4 py-1.5 text-xs font-medium text-blue-700 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
          </span>
          AI-powered document Q&amp;A
        </div>

        <h1 className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
          Chat with your PDFs
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600">
          Upload a document, ask questions, and get answers grounded in the source — with citations
          you can trust.
        </p>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          <Feature
            icon={<FileText className="h-5 w-5" />}
            title="Upload"
            description="Drop in any PDF and we'll handle the rest."
          />
          <Feature
            icon={<MessageSquare className="h-5 w-5" />}
            title="Ask"
            description="Get cited answers from the document itself."
          />
          <Feature
            icon={<Download className="h-5 w-5" />}
            title="Export"
            description="Download a clean transcript when you're done."
          />
        </div>

        <p className="mt-20 text-xs text-slate-500">Coming together one phase at a time.</p>
      </div>
    </main>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200/60 bg-white/70 p-6 text-left shadow-sm backdrop-blur-sm transition-all hover:border-blue-200 hover:bg-white hover:shadow-md">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-600">{description}</p>
    </div>
  );
}
