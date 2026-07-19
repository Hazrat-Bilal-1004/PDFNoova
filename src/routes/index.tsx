import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileStack,
  Scissors,
  ShieldCheck,
  Lock,
  LockOpen,
  Image as ImageIcon,
  FileImage,
  Zap,
  Sparkles,
  Cpu,
  ArrowRight,
  Upload,
  MousePointer2,
  Download,
} from "lucide-react";
import { AdSlot } from "../components/AdSlot";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PDFNoova — Fast, private PDF tools in your browser" },
      {
        name: "description",
        content:
          "Free browser-based PDF tools. Merge, split, and manage PDF files without uploads, accounts, or watermarks.",
      },
      { property: "og:title", content: "PDFNoova — Fast, private PDF tools in your browser" },
      { property: "og:url", content: "/" },
      {
        property: "og:description",
        content: "Free browser-based PDF tools. Merge, split, and manage PDF files without uploads, accounts, or watermarks.",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.pdfnoova.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "PDFNoova",
          url: "/",
          potentialAction: {
            "@type": "SearchAction",
            target: "/blog?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  component: Home,
});

const tools = [
  {
    to: "/merge-pdf" as const,
    label: "Merge PDF",
    desc: "Combine multiple PDFs into one clean file.",
    icon: FileStack,
    ready: true,
  },
  {
    to: "/split-pdf" as const,
    label: "Split PDF",
    desc: "Extract pages or split a PDF into parts.",
    icon: Scissors,
    ready: true,
  },
  {
    to: "/compress-pdf" as const,
    label: "Compress PDF",
    desc: "Shrink file size without losing quality.",
    icon: Sparkles,
    ready: true,
  },
  {
    to: "/rotate-pdf" as const,
    label: "Rotate PDF",
    desc: "Fix orientation on any page.",
    icon: Cpu,
    ready: true,
  },
  {
    to: "/image-to-pdf" as const,
    label: "Image to PDF",
    desc: "Turn JPGs and PNGs into a PDF document.",
    icon: ImageIcon,
    ready: true,
  },
  {
    to: "/jpg-to-pdf" as const,
    label: "JPG to PDF",
    desc: "Convert JPG photos into a single PDF.",
    icon: FileImage,
    ready: true,
  },
  {
    to: "/pdf-to-jpg" as const,
    label: "PDF to JPG",
    desc: "Export every PDF page as a JPG image.",
    icon: Download,
    ready: true,
  },
  {
    to: "/protect-pdf" as const,
    label: "Protect PDF",
    desc: "Add a password to secure your PDF.",
    icon: Lock,
    ready: true,
  },
  {
    to: "/unlock-pdf" as const,
    label: "Unlock PDF",
    desc: "Remove password protection from a PDF.",
    icon: LockOpen,
    ready: true,
  },
] as const;

function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient">
        <div className="mx-auto max-w-6xl px-5 pt-20 pb-16 text-center">
          <span className="chip animate-fade-up"><ShieldCheck className="h-3 w-3" /> Privacy-first · 100% in your browser</span>
          <h1 className="mt-5 text-5xl md:text-7xl font-semibold tracking-tight animate-fade-up" style={{ animationDelay: "80ms" }}>
            PDF tools that <span className="italic text-primary">just work</span>.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: "160ms" }}>
            Merge, split, and manage PDFs in seconds. No uploads, no accounts, no watermarks —
            your files never leave your device.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 animate-fade-up" style={{ animationDelay: "240ms" }}>
            <Link to="/merge-pdf" className="btn-primary">
              Merge a PDF <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/split-pdf" className="btn-ghost">Split a PDF</Link>
          </div>
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="mx-auto max-w-6xl px-5 mt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => {
            const Icon = t.icon;
            const inner = (
              <div className={`card-soft p-6 h-full flex flex-col ${!t.ready ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground grid place-items-center shadow-soft">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{t.label}</h3>
                  {!t.ready && <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">soon</span>}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{t.desc}</p>
                {t.ready && (
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Open tool <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </div>
            );
            return t.ready ? (
              <Link key={t.label} to={t.to} className="block">
                {inner}
              </Link>
            ) : (
              <div key={t.label}>{inner}</div>
            );
          })}
        </div>
      </section>

      {/* Ad */}
      <section className="mx-auto max-w-6xl px-5 mt-14">
        <AdSlot />
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 mt-24">
        <div className="text-center max-w-2xl mx-auto">
          <span className="chip">How it works</span>
          <h2 className="mt-4 text-4xl font-semibold">Three simple steps</h2>
          <p className="mt-3 text-muted-foreground">
            No signup, no software install. Open the tool and go.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { icon: Upload, title: "Drop your PDF", body: "Drag files in or pick from your device." },
            { icon: MousePointer2, title: "Reorder or configure", body: "Arrange pages or set your options." },
            { icon: Download, title: "Download instantly", body: "Your new PDF is ready in seconds." },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="card-soft p-6 relative">
                <span className="absolute -top-3 left-6 chip bg-primary text-primary-foreground">Step {i + 1}</span>
                <Icon className="h-6 w-6 text-primary mt-2" />
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why */}
      <section className="mx-auto max-w-6xl px-5 mt-24">
        <div className="grid gap-10 md:grid-cols-2 items-center">
          <div>
            <span className="chip">Why PDFNoova</span>
            <h2 className="mt-4 text-4xl font-semibold">Built for people who move fast.</h2>
            <p className="mt-4 text-muted-foreground">
              We built PDFNoova because the web deserves PDF tools that respect your time and your
              privacy. No noise. No dark patterns. Just the tools you need — free, forever.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Runs entirely in your browser via WebAssembly",
                "No signups, no watermarks, no email required",
                "Works offline once the page has loaded",
                "Architecture ready for OCR, compression, conversions",
              ].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card-soft p-8">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { k: "0", v: "files uploaded" },
                { k: "100%", v: "browser-based" },
                { k: "1h", v: "auto-cleanup" },
                { k: "5", v: "free ops / day" },
                { k: "∞", v: "no account" },
                { k: "0", v: "trackers" },
              ].map((s) => (
                <div key={s.v} className="rounded-xl bg-secondary/50 py-5">
                  <p className="text-2xl font-semibold text-primary">{s.k}</p>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="mx-auto max-w-6xl px-5 mt-24">
        <div className="card-soft p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative grid md:grid-cols-[auto_1fr] gap-6 items-start">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground grid place-items-center">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <span className="chip">Privacy first</span>
              <h2 className="mt-3 text-3xl font-semibold">Your PDFs stay on your device.</h2>
              <p className="mt-3 text-muted-foreground max-w-2xl">
                PDFNoova processes files locally in your browser. If a tool ever needs a
                server round-trip in the future, files will be auto-deleted within one
                hour and never shared, indexed, or resold.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="chip"><Zap className="h-3 w-3" /> Local processing</span>
                <span className="chip"><ShieldCheck className="h-3 w-3" /> Auto-delete &lt; 1h</span>
                <span className="chip"><Lock className="h-3 w-3" /> Never shared</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 mt-24">
        <div className="text-center">
          <span className="chip">FAQ</span>
          <h2 className="mt-4 text-4xl font-semibold">Common questions</h2>
        </div>
        <div className="mt-8 space-y-3">
          {[
            {
              q: "Is PDFNoova really free?",
              a: "Yes. All current tools are 100% free with a soft limit of 5 operations per 24 hours to prevent abuse. No credit card, no signup.",
            },
            {
              q: "Where are my files processed?",
              a: "Entirely in your browser. Your PDFs never travel to a server. You can even use PDFNoova offline once the page has loaded.",
            },
            {
              q: "Will you add more tools?",
              a: "Yes — compression, rotation, unlock, PDF-to-Word, image-to-PDF, OCR, watermarks and batch processing are on the roadmap.",
            },
            {
              q: "How do I contact you?",
              a: "Email us at resume2usa@gmail.com.",
            },
          ].map((f) => (
            <details key={f.q} className="card-soft p-5 group">
              <summary className="cursor-pointer list-none flex justify-between items-center font-medium">
                {f.q}
                <span className="text-primary transition-transform group-open:rotate-45 text-2xl leading-none">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 mt-24">
        <div
          className="rounded-3xl p-10 md:p-14 text-center shadow-elevated"
          style={{ background: "var(--gradient-primary)" }}
        >
          <h2 className="text-4xl md:text-5xl font-semibold text-primary-foreground">
            Ready to tame your PDFs?
          </h2>
          <p className="mt-4 text-primary-foreground/85 max-w-xl mx-auto">
            Start with Merge or Split — no account needed, no waiting.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/merge-pdf"
              className="inline-flex items-center gap-2 rounded-full bg-white text-primary px-6 py-3 font-semibold shadow-soft hover:shadow-elevated transition-all hover:-translate-y-0.5"
            >
              Merge PDF <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/split-pdf"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 text-primary-foreground px-6 py-3 font-semibold hover:bg-white/10 transition-all"
            >
              Split PDF
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
