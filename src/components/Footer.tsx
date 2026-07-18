import { Link } from "@tanstack/react-router";
import { BrandMark } from "./Brand";
import { Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-6xl px-5 py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <BrandMark />
          <p className="mt-4 text-sm text-muted-foreground max-w-sm">
            Fast, private PDF tools that run entirely in your browser. Your files
            never leave your device.
          </p>
          <a
            href="mailto:resume2usa@gmail.com"
            className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Mail className="h-4 w-4" /> resume2usa@gmail.com
          </a>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3 text-foreground">Tools</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/merge-pdf" className="hover:text-primary">Merge PDF</Link></li>
            <li><Link to="/split-pdf" className="hover:text-primary">Split PDF</Link></li>
            <li><Link to="/compress-pdf" className="hover:text-primary">Compress PDF</Link></li>
            <li><Link to="/rotate-pdf" className="hover:text-primary">Rotate PDF</Link></li>
            <li><Link to="/image-to-pdf" className="hover:text-primary">Image to PDF</Link></li>
            <li><Link to="/jpg-to-pdf" className="hover:text-primary">JPG to PDF</Link></li>
            <li><Link to="/pdf-to-jpg" className="hover:text-primary">PDF to JPG</Link></li>
            <li><Link to="/protect-pdf" className="hover:text-primary">Protect PDF</Link></li>
            <li><Link to="/unlock-pdf" className="hover:text-primary">Unlock PDF</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3 text-foreground">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/blog" className="hover:text-primary">Blog</Link></li>
            <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-primary">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/50">
        <div className="mx-auto max-w-6xl px-5 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} PDFNoova. All rights reserved.</p>
          <p>Built with privacy first.</p>
        </div>
      </div>
    </footer>
  );
}
