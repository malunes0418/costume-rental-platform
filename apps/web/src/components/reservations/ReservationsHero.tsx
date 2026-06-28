"use client";

import { cn } from "@/lib/utils";

interface StatChipProps {
  label: string;
  value: number;
  tone?: "default" | "coral" | "gold";
}

function StatChip({ label, value, tone = "default" }: StatChipProps) {
  return (
    <div
      className={cn(
        "flex min-w-[7rem] flex-col gap-0.5 rounded-xl border px-4 py-3",
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

interface ReservationsHeroProps {
  savedCount: number;
  activeCount: number;
  pendingPaymentCount: number;
  readyToPayCount: number;
}

export function ReservationsHero({
  savedCount,
  activeCount,
  pendingPaymentCount,
  readyToPayCount
}: ReservationsHeroProps) {
  const hasUrgency = pendingPaymentCount > 0 || readyToPayCount > 0;

  return (
    <header className="relative mb-10 overflow-hidden rounded-2xl border border-border bg-card px-6 py-8 sm:px-8 sm:py-10">
      <div
        className="pointer-events-none absolute inset-0 reservations-hero-glow"
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl space-y-3">
          <p className="animate-fade-up text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
            Your account · Backstage
          </p>
          <h1 className="animate-fade-up-delay-1 font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Reservations
          </h1>
          <p className="animate-fade-up-delay-2 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
            Finish saved looks in your cart, then follow each booking from payment through delivery and return — like
            cues on a call sheet.
          </p>
        </div>

        <div
          className="animate-fade-up-delay-3 flex flex-wrap gap-3"
          role="list"
          aria-label="Reservation summary"
        >
          {savedCount > 0 ? (
            <StatChip label="In cart" value={savedCount} tone={readyToPayCount > 0 ? "coral" : "default"} />
          ) : null}
          {activeCount > 0 ? <StatChip label="Active" value={activeCount} /> : null}
          {pendingPaymentCount > 0 ? (
            <StatChip label="Awaiting proof" value={pendingPaymentCount} tone="gold" />
          ) : null}
          {readyToPayCount > 0 && pendingPaymentCount === 0 ? (
            <StatChip label="Ready to pay" value={readyToPayCount} tone="coral" />
          ) : null}
          {!hasUrgency && savedCount === 0 && activeCount === 0 ? (
            <StatChip label="Bookings" value={0} />
          ) : null}
        </div>
      </div>
    </header>
  );
}
