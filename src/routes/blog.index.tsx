import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar } from "lucide-react";
import { posts } from "../lib/blog-posts";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog — Guides & tips on working with PDFs · PDFNoova" },
      {
        name: "description",
        content:
          "Guides, tutorials, and roundups about PDF tools, merging, splitting, and compression from the PDFNoova team.",
      },
      { property: "og:title", content: "PDFNoova Blog" },
      { property: "og:url", content: "/blog" },
      { property: "og:description", content: "PDF tips, guides, and reviews." },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <header className="text-center max-w-2xl mx-auto">
        <span className="chip">Blog</span>
        <h1 className="mt-4 text-5xl font-semibold">Notes on working with PDFs</h1>
        <p className="mt-4 text-muted-foreground">
          Guides, tips, and honest reviews of PDF tools from the PDFNoova team.
        </p>
      </header>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {posts.map((p) => (
          <Link
            key={p.slug}
            to="/blog/$slug"
            params={{ slug: p.slug }}
            className="card-soft p-6 group flex flex-col"
          >
            <span className="chip w-fit">{p.category}</span>
            <h2 className="mt-3 text-2xl font-semibold group-hover:text-primary transition-colors">
              {p.title}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{p.description}</p>
            <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(p.date).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })}
                · {p.readTime}
              </span>
              <span className="inline-flex items-center gap-1 text-primary font-medium">
                Read <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
