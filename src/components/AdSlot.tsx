// Elegant placeholder for future advertising slots.
// Swap the inner content for a real ad tag (AdSense, etc.) later
// without touching layout — the container reserves consistent space
// and matches the site's design language.
export function AdSlot({
  label = "Advertisement",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`w-full rounded-2xl border border-dashed border-border bg-secondary/40 px-6 py-8 text-center ${className}`}
      aria-label="Advertisement placeholder"
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
        {label}
      </p>
      <p className="text-sm text-muted-foreground">
        Your ad here — reserved space for future sponsors.
      </p>
    </div>
  );
}
