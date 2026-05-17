"use client";

import { useEffect, useMemo, useState } from "react";
import { CardStackIcon } from "@radix-ui/react-icons";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { listVendorReservations, type Reservation } from "@/lib/vendor";

const PLATFORM_FEE_RATE = 0.1;

function formatCurrency(value: number) {
  return `PHP ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function EarningsSummary({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{value}</p>
      <p className="mt-3 min-h-[2.5rem] text-xs leading-5 text-muted-foreground">{hint}</p>
      <div className="mt-auto" />
    </div>
  );
}

function EarningsCountSummary({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{value}</p>
      <p className="mt-3 min-h-[2.5rem] text-xs leading-5 text-muted-foreground">{hint}</p>
      <div className="mt-auto" />
    </div>
  );
}

function EarningsSummaryGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 [&>div]:flex [&>div]:min-h-[10rem] [&>div]:flex-col">
      {children}
    </div>
  );
}

function earningStatus(reservation: Reservation) {
  if (reservation.status === "PAID" && reservation.vendor_status === "CONFIRMED") {
    return {
      label: "Confirmed",
      className: "border-emerald-400/40 text-emerald-700 dark:text-emerald-400",
      detail: "Cleared for vendor payout tracking.",
    };
  }
  if (reservation.status === "PAID" && reservation.vendor_status === "PENDING_VENDOR") {
    return {
      label: "Needs review",
      className: "border-amber-400/40 text-amber-700 dark:text-amber-400",
      detail: "Paid, but still waiting on your decision.",
    };
  }
  if (reservation.status === "PENDING_PAYMENT") {
    return {
      label: "Awaiting payment",
      className: "border-border text-muted-foreground",
      detail: "No paid revenue yet.",
    };
  }
  if (reservation.status === "CANCELLED" || reservation.vendor_status === "REJECTED_BY_VENDOR") {
    return {
      label: "Closed",
      className: "border-destructive/30 text-destructive",
      detail: "No longer moving toward payout.",
    };
  }
  return {
    label: "Open",
    className: "border-border text-muted-foreground",
    detail: "Still in progress.",
  };
}

export default function VendorEarningsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchEarnings() {
      try {
        const reservationData = await listVendorReservations();
        setReservations(reservationData);
      } catch {
        setReservations([]);
      } finally {
        setLoading(false);
      }
    }

    void fetchEarnings();
  }, [user]);

  const metrics = useMemo(() => {
    const paidReservations = reservations.filter((reservation) => reservation.status === "PAID");
    const confirmedReservations = paidReservations.filter(
      (reservation) => reservation.vendor_status === "CONFIRMED"
    );
    const awaitingReviewReservations = paidReservations.filter(
      (reservation) => reservation.vendor_status === "PENDING_VENDOR"
    );
    const awaitingPaymentReservations = reservations.filter(
      (reservation) => reservation.status === "PENDING_PAYMENT"
    );

    const grossPaid = paidReservations.reduce(
      (sum, reservation) => sum + Number(reservation.total_price),
      0
    );
    const netPaid = grossPaid * (1 - PLATFORM_FEE_RATE);
    const grossAwaitingReview = awaitingReviewReservations.reduce(
      (sum, reservation) => sum + Number(reservation.total_price),
      0
    );
    const netAwaitingReview = grossAwaitingReview * (1 - PLATFORM_FEE_RATE);

    return {
      confirmedReservations,
      awaitingReviewReservations,
      awaitingPaymentReservations,
      grossPaid,
      netPaid,
      grossAwaitingReview,
      netAwaitingReview,
    };
  }, [reservations]);

  const sortedReservations = useMemo(
    () =>
      [...reservations].sort(
        (left, right) =>
          new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      ),
    [reservations]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 rounded-[var(--radius-xl)]" />
        <Skeleton className="h-[520px] rounded-[var(--radius-xl)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface-shell rounded-[var(--radius-xl)] p-7 md:p-8">
        <div className="max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Earnings
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-4xl">
            Keep payout visibility simple.
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
            See what is already paid, what is blocked on your review, and what still has not turned
            into real revenue.
          </p>
        </div>

        <EarningsSummaryGrid>
          <EarningsSummary
            label="Net paid"
            value={formatCurrency(metrics.netPaid)}
            hint="Estimated after platform fee."
          />
          <EarningsSummary
            label="Paid gross"
            value={formatCurrency(metrics.grossPaid)}
            hint="Total renter payments received."
          />
          <EarningsSummary
            label="Needs review"
            value={formatCurrency(metrics.netAwaitingReview)}
            hint="Paid value still waiting on you."
          />
          <EarningsCountSummary
            label="Awaiting payment"
            value={metrics.awaitingPaymentReservations.length}
            hint="Reservations not monetized yet."
          />
        </EarningsSummaryGrid>
      </section>

      {reservations.length === 0 ? (
        <section className="surface-panel rounded-[var(--radius-xl)] p-10 text-center md:p-14">
          <div className="mx-auto flex max-w-lg flex-col items-center">
            <div className="rounded-full border border-border bg-background p-4 text-muted-foreground">
              <CardStackIcon className="size-8" />
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-foreground">
              No revenue activity yet.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Once renters start paying for reservations, this page will show booking value, fee
              impact, and what still needs attention before payout.
            </p>
          </div>
        </section>
      ) : (
        <section className="surface-panel overflow-hidden rounded-[var(--radius-xl)]">
          <div className="border-b border-border px-6 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Activity
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              A compact ledger of reservation value, fee impact, and payout stage.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-border bg-background/70 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Reservation</th>
                  <th className="px-6 py-4 font-medium">Stage</th>
                  <th className="px-6 py-4 font-medium">Money</th>
                  <th className="px-6 py-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedReservations.map((reservation) => {
                  const firstItem = reservation.items?.[0];
                  const gross = Number(reservation.total_price);
                  const fee = gross * PLATFORM_FEE_RATE;
                  const net = gross - fee;
                  const status = earningStatus(reservation);

                  return (
                    <tr key={reservation.id} className="hover:bg-background/60">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">
                          {firstItem?.Costume?.name || `Reservation #${reservation.id}`}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">#{reservation.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>
                        <p className="mt-2 text-xs text-muted-foreground">{status.detail}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">{formatCurrency(net)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Gross {formatCurrency(gross)} · Fee -{formatCurrency(fee)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(reservation.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
