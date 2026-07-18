import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Upload, Image as ImageIcon, Loader2, CheckCircle2, X } from "lucide-react";
import { ToolLayout } from "../components/ToolLayout";
import { tryConsume, getRemaining, formatResetIn, DAILY_LIMIT } from "../lib/rate-limit";

export const Route = createFileRoute("/image-to-pdf")({
  head: () => ({
    meta: [
      { title: "Image to PDF — Convert JPG & PNG to PDF free · PDFNoova" },
      { name: "description", content: "Convert JPG, JPEG and PNG images into a single PDF document. Free, private, entirely in your browser." },
      { property: "og:title", content: "Image to PDF — Free & private · PDFNoova" },
      { property: "og:url", content: "/image-to-pdf" },
      { property: "og:description", content: "Combine images into a clean PDF, all in your browser." },
    ],
    links: [{ rel: "canonical", href: "/image-to-pdf" }],
  }),
  component: ImageToPdfPage,
});

const ACCEPT = ["image/jpeg", "image/jpg", "image/png"];

function ImageToPdfPage() {
  return (
    <ToolLayout
      eyebrow="Image to PDF"
      title="Turn images into a PDF"
      description="Drop JPG or PNG images, reorder them, and download a single PDF. Everything happens locally in your browser."
    >
      <ImageToPdfTool accept={ACCEPT} downloadName="pdfnoova-images.pdf" acceptLabel="JPG, JPEG, PNG" />
    </ToolLayout>
  );
}

export function ImageToPdfTool({
  accept,
  acceptLabel,
  downloadName,
}: {
  accept: string[];
  acceptLabel: string;
  downloadName: string;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function add(list: FileList | null) {
    if (!list) return;
    setError(null);
    const good: File[] = [];
    for (const f of Array.from(list)) {
      if (!accept.includes(f.type) && !/\.(jpe?g|png)$/i.test(f.name)) {
        setError(`"${f.name}" is not a supported image.`);
        continue;
      }
      if (f.size > 25 * 1024 * 1024) {
        setError(`"${f.name}" is larger than 25 MB.`);
        continue;
      }
      good.push(f);
    }
    setFiles((prev) => [...prev, ...good]);
  }

  function remove(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  function move(i: number, dir: -1 | 1) {
    setFiles((prev) => {
      const next = [...prev];
      const t = i + dir;
      if (t < 0 || t >= next.length) return prev;
      [next[i], next[t]] = [next[t], next[i]];
      return next;
    });
  }

  async function convert() {
    setError(null);
    setDone(false);
    if (files.length === 0) {
      setError("Add at least one image.");
      return;
    }
    const gate = tryConsume();
    if (!gate.ok) {
      setError(`Daily free limit reached (${DAILY_LIMIT} ops / 24h). Try again in ${formatResetIn(gate.resetInMs!)}.`);
      return;
    }
    setBusy(true);
    try {
      const doc = await PDFDocument.create();
      for (const f of files) {
        const bytes = await f.arrayBuffer();
        const isPng = f.type === "image/png" || /\.png$/i.test(f.name);
        const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
        const page = doc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setDone(true);
    } catch (e) {
      console.error(e);
      setError("Couldn't build a PDF from those images.");
    } finally {
      setBusy(false);
    }
  }

  const remaining = typeof window !== "undefined" ? getRemaining() : DAILY_LIMIT;

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          add(e.dataTransfer.files);
        }}
        className="cursor-pointer rounded-3xl border-2 border-dashed border-border bg-card hover:border-primary/50 hover:bg-accent/40 p-10 md:p-14 text-center transition-all"
        role="button"
        tabIndex={0}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-soft animate-float">
          <Upload className="h-6 w-6" />
        </div>
        <p className="mt-4 text-lg font-semibold">Drop images here or click to browse</p>
        <p className="mt-1 text-sm text-muted-foreground">{acceptLabel} · max 25 MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept.join(",")}
          multiple
          className="hidden"
          onChange={(e) => add(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-5 space-y-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <ImageIcon className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{f.name}</p>
                <p className="text-xs text-muted-foreground">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              {files.length > 1 && (
                <div className="flex items-center gap-1 text-xs">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="px-2 py-1 rounded-md hover:bg-accent disabled:opacity-30" aria-label="Move up">↑</button>
                  <button onClick={() => move(i, 1)} disabled={i === files.length - 1} className="px-2 py-1 rounded-md hover:bg-accent disabled:opacity-30" aria-label="Move down">↓</button>
                </div>
              )}
              <button onClick={() => remove(i)} className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive" aria-label="Remove image">
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3 justify-between">
        <p className="text-xs text-muted-foreground">{remaining} of {DAILY_LIMIT} free operations left today</p>
        <button
          onClick={convert}
          disabled={busy || files.length === 0}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> Converting…</>) : (<><ImageIcon className="h-4 w-4" /> Create PDF</>)}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
      {done && (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" /> PDF downloaded.
        </p>
      )}
    </div>
  );
}