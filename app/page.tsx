import { UploadDropzone } from "@/components/upload-dropzone";

// Landing page. The upload dropzone is the centerpiece — once a user
// drops a PDF, they're taken to the chat page for that document.
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-white/60 px-4 py-1.5 text-xs font-medium text-blue-700 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
            </span>
            Kazi Ahmed’s AI-Powered Document Q&amp;A
          </div>

          <h1 className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
            Chat with your PDFs
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600">
            Upload a document, ask questions, and get answers grounded in the source — with
            citations you can trust.
          </p>
        </div>

        <UploadDropzone />

        <p className="mt-16 text-center text-xs text-slate-500">
          Your document is processed and embedded for retrieval. The original file is not stored.
        </p>
      </div>
    </main>
  );
}
