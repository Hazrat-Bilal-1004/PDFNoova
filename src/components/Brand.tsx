import { Link } from "@tanstack/react-router";

export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <img
      src="/pdfnoova-logo.jpeg"
      alt="PDFNoova logo"
      className={className}
      width={64}
      height={64}
      loading="eager"
      decoding="async"
    />
  );
}

export function BrandMark() {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <Logo className="h-9 w-9 transition-transform group-hover:scale-105" />
      <span className="text-xl font-semibold tracking-tight font-display">
        <span className="text-foreground">PDF</span>
        <span className="text-primary">Noova</span>
      </span>
    </Link>
  );
}
