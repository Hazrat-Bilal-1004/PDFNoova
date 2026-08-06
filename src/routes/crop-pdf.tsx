import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Crop, Loader2, CheckCircle2 } from "lucide-react";
import { ToolLayout } from "../components/ToolLayout";
import { PdfDropzone } from "../components/PdfDropzone";
import { tryConsume, getRemaining, formatResetIn, DAILY_LIMIT } from "../lib/rate-limit";

export const Route = createFileRoute("/crop-pdf")({
  head: () => ({
    meta: [
      { title: "Crop PDF Pages — Trim PDF margins online free · PDFNoova" },
      {
        name: "description",
        content:
          "Crop PDF pages and trim white margins in your browser. Set top, bottom, left and right margins. Free, private, no uploads.",
      },
      { property: "og:title", content: "Crop PDF Pages — Free & private · PDFNoova" },
      { property: "og:url", content: "/crop-pdf" },
      {
        property: "og:description",
        content: "Trim margins from PDF pages in seconds. Runs in your browser.",
      },
    ],
    links: [{ rel: "canonical", href: "/crop-pdf" }],
  }),
  component: CropPdfPage,
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

function CropPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [top, setTop] = useState(5);
  const [bottom, setBottom] = useState(5);
  const [left, setLeft] = useState(5);
  const [right, setRight] = useState(5);
  const [scope, setScope] = useState<"all" | "range">("all");
  const [ranges, setRanges] = useState("1");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function crop() {
    setError(null);
    setDone(false);
    if (files.length !== 1) {
      setError("Please add exactly one PDF to crop.");
      return;
    }
    if (top + bottom >= 100 || left + right >= 100) {
      setError("Margins are too large — nothing would be left of the page.");
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
      const total = doc.getPageCount();
      let targets: number[];
      if (scope === "all") {
        targets = Array.from({ length: total }, (_, i) => i);
      } else {
        try {
          targets = parseRanges(ranges, total);
        } catch (e) {
          setError((e as Error).message);
          setBusy(false);
          return;
        }
        if (targets.length === 0) {
          setError("Your range didn't match any pages.");
          setBusy(false);
          return;
        }
      }
      for (const i of targets) {
        const page = doc.getPage(i);
        const box = page.getMediaBox();
        const cx = box.x + (box.width * left) / 100;
        const cy = box.y + (box.height * bottom) / 100;
        const cw = box.width * (1 - (left + right) / 100);
        const ch = box.height * (1 - (top + bottom) / 100);
        page.setCropBox(cx, cy, cw, ch);
        page.setMediaBox(cx, cy, cw, ch);
      }
      const out = await doc.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pdfnoova-cropped.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setDone(true);
    } catch (e) {
      console.error(e);
      setError("Couldn't crop that PDF. It may be corrupt or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  const remaining = typeof window !== "undefined" ? getRemaining() : DAILY_LIMIT;

  const margins = [
    { label: "Top", value: top, set: setTop },
    { label: "Bottom", value: bottom, set: setBottom },
    { label: "Left", value: left, set: setLeft },
    { label: "Right", value: right, set: setRight },
  ];

  return (
    <ToolLayout
      eyebrow="Crop PDF"
      title="Crop pages and trim margins"
      description="Cut away unwanted white space by trimming each edge by a percentage — for the whole document or selected pages."
    >
      <PdfDropzone
        multiple={false}
        files={files}
        onChange={setFiles}
        helper="One PDF at a time · processed in your browser"
      />

      <div className="mt-6 grid gap-4">
        <div>
          <span className="text-sm font-medium">Margins to remove (% of page)</span>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            {margins.map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-medium">{m.value}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={45}
                  step={1}
                  value={m.value}
                  onChange={(e) => m.set(parseInt(e.target.value, 10))}
                  className="mt-1 w-full accent-[hsl(var(--primary))]"
                  aria-label={`${m.label} margin`}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <span className="text-sm font-medium">Apply to</span>
          <div className="mt-1.5 flex gap-2">
            {[
              { v: "all" as const, label: "All pages" },
              { v: "range" as const, label: "Selected pages" },
            ].map((s) => (
              <button
                key={s.v}
                onClick={() => setScope(s.v)}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all border ${
                  scope === s.v
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "border-border hover:bg-accent"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {scope === "range" && (
          <div>
            <label htmlFor="crop-ranges" className="text-sm font-medium">
              Pages
            </label>
            <input
              id="crop-ranges"
              value={ranges}
              onChange={(e) => setRanges(e.target.value)}
              placeholder="e.g. 1, 3-5, 8"
              className="mt-1.5 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 justify-between">
        <p className="text-xs text-muted-foreground">
          {remaining} of {DAILY_LIMIT} free operations left today
        </p>
        <button
          onClick={crop}
          disabled={busy || files.length !== 1}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Cropping…
            </>
          ) : (
            <>
              <Crop className="h-4 w-4" /> Crop PDF
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
          <CheckCircle2 className="h-4 w-4" /> Cropped PDF downloaded.
        </p>
      )}
    </ToolLayout>
  );
}
