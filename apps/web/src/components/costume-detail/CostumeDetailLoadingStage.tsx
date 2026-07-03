import { Sparkle } from "@/components/brand/Sparkle";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function LoadingCue() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkle size="sm" animated={false} className="opacity-75" />
          <p className="costume-act-label">Dressing room</p>
        </div>
        <p className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Preparing this look…
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          The stage is being set for this costume.
        </p>
      </div>

      <div className="marketplace-loading-dots flex items-center gap-2 pb-1" aria-hidden="true">
        <span className="marketplace-loading-dot marketplace-loading-dot--coral" />
        <span className="marketplace-loading-dot marketplace-loading-dot--gold" />
        <span className="marketplace-loading-dot marketplace-loading-dot--coral" />
      </div>
    </div>
  );
}

function StageSilhouette() {
  return (
    <div className="costume-stage" aria-hidden="true">
      <div className="pointer-events-none absolute inset-0 costume-stage-spotlight" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 costume-stage-curtain costume-stage-curtain--left" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 costume-stage-curtain costume-stage-curtain--right" />

      <div className="relative p-3 sm:p-4">
        <div className="relative mx-auto w-full max-w-[600px]">
          <div className="costume-stage-frame flex min-h-[min(52vh,420px)] max-h-[min(72vh,580px)] items-center justify-center overflow-hidden rounded-xl px-6 py-10 sm:min-h-[min(58vh,480px)]">
            <div className="costume-loading-shimmer aspect-[3/4] w-full max-w-[300px] rounded-lg sm:max-w-[340px]" />
          </div>
        </div>
      </div>

      <div className="costume-stage-line" />
    </div>
  );
}

function TicketSilhouette({
  className,
  showActions = true
}: {
  className?: string;
  showActions?: boolean;
}) {
  return (
    <aside
      className={cn("xl:sticky xl:top-[calc(var(--navbar-height)+1.25rem)] xl:self-start", className)}
      aria-hidden="true"
    >
      <div className="costume-ticket floating-panel relative p-6 sm:p-7">
        <div className="pointer-events-none absolute inset-0 costume-ticket-glow" />

        <div className="relative space-y-5">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-14 rounded-md" />
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>

          <div className="space-y-3 border-b border-border/80 pb-5">
            <Skeleton className="h-9 w-full max-w-xs rounded-md" />
            <Skeleton className="h-4 w-40 rounded-md" />
          </div>

          <Skeleton className="h-[7.5rem] w-full rounded-xl" />

          {showActions ? (
            <div className="grid gap-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : null}
        </div>

        <div className="costume-ticket-notch costume-ticket-notch--left" />
        <div className="costume-ticket-notch costume-ticket-notch--right" />
      </div>
    </aside>
  );
}

function ActHints() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <div className="space-y-4">
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="panel-card h-28 w-full max-w-3xl rounded-xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-3 w-28 rounded-md" />
        <Skeleton className="panel-card h-36 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function CostumeDetailLoadingStage() {
  return (
    <div
      className="costume-detail-shell marketplace-shell flex flex-1 flex-col"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading costume details"
    >
      <div className="marketplace-content pb-28 xl:pb-16">
        <nav aria-hidden="true" className="mb-6 md:mb-8">
          <Skeleton className="h-3 w-56 max-w-full rounded-md" />
        </nav>

        <div className="mb-8 md:mb-10">
          <LoadingCue />
        </div>

        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-10">
          <div className="space-y-10 xl:space-y-12">
            <StageSilhouette />
            <TicketSilhouette className="xl:hidden" showActions={false} />
            <ActHints />
          </div>

          <TicketSilhouette className="hidden xl:block" />
        </div>
      </div>
    </div>
  );
}
