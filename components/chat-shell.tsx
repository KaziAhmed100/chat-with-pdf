"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { toast } from "sonner";
import { useRef, useEffect } from "react";
import { ChatMessage } from "./chat-message";
import { ChatComposer } from "./chat-composer";
import { ChatEmptyState } from "./chat-empty-state";
import { DocumentSummary } from "./document-summary";
import { TranscriptDownload } from "./transcript-download";

type Source = {
  n: number;
  pageNumber: number;
  content: string;
};

type ChatShellProps = {
  documentId: string;
  documentName: string;
  pageCount: number;
  initialSummary: string | null;
};

// The full interactive surface for a document: summary panel, chat
// thread, composer, and transcript download. Owns state for the
// transcript so the download button can produce a complete export.
export function ChatShell({ documentId, documentName, pageCount, initialSummary }: ChatShellProps) {
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState(initialSummary);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { documentId },
    }),
    onError: (err) => toast.error(err.message || "Something went wrong."),
  });

  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (error?.message?.includes("Too many requests")) {
      toast.error("You've hit the rate limit. Please wait a few minutes.");
    }
  }, [error]);

  function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || isStreaming) return;
    sendMessage({ text: content });
    setInput("");
  }

  // Flatten useChat's message format into something the transcript
  // builder can consume directly.
  const transcriptMessages = messages.map((m) => {
    const text = m.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");
    const sources =
      m.role === "assistant" && m.metadata
        ? ((m.metadata as { sources?: Source[] }).sources ?? [])
        : [];
    return {
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      text,
      sources,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <DocumentSummary
        documentId={documentId}
        initialSummary={summary}
        onSummaryChange={setSummary}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {messages.length === 0
            ? "Ask anything about the document below."
            : `${messages.filter((m) => m.role === "user").length} questions asked`}
        </p>
        <TranscriptDownload
          documentName={documentName}
          pageCount={pageCount}
          summary={summary}
          messages={transcriptMessages}
        />
      </div>

      <div className="flex h-[calc(100vh-20rem)] flex-col">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-1 py-2">
          {messages.length === 0 ? (
            <ChatEmptyState onSelect={handleSend} />
          ) : (
            transcriptMessages.map((m, i) => (
              <ChatMessage key={i} role={m.role} text={m.text} sources={m.sources} />
            ))
          )}
        </div>

        <div className="mt-4">
          <ChatComposer
            value={input}
            onChange={setInput}
            onSubmit={() => handleSend()}
            disabled={isStreaming}
            isStreaming={isStreaming}
          />
        </div>
      </div>
    </div>
  );
}
