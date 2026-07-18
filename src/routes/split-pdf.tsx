import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Scissors, Loader2, CheckCircle2 } from "lucide-react";
import { ToolLayout } from "../components/ToolLayout";
import { PdfDropzone } from "../components/PdfDropzone";
import { tryConsume, getRemaining, formatResetIn, DAILY_LIMIT } from "../lib/rate-limit";

export const Route = createFileRoute("/split-pdf")({
  head: () => ({
    meta: [
      { title: "Split PDF — Extract PDF pages online free · PDFNoova" },
      {
        name: "description",
        content:
          "Split a PDF into pages or extract a range. Free, private, and runs in your browser — no uploads.",
      },
      { property: "og:title", content: "Split PDF — Free & private · PDFNoova" },
      { property: "og:url", content: "/split-pdf" },
      {
        property: "og:description",
        content: "Split PDFs by page or range. Runs in your browser.",
      },
    ],
    links: [{ rel: "canonical", href: "/split-pdf" }],
  }),
  component: SplitPage,
});

// Parse "1-3, 5, 7-9" into a list of 0-based page indices, validated
// against the total page count.
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

function SplitPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<"range" | "all">("range");
  const [ranges, setRanges] = useState("1-1");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function split() {
    setError(null);
    setDone(false);
    if (files.length !== 1) {
      setError("Please add exactly one PDF to split.");
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

      if (mode === "range") {
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
        downloadBlob(new Blob([b as BlobPart], { type: "application/pdf" }), "pdfnoova-split.pdf");
      } else {
        // Split every page into its own PDF, delivered as separate downloads.
        for (let i = 0; i < total; i++) {
          const out = await PDFDocument.create();
          const [p] = await out.copyPages(src, [i]);
          out.addPage(p);
          const b = await out.save();
          downloadBlob(
            new Blob([b as BlobPart], { type: "application/pdf" }),
            `pdfnoova-page-${i + 1}.pdf`,
          );
        }
      }
      setDone(true);
    } catch (e) {
      console.error(e);
      setError("Couldn't split that PDF. It may be corrupt or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  const remaining = typeof window !== "undefined" ? getRemaining() : DAILY_LIMIT;

  return (
    <ToolLayout
      eyebrow="Split PDF"
      title="Extract pages from a PDF"
      description="Pull specific pages or split every page into its own file — all in your browser."
    >
      <PdfDropzone
        multiple={false}
        files={files}
        onChange={setFiles}
        helper="One PDF at a time · processed in your browser"
      />

      <div className="mt-6 grid gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setMode("range")}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all border ${
              mode === "range" ? "bg-primary text-primary-foreground border-transparent" : "border-border hover:bg-accent"
            }`}
          >
            Extract range
          </button>
          <button
            onClick={() => setMode("all")}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all border ${
              mode === "all" ? "bg-primary text-primary-foreground border-transparent" : "border-border hover:bg-accent"
            }`}
          >
            Split every page
          </button>
        </div>
        {mode === "range" && (
          <label className="block">
            <span className="text-sm font-medium">Pages</span>
            <input
              value={ranges}
              onChange={(e) => setRanges(e.target.value)}
              placeholder="e.g. 1-3, 5, 7-9"
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Enter page numbers and ranges separated by commas.
            </span>
          </label>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 justify-between">
        <p className="text-xs text-muted-foreground">
          {remaining} of {DAILY_LIMIT} free operations left today
        </p>
        <button
          onClick={split}
          disabled={busy || files.length !== 1}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Splitting…
            </>
          ) : (
            <>
              <Scissors className="h-4 w-4" /> Split PDF
            </>
          )}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
      {done && (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" /> Done. Check your downloads.
        </p>
      )}
    </ToolLayout>
  );
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
