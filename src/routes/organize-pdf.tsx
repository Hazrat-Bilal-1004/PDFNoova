import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import {
  LayoutGrid,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Trash2,
  Undo2,
} from "lucide-react";
import { ToolLayout } from "../components/ToolLayout";
import { PdfDropzone } from "../components/PdfDropzone";
import { tryConsume, getRemaining, formatResetIn, DAILY_LIMIT } from "../lib/rate-limit";

// Some browsers ship a pdf.js build that expects Map.prototype.getOrInsertComputed.
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

export const Route = createFileRoute("/organize-pdf")({
  head: () => ({
    meta: [
      { title: "Organize PDF — Reorder, rotate & delete pages free · PDFNoova" },
      {
        name: "description",
        content:
          "Organize a PDF visually: drag pages into order, rotate them, delete the ones you don't need, then download. Free, private, runs in your browser.",
      },
      { property: "og:title", content: "Organize PDF — Free & private · PDFNoova" },
      { property: "og:url", content: "/organize-pdf" },
      {
        property: "og:description",
        content: "Reorder, rotate and remove PDF pages with live thumbnails — no uploads.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/organize-pdf" }],
  }),
  component: OrganizePage,
});

type PageItem = { index: number; thumb: string; rotation: number };

function OrganizePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [removed, setRemoved] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDone(false);
      setError(null);
      setPages([]);
      setRemoved([]);
      if (files.length !== 1) return;
      setLoading(true);
      try {
        ensureMapPolyfill();
        const pdfjs = await import("pdfjs-dist");
        // @ts-ignore worker src typing
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const bytes = new Uint8Array(await files[0].arrayBuffer());
        const pdf = await pdfjs.getDocument({ data: bytes }).promise;
        const items: PageItem[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const scale = 180 / base.width;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const ctx = canvas.getContext("2d")!;
          // @ts-ignore pdfjs render signature evolves
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          items.push({ index: i - 1, thumb: canvas.toDataURL("image/png"), rotation: 0 });
        }
        if (!cancelled) setPages(items);
      } catch (e) {
        console.error(e);
        if (!cancelled)
          setError("Couldn't read that PDF. It may be corrupt or password-protected.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [files]);

  function move(i: number, dir: -1 | 1) {
    const next = [...pages];
    const t = i + dir;
    if (t < 0 || t >= next.length) return;
    [next[i], next[t]] = [next[t], next[i]];
    setPages(next);
  }

  function rotate(i: number) {
    setPages(pages.map((p, k) => (k === i ? { ...p, rotation: (p.rotation + 90) % 360 } : p)));
  }

  function remove(i: number) {
    setRemoved([...removed, pages[i]]);
    setPages(pages.filter((_, k) => k !== i));
  }

  function restore(i: number) {
    setPages([...pages, removed[i]]);
    setRemoved(removed.filter((_, k) => k !== i));
  }

  async function run() {
    setError(null);
    setDone(false);
    if (files.length !== 1 || pages.length === 0) {
      setError("Add a PDF and keep at least one page.");
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
      const src = await PDFDocument.load(await files[0].arrayBuffer(), { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const copied = await out.copyPages(
        src,
        pages.map((p) => p.index),
      );
      copied.forEach((page, i) => {
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + pages[i].rotation) % 360));
        out.addPage(page);
      });
      const b = await out.save();
      const url = URL.createObjectURL(new Blob([b as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "pdfnoova-organized.pdf";
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
      eyebrow="Organize PDF"
      title="Reorder, rotate and delete PDF pages"
      description="See every page as a thumbnail, then move, spin or remove them and download the tidied-up PDF."
    >
      <PdfDropzone
        multiple={false}
        files={files}
        onChange={setFiles}
        helper="One PDF at a time · processed in your browser"
      />

      {loading && (
        <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Rendering page previews…
        </p>
      )}

      {pages.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {pages.map((p, i) => (
            <div key={`${p.index}-${i}`} className="rounded-xl border border-border bg-card p-2">
              <div className="overflow-hidden rounded-lg bg-muted flex items-center justify-center h-40">
                <img
                  src={p.thumb}
                  alt={`Page ${p.index + 1} preview`}
                  className="max-h-40 object-contain transition-transform"
                  style={{ transform: `rotate(${p.rotation}deg)` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  #{i + 1} · p{p.index + 1}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="p-1 rounded-md hover:bg-accent disabled:opacity-30"
                    aria-label="Move left"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === pages.length - 1}
                    className="p-1 rounded-md hover:bg-accent disabled:opacity-30"
                    aria-label="Move right"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => rotate(i)}
                    className="p-1 rounded-md hover:bg-accent"
                    aria-label="Rotate page"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove(i)}
                    className="p-1 rounded-md hover:bg-accent text-destructive"
                    aria-label="Delete page"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {removed.length > 0 && (
        <div className="mt-5">
          <span className="text-sm font-medium">Removed pages</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {removed.map((p, i) => (
              <button
                key={`${p.index}-r-${i}`}
                onClick={() => restore(i)}
                className="btn-ghost text-xs"
              >
                <Undo2 className="h-3.5 w-3.5" /> Restore page {p.index + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3 justify-between">
        <p className="text-xs text-muted-foreground">
          {remaining} of {DAILY_LIMIT} free operations left today
        </p>
        <button
          onClick={run}
          disabled={busy || pages.length === 0}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <LayoutGrid className="h-4 w-4" /> Save Organized PDF
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
          <CheckCircle2 className="h-4 w-4" /> Organized PDF downloaded.
        </p>
      )}
    </ToolLayout>
  );
}
