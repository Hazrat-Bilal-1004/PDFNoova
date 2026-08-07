import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Maximize2, Loader2, CheckCircle2 } from "lucide-react";
import { ToolLayout } from "../components/ToolLayout";
import { PdfDropzone } from "../components/PdfDropzone";
import { tryConsume, getRemaining, formatResetIn, DAILY_LIMIT } from "../lib/rate-limit";

export const Route = createFileRoute("/resize-pdf")({
  head: () => ({
    meta: [
      { title: "Resize PDF Pages — Convert to A4, Letter or Legal free · PDFNoova" },
      {
        name: "description",
        content:
          "Resize PDF pages to A4, US Letter or Legal in your browser. Keeps content scaled and centred. Free, private, no uploads.",
      },
      { property: "og:title", content: "Resize PDF Pages — Free & private · PDFNoova" },
      { property: "og:url", content: "/resize-pdf" },
      {
        property: "og:description",
        content: "Change PDF page size to A4, Letter or Legal instantly in your browser.",
      },
    ],
    links: [{ rel: "canonical", href: "/resize-pdf" }],
  }),
  component: ResizePdfPage,
});

// Page sizes in PDF points (1pt = 1/72 inch)
const SIZES = {
  a4: { label: "A4", hint: "210 × 297 mm", width: 595.28, height: 841.89 },
  letter: { label: "US Letter", hint: "8.5 × 11 in", width: 612, height: 792 },
  legal: { label: "Legal", hint: "8.5 × 14 in", width: 612, height: 1008 },
} as const;

type SizeKey = keyof typeof SIZES;

function ResizePdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [size, setSize] = useState<SizeKey>("a4");
  const [orientation, setOrientation] = useState<"auto" | "portrait" | "landscape">("auto");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resize() {
    setError(null);
    setDone(false);
    if (files.length !== 1) {
      setError("Please add exactly one PDF to resize.");
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
      const out = await PDFDocument.create();
      const total = src.getPageCount();
      const embedded = await out.embedPdf(
        src,
        Array.from({ length: total }, (_, i) => i),
      );

      for (const page of embedded) {
        const isLandscape =
          orientation === "landscape" ||
          (orientation === "auto" && page.width > page.height);
        const base = SIZES[size];
        const targetW = isLandscape ? base.height : base.width;
        const targetH = isLandscape ? base.width : base.height;

        const scale = Math.min(targetW / page.width, targetH / page.height);
        const w = page.width * scale;
        const h = page.height * scale;

        const newPage = out.addPage([targetW, targetH]);
        newPage.drawPage(page, {
          x: (targetW - w) / 2,
          y: (targetH - h) / 2,
          width: w,
          height: h,
        });
      }

      const saved = await out.save();
      const blob = new Blob([saved as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pdfnoova-${size}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setDone(true);
    } catch (e) {
      console.error(e);
      setError("Couldn't resize that PDF. It may be corrupt or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  const remaining = typeof window !== "undefined" ? getRemaining() : DAILY_LIMIT;

  return (
    <ToolLayout
      eyebrow="Resize PDF"
      title="Resize PDF pages to A4, Letter or Legal"
      description="Convert every page to a standard paper size. Your content is scaled proportionally and centred — nothing gets cut off."
    >
      <PdfDropzone
        multiple={false}
        files={files}
        onChange={setFiles}
        helper="One PDF at a time · processed in your browser"
      />

      <div className="mt-6 grid gap-4">
        <div>
          <span className="text-sm font-medium">Page size</span>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
            {(Object.keys(SIZES) as SizeKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setSize(k)}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition-all border text-left ${
                  size === k
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "border-border hover:bg-accent"
                }`}
              >
                <span className="block">{SIZES[k].label}</span>
                <span
                  className={`block text-xs mt-0.5 ${
                    size === k ? "text-primary-foreground/75" : "text-muted-foreground"
                  }`}
                >
                  {SIZES[k].hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-sm font-medium">Orientation</span>
          <div className="mt-1.5 flex gap-2">
            {[
              { v: "auto" as const, label: "Keep original" },
              { v: "portrait" as const, label: "Portrait" },
              { v: "landscape" as const, label: "Landscape" },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => setOrientation(o.v)}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all border ${
                  orientation === o.v
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "border-border hover:bg-accent"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 justify-between">
        <p className="text-xs text-muted-foreground">
          {remaining} of {DAILY_LIMIT} free operations left today
        </p>
        <button
          onClick={resize}
          disabled={busy || files.length !== 1}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Resizing…
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4" /> Resize PDF
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
          <CheckCircle2 className="h-4 w-4" /> Resized PDF downloaded.
        </p>
      )}
    </ToolLayout>
  );
}
