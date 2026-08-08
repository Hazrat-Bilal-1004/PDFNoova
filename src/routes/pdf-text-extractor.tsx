import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileType2, Loader2, CheckCircle2, Copy, Download } from "lucide-react";
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

export const Route = createFileRoute("/pdf-text-extractor")({
  head: () => ({
    meta: [
      { title: "PDF Text Extractor — Copy text from PDF free · PDFNoova" },
      {
        name: "description",
        content:
          "Extract all text from a PDF in seconds. Copy it to your clipboard or download a .txt file. Free, private, runs entirely in your browser.",
      },
      { property: "og:title", content: "PDF Text Extractor — Free & private · PDFNoova" },
      { property: "og:url", content: "/pdf-text-extractor" },
      {
        property: "og:description",
        content: "Pull the text out of any PDF instantly — no uploads, no signup.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/pdf-text-extractor" }],
  }),
  component: TextExtractorPage,
});

function TextExtractorPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [pageBreaks, setPageBreaks] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    setText("");
    setCopied(false);
    if (files.length !== 1) {
      setError("Please add a PDF first.");
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
      // @ts-ignore worker src typing
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const bytes = new Uint8Array(await files[0].arrayBuffer());
      const pdf = await pdfjs.getDocument({ data: bytes }).promise;
      const chunks: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        let last = -1;
        let pageText = "";
        for (const item of content.items as any[]) {
          if (typeof item.str !== "string") continue;
          const y = item.transform?.[5];
          if (last !== -1 && typeof y === "number" && Math.abs(y - last) > 2) pageText += "\n";
          pageText += item.str + (item.hasEOL ? "\n" : " ");
          if (typeof y === "number") last = y;
        }
        const cleaned = pageText.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
        chunks.push(pageBreaks ? `--- Page ${i} ---\n${cleaned}` : cleaned);
      }
      const joined = chunks.join("\n\n").trim();
      setText(
        joined ||
          "No selectable text found. This PDF is likely a scan — you'd need OCR to read it.",
      );
    } catch (e) {
      console.error(e);
      setError("Couldn't read that PDF. It may be corrupt or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Your browser blocked clipboard access — select the text and copy manually.");
    }
  }

  function downloadTxt() {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = (files[0]?.name.replace(/\.pdf$/i, "") || "pdfnoova") + ".txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  const remaining = typeof window !== "undefined" ? getRemaining() : DAILY_LIMIT;
  const words = text ? text.trim().split(/\s+/).length : 0;

  return (
    <ToolLayout
      eyebrow="PDF Text Extractor"
      title="Extract text from any PDF"
      description="Pull all the selectable text out of a PDF, then copy it or save it as a .txt file."
    >
      <PdfDropzone
        multiple={false}
        files={files}
        onChange={(f) => {
          setFiles(f);
          setText("");
          setError(null);
        }}
        helper="One PDF at a time · processed in your browser"
      />

      <label className="mt-5 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={pageBreaks}
          onChange={(e) => setPageBreaks(e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        Include page markers (--- Page 1 ---)
      </label>

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
              <Loader2 className="h-4 w-4 animate-spin" /> Extracting…
            </>
          ) : (
            <>
              <FileType2 className="h-4 w-4" /> Extract Text
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {text && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {words.toLocaleString()} words · {text.length.toLocaleString()} characters
            </span>
            <div className="flex gap-2">
              <button onClick={copy} className="btn-ghost text-sm">
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copy
                  </>
                )}
              </button>
              <button onClick={downloadTxt} className="btn-ghost text-sm">
                <Download className="h-4 w-4" /> Download .txt
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={text}
            className="mt-3 w-full h-80 rounded-xl border border-input bg-background p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}
    </ToolLayout>
  );
}
