import { Skeleton } from "@/components/ui/skeleton";

export type ReservationsSkeletonVariant = "empty" | "cart" | "active" | "both";

export function resolveReservationsSkeletonVariant(
  reservations: Array<{ status: string }>
): ReservationsSkeletonVariant {
  const hasCart = reservations.some((reservation) => reservation.status === "CART");
  const hasActive = reservations.some((reservation) => reservation.status !== "CART");
  if (!hasCart && !hasActive) return "empty";
  if (hasCart && hasActive) return "both";
  if (hasCart) return "cart";
  return "active";
}

function EmptyStageSkeleton() {
  return (
    <div
      className="panel-card flex flex-col items-center gap-6 px-8 py-20 text-center sm:px-12"
      aria-hidden="true"
    >
      <Skeleton className="size-20 rounded-full" />
      <div className="flex w-full max-w-sm flex-col items-center gap-2">
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="h-7 w-48 rounded-md" />
        <Skeleton className="mt-1 h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-4/5 rounded-md" />
      </div>
      <Skeleton className="h-10 w-40 rounded-md" />
    </div>
  );
}

function ActiveReservationCardSkeleton() {
  return (
    <article className="panel-card overflow-hidden" aria-hidden="true">
      <div className="flex flex-col lg:flex-row">
        <div className="reservation-spotlight relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-muted lg:w-44 xl:w-52">
          <div className="costume-loading-shimmer absolute inset-0" />
          <Skeleton className="absolute bottom-4 left-4 h-6 w-24 rounded-lg bg-secondary" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5 p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-12 rounded-md" />
              <Skeleton className="h-7 w-3/4 max-w-xs rounded-md sm:h-8" />
              <Skeleton className="h-4 w-56 max-w-full rounded-md" />
              <Skeleton className="h-3 w-40 rounded-md" />
            </div>
            <Skeleton className="h-8 w-28 shrink-0 rounded-md" />
          </div>

          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-32 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-baseline justify-between gap-4">
              <Skeleton className="h-3 w-36 rounded-md" />
              <Skeleton className="h-3 w-28 rounded-md" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
        </div>
      </div>
    </article>
  );
}

function SavedCartPanelSkeleton() {
  return (
    <section className="space-y-6" aria-hidden="true">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Saved cart</p>
          <h2 className="section-heading">Finish your bookings</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Costumes saved from the marketplace live here until payment. Choose dates for each look, set delivery
            once per vendor, then pay in your cart.
          </p>
        </div>
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-40 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="size-9 rounded-md" />
        </div>
      </div>

      <div className="panel-card overflow-hidden p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-36 rounded-md" />
            <Skeleton className="h-6 w-48 rounded-md" />
            <Skeleton className="h-4 w-64 max-w-full rounded-md" />
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <Skeleton className="h-10 w-48 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="flex gap-4 px-1 py-4 sm:gap-5">
              <Skeleton className="mt-3 size-4 shrink-0 rounded-sm" />
              <Skeleton className="size-16 shrink-0 rounded-lg sm:size-20" />
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-40 rounded-md" />
                  <Skeleton className="h-4 w-52 max-w-full rounded-md" />
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Skeleton className="h-6 w-20 rounded-md" />
                  <Skeleton className="h-7 w-16 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ActiveReservationsSkeleton({ eyebrow }: { eyebrow: string }) {
  return (
    <section className="space-y-6" aria-hidden="true">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
        <h2 className="section-heading">Active reservations</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Track payment, vendor review, delivery, and returns — each booking reads like a call sheet.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-36 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      <div className="flex flex-col gap-5">
        {Array.from({ length: 2 }, (_, index) => (
          <ActiveReservationCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

function EmptySidebarSkeleton() {
  return (
    <div className="panel-card sticky top-24 overflow-hidden" aria-hidden="true">
      <div className="border-b border-border bg-brand-coral-soft/50 px-6 py-5 sm:px-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Backstage · Payment</p>
        <Skeleton className="mt-2 h-6 w-32 rounded-md" />
        <Skeleton className="mt-3 h-4 w-full rounded-md" />
        <Skeleton className="mt-2 h-4 w-3/4 rounded-md" />
      </div>

      <div className="flex flex-col gap-6 p-6 sm:p-7">
        <div className="rounded-xl border border-dashed border-border px-5 py-8">
          <div className="mx-auto flex max-w-[14rem] flex-col items-center gap-2">
            <Skeleton className="h-3 w-16 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-4/5 rounded-md" />
          </div>
        </div>

        <section className="space-y-4 border-t border-border pt-6">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">Delivery book</p>
            <h3 className="font-display text-lg font-semibold text-foreground">Delivery settings</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Manage saved addresses and default delivery windows in account settings.
            </p>
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
        </section>
      </div>
    </div>
  );
}

function PopulatedSidebarSkeleton() {
  return (
    <div className="panel-card sticky top-24 overflow-hidden" aria-hidden="true">
      <div className="border-b border-border bg-brand-coral-soft/50 px-6 py-5 sm:px-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Backstage · Payment</p>
        <Skeleton className="mt-2 h-6 w-40 rounded-md" />
        <Skeleton className="mt-3 h-4 w-full rounded-md" />
        <Skeleton className="mt-2 h-4 w-4/5 rounded-md" />
      </div>

      <div className="flex flex-col gap-6 p-6 sm:p-7">
        <div className="space-y-4">
          <Skeleton className="h-4 w-56 max-w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>

        <section className="space-y-4 border-t border-border pt-6">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">Delivery book</p>
            <h3 className="font-display text-lg font-semibold text-foreground">Delivery settings</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Manage saved addresses and default delivery windows in account settings.
            </p>
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
        </section>
      </div>
    </div>
  );
}

function ReservationsHeroSkeleton({ variant }: { variant: ReservationsSkeletonVariant }) {
  const chipCount = variant === "empty" ? 1 : 2;

  return (
    <header className="relative mb-10 overflow-hidden rounded-2xl border border-border bg-card px-6 py-8 sm:px-8 sm:py-10">
      <div className="pointer-events-none absolute inset-0 reservations-hero-glow" aria-hidden="true" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
            Your account · Backstage
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Reservations
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
            Finish saved looks in your cart, then follow each booking from payment through delivery and return — like
            cues on a call sheet.
          </p>
        </div>

        <div className="flex flex-wrap gap-3" aria-hidden="true">
          {Array.from({ length: chipCount }, (_, index) => (
            <div
              key={index}
              className="flex min-w-[7rem] flex-col gap-2 rounded-xl border border-border bg-card px-4 py-3"
            >
              <Skeleton className="h-7 w-10 rounded-md" />
              <Skeleton className="h-2.5 w-14 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

interface ReservationsPageSkeletonProps {
  variant?: ReservationsSkeletonVariant;
}

export function ReservationsPageSkeleton({ variant = "active" }: ReservationsPageSkeletonProps) {
  // Only one main column shape at a time — stacking cart + active invents a
  // second section when the user only has one of them.
  const isEmpty = variant === "empty";
  const showCartOnly = variant === "cart";
  const showActive = variant === "active" || variant === "both";

  return (
    <div
      className="min-h-screen reservations-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading reservations"
    >
      <div className="mx-auto w-full max-w-[1200px] px-6 pb-24 pt-10">
        <ReservationsHeroSkeleton variant={variant} />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col gap-12 lg:col-span-7 xl:col-span-8">
            {isEmpty ? (
              <EmptyStageSkeleton />
            ) : showCartOnly ? (
              <SavedCartPanelSkeleton />
            ) : showActive ? (
              <ActiveReservationsSkeleton eyebrow="Your bookings" />
            ) : null}
          </div>

          <div className="lg:col-span-5 xl:col-span-4">
            {isEmpty ? <EmptySidebarSkeleton /> : <PopulatedSidebarSkeleton />}
          </div>
        </div>
      </div>
    </div>
  );
}
