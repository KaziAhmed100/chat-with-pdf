"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { toast } from "sonner";
import { ChatMessage } from "./chat-message";
import { ChatComposer } from "./chat-composer";
import { ChatEmptyState } from "./chat-empty-state";

type Source = {
  n: number;
  pageNumber: number;
  content: string;
};

type ChatProps = {
  documentId: string;
};

export function Chat({ documentId }: ChatProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { documentId },
    }),
    onError: (err) => {
      toast.error(err.message || "Something went wrong.");
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // Auto-scroll to bottom whenever messages or streaming state change.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isStreaming]);

  function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || isStreaming) return;
    sendMessage({ text: content });
    setInput("");
  }

  // Surface a clean message when rate limit kicks in.
  useEffect(() => {
    if (error?.message?.includes("Too many requests")) {
      toast.error("You've hit the rate limit. Please wait a few minutes.");
    }
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-1 py-2">
        {messages.length === 0 ? (
          <ChatEmptyState onSelect={handleSend} />
        ) : (
          messages.map((m) => {
            const text = m.parts
              .filter((p): p is { type: "text"; text: string } => p.type === "text")
              .map((p) => p.text)
              .join("");

            // The server attaches sources via messageMetadata; the AI SDK
            // surfaces them on m.metadata for assistant messages.
            const sources =
              m.role === "assistant" && m.metadata
                ? ((m.metadata as { sources?: Source[] }).sources ?? [])
                : [];

            return (
              <ChatMessage
                key={m.id}
                role={m.role === "user" ? "user" : "assistant"}
                text={text}
                sources={sources}
              />
            );
          })
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
  );
}
