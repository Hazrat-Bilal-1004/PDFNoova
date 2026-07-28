import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { ToolLayout } from "../components/ToolLayout";
import { PdfDropzone } from "../components/PdfDropzone";
import { tryConsume, getRemaining, formatResetIn, DAILY_LIMIT } from "../lib/rate-limit";

export const Route = createFileRoute("/delete-pdf-pages")({
  head: () => ({
    meta: [
      { title: "Delete PDF Pages — Remove pages online free · PDFNoova" },
      {
        name: "description",
        content:
          "Delete specific pages from a PDF in your browser. Free, private, no uploads — enter page numbers or ranges and download the trimmed PDF.",
      },
      { property: "og:title", content: "Delete PDF Pages — Free & private · PDFNoova" },
      { property: "og:url", content: "/delete-pdf-pages" },
      {
        property: "og:description",
        content: "Remove unwanted pages from a PDF instantly, right in your browser.",
      },
    ],
    links: [{ rel: "canonical", href: "/delete-pdf-pages" }],
  }),
  component: DeletePage,
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

function DeletePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [ranges, setRanges] = useState("2");
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
      let toDelete: number[];
      try {
        toDelete = parseRanges(ranges, total);
      } catch (e) {
        setError((e as Error).message);
        setBusy(false);
        return;
      }
      if (toDelete.length === 0) {
        setError("Your range didn't match any pages.");
        setBusy(false);
        return;
      }
      if (toDelete.length >= total) {
        setError("You can't delete every page — at least one must remain.");
        setBusy(false);
        return;
      }
      const keep = [];
      for (let i = 0; i < total; i++) if (!toDelete.includes(i)) keep.push(i);
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, keep);
      copied.forEach((p) => out.addPage(p));
      const b = await out.save();
      const url = URL.createObjectURL(new Blob([b as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "pdfnoova-trimmed.pdf";
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
      eyebrow="Delete PDF Pages"
      title="Remove pages from a PDF"
      description="Enter the page numbers you want removed — everything else stays in the original order."
    >
      <PdfDropzone
        multiple={false}
        files={files}
        onChange={setFiles}
        helper="One PDF at a time · processed in your browser"
      />
      <div className="mt-6">
        <label className="block">
          <span className="text-sm font-medium">Pages to delete</span>
          <input
            value={ranges}
            onChange={(e) => setRanges(e.target.value)}
            placeholder="e.g. 2, 5-7, 10"
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
              <Loader2 className="h-4 w-4 animate-spin" /> Deleting…
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" /> Delete Pages
            </>
          )}
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
      {done && (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" /> Trimmed PDF downloaded.
        </p>
      )}
    </ToolLayout>
  );
}
