"use client";

import { CheckIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";

const actionLabelClass = "text-[10px] font-semibold uppercase tracking-widest";

interface NotificationsHeroProps {
  unreadCount: number;
  totalCount: number;
  markingAll: boolean;
  onMarkAll: () => void;
}

export function NotificationsHero({
  unreadCount,
  totalCount,
  markingAll,
  onMarkAll,
}: NotificationsHeroProps) {
  return (
    <header className="relative mb-10 overflow-hidden rounded-2xl border border-border bg-card px-6 py-8 sm:px-8 sm:py-10">
      <div className="pointer-events-none absolute inset-0 notifications-hero-glow" aria-hidden="true" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl space-y-3">
          <p className="animate-fade-up text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
            Your account · Call board
          </p>
          <h1 className="animate-fade-up-delay-1 font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Notifications
          </h1>
          <p className="animate-fade-up-delay-2 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
            Reservation cues, payment reviews, and vendor updates — everything that needs your attention, in one
            place.
          </p>
        </div>

        <div className="animate-fade-up-delay-3 flex flex-wrap items-center gap-3">
          <div className="flex min-w-[7rem] flex-col gap-0.5 rounded-xl border border-border bg-card px-4 py-3">
            <span className="font-display text-2xl font-semibold tabular-nums text-foreground">{unreadCount}</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Unread</span>
          </div>
          <div className="flex min-w-[7rem] flex-col gap-0.5 rounded-xl border border-primary/25 bg-brand-coral-soft px-4 py-3">
            <span className="font-display text-2xl font-semibold tabular-nums text-foreground">{totalCount}</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total cues</span>
          </div>
          <button
            type="button"
            onClick={onMarkAll}
            disabled={markingAll || unreadCount === 0}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
              actionLabelClass
            )}
          >
            <CheckIcon className="size-3.5" />
            Mark all read
          </button>
        </div>
      </div>
    </header>
  );
}
