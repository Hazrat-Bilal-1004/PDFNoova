import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import JSZip from "jszip";
import { Image as ImageIcon, Loader2, CheckCircle2 } from "lucide-react";
import { ToolLayout } from "../components/ToolLayout";
import { PdfDropzone } from "../components/PdfDropzone";
import { tryConsume, getRemaining, formatResetIn, DAILY_LIMIT } from "../lib/rate-limit";

export const Route = createFileRoute("/pdf-to-jpg")({
  head: () => ({
    meta: [
      { title: "PDF to JPG — Convert PDF pages to JPG free · PDFNoova" },
      { name: "description", content: "Export every page of a PDF as a JPG image, right in your browser. Free, private, no uploads." },
      { property: "og:title", content: "PDF to JPG — Free & private · PDFNoova" },
      { property: "og:url", content: "/pdf-to-jpg" },
      { property: "og:description", content: "Save PDF pages as JPG images in seconds." },
    ],
    links: [{ rel: "canonical", href: "https://www.pdfnoova.com/pdf-to-jpg" }],
  }),
  component: PdfToJpgPage,
});

function PdfToJpgPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<0.8 | 0.92 | 1>(0.92);

  async function convert() {
    setError(null);
    setDone(false);
    if (files.length !== 1) {
      setError("Please add exactly one PDF.");
      return;
    }
    const gate = tryConsume();
    if (!gate.ok) {
      setError(`Daily free limit reached (${DAILY_LIMIT} ops / 24h). Try again in ${formatResetIn(gate.resetInMs!)}.`);
      return;
    }
    setBusy(true);
    try {
      const pdfjs = await import("pdfjs-dist");
      // Use worker from CDN matching version
      // @ts-ignore worker options
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const bytes = await files[0].arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: bytes }).promise;
      const zip = new JSZip();
      const baseName = files[0].name.replace(/\.pdf$/i, "");
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // @ts-ignore pdfjs render signature evolves
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const b64 = dataUrl.split(",")[1];
        zip.file(`${baseName}-page-${String(i).padStart(3, "0")}.jpg`, b64, { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}-jpg.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setDone(true);
    } catch (e) {
      console.error(e);
      setError("Couldn't convert that PDF. It may be corrupt or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  const remaining = typeof window !== "undefined" ? getRemaining() : DAILY_LIMIT;

  return (
    <ToolLayout
      eyebrow="PDF to JPG"
      title="Save PDF pages as JPG"
      description="Render each page of your PDF into a JPG image and download them as a zip. Runs entirely in your browser."
    >
      <PdfDropzone multiple={false} files={files} onChange={setFiles} helper="One PDF at a time · processed in your browser" />

      <div className="mt-6">
        <span className="text-sm font-medium">Image quality</span>
        <div className="mt-1.5 flex gap-2">
          {[
            { v: 0.8 as const, label: "Standard" },
            { v: 0.92 as const, label: "High" },
            { v: 1 as const, label: "Max" },
          ].map((q) => (
            <button
              key={q.v}
              onClick={() => setQuality(q.v)}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all border ${
                quality === q.v ? "bg-primary text-primary-foreground border-transparent" : "border-border hover:bg-accent"
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 justify-between">
        <p className="text-xs text-muted-foreground">{remaining} of {DAILY_LIMIT} free operations left today</p>
        <button onClick={convert} disabled={busy || files.length !== 1} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> Converting…</>) : (<><ImageIcon className="h-4 w-4" /> Convert to JPG</>)}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
      {done && (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" /> ZIP with JPGs downloaded.
        </p>
      )}
    </ToolLayout>
  );
}
