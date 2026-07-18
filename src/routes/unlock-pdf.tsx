import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PDFDocument as CantooPDFDocument } from "@cantoo/pdf-lib";
import { LockOpen, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { ToolLayout } from "../components/ToolLayout";
import { PdfDropzone } from "../components/PdfDropzone";
import { tryConsume, getRemaining, formatResetIn, DAILY_LIMIT } from "../lib/rate-limit";

export const Route = createFileRoute("/unlock-pdf")({
  head: () => ({
    meta: [
      { title: "Unlock PDF — Remove PDF password online free · PDFNoova" },
      { name: "description", content: "Remove the password from a PDF you own, right in your browser. Free, private, no uploads." },
      { property: "og:title", content: "Unlock PDF — Free & private · PDFNoova" },
      { property: "og:url", content: "/unlock-pdf" },
      { property: "og:description", content: "Strip the password from your PDF locally in your browser." },
    ],
    links: [{ rel: "canonical", href: "/unlock-pdf" }],
  }),
  component: UnlockPage,
});

function UnlockPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unlock() {
    setError(null);
    setDone(false);
    if (files.length !== 1) return setError("Please add exactly one PDF.");

    const gate = tryConsume();
    if (!gate.ok) return setError(`Daily free limit reached (${DAILY_LIMIT} ops / 24h). Try again in ${formatResetIn(gate.resetInMs!)}.`);

    setBusy(true);
    try {
      const bytes = await files[0].arrayBuffer();
      const doc = await CantooPDFDocument.load(bytes, {
        // @ts-ignore @cantoo/pdf-lib supports password
        password,
        ignoreEncryption: false,
      });
      const out = await doc.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pdfnoova-unlocked.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setDone(true);
    } catch (e) {
      console.error(e);
      setError("Couldn't unlock that PDF. The password may be wrong or the file uses unsupported encryption.");
    } finally {
      setBusy(false);
    }
  }

  const remaining = typeof window !== "undefined" ? getRemaining() : DAILY_LIMIT;

  return (
    <ToolLayout
      eyebrow="Unlock PDF"
      title="Remove your PDF password"
      description="Only unlock PDFs you own. Enter the file's password and download an unrestricted copy — all locally."
    >
      <PdfDropzone multiple={false} files={files} onChange={setFiles} helper="One PDF at a time · processed in your browser" />

      <label className="block mt-6">
        <span className="text-sm font-medium">Current password</span>
        <div className="mt-1.5 relative">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Enter the PDF password"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-accent text-muted-foreground"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </label>

      <div className="mt-6 flex flex-wrap items-center gap-3 justify-between">
        <p className="text-xs text-muted-foreground">{remaining} of {DAILY_LIMIT} free operations left today</p>
        <button onClick={unlock} disabled={busy || files.length !== 1} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> Unlocking…</>) : (<><LockOpen className="h-4 w-4" /> Unlock PDF</>)}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
      {done && (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" /> Unlocked PDF downloaded.
        </p>
      )}
    </ToolLayout>
  );
}