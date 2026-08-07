import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { ToolLayout } from "../components/ToolLayout";
import { PdfDropzone } from "../components/PdfDropzone";

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

export const Route = createFileRoute("/pdf-viewer")({
  head: () => ({
    meta: [
      { title: "PDF Viewer — Open and read PDF files online free · PDFNoova" },
      {
        name: "description",
        content:
          "Open and read any PDF right in your browser. Page navigation and zoom, no uploads, no accounts, completely private.",
      },
      { property: "og:title", content: "PDF Viewer — Free & private · PDFNoova" },
      { property: "og:url", content: "/pdf-viewer" },
      {
        property: "og:description",
        content: "Read PDFs instantly in your browser. Nothing is uploaded.",
      },
    ],
    links: [{ rel: "canonical", href: "/pdf-viewer" }],
  }),
  component: PdfViewerPage,
});

function PdfViewerPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [pdf, setPdf] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1.2);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const taskRef = useRef<any>(null);

  // Load the document whenever the selected file changes.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      setPdf(null);
      setNumPages(0);
      setPage(1);
      if (files.length !== 1) return;
      setBusy(true);
      try {
        ensureMapPolyfill();
        const pdfjs = await import("pdfjs-dist");
        // @ts-ignore worker options
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const bytes = await files[0].arrayBuffer();
        const doc = await pdfjs.getDocument({ data: bytes }).promise;
        if (cancelled) return;
        setPdf(doc);
        setNumPages(doc.numPages);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Couldn't open that PDF. It may be corrupt or password-protected.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [files]);

  const render = useCallback(async () => {
    if (!pdf || !canvasRef.current) return;
    try {
      if (taskRef.current) {
        taskRef.current.cancel();
        taskRef.current = null;
      }
      const p = await pdf.getPage(page);
      const viewport = p.getViewport({ scale: zoom });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const task = p.render({ canvasContext: ctx, viewport, canvas });
      taskRef.current = task;
      await task.promise;
      taskRef.current = null;
    } catch (e: any) {
      if (e?.name !== "RenderingCancelledException") console.error(e);
    }
  }, [pdf, page, zoom]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <ToolLayout
      eyebrow="PDF Viewer"
      title="Open and read PDFs in your browser"
      description="Drop in a PDF and read it instantly with page navigation and zoom. Your file never leaves your device."
    >
      <PdfDropzone
        multiple={false}
        files={files}
        onChange={setFiles}
        helper="One PDF at a time · opened locally in your browser"
      />

      {busy && (
        <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Opening PDF…
        </p>
      )}

      {error && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {pdf && (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-ghost disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium">
                Page {page} of {numPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(numPages, p + 1))}
                disabled={page >= numPages}
                className="btn-ghost disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.2).toFixed(2)))}
                className="btn-ghost"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-sm text-muted-foreground w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(2)))}
                className="btn-ghost"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-auto rounded-xl border border-border bg-secondary/40 p-4 max-h-[70vh]">
            <canvas ref={canvasRef} className="mx-auto rounded-lg shadow-soft bg-white" />
          </div>

          <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Eye className="h-3.5 w-3.5" /> Rendered locally — nothing is uploaded.
          </p>
        </>
      )}
    </ToolLayout>
  );
}
