import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { RotateCw, Loader2, CheckCircle2 } from "lucide-react";
import { ToolLayout } from "../components/ToolLayout";
import { PdfDropzone } from "../components/PdfDropzone";
import { tryConsume, getRemaining, formatResetIn, DAILY_LIMIT } from "../lib/rate-limit";

export const Route = createFileRoute("/rotate-pdf")({
  head: () => ({
    meta: [
      { title: "Rotate PDF — Rotate PDF pages online free · PDFNoova" },
      {
        name: "description",
        content:
          "Rotate all or selected PDF pages by 90°, 180°, or 270° in your browser. Free, private, no uploads.",
      },
      { property: "og:title", content: "Rotate PDF — Free & private · PDFNoova" },
      { property: "og:url", content: "/rotate-pdf" },
      {
        property: "og:description",
        content: "Fix page orientation in seconds. Runs in your browser.",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.pdfnoova.com/rotate-pdf" }],
  }),
  component: RotatePage,
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

function RotatePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [scope, setScope] = useState<"all" | "range">("all");
  const [ranges, setRanges] = useState("1");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function rotate() {
    setError(null);
    setDone(false);
    if (files.length !== 1) {
      setError("Please add exactly one PDF to rotate.");
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
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + angle) % 360));
      }
      const out = await doc.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pdfnoova-rotated.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setDone(true);
    } catch (e) {
      console.error(e);
      setError("Couldn't rotate that PDF. It may be corrupt or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  const remaining = typeof window !== "undefined" ? getRemaining() : DAILY_LIMIT;

  return (
    <ToolLayout
      eyebrow="Rotate PDF"
      title="Rotate pages in your PDF"
      description="Turn any page 90°, 180°, or 270° — apply to the whole document or a specific range."
    >
      <PdfDropzone
        multiple={false}
        files={files}
        onChange={setFiles}
        helper="One PDF at a time · processed in your browser"
      />

      <div className="mt-6 grid gap-4">
        <div>
          <span className="text-sm font-medium">Rotation</span>
          <div className="mt-1.5 flex gap-2">
            {[90, 180, 270].map((a) => (
              <button
                key={a}
                onClick={() => setAngle(a as 90 | 180 | 270)}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all border ${
                  angle === a ? "bg-primary text-primary-foreground border-transparent" : "border-border hover:bg-accent"
                }`}
              >
                {a}°
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-sm font-medium">Apply to</span>
          <div className="mt-1.5 flex gap-2">
            <button
              onClick={() => setScope("all")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all border ${
                scope === "all" ? "bg-primary text-primary-foreground border-transparent" : "border-border hover:bg-accent"
              }`}
            >
              All pages
            </button>
            <button
              onClick={() => setScope("range")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all border ${
                scope === "range" ? "bg-primary text-primary-foreground border-transparent" : "border-border hover:bg-accent"
              }`}
            >
              Page range
            </button>
          </div>
        </div>

        {scope === "range" && (
          <label className="block">
            <span className="text-sm font-medium">Pages</span>
            <input
              value={ranges}
              onChange={(e) => setRanges(e.target.value)}
              placeholder="e.g. 1-3, 5, 7-9"
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Enter page numbers and ranges separated by commas.
            </span>
          </label>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 justify-between">
        <p className="text-xs text-muted-foreground">
          {remaining} of {DAILY_LIMIT} free operations left today
        </p>
        <button
          onClick={rotate}
          disabled={busy || files.length !== 1}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Rotating…
            </>
          ) : (
            <>
              <RotateCw className="h-4 w-4" /> Rotate PDF
            </>
          )}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
      {done && (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" /> Rotated file downloaded.
        </p>
      )}
    </ToolLayout>
  );
}
