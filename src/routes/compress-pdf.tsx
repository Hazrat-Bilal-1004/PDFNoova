import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { ToolLayout } from "../components/ToolLayout";
import { PdfDropzone } from "../components/PdfDropzone";
import { tryConsume, getRemaining, formatResetIn, DAILY_LIMIT } from "../lib/rate-limit";

export const Route = createFileRoute("/compress-pdf")({
  head: () => ({
    meta: [
      { title: "Compress PDF — Shrink PDF file size online free · PDFNoova" },
      {
        name: "description",
        content:
          "Reduce PDF file size in your browser. Free, private, no uploads — optimize PDFs instantly with PDFNoova.",
      },
      { property: "og:title", content: "Compress PDF — Free & private · PDFNoova" },
      { property: "og:url", content: "/compress-pdf" },
      {
        property: "og:description",
        content: "Shrink PDFs in your browser. No uploads, no accounts.",
      },
    ],
    links: [{ rel: "canonical", href: "/compress-pdf" }],
  }),
  component: CompressPage,
});

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function CompressPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ before: number; after: number } | null>(null);

  async function compress() {
    setError(null);
    setDone(false);
    setResult(null);
    if (files.length !== 1) {
      setError("Please add exactly one PDF to compress.");
      return;
    }
    const gate = tryConsume();
    if (!gate.ok) {
      setError(
        `Daily free limit reached (${DAILY_LIMIT} ops / 24h). Try again in ${formatResetIn(gate.resetInMs!)}.`,
      );
      return;
    }
    setBusy(true);
    try {
      const bytes = await files[0].arrayBuffer();
      const before = bytes.byteLength;
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
      // Strip metadata to save bytes
      src.setTitle("");
      src.setAuthor("");
      src.setSubject("");
      src.setKeywords([]);
      src.setProducer("");
      src.setCreator("");
      const out = await src.save({ useObjectStreams: true, addDefaultPage: false });
      const after = out.byteLength;
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pdfnoova-compressed.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setResult({ before, after });
      setDone(true);
    } catch (e) {
      console.error(e);
      setError("Couldn't compress that PDF. It may be corrupt or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  const remaining = typeof window !== "undefined" ? getRemaining() : DAILY_LIMIT;

  return (
    <ToolLayout
      eyebrow="Compress PDF"
      title="Shrink your PDF file size"
      description="Optimize a PDF's structure and strip metadata to make it smaller — all in your browser."
    >
      <PdfDropzone
        multiple={false}
        files={files}
        onChange={setFiles}
        helper="One PDF at a time · processed in your browser"
      />

      <div className="mt-6 flex flex-wrap items-center gap-3 justify-between">
        <p className="text-xs text-muted-foreground">
          {remaining} of {DAILY_LIMIT} free operations left today
        </p>
        <button
          onClick={compress}
          disabled={busy || files.length !== 1}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Compressing…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Compress PDF
            </>
          )}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
      {done && result && (
        <div className="mt-4 card-soft p-4 text-sm">
          <p className="inline-flex items-center gap-2 text-primary font-medium">
            <CheckCircle2 className="h-4 w-4" /> Compressed file downloaded.
          </p>
          <p className="mt-2 text-muted-foreground">
            {formatBytes(result.before)} → <span className="text-foreground font-medium">{formatBytes(result.after)}</span>
            {" "}
            ({result.after < result.before
              ? `saved ${(100 - (result.after / result.before) * 100).toFixed(1)}%`
              : "already well optimized"})
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tip: PDFs made mostly of scanned images benefit most from a dedicated image re-compression step,
            coming in a future update.
          </p>
        </div>
      )}
    </ToolLayout>
  );
}
