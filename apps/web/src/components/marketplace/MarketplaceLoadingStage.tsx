import { cn } from "@/lib/utils";
import { CostumeCardSkeleton } from "@/components/CostumeCard";

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
      <div className="marketplace-content flex flex-1 gap-6 lg:gap-8">
        <div
          className="hidden w-56 shrink-0 self-start rounded-2xl border border-border bg-card p-5 lg:block lg:w-60"
          aria-hidden="true"
        >
          <div className="mb-5 h-6 w-20 rounded-md bg-muted" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded-md bg-muted" />
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="h-12 rounded-xl border border-border bg-card" aria-hidden="true" />
          <div className="marketplace-card-grid grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 md:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <CostumeCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>

      <p className="sr-only">Loading marketplace</p>
    </div>
  );
}
