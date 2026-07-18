import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "../components/ToolLayout";
import { ImageToPdfTool } from "./image-to-pdf";

export const Route = createFileRoute("/jpg-to-pdf")({
  head: () => ({
    meta: [
      { title: "JPG to PDF — Convert JPG images to PDF free · PDFNoova" },
      { name: "description", content: "Convert one or more JPG photos into a single PDF document. Free, private, browser-based." },
      { property: "og:title", content: "JPG to PDF — Free & private · PDFNoova" },
      { property: "og:url", content: "/jpg-to-pdf" },
      { property: "og:description", content: "Combine JPG photos into a clean PDF in seconds." },
    ],
    links: [{ rel: "canonical", href: "/jpg-to-pdf" }],
  }),
  component: JpgToPdfPage,
});

function JpgToPdfPage() {
  return (
    <ToolLayout
      eyebrow="JPG to PDF"
      title="Convert JPG photos to PDF"
      description="Drop your JPG files, reorder them, and download a single PDF. Runs entirely in your browser."
    >
      <ImageToPdfTool accept={["image/jpeg", "image/jpg"]} acceptLabel="JPG, JPEG" downloadName="pdfnoova-jpg.pdf" />
    </ToolLayout>
  );
}