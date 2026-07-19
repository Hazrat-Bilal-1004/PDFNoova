import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PDFDocument as CantooPDFDocument } from "@cantoo/pdf-lib";
import { Lock, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { ToolLayout } from "../components/ToolLayout";
import { PdfDropzone } from "../components/PdfDropzone";
import { tryConsume, getRemaining, formatResetIn, DAILY_LIMIT } from "../lib/rate-limit";

export const Route = createFileRoute("/protect-pdf")({
  head: () => ({
    meta: [
      { title: "Protect PDF — Add password to PDF online free · PDFNoova" },
      { name: "description", content: "Add a password to secure your PDF, right in your browser. Free, private, no uploads." },
      { property: "og:title", content: "Protect PDF — Free & private · PDFNoova" },
      { property: "og:url", content: "/protect-pdf" },
      { property: "og:description", content: "Password-protect your PDF locally, no accounts, no uploads." },
    ],
    links: [{ rel: "canonical", href: "https://www.pdfnoova.com/protect-pdf" }],
  }),
  component: ProtectPage,
});

function ProtectPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function protectPdf() {
    setError(null);
    setDone(false);
    if (files.length !== 1) return setError("Please add exactly one PDF.");
    if (password.length < 4) return setError("Use a password of at least 4 characters.");
    if (password !== confirm) return setError("Passwords don't match.");

    const gate = tryConsume();
    if (!gate.ok) return setError(`Daily free limit reached (${DAILY_LIMIT} ops / 24h). Try again in ${formatResetIn(gate.resetInMs!)}.`);

    setBusy(true);
    try {
      const bytes = await files[0].arrayBuffer();
      const doc = await CantooPDFDocument.load(bytes, { ignoreEncryption: true });
      const out = await doc.save({
        // @ts-expect-error @cantoo/pdf-lib encryption options
        encrypt: {
          userPassword: password,
          ownerPassword: password,
          permissions: {
            printing: "highResolution",
            modifying: false,
            copying: false,
            annotating: false,
            fillingForms: true,
            contentAccessibility: true,
            documentAssembly: false,
          },
        },
      });
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pdfnoova-protected.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setDone(true);
    } catch (e) {
      console.error(e);
      setError("Couldn't protect that PDF. Try a different file.");
    } finally {
      setBusy(false);
    }
  }

  const remaining = typeof window !== "undefined" ? getRemaining() : DAILY_LIMIT;

  return (
    <ToolLayout
      eyebrow="Protect PDF"
      title="Password-protect your PDF"
      description="Add a password so only people with the key can open your PDF. Everything happens in your browser."
    >
      <PdfDropzone multiple={false} files={files} onChange={setFiles} helper="One PDF at a time · processed in your browser" />

      <div className="mt-6 grid gap-4">
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <div className="mt-1.5 relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Choose a strong password"
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
        <label className="block">
          <span className="text-sm font-medium">Confirm password</span>
          <input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Repeat your password"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 justify-between">
        <p className="text-xs text-muted-foreground">{remaining} of {DAILY_LIMIT} free operations left today</p>
        <button onClick={protectPdf} disabled={busy || files.length !== 1} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> Protecting…</>) : (<><Lock className="h-4 w-4" /> Protect PDF</>)}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
      {done && (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" /> Protected PDF downloaded.
        </p>
      )}
    </ToolLayout>
  );
}
