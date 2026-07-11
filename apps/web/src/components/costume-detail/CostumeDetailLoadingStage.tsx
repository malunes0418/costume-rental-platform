import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function StageSilhouette() {
  return (
    <div className="costume-stage" aria-hidden="true">
      <div className="pointer-events-none absolute inset-0 costume-stage-spotlight" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 costume-stage-curtain costume-stage-curtain--left" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 costume-stage-curtain costume-stage-curtain--right" />

      <div className="relative grid gap-4 p-3 sm:p-4 lg:grid-cols-[5.5rem_minmax(0,1fr)] lg:items-start">
        <div className="order-2 flex gap-2 overflow-hidden pb-1 lg:order-1 lg:max-h-[min(72vh,580px)] lg:flex-col lg:pb-0">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="costume-loading-shimmer aspect-[3/4] w-[4.5rem] shrink-0 rounded-lg border border-border/80 sm:w-20 lg:w-full"
            />
          ))}
        </div>

        <div className="order-1 min-w-0 lg:order-2">
          <div className="relative mx-auto w-full max-w-[600px]">
            <div className="costume-stage-frame flex items-center justify-center overflow-hidden rounded-xl">
              <div className="costume-loading-shimmer aspect-[3/4] w-full max-w-[min(100%,27rem)]" />
            </div>

            <Skeleton className="absolute left-3 top-3 h-[18px] w-[4.5rem] rounded-md bg-secondary" />
            <Skeleton className="absolute right-3 top-3 size-9 rounded-sm bg-secondary" />
            <Skeleton className="absolute bottom-3 right-3 h-6 w-12 rounded-full bg-secondary" />
          </div>

          <div className="mt-3 flex justify-center">
            <Skeleton className="h-[11px] w-40 rounded-md" />
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
            <Skeleton className="h-[22px] w-20 rounded-md" />
            <Skeleton className="h-[22px] w-16 rounded-md" />
            <Skeleton className="h-[22px] w-14 rounded-md" />
          </div>

          <div className="space-y-3 border-b border-border/80 pb-5">
            <Skeleton className="h-9 w-[92%] max-w-sm rounded-md md:h-10" />
            <div className="flex flex-wrap items-center gap-2.5">
              <Skeleton className="h-4 w-40 rounded-md" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
          </div>

          <div className="costume-price-block rounded-xl px-5 py-5">
            <div className="flex items-end justify-between gap-4">
              <Skeleton className="h-10 w-28 rounded-md" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
            <Skeleton className="mt-3 h-4 w-full rounded-md" />
            <Skeleton className="mt-2 h-4 w-4/5 rounded-md" />
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-4 py-3">
            <Skeleton className="h-3 w-14 rounded-md" />
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-[22px] w-24 rounded-md" />
          </div>

          {showActions ? (
            <div className="grid gap-3 pt-1">
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
    <div className="space-y-10 xl:space-y-12" aria-hidden="true">
      <section className="space-y-5">
        <div>
          <p className="costume-act-label">Act I · The story</p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            About this costume
          </h2>
        </div>
        <div className="panel-card max-w-3xl space-y-3 p-6 sm:p-7">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-[94%] rounded-md" />
          <Skeleton className="h-4 w-[88%] rounded-md" />
          <Skeleton className="h-4 w-2/3 rounded-md" />
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <p className="costume-act-label">Act II · Call sheet</p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Rental details
          </h2>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            Everything you need before stepping into character.
          </p>
        </div>
        <div className="panel-card overflow-hidden">
          <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-start gap-3 px-5 py-4 sm:px-6 sm:py-5">
                <Skeleton className="size-9 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-2.5 w-14 rounded-md" />
                  <Skeleton className="h-4 w-24 rounded-md" />
                </div>
              </div>
            ))}
          </div>
          <div className="costume-pricing-callout space-y-2 border-t border-border px-5 py-4 sm:px-6 sm:py-5">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-4 w-full max-w-md rounded-md" />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <p className="costume-act-label">Act III · Audience</p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Reviews
          </h2>
          <Skeleton className="mt-2 h-4 w-40 rounded-md" />
        </div>
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="costume-rating-spotlight rounded-2xl px-6 py-5 text-right">
              <Skeleton className="ml-auto h-12 w-14 rounded-md" />
              <div className="mt-2 flex justify-end gap-0.5">
                {Array.from({ length: 5 }, (_, index) => (
                  <Skeleton key={index} className="size-3.5 rounded-sm" />
                ))}
              </div>
              <Skeleton className="ml-auto mt-2 h-3 w-24 rounded-md" />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
            <div className="panel-card space-y-4 p-5 sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Breakdown
              </p>
              <div className="space-y-2.5">
                {[
                  "w-[92%]",
                  "w-[55%]",
                  "w-[28%]",
                  "w-[12%]",
                  "w-[8%]"
                ].map((fillWidth, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <Skeleton className="h-4 w-7 shrink-0 rounded-md" />
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className={cn("rating-bar-fill h-full opacity-35", fillWidth)} />
                    </div>
                    <Skeleton className="h-4 w-7 shrink-0 rounded-md" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-4 w-48 rounded-md" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 2 }, (_, index) => (
                <article key={index} className="panel-card p-5">
                  <div className="flex items-start gap-3">
                    <Skeleton className="size-10 shrink-0 rounded-full ring-2 ring-border" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Skeleton className="h-4 w-28 rounded-md" />
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }, (_, star) => (
                            <Skeleton key={star} className="size-3.5 rounded-sm" />
                          ))}
                        </div>
                      </div>
                      <Skeleton className="mt-1 h-3 w-24 rounded-md" />
                      <div className="mt-3 space-y-2">
                        <Skeleton className="h-3.5 w-full rounded-md" />
                        <Skeleton className="h-3.5 w-3/4 rounded-md" />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MobileBarSilhouette() {
  return (
    <div
      className="costume-mobile-bar fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md xl:hidden"
      aria-hidden="true"
    >
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-2.5 w-24 rounded-md" />
        </div>
        <Skeleton className="h-11 w-16 shrink-0 rounded-xl" />
        <Skeleton className="h-11 w-24 shrink-0 rounded-xl" />
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
          <div className="flex flex-wrap items-center gap-1.5">
            <Skeleton className="h-3 w-20 rounded-md" />
            <Skeleton className="size-3 rounded-sm" />
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="size-3 rounded-sm" />
            <Skeleton className="h-3 w-32 max-w-[40vw] rounded-md" />
          </div>
        </nav>

        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-10">
          <div className="space-y-10 xl:space-y-12">
            <StageSilhouette />
            <TicketSilhouette className="xl:hidden" showActions={false} />
            <ActHints />
          </div>

          <TicketSilhouette className="hidden xl:block" />
        </div>
      </div>

      <MobileBarSilhouette />
    </div>
  );
}
