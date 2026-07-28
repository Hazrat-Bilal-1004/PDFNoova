import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ArrowUpDown, Loader2, CheckCircle2, ArrowUp, ArrowDown } from "lucide-react";
import { ToolLayout } from "../components/ToolLayout";
import { PdfDropzone } from "../components/PdfDropzone";
import { tryConsume, getRemaining, formatResetIn, DAILY_LIMIT } from "../lib/rate-limit";

export const Route = createFileRoute("/reorder-pdf-pages")({
  head: () => ({
    meta: [
      { title: "Reorder PDF Pages — Rearrange pages online free · PDFNoova" },
      {
        name: "description",
        content:
          "Drag or nudge PDF pages into any order you want. Free, private, browser-based — nothing is uploaded.",
      },
      { property: "og:title", content: "Reorder PDF Pages — Free & private · PDFNoova" },
      { property: "og:url", content: "/reorder-pdf-pages" },
      {
        property: "og:description",
        content: "Rearrange the pages of your PDF in seconds, right in your browser.",
      },
    ],
    links: [{ rel: "canonical", href: "/reorder-pdf-pages" }],
  }),
  component: ReorderPage,
});

function ReorderPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [orderText, setOrderText] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setDone(false);
      setError(null);
      if (files.length !== 1) {
        setOrder([]);
        setOrderText("");
        return;
      }
      try {
        const bytes = await files[0].arrayBuffer();
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const n = doc.getPageCount();
        const arr = Array.from({ length: n }, (_, i) => i);
        setOrder(arr);
        setOrderText(arr.map((i) => i + 1).join(", "));
      } catch {
        setError("Couldn't read that PDF. It may be corrupt or password-protected.");
      }
    })();
  }, [files]);

  function move(idx: number, dir: -1 | 1) {
    const next = [...order];
    const t = idx + dir;
    if (t < 0 || t >= next.length) return;
    [next[idx], next[t]] = [next[t], next[idx]];
    setOrder(next);
    setOrderText(next.map((i) => i + 1).join(", "));
  }

  function applyText() {
    const parts = orderText.split(",").map((s) => s.trim()).filter(Boolean);
    const n = order.length;
    const seen = new Set<number>();
    const parsed: number[] = [];
    for (const p of parts) {
      if (!/^\d+$/.test(p)) {
        setError(`"${p}" is not a page number.`);
        return;
      }
      const v = parseInt(p, 10);
      if (v < 1 || v > n) {
        setError(`Page ${v} is out of range (1–${n}).`);
        return;
      }
      if (seen.has(v)) {
        setError(`Page ${v} appears more than once.`);
        return;
      }
      seen.add(v);
      parsed.push(v - 1);
    }
    if (parsed.length !== n) {
      setError(`List every page exactly once (${n} total).`);
      return;
    }
    setError(null);
    setOrder(parsed);
  }

  async function run() {
    setError(null);
    setDone(false);
    if (files.length !== 1 || order.length === 0) {
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
      const bytes = await files[0].arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, order);
      copied.forEach((p) => out.addPage(p));
      const b = await out.save();
      const url = URL.createObjectURL(new Blob([b as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "pdfnoova-reordered.pdf";
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
      eyebrow="Reorder PDF Pages"
      title="Rearrange pages in a PDF"
      description="Nudge pages up or down, or type the exact order you want. Then download the reshuffled PDF."
    >
      <PdfDropzone
        multiple={false}
        files={files}
        onChange={setFiles}
        helper="One PDF at a time · processed in your browser"
      />

      {order.length > 0 && (
        <>
          <div className="mt-6">
            <span className="text-sm font-medium">Custom order</span>
            <div className="mt-1.5 flex gap-2">
              <input
                value={orderText}
                onChange={(e) => setOrderText(e.target.value)}
                placeholder="e.g. 3, 1, 2, 4"
                className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button onClick={applyText} className="btn-ghost text-sm">
                Apply
              </button>
            </div>
            <span className="mt-1 block text-xs text-muted-foreground">
              List every page number exactly once, separated by commas.
            </span>
          </div>

          <ul className="mt-5 space-y-2 max-h-96 overflow-auto pr-1">
            {order.map((pageIdx, i) => (
              <li
                key={`${pageIdx}-${i}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5"
              >
                <span className="text-xs text-muted-foreground w-8">#{i + 1}</span>
                <span className="text-sm font-medium flex-1">Page {pageIdx + 1}</span>
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="p-1.5 rounded-md hover:bg-accent disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === order.length - 1}
                  className="p-1.5 rounded-md hover:bg-accent disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3 justify-between">
        <p className="text-xs text-muted-foreground">
          {remaining} of {DAILY_LIMIT} free operations left today
        </p>
        <button
          onClick={run}
          disabled={busy || order.length === 0}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <ArrowUpDown className="h-4 w-4" /> Save Reordered PDF
            </>
          )}
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
      {done && (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" /> Reordered PDF downloaded.
        </p>
      )}
    </ToolLayout>
  );
}
