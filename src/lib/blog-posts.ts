export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  category: string;
  content: { heading?: string; body: string }[];
};

export const posts: BlogPost[] = [
  {
    slug: "how-to-merge-pdf-files-easily-online",
    title: "How to Merge PDF Files Easily Online",
    description:
      "A complete beginner's guide to merging PDF files online — securely, freely, and without installing software.",
    date: "2026-02-14",
    readTime: "6 min read",
    category: "Guides",
    content: [
      {
        body:
          "Merging PDF files used to require expensive desktop software. Today you can combine dozens of documents into a single PDF in seconds, straight from your browser. This guide walks you through the safest and simplest way to merge PDFs online — no installs, no accounts, no watermarks.",
      },
      {
        heading: "Why merge PDFs at all?",
        body:
          "Combining PDFs is one of the most common office tasks. You might stitch invoices into a single monthly file, assemble scanned contracts, or hand a client one clean deliverable instead of ten attachments. A merged PDF is easier to email, easier to archive, and easier to sign.",
      },
      {
        heading: "The step-by-step process",
        body:
          "1. Open the PDFNoova Merge tool. 2. Drag and drop your PDF files (or click to browse). 3. Reorder them by dragging until they line up the way you want. 4. Hit Merge. Your combined PDF downloads instantly — the work happens in your browser, so your files never leave your device.",
      },
      {
        heading: "Tips for a clean result",
        body:
          "Rename files before uploading so the order is obvious. Keep individual files under 25 MB when possible for the smoothest experience. If your PDFs are scanned images, consider compressing them first so the final merged file stays lightweight.",
      },
      {
        heading: "Privacy matters",
        body:
          "With PDFNoova, PDF merging runs entirely inside your browser using WebAssembly. That means your documents are never uploaded to a server — a critical distinction when you are working with contracts, medical records, or anything sensitive.",
      },
    ],
  },
  {
    slug: "best-free-pdf-tools-in-2026",
    title: "Best Free PDF Tools in 2026",
    description:
      "Our editorial pick of the best free PDF tools in 2026 — what they do well, where they fall short, and how to choose.",
    date: "2026-01-22",
    readTime: "8 min read",
    category: "Roundups",
    content: [
      {
        body:
          "The PDF tooling landscape has matured dramatically. In 2026, the best free tools are fast, browser-based, privacy-first, and don't beg you to sign up. Here is our short list of what actually works, and what to look for.",
      },
      {
        heading: "What makes a great PDF tool in 2026",
        body:
          "Three things: it runs locally in your browser (no uploads), it handles large files without choking, and it is honest about what is free versus paywalled. The days of hidden watermarks and 3-file daily limits are ending.",
      },
      {
        heading: "Core operations everyone needs",
        body:
          "Merge, split, compress, rotate, and convert to and from images. If a tool nails those five, it covers 90% of everyday PDF work. Anything beyond — OCR, redaction, form building — is bonus territory and often justifiably paid.",
      },
      {
        heading: "Why we built PDFNoova",
        body:
          "We wanted a set of tools that respected the user by default: no login, no upload, no dark patterns. PDFNoova is free to use with a soft 5-operation daily limit that keeps abuse in check without ever asking for an email address.",
      },
      {
        heading: "How to pick the right tool",
        body:
          "For occasional use, pick whatever runs in your browser. For business use, verify that the vendor documents where files are processed and how long they are kept. For sensitive work, prefer tools that explicitly say 'in-browser' processing, and open your browser's network tab to confirm.",
      },
    ],
  },
  {
    slug: "tips-to-compress-pdf-without-losing-quality",
    title: "Tips to Compress PDF Without Losing Quality",
    description:
      "Practical tips to shrink PDF file size while keeping text sharp and images looking good.",
    date: "2025-12-04",
    readTime: "7 min read",
    category: "Tutorials",
    content: [
      {
        body:
          "A 40 MB PDF is a problem — email attachments bounce, cloud syncs stall, and mobile downloads take forever. Compressing well means shrinking the file without turning your beautiful photos into pixel soup. Here is how.",
      },
      {
        heading: "Understand what makes a PDF big",
        body:
          "Most bloat comes from images, especially scanned pages saved as huge lossless bitmaps. Text and vector graphics are almost free. Before compressing, check whether your PDF is truly full of photos or just poorly saved.",
      },
      {
        heading: "Pick the right compression level",
        body:
          "'Screen' level is fine for anything that will only be viewed on a display. 'Print' level preserves detail suitable for office printing. 'Prepress' keeps everything high resolution for professional printing. Choosing the right target can shrink a file by 5-10x with no visible difference.",
      },
      {
        heading: "Downsample images intentionally",
        body:
          "150 DPI is more than enough for on-screen reading. 300 DPI is enough for standard printing. Anything above that is usually wasted bytes. Modern PDF compressors let you cap resolution — set it and move on.",
      },
      {
        heading: "Test before you send",
        body:
          "Always open the compressed PDF and skim it. Watch for muddy photos, jagged charts, or unreadable small text. If quality suffered, back off one level. Two minutes of QA saves an embarrassing redo.",
      },
    ],
  },
];

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);
