import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import JSZip from "jszip";
import { LayoutGrid, Loader2, CheckCircle2 } from "lucide-react";
import { ToolLayout } from "../components/ToolLayout";
import { PdfDropzone } from "../components/PdfDropzone";
import { tryConsume, getRemaining, formatResetIn, DAILY_LIMIT } from "../lib/rate-limit";

// Some browsers ship a pdf.js build that expects Map.prototype.getOrInsertComputed.
// Polyfill it so rendering works everywhere.
function ensureMapPolyfill() {
  const proto = Map.prototype as any;
  if (typeof proto.getOrInsertComputed !== "function") {
    proto.getOrInsertComputed = function (key: unknown, compute: (k: unknown) => unknown) {
      if (!this.has(key)) this.set(key, compute(key));
      return this.get(key);
    };
  }
  if (typeof proto.getOrInsert !== "function") {
    proto.getOrInsert = function (key: unknown, value: unknown) {
      if (!this.has(key)) this.set(key, value);
      return this.get(key);
    };
  }
}

export const Route = createFileRoute("/pdf-thumbnail-generator")({
  head: () => ({
    meta: [
      { title: "PDF Thumbnail Generator — Create PDF previews free · PDFNoova" },
      {
        name: "description",
        content:
          "Generate thumbnail images from any PDF page in your browser. Pick a size, preview them, and download as PNG or a ZIP. No uploads.",
      },
      { property: "og:title", content: "PDF Thumbnail Generator — Free & private · PDFNoova" },
      { property: "og:url", content: "/pdf-thumbnail-generator" },
      {
        property: "og:description",
        content: "Turn PDF pages into thumbnail images instantly, right in your browser.",
      },
    ],
    links: [{ rel: "canonical", href: "/pdf-thumbnail-generator" }],
  }),
  component: ThumbnailPage,
});

type Thumb = { page: number; url: string };

function ThumbnailPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [width, setWidth] = useState<200 | 400 | 800>(400);
  const [scope, setScope] = useState<"first" | "all">("all");
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setError(null);
    setDone(false);
    setThumbs([]);
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
      ensureMapPolyfill();
      const pdfjs = await import("pdfjs-dist");
      // @ts-ignore worker options
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const bytes = await files[0].arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: bytes }).promise;
      const last = scope === "first" ? 1 : pdf.numPages;
      const made: Thumb[] = [];
      for (let i = 1; i <= last; i++) {
        const page = await pdf.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: width / base.width });
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // @ts-ignore pdfjs render signature evolves
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        made.push({ page: i, url: canvas.toDataURL("image/png") });
      }
      setThumbs(made);
      setDone(true);
    } catch (e) {
      console.error(e);
      setError("Couldn't read that PDF. It may be corrupt or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  function downloadOne(t: Thumb) {
    const a = document.createElement("a");
    a.href = t.url;
    a.download = `${files[0].name.replace(/\.pdf$/i, "")}-thumb-${String(t.page).padStart(3, "0")}.png`;
    a.click();
  }

  async function downloadZip() {
    const zip = new JSZip();
    const baseName = files[0].name.replace(/\.pdf$/i, "");
    for (const t of thumbs) {
      zip.file(
        `${baseName}-thumb-${String(t.page).padStart(3, "0")}.png`,
        t.url.split(",")[1],
        { base64: true },
      );
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}-thumbnails.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  const remaining = typeof window !== "undefined" ? getRemaining() : DAILY_LIMIT;

  return (
    <ToolLayout
      eyebrow="PDF Thumbnail Generator"
      title="Create thumbnails from your PDF"
      description="Render PDF pages into crisp PNG thumbnails — preview them here, then download one or all as a ZIP."
    >
      <PdfDropzone
        multiple={false}
        files={files}
        onChange={setFiles}
        helper="One PDF at a time · processed in your browser"
      />

      <div className="mt-6 grid gap-4">
        <div>
          <span className="text-sm font-medium">Thumbnail width</span>
          <div className="mt-1.5 flex gap-2">
            {[
              { v: 200 as const, label: "Small · 200px" },
              { v: 400 as const, label: "Medium · 400px" },
              { v: 800 as const, label: "Large · 800px" },
            ].map((w) => (
              <button
                key={w.v}
                onClick={() => setWidth(w.v)}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all border ${
                  width === w.v
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "border-border hover:bg-accent"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-sm font-medium">Pages</span>
          <div className="mt-1.5 flex gap-2">
            {[
              { v: "first" as const, label: "Cover only" },
              { v: "all" as const, label: "Every page" },
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
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 justify-between">
        <p className="text-xs text-muted-foreground">
          {remaining} of {DAILY_LIMIT} free operations left today
        </p>
        <button
          onClick={generate}
          disabled={busy || files.length !== 1}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <LayoutGrid className="h-4 w-4" /> Generate thumbnails
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {thumbs.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4" /> {thumbs.length} thumbnail
              {thumbs.length > 1 ? "s" : ""} ready.
            </p>
            {thumbs.length > 1 && (
              <button onClick={downloadZip} className="btn-ghost">
                Download all as ZIP
              </button>
            )}
          </div>
          <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {thumbs.map((t) => (
              <li key={t.page} className="rounded-2xl border border-border bg-card p-3">
                <img
                  src={t.url}
                  alt={`Thumbnail of page ${t.page}`}
                  className="w-full rounded-lg border border-border bg-white"
                />
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Page {t.page}</span>
                  <button
                    onClick={() => downloadOne(t)}
                    className="font-medium text-primary hover:underline"
                  >
                    PNG
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {done && thumbs.length === 0 && !error && (
        <p className="mt-4 text-sm text-muted-foreground">No pages were rendered.</p>
      )}
    </ToolLayout>
  );
}
