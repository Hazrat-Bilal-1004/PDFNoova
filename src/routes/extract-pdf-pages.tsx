import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { FileOutput, Loader2, CheckCircle2 } from "lucide-react";
import { ToolLayout } from "../components/ToolLayout";
import { PdfDropzone } from "../components/PdfDropzone";
import { tryConsume, getRemaining, formatResetIn, DAILY_LIMIT } from "../lib/rate-limit";

export const Route = createFileRoute("/extract-pdf-pages")({
  head: () => ({
    meta: [
      { title: "Extract PDF Pages — Pull pages online free · PDFNoova" },
      {
        name: "description",
        content:
          "Extract selected pages from a PDF into a new file. Free, private, browser-based — no uploads, no watermarks.",
      },
      { property: "og:title", content: "Extract PDF Pages — Free & private · PDFNoova" },
      { property: "og:url", content: "/extract-pdf-pages" },
      {
        property: "og:description",
        content: "Grab just the pages you need and save them as a fresh PDF.",
      },
    ],
    links: [{ rel: "canonical", href: "/extract-pdf-pages" }],
  }),
  component: ExtractPage,
});

function parseRanges(input: string, total: number): number[] {
  const out = new Set<number>();
  const parts = input.split(",").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      const n = parseInt(part, 10);
      if (n >= 1 && n <= total) out.add(n - 1);
    } else {
      const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (!m) throw new Error(`Invalid range: "${part}"`);
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);
      if (a < 1 || b > total || a > b) throw new Error(`Out-of-bounds range: "${part}"`);
      for (let i = a; i <= b; i++) out.add(i - 1);
    }
  }
  return [...out].sort((x, y) => x - y);
}

function ExtractPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [ranges, setRanges] = useState("1-1");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    setDone(false);
    if (files.length !== 1) {
      setError("Please add exactly one PDF.");
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
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const total = src.getPageCount();
      let indices: number[];
      try {
        indices = parseRanges(ranges, total);
      } catch (e) {
        setError((e as Error).message);
        setBusy(false);
        return;
      }
      if (indices.length === 0) {
        setError("Your range didn't match any pages.");
        setBusy(false);
        return;
      }
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, indices);
      copied.forEach((p) => out.addPage(p));
      const b = await out.save();
      const url = URL.createObjectURL(new Blob([b as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "pdfnoova-extracted.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setDone(true);
    } catch (e) {
      console.error(e);
      setError("Couldn't process that PDF. It may be corrupt or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  const remaining = typeof window !== "undefined" ? getRemaining() : DAILY_LIMIT;

  return (
    <ToolLayout
      eyebrow="Extract PDF Pages"
      title="Extract pages into a new PDF"
      description="Choose specific pages or ranges and download them as a brand-new PDF file."
    >
      <PdfDropzone
        multiple={false}
        files={files}
        onChange={setFiles}
        helper="One PDF at a time · processed in your browser"
      />
      <div className="mt-6">
        <label className="block">
          <span className="text-sm font-medium">Pages to extract</span>
          <input
            value={ranges}
            onChange={(e) => setRanges(e.target.value)}
            placeholder="e.g. 1-3, 5, 7-9"
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            Separate page numbers and ranges with commas.
          </span>
        </label>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3 justify-between">
        <p className="text-xs text-muted-foreground">
          {remaining} of {DAILY_LIMIT} free operations left today
        </p>
        <button
          onClick={run}
          disabled={busy || files.length !== 1}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Extracting…
            </>
          ) : (
            <>
              <FileOutput className="h-4 w-4" /> Extract Pages
            </>
          )}
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
      {done && (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" /> Extracted PDF downloaded.
        </p>
      )}
    </ToolLayout>
  );
}
