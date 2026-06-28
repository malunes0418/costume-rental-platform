"use client";

import Link from "next/link";
import { ArrowRightIcon, HeartIcon } from "@radix-ui/react-icons";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CURATION_STEPS = [
  { step: 1, label: "Spot a look", detail: "Browse the marketplace" },
  { step: 2, label: "Heart it", detail: "Save to your dressing room" },
  { step: 3, label: "Snap in", detail: "Reserve when you're ready" }
] as const;

const actionLabelClass = "text-[10px] font-semibold uppercase tracking-widest";

interface WishlistSidebarProps {
  savedCount: number;
}

export function WishlistSidebar({ savedCount }: WishlistSidebarProps) {
  return (
    <div className="panel-card sticky top-24 overflow-hidden shadow-coral-hover">
      <div className="border-b border-border bg-brand-gold-soft/60 px-6 py-5 sm:px-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent-foreground">
          Dressing room · Notes
        </p>
        <h2 className="mt-2 font-display text-xl font-semibold text-foreground">
          {savedCount > 0 ? "Ready when you are" : "Build your shortlist"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {savedCount > 0
            ? "Tap any saved look to check dates and availability, then add it to your cart."
            : "Heart costumes as you browse — they'll wait here until you're ready to commit."}
        </p>
      </div>

      <div className="flex flex-col gap-6 p-6 sm:p-7">
        <ol className="space-y-3" aria-label="How wishlist works">
          {CURATION_STEPS.map(({ step, label, detail }) => (
            <li key={step} className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/20 px-4 py-3">
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-brand-coral-soft text-[11px] font-bold tabular-nums text-primary"
                aria-hidden="true"
              >
                {step}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <Link href="/" className={cn(buttonVariants({ size: "lg" }), "h-11 w-full hover-snap", actionLabelClass)}>
          Browse costumes
          <ArrowRightIcon data-icon="inline-end" className="size-3.5" />
        </Link>

        {savedCount > 0 ? (
          <div className="space-y-3 border-t border-border pt-6">
            <div className="flex items-center gap-2 text-primary">
              <HeartIcon className="size-3.5" aria-hidden="true" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em]">Next step</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Found the one? Open a costume, pick your dates, and finish checkout from{" "}
              <span className="font-medium text-foreground">Reservations</span>.
            </p>
            <Link
              href="/reservations"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 w-full px-5", actionLabelClass)}
            >
              Go to reservations
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border py-6 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Tip</p>
            <p className="mt-2 px-4 text-sm text-muted-foreground">
              Use list view to compare metadata side by side before you reserve.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
