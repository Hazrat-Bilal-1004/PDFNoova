import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { Stamp, Loader2, CheckCircle2 } from "lucide-react";
import { ToolLayout } from "../components/ToolLayout";
import { PdfDropzone } from "../components/PdfDropzone";
import { tryConsume, getRemaining, formatResetIn, DAILY_LIMIT } from "../lib/rate-limit";

export const Route = createFileRoute("/watermark-pdf")({
  head: () => ({
    meta: [
      { title: "Add Watermark to PDF — Free online watermark tool · PDFNoova" },
      {
        name: "description",
        content:
          "Add a text watermark to every page of your PDF. Choose size, opacity, colour and rotation. Free, private, runs in your browser.",
      },
      { property: "og:title", content: "Add Watermark to PDF — Free & private · PDFNoova" },
      { property: "og:url", content: "/watermark-pdf" },
      {
        property: "og:description",
        content: "Stamp DRAFT, CONFIDENTIAL or any text across your PDF pages. No uploads.",
      },
    ],
    links: [{ rel: "canonical", href: "/watermark-pdf" }],
  }),
  component: WatermarkPage,
});

const COLORS: Record<string, [number, number, number]> = {
  Grey: [0.5, 0.5, 0.5],
  Red: [0.85, 0.15, 0.15],
  Blue: [0.15, 0.35, 0.85],
  Green: [0.1, 0.6, 0.35],
  Black: [0, 0, 0],
};

function WatermarkPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("CONFIDENTIAL");
  const [size, setSize] = useState(48);
  const [opacity, setOpacity] = useState(20);
  const [color, setColor] = useState<keyof typeof COLORS>("Grey");
  const [diagonal, setDiagonal] = useState(true);
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
    if (!text.trim()) {
      setError("Enter the watermark text.");
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
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const [r, g, b] = COLORS[color];
      const angle = diagonal ? 45 : 0;
      const rad = (angle * Math.PI) / 180;

      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, size);
        const textHeight = font.heightAtSize(size);
        const x = width / 2 - (textWidth / 2) * Math.cos(rad) + (textHeight / 2) * Math.sin(rad);
        const y = height / 2 - (textWidth / 2) * Math.sin(rad) - (textHeight / 2) * Math.cos(rad);
        page.drawText(text, {
          x,
          y,
          size,
          font,
          color: rgb(r, g, b),
          opacity: opacity / 100,
          rotate: degrees(angle),
        });
      }

      const out = await doc.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pdfnoova-watermarked.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setDone(true);
    } catch (e) {
      console.error(e);
      setError("Couldn't watermark that PDF. It may be corrupt or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  const remaining = typeof window !== "undefined" ? getRemaining() : DAILY_LIMIT;

  return (
    <ToolLayout
      eyebrow="Watermark PDF"
      title="Add a watermark to your PDF"
      description="Stamp text like DRAFT or CONFIDENTIAL across every page — with your own size, colour and opacity."
    >
      <PdfDropzone
        multiple={false}
        files={files}
        onChange={setFiles}
        helper="One PDF at a time · processed in your browser"
      />

      <div className="mt-6 grid gap-4">
        <label className="block">
          <span className="text-sm font-medium">Watermark text</span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. CONFIDENTIAL"
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Font size: {size}pt</span>
            <input
              type="range"
              min={12}
              max={120}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="mt-3 w-full accent-primary"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Opacity: {opacity}%</span>
            <input
              type="range"
              min={5}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="mt-3 w-full accent-primary"
            />
          </label>
        </div>

        <div>
          <span className="text-sm font-medium">Colour</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {Object.keys(COLORS).map((c) => (
              <button
                key={c}
                onClick={() => setColor(c as keyof typeof COLORS)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                  color === c
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "border-border hover:bg-accent"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-sm font-medium">Angle</span>
          <div className="mt-1.5 flex gap-2">
            <button
              onClick={() => setDiagonal(true)}
              className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                diagonal
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "border-border hover:bg-accent"
              }`}
            >
              Diagonal (45°)
            </button>
            <button
              onClick={() => setDiagonal(false)}
              className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                !diagonal
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "border-border hover:bg-accent"
              }`}
            >
              Horizontal
            </button>
          </div>
        </div>
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
              <Loader2 className="h-4 w-4 animate-spin" /> Watermarking…
            </>
          ) : (
            <>
              <Stamp className="h-4 w-4" /> Add watermark
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
          <CheckCircle2 className="h-4 w-4" /> Watermarked file downloaded.
        </p>
      )}
    </ToolLayout>
  );
}
