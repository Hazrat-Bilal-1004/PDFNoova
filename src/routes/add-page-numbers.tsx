import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Hash, Loader2, CheckCircle2 } from "lucide-react";
import { ToolLayout } from "../components/ToolLayout";
import { PdfDropzone } from "../components/PdfDropzone";
import { tryConsume, getRemaining, formatResetIn, DAILY_LIMIT } from "../lib/rate-limit";

export const Route = createFileRoute("/add-page-numbers")({
  head: () => ({
    meta: [
      { title: "Add Page Numbers to PDF — Free online tool · PDFNoova" },
      {
        name: "description",
        content:
          "Insert page numbers into any PDF. Pick position, starting number, font size and format. Free, private, runs in your browser.",
      },
      { property: "og:title", content: "Add Page Numbers to PDF — Free & private · PDFNoova" },
      { property: "og:url", content: "/add-page-numbers" },
      {
        property: "og:description",
        content: "Number your PDF pages in seconds. No uploads, no signup.",
      },
    ],
    links: [{ rel: "canonical", href: "/add-page-numbers" }],
  }),
  component: PageNumbersPage,
});

type Position = "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left";

const POSITIONS: { id: Position; label: string }[] = [
  { id: "bottom-center", label: "Bottom centre" },
  { id: "bottom-right", label: "Bottom right" },
  { id: "bottom-left", label: "Bottom left" },
  { id: "top-center", label: "Top centre" },
  { id: "top-right", label: "Top right" },
  { id: "top-left", label: "Top left" },
];

function PageNumbersPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [position, setPosition] = useState<Position>("bottom-center");
  const [start, setStart] = useState(1);
  const [size, setSize] = useState(12);
  const [format, setFormat] = useState<"n" | "n-of-t" | "page-n">("n");
  const [skipFirst, setSkipFirst] = useState(false);
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
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const total = pages.length;
      const margin = 28;

      pages.forEach((page, i) => {
        if (skipFirst && i === 0) return;
        const num = start + i;
        const label =
          format === "n" ? `${num}` : format === "page-n" ? `Page ${num}` : `${num} of ${start + total - 1}`;
        const textWidth = font.widthOfTextAtSize(label, size);
        const { width, height } = page.getSize();
        const x = position.endsWith("center")
          ? width / 2 - textWidth / 2
          : position.endsWith("right")
            ? width - margin - textWidth
            : margin;
        const y = position.startsWith("bottom") ? margin : height - margin - size;
        page.drawText(label, { x, y, size, font, color: rgb(0.25, 0.25, 0.25) });
      });

      const out = await doc.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pdfnoova-numbered.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setDone(true);
    } catch (e) {
      console.error(e);
      setError("Couldn't number that PDF. It may be corrupt or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  const remaining = typeof window !== "undefined" ? getRemaining() : DAILY_LIMIT;

  return (
    <ToolLayout
      eyebrow="Add Page Numbers"
      title="Add page numbers to your PDF"
      description="Choose the position, starting number and format — numbers are drawn straight onto your pages."
    >
      <PdfDropzone
        multiple={false}
        files={files}
        onChange={setFiles}
        helper="One PDF at a time · processed in your browser"
      />

      <div className="mt-6 grid gap-4">
        <div>
          <span className="text-sm font-medium">Position</span>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {POSITIONS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPosition(p.id)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                  position === p.id
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "border-border hover:bg-accent"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-sm font-medium">Format</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {[
              { id: "n", label: "1" },
              { id: "page-n", label: "Page 1" },
              { id: "n-of-t", label: "1 of 10" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id as typeof format)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                  format === f.id
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "border-border hover:bg-accent"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Start at</span>
            <input
              type="number"
              min={0}
              value={start}
              onChange={(e) => setStart(Math.max(0, Number(e.target.value)))}
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Font size: {size}pt</span>
            <input
              type="range"
              min={8}
              max={28}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="mt-3 w-full accent-primary"
            />
          </label>
        </div>

        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            checked={skipFirst}
            onChange={(e) => setSkipFirst(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Skip the first page (cover page)
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
              <Loader2 className="h-4 w-4 animate-spin" /> Numbering…
            </>
          ) : (
            <>
              <Hash className="h-4 w-4" /> Add page numbers
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {done && (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" /> Numbered file downloaded.
        </p>
      )}
    </ToolLayout>
  );
}
