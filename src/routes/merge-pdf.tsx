import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { FileStack, Loader2, CheckCircle2 } from "lucide-react";
import { ToolLayout } from "../components/ToolLayout";
import { PdfDropzone } from "../components/PdfDropzone";
import { tryConsume, getRemaining, formatResetIn, DAILY_LIMIT } from "../lib/rate-limit";

export const Route = createFileRoute("/merge-pdf")({
  head: () => ({
    meta: [
      { title: "Merge PDF — Combine PDF files online free · PDFNoova" },
      {
        name: "description",
        content:
          "Merge multiple PDF files into one online, free, and privately. Runs in your browser — no uploads.",
      },
      { property: "og:title", content: "Merge PDF — Free & private · PDFNoova" },
      { property: "og:url", content: "/merge-pdf" },
      {
        property: "og:description",
        content: "Combine PDFs in your browser. No uploads, no accounts.",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.pdfnoova.com/merge-pdf" }],
  }),
  component: MergePage,
});

function MergePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function merge() {
    setError(null);
    setDone(false);
    if (files.length < 2) {
      setError("Add at least two PDFs to merge.");
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
      const out = await PDFDocument.create();
      for (const f of files) {
        const bytes = await f.arrayBuffer();
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      const bytes = await out.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pdfnoova-merged.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDone(true);
    } catch (e) {
      console.error(e);
      setError("Couldn't merge those PDFs. One of them may be corrupt or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  const remaining = typeof window !== "undefined" ? getRemaining() : DAILY_LIMIT;

  return (
    <ToolLayout
      eyebrow="Merge PDF"
      title="Combine PDFs into one file"
      description="Drop your PDFs, drag to reorder, and download a single merged file. Everything happens in your browser."
    >
      <PdfDropzone multiple files={files} onChange={setFiles} />

      <div className="mt-6 flex flex-wrap items-center gap-3 justify-between">
        <p className="text-xs text-muted-foreground">
          {remaining} of {DAILY_LIMIT} free operations left today
        </p>
        <button
          onClick={merge}
          disabled={busy || files.length < 2}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Merging…
            </>
          ) : (
            <>
              <FileStack className="h-4 w-4" /> Merge {files.length > 0 ? `${files.length} files` : "PDFs"}
            </>
          )}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
      {done && (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" /> Merged file downloaded.
        </p>
      )}
    </ToolLayout>
  );
}
