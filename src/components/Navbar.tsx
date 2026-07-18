import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandMark } from "./Brand";

const links = [
  { to: "/", label: "Home" },
  { to: "/blog", label: "Blog" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border/60">
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
        <BrandMark />
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3.5 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              activeOptions={{ exact: l.to === "/" }}
              activeProps={{ className: "text-primary bg-accent" }}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/merge-pdf" className="btn-primary ml-2 text-sm px-5 py-2">
            Try free
          </Link>
        </nav>
        <button
          className="md:hidden btn-ghost p-2"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border/60 bg-background/95">
          <div className="mx-auto max-w-6xl px-5 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
