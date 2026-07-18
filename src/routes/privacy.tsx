import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · PDFNoova" },
      { name: "description", content: "How PDFNoova handles your files and data — privacy first, in-browser processing." },
      { property: "og:title", content: "Privacy Policy · PDFNoova" },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14 prose-neutral">
      <span className="chip">Privacy</span>
      <h1 className="mt-4 text-5xl font-semibold">Privacy Policy</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated: February 2026</p>

      <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-2xl font-semibold mb-2">In-browser processing</h2>
          <p>
            PDFNoova's tools run entirely inside your browser using WebAssembly. Your PDFs
            are never uploaded, stored, or seen by our servers.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">Auto-deletion</h2>
          <p>
            If a future tool ever requires server-side processing, uploaded files will be
            automatically and permanently deleted from our servers within one hour and
            never shared with third parties.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">Data we don't collect</h2>
          <p>
            We do not require accounts, we do not collect personal information, and we do
            not sell data. Free operations are throttled through a local counter in your
            browser — no server-side tracking is involved.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">Analytics</h2>
          <p>
            We may use privacy-preserving, aggregate analytics to understand overall
            usage. Any such analytics will never include the contents of your files.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">Contact</h2>
          <p>
            Questions? Email us at{" "}
            <a href="mailto:resume2usa@gmail.com" className="text-primary hover:underline">
              resume2usa@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
