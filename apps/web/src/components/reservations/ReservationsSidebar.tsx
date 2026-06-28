"use client";

import Link from "next/link";
import { IdCardIcon as CreditCard, UploadIcon as Upload } from "@radix-ui/react-icons";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const actionLabelClass = "text-[10px] font-semibold uppercase tracking-widest";

interface ReservationsSidebarProps {
  pendingPaymentCount: number;
  readyToPayCount: number;
  incompleteDraftCount: number;
  onOpenCart: () => void;
}

export function ReservationsSidebar({
  pendingPaymentCount,
  readyToPayCount,
  incompleteDraftCount,
  onOpenCart
}: ReservationsSidebarProps) {
  const headline =
    pendingPaymentCount > 0
      ? "Upload proof"
      : readyToPayCount > 0
        ? "Ready for checkout"
        : incompleteDraftCount > 0
          ? "After setup"
          : "All caught up";

  const description =
    pendingPaymentCount > 0
      ? "Upload your payment receipt for reservations awaiting base payment. Supplemental surcharge receipts live inside each booking."
      : readyToPayCount > 0
        ? "Your saved costumes are configured. Open the cart to submit payment and confirm your reservations."
        : incompleteDraftCount > 0
          ? "Checkout unlocks after you choose rental dates and delivery for each vendor group."
          : "No reservations are waiting on payment right now.";

  return (
    <div className="panel-card sticky top-24 overflow-hidden shadow-coral-hover">
      <div className="border-b border-border bg-brand-coral-soft/50 px-6 py-5 sm:px-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Backstage · Payment</p>
        <h2 className="mt-2 font-display text-xl font-semibold text-foreground">{headline}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>

      <div className="flex flex-col gap-6 p-6 sm:p-7">
        {pendingPaymentCount > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              <strong className="font-display text-lg tabular-nums">{pendingPaymentCount}</strong> reservation
              {pendingPaymentCount > 1 ? "s" : ""} awaiting payment. Submit one proof for your entire cart.
            </p>
            <Button type="button" size="lg" className={cn("h-12 w-full hover-snap", actionLabelClass)} onClick={onOpenCart}>
              <Upload data-icon="inline-start" />
              Upload payment in cart
            </Button>
          </div>
        ) : readyToPayCount > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              <strong className="font-display text-lg tabular-nums">{readyToPayCount}</strong> costume
              {readyToPayCount > 1 ? "s are" : " is"} ready for checkout.
            </p>
            <Button type="button" size="lg" className={cn("h-12 w-full hover-snap", actionLabelClass)} onClick={onOpenCart}>
              <CreditCard data-icon="inline-start" />
              Open cart to pay
            </Button>
          </div>
        ) : incompleteDraftCount > 0 ? (
          <div className="rounded-xl border border-dashed border-amber-400/40 bg-brand-gold-soft px-5 py-6 text-center">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-accent-foreground">
              Setup first
            </p>
            <p className="text-sm text-muted-foreground">
              {incompleteDraftCount} costume{incompleteDraftCount > 1 ? "s still need" : " still needs"} dates or
              delivery before you can pay.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border py-8 text-center">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">All set</p>
            <p className="text-sm text-muted-foreground">You don&apos;t have any pending payments right now.</p>
          </div>
        )}

        <section className="space-y-4 border-t border-border pt-6">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">Delivery book</p>
            <h3 className="font-display text-lg font-semibold text-foreground">Delivery settings</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Manage saved addresses and default delivery windows in account settings.
            </p>
          </div>

          <Link
            href="/account/settings?next=/reservations"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 w-full px-5", actionLabelClass)}
          >
            Manage delivery settings
          </Link>
        </section>
      </div>
    </div>
  );
}
