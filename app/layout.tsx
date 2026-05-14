import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Chat with PDF — AI-Powered Document Q&A",
  description:
    "Upload a PDF, ask questions, get reasoned answers with citations from the source document. Powered by Claude and pgvector.",
  openGraph: {
    title: "Chat with PDF — AI-Powered Document Q&A",
    description:
      "Upload a PDF, ask questions, get reasoned answers with citations from the source document.",
    url: siteUrl,
    siteName: "Chat with PDF",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chat with PDF — AI-Powered Document Q&A",
    description:
      "Upload a PDF, ask questions, get reasoned answers with citations from the source document.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
