"use client";

import { useState } from "react";
import { toast } from "sonner";

type UploadStage = "idle" | "uploading" | "processing" | "done" | "error";

type UploadResult = {
  documentId: string;
  filename: string;
  pageCount: number;
  chunkCount: number;
};

// Tracks the upload state machine for the UI. `processing` and `uploading`
// look the same to the user (both are "loading"), but we distinguish them
// internally so we can show different progress copy.
export function useUpload() {
  const [stage, setStage] = useState<UploadStage>("idle");
  const [progress, setProgress] = useState<string>("");

  async function upload(file: File): Promise<UploadResult | null> {
    setStage("uploading");
    setProgress("Uploading PDF...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      // The server does extract → chunk → embed → persist. From the
      // browser's perspective it's one request that takes a few seconds.
      setProgress("Extracting text and embedding...");
      setStage("processing");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Upload failed." }));
        throw new Error(error.error || "Upload failed.");
      }

      const data = (await response.json()) as UploadResult;
      setStage("done");
      setProgress("");
      return data;
    } catch (error) {
      setStage("error");
      const message = error instanceof Error ? error.message : "Something went wrong.";
      setProgress(message);
      toast.error(message);
      return null;
    }
  }

  function reset() {
    setStage("idle");
    setProgress("");
  }

  return { stage, progress, upload, reset };
}
