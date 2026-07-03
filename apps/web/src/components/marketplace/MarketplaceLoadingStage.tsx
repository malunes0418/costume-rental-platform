import { Sparkle } from "@/components/brand/Sparkle";
import { CostumeCardSkeleton } from "@/components/CostumeCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MarketplaceLoadingStageProps {
  className?: string;
}

export function MarketplaceLoadingStage({ className }: MarketplaceLoadingStageProps) {
  return (
    <div
      className={cn("marketplace-shell flex flex-1 flex-col", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading marketplace"
    >
      <div className="marketplace-content flex flex-1 flex-col py-10 md:py-14">
        <div className="marketplace-loading-stage relative mx-auto mb-10 w-full max-w-lg px-4 text-center sm:mb-12">
          <div className="hero-curtain hero-curtain-left hero-curtain-heavy marketplace-loading-curtain" aria-hidden="true" />
          <div className="hero-curtain hero-curtain-right hero-curtain-heavy marketplace-loading-curtain" aria-hidden="true" />
          <div className="hero-spotlight marketplace-loading-spotlight" aria-hidden="true" />

          <div className="relative z-[1] flex flex-col items-center gap-4">
            <div className="flex items-center gap-2.5">
              <Sparkle size="sm" animated={false} className="opacity-80" />
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.32em] text-primary">
                Backstage
              </p>
              <Sparkle size="sm" animated={false} className="opacity-80" />
            </div>

            <p className="font-display text-2xl font-semibold text-foreground md:text-3xl">
              Raising the curtain…
            </p>

            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Costumes are taking their places across the marketplace.
            </p>

            <div className="marketplace-loading-dots flex items-center gap-2 pt-1" aria-hidden="true">
              <span className="marketplace-loading-dot marketplace-loading-dot--coral" />
              <span className="marketplace-loading-dot marketplace-loading-dot--gold" />
              <span className="marketplace-loading-dot marketplace-loading-dot--coral" />
            </div>
          </div>
        </div>

        <div className="marketplace-loading-skeleton flex gap-6 lg:gap-8" aria-hidden="true">
          <aside className="hidden w-56 shrink-0 space-y-5 lg:block xl:w-64">
            <Skeleton className="h-5 w-24 rounded-md" />
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full rounded-md" />
              ))}
            </div>
            <Skeleton className="h-24 w-full rounded-xl" />
          </aside>

          <div className="min-w-0 flex-1 space-y-4">
            <div className="marketplace-results-bar flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
              <Skeleton className="h-4 w-28 rounded-md" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
              </div>
            </div>

            <div className="marketplace-card-grid grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 md:gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <CostumeCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
