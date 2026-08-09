import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Calendar } from "lucide-react";
import { getPost, posts, type BlogPost } from "../lib/blog-posts";
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
    const title = post.metaTitle ?? `${post.title} · PDFNoova Blog`;
    const scripts: { type: string; children: string }[] = [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          dateModified: post.date,
          image: post.image ? [post.image] : undefined,
          mainEntityOfPage: { "@type": "WebPage", "@id": `/blog/${params.slug}` },
          author: { "@type": "Organization", name: "PDFNoova" },
          publisher: { "@type": "Organization", name: "PDFNoova" },
        }),
      },
    ];
    scripts.push({
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "/" },
          { "@type": "ListItem", position: 2, name: "Blog", item: "/blog" },
          { "@type": "ListItem", position: 3, name: post.title, item: `/blog/${params.slug}` },
        ],
      }),
    });
    if (post.faqs?.length) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      });
    }
    return {
      meta: [
        { title },
        { name: "description", content: post.description },
        { name: "robots", content: "index, follow" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: post.description },
        { property: "og:type", content: "article" },
        { property: "og:title", content: title },
        { property: "og:description", content: post.description },
        { property: "og:url", content: `/blog/${params.slug}` },
        ...(post.image
          ? [
              { property: "og:image", content: post.image },
              { name: "twitter:image", content: post.image },
              { name: "twitter:card", content: "summary_large_image" },
            ]
          : []),
        { property: "article:published_time", content: post.date },
      ],
      links: [{ rel: "canonical", href: `/blog/${params.slug}` }],
      scripts,
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
  const { post } = Route.useLoaderData() as { post: BlogPost };
  const related = posts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <article className="mx-auto max-w-3xl px-5 py-14">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link to="/" className="hover:text-primary">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link to="/blog" className="hover:text-primary">Blog</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground/80">{post.title}</li>
        </ol>
      </nav>
      <Link to="/blog" className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
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

      {post.image && (
        <img
          src={post.image}
          alt={post.imageAlt ?? post.title}
          width={1200}
          height={630}
          className="mt-8 w-full rounded-2xl border border-border bg-secondary/40"
        />
      )}

      <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-foreground/90">
        {post.content.map((block, i) => (
          <section key={i}>
            {block.heading &&
              (block.level === 3 ? (
                <h3 className="text-xl font-semibold mt-6 mb-2">{block.heading}</h3>
              ) : (
                <h2 className="text-2xl font-semibold mt-8 mb-3">{block.heading}</h2>
              ))}
            {block.body && <p><RichText text={block.body} /></p>}
            {block.list && block.list.length > 0 &&
              (block.ordered ? (
                <ol className="mt-3 list-decimal space-y-2 pl-5 marker:text-primary marker:font-semibold">
                  {block.list.map((item, j) => (
                    <li key={j}><RichText text={item} /></li>
                  ))}
                </ol>
              ) : (
                <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-primary">
                  {block.list.map((item, j) => (
                    <li key={j}><RichText text={item} /></li>
                  ))}
                </ul>
              ))}
            {block.cta && (
              <div className="mt-2">
                <Link to={block.cta.to as never} className="btn-primary">
                  {block.cta.label}
                </Link>
              </div>
            )}
          </section>
        ))}
      </div>


      {post.tools && post.tools.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Tools mentioned in this article</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {post.tools.map((t) => (
              <Link key={t.to} to={t.to as never} className="card-soft p-5">
                <h3 className="font-semibold text-primary">{t.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.blurb}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {post.faqs && post.faqs.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
          <div className="mt-4 space-y-4">
            {post.faqs.map((f) => (
              <div key={f.q} className="card-soft p-5">
                <h3 className="font-semibold">{f.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

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

// Renders inline markdown-style internal links: [label](/path)
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (!m) return <span key={i}>{part}</span>;
        return (
          <Link
            key={i}
            to={m[2] as never}
            className="text-primary underline underline-offset-4 hover:opacity-80"
          >
            {m[1]}
          </Link>
        );
      })}
    </>
  );
}
