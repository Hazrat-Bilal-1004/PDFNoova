import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Calendar } from "lucide-react";
import { getPost, posts } from "../lib/blog-posts";
import { AdSlot } from "../components/AdSlot";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Article not found · PDFNoova" }, { name: "robots", content: "noindex" }] };
    }
    const { post } = loaderData;
    return {
      meta: [
        { title: `${post.title} · PDFNoova Blog` },
        { name: "description", content: post.description },
        { property: "og:type", content: "article" },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.description },
        { property: "og:url", content: `/blog/${params.slug}` },
        { property: "article:published_time", content: post.date },
      ],
      links: [{ rel: "canonical", href: `/blog/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.description,
            datePublished: post.date,
            author: { "@type": "Organization", name: "PDFNoova" },
          }),
        },
      ],
    };
  },
  component: Post,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-20 text-center">
      <h1 className="text-3xl font-semibold">Article not found</h1>
      <p className="mt-3 text-muted-foreground">This article doesn't exist or has been moved.</p>
      <Link to="/blog" className="btn-primary mt-6">Back to the blog</Link>
    </div>
  ),
});

function Post() {
  const { post } = Route.useLoaderData();
  const related = posts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <article className="mx-auto max-w-3xl px-5 py-14">
      <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to blog
      </Link>
      <header className="mt-6">
        <span className="chip">{post.category}</span>
        <h1 className="mt-4 text-4xl md:text-5xl font-semibold">{post.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{post.description}</p>
        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(post.date).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}
          </span>
          <span>·</span>
          <span>{post.readTime}</span>
        </div>
      </header>

      <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-foreground/90">
        {post.content.map((block: { heading?: string; body: string }, i: number) => (
          <section key={i}>
            {block.heading && <h2 className="text-2xl font-semibold mt-8 mb-3">{block.heading}</h2>}
            <p>{block.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-12">
        <AdSlot />
      </div>

      {related.length > 0 && (
        <aside className="mt-16">
          <h2 className="text-2xl font-semibold">Keep reading</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                to="/blog/$slug"
                params={{ slug: r.slug }}
                className="card-soft p-5"
              >
                <span className="chip w-fit">{r.category}</span>
                <h3 className="mt-2 font-semibold">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.description}</p>
              </Link>
            ))}
          </div>
        </aside>
      )}
    </article>
  );
}
