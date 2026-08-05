import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Calculator, Loader2, FileText } from "lucide-react";
import { ToolLayout } from "../components/ToolLayout";
import { PdfDropzone } from "../components/PdfDropzone";

export const Route = createFileRoute("/pdf-page-counter")({
  head: () => ({
    meta: [
      { title: "PDF Page Counter — Count pages in PDF files free · PDFNoova" },
      {
        name: "description",
        content:
          "Count how many pages are in one or many PDF files instantly. Free, private, runs entirely in your browser with no uploads.",
      },
      { property: "og:title", content: "PDF Page Counter — Free & private · PDFNoova" },
      { property: "og:url", content: "/pdf-page-counter" },
      {
        property: "og:description",
        content: "Get the page count of any PDF instantly — no uploads, no signup.",
      },
    ],
    links: [{ rel: "canonical", href: "/pdf-page-counter" }],
  }),
  component: PageCounterPage,
});

type Row = { name: string; sizeMb: string; pages: number | null; error?: string };

function PageCounterPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    setRows([]);
    if (files.length === 0) {
      setError("Add at least one PDF to count.");
      return;
    }
    setBusy(true);
    try {
      const results: Row[] = [];
      for (const f of files) {
        const row: Row = { name: f.name, sizeMb: (f.size / 1024 / 1024).toFixed(2), pages: null };
        try {
          const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
          row.pages = doc.getPageCount();
        } catch {
          row.error = "Couldn't read this file";
        }
        results.push(row);
      }
      setRows(results);
    } finally {
      setBusy(false);
    }
  }

  const total = rows.reduce((sum, r) => sum + (r.pages ?? 0), 0);

  return (
    <ToolLayout
      eyebrow="PDF Page Counter"
      title="Count the pages in your PDFs"
      description="Drop in one or more PDFs and see the page count of each — plus the combined total."
    >
      <PdfDropzone
        multiple
        files={files}
        onChange={(f) => {
          setFiles(f);
          setRows([]);
        }}
        helper="Add as many PDFs as you like · nothing leaves your device"
      />

      <div className="mt-6 flex flex-wrap items-center gap-3 justify-between">
        <p className="text-xs text-muted-foreground">Counting pages is always free and unlimited.</p>
        <button
          onClick={run}
          disabled={busy || files.length === 0}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Counting…
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4" /> Count pages
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {rows.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border overflow-hidden">
          <ul className="divide-y divide-border">
            {rows.map((r, i) => (
              <li key={`${r.name}-${i}`} className="flex items-center gap-3 px-4 py-3">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.sizeMb} MB</p>
                </div>
                <span className={`text-sm font-semibold ${r.error ? "text-destructive" : ""}`}>
                  {r.error ?? `${r.pages} ${r.pages === 1 ? "page" : "pages"}`}
                </span>
              </li>
            ))}
          </ul>
          {rows.length > 1 && (
            <div className="flex items-center justify-between bg-accent/50 px-4 py-3 text-sm font-semibold">
              <span>Total</span>
              <span>{total} pages</span>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
