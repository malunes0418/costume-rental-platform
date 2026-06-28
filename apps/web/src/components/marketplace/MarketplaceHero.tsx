"use client";

import { cn } from "@/lib/utils";
import { categoryLabel } from "./constants";

interface StatChipProps {
  label: string;
  value: number;
  tone?: "default" | "coral" | "gold";
}

function StatChip({ label, value, tone = "default" }: StatChipProps) {
  return (
    <div
      className={cn(
        "flex min-w-[6.5rem] flex-col gap-0.5 rounded-xl border px-4 py-3",
        tone === "coral" && "border-primary/25 bg-brand-coral-soft",
        tone === "gold" && "border-accent/30 bg-brand-gold-soft",
        tone === "default" && "border-border bg-card"
      )}
    >
      <span className="font-display text-2xl font-semibold tabular-nums text-foreground">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

interface MarketplaceHeroProps {
  variant: "section" | "browse";
  total: number;
  filteredCount?: number;
  query?: string;
  category?: string;
}

export function MarketplaceHero({ variant, total, filteredCount, query, category }: MarketplaceHeroProps) {
  const displayTotal = filteredCount ?? total;
  const hasFilters = Boolean(query || category);
  const browseTitle = query
    ? `Results for “${query}”`
    : category
      ? categoryLabel(category)
      : "Snap Into Character";

  if (variant === "section") {
    return (
      <header className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-card px-6 py-7 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute inset-0 marketplace-hero-glow" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-lg space-y-2">
            <p className="animate-fade-up text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
              The catalog · Front of house
            </p>
            <h2 className="animate-fade-up-delay-1 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Marketplace
            </h2>
            <p className="animate-fade-up-delay-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Filter by character, size, and budget — then snap into the look that fits the scene.
            </p>
          </div>
          {total > 0 && (
            <div className="animate-fade-up-delay-3 flex flex-wrap gap-3" role="list" aria-label="Catalog summary">
              <StatChip label="Available" value={total} tone="coral" />
              {hasFilters && displayTotal !== total ? (
                <StatChip label="Matching" value={displayTotal} tone="gold" />
              ) : null}
            </div>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="relative overflow-hidden border-b border-border bg-card">
      <div className="pointer-events-none absolute inset-0 marketplace-hero-glow" aria-hidden="true" />
      <div className="marketplace-content relative py-8 sm:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="animate-fade-up text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
              {hasFilters ? "Filtered browse" : "Costume catalog"}
            </p>
            <h1 className="animate-fade-up-delay-1 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              {browseTitle}
            </h1>
            <p className="animate-fade-up-delay-2 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
              {hasFilters
                ? "Refine with filters or sort — every listing shows real pricing from verified vendors."
                : "Browse curated costumes for parties, shoots, and theatre."}
            </p>
          </div>
          {total > 0 && (
            <div className="animate-fade-up-delay-3 flex flex-wrap gap-3" role="list" aria-label="Browse summary">
              <StatChip
                label={hasFilters && displayTotal !== total ? "Matching" : "Available"}
                value={displayTotal}
                tone="coral"
              />
              {hasFilters && displayTotal !== total ? (
                <StatChip label="In catalog" value={total} tone="default" />
              ) : null}
            </div>
          )}
        </div>
      </div>
      <div className="navbar-stage-line" aria-hidden="true" />
    </header>
  );
}
