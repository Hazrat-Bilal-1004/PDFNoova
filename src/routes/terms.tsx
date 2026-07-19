import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service · PDFNoova" },
      { name: "description", content: "Terms of service governing use of PDFNoova's free PDF tools." },
      { property: "og:title", content: "Terms of Service · PDFNoova" },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "https://www.pdfnoova.com/terms" }],
  }),
  component: Terms,
});

function Terms() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14">
      <span className="chip">Terms</span>
      <h1 className="mt-4 text-5xl font-semibold">Terms of Service</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated: February 2026</p>

      <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-2xl font-semibold mb-2">Acceptance</h2>
          <p>By using PDFNoova, you agree to these terms. If you don't agree, please don't use the service.</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">Free use</h2>
          <p>
            PDFNoova is free to use with a soft limit of 5 operations per 24 hours per browser to
            prevent abuse. We reserve the right to change limits at any time.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">Acceptable use</h2>
          <p>
            You must own or have permission to process the files you upload. Do not use PDFNoova for
            illegal activities or to violate anyone's rights.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">No warranty</h2>
          <p>
            PDFNoova is provided "as is" without warranties of any kind. We are not liable for any
            loss, corruption, or damages arising from use of the service.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">Changes</h2>
          <p>
            We may update these terms as the service evolves. Continued use after changes constitutes
            acceptance of the updated terms.
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
