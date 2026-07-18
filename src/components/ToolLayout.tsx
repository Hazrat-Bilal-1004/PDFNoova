import { ReactNode } from "react";
import { ShieldCheck, Zap, Lock } from "lucide-react";
import { AdSlot } from "./AdSlot";

export function ToolLayout({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="pb-16">
      <section className="hero-gradient">
        <div className="mx-auto max-w-4xl px-5 pt-14 pb-10 text-center">
          <span className="chip">{eyebrow}</span>
          <h1 className="mt-4 text-4xl md:text-5xl font-semibold">{title}</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {description}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            <span className="chip"><Lock className="h-3 w-3" /> Runs in your browser</span>
            <span className="chip"><ShieldCheck className="h-3 w-3" /> No uploads</span>
            <span className="chip"><Zap className="h-3 w-3" /> Instant download</span>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-5 mt-6">
        <div className="card-soft p-6 md:p-8">{children}</div>
        <div className="mt-8">
          <AdSlot />
        </div>
      </section>
    </div>
  );
}
