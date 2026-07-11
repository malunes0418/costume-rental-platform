"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CardStackIcon } from "@radix-ui/react-icons";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { getPlatformFeeRate } from "@/lib/admin";
import {
  ACTIVE_VENDOR_EARNING_STATUSES,
  getReservationStatusMeta
} from "@/lib/reservationStatus";
import { cn } from "@/lib/utils";
import { listVendorReservations, type Reservation } from "@/lib/vendor";

const DEFAULT_PLATFORM_FEE_RATE = 0.1;

function formatPeso(value: number) {
  return `₱${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function surchargeTotal(reservation: Reservation) {
  return (reservation.adjustments || [])
    .filter((adjustment) => adjustment.status === "PAID")
    .reduce((sum, adjustment) => sum + Number(adjustment.amount), 0);
}

function grossTotal(reservation: Reservation) {
  return Number(reservation.total_price) + surchargeTotal(reservation);
}

export default function VendorEarningsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFeeRate, setPlatformFeeRate] = useState(DEFAULT_PLATFORM_FEE_RATE);

  useEffect(() => {
    if (!user) return;
    async function fetchEarnings() {
      try {
        const [value, settings] = await Promise.all([
          listVendorReservations(),
          getPlatformFeeRate().catch(() => ({ platform_fee_rate: DEFAULT_PLATFORM_FEE_RATE }))
        ]);
        setReservations(value);
        if (
          typeof settings.platform_fee_rate === "number" &&
          Number.isFinite(settings.platform_fee_rate)
        ) {
          setPlatformFeeRate(settings.platform_fee_rate);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    void fetchEarnings();
  }, [user]);

  const ledger = useMemo(() => {
    const completedReservations = reservations.filter(
      (reservation) => reservation.status === "COMPLETED"
    );
    const pendingReservations = reservations.filter((reservation) =>
      ACTIVE_VENDOR_EARNING_STATUSES.includes(reservation.status)
    );
    const awaitingSurchargeReservations = reservations.filter(
      (reservation) => reservation.status === "AWAITING_SURCHARGE_PAYMENT"
    );

    const totalRevenueGross = completedReservations.reduce(
      (sum, reservation) => sum + grossTotal(reservation),
      0
    );
    const totalRevenueNet = totalRevenueGross * (1 - platformFeeRate);

    const pendingBalanceGross = pendingReservations.reduce(
      (sum, reservation) => sum + grossTotal(reservation),
      0
    );
    const pendingBalanceNet = pendingBalanceGross * (1 - platformFeeRate);

    const awaitingGross = awaitingSurchargeReservations.reduce(
      (sum, reservation) => sum + Number(reservation.total_price),
      0
    );

    const sorted = reservations
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
      completedReservations,
      pendingReservations,
      awaitingSurchargeReservations,
      totalRevenueGross,
      totalRevenueNet,
      pendingBalanceGross,
      pendingBalanceNet,
      awaitingGross,
      sorted
    };
  }, [reservations, platformFeeRate]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-4 w-full max-w-md rounded-full" />
        </div>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="mt-8 h-64 w-full rounded-xl" />
      </div>
    );
  }

  const hasActivity = reservations.length > 0;

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-12">
      <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Finance
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Earnings
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Track cleared take, bookings still in fulfillment, and any surcharge pauses.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href="/vendor/reservations"
              className="hover-snap inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90"
            >
              Open reservations
            </Link>
            <Link
              href="/vendor/settings"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-[10px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
            >
              Payment details
            </Link>
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Earnings counts">
          <div className="flex items-baseline gap-2">
            <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Cleared
            </dt>
            <dd className="font-display text-xl font-semibold tabular-nums text-foreground">
              {ledger.completedReservations.length}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              In motion
            </dt>
            <dd className="font-display text-xl font-semibold tabular-nums text-foreground">
              {ledger.pendingReservations.length}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Paused
            </dt>
            <dd
              className={cn(
                "font-display text-xl font-semibold tabular-nums",
                ledger.awaitingSurchargeReservations.length > 0
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-foreground"
              )}
            >
              {ledger.awaitingSurchargeReservations.length}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              On ledger
            </dt>
            <dd className="font-display text-xl font-semibold tabular-nums text-foreground">
              {reservations.length}
            </dd>
          </div>
        </dl>
      </header>

      <section className="mb-10 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Cleared revenue
          </p>
          <p className="mt-3 font-display text-3xl font-semibold leading-none tracking-tight text-foreground md:text-4xl">
            {formatPeso(ledger.totalRevenueNet)}
          </p>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            Net after a {Math.round(platformFeeRate * 100)}% platform fee · from{" "}
            {ledger.completedReservations.length} completed order
            {ledger.completedReservations.length === 1 ? "" : "s"}
          </p>
          {ledger.totalRevenueGross > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Gross {formatPeso(ledger.totalRevenueGross)} before fee
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            In fulfillment
          </p>
          <p className="mt-3 font-display text-3xl font-semibold leading-none tracking-tight text-primary md:text-4xl">
            {formatPeso(ledger.pendingBalanceNet)}
          </p>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            Includes approved supplemental surcharge payments still moving through delivery.
          </p>
        </div>

        <div
          className={cn(
            "rounded-xl border p-5 sm:p-6",
            ledger.awaitingSurchargeReservations.length > 0
              ? "border-amber-400/40 bg-amber-50/50 dark:bg-amber-950/20"
              : "border-border bg-card"
          )}
        >
          <p
            className={cn(
              "text-[10px] font-semibold uppercase tracking-widest",
              ledger.awaitingSurchargeReservations.length > 0
                ? "text-amber-700 dark:text-amber-400"
                : "text-muted-foreground"
            )}
          >
            Awaiting surcharge
          </p>
          <p
            className={cn(
              "mt-3 font-display text-3xl font-semibold leading-none tracking-tight md:text-4xl",
              ledger.awaitingSurchargeReservations.length > 0
                ? "text-amber-900 dark:text-amber-300"
                : "text-foreground"
            )}
          >
            {formatPeso(ledger.awaitingGross)}
          </p>
          <p
            className={cn(
              "mt-3 text-xs leading-6",
              ledger.awaitingSurchargeReservations.length > 0
                ? "text-amber-700 dark:text-amber-400"
                : "text-muted-foreground"
            )}
          >
            {ledger.awaitingSurchargeReservations.length} reservation
            {ledger.awaitingSurchargeReservations.length === 1 ? "" : "s"} paused until supplemental
            payment clears.
          </p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Transaction history
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-foreground">
              Booking ledger
            </h2>
          </div>
          {hasActivity ? (
            <p className="text-xs text-muted-foreground">
              Net = gross minus {Math.round(platformFeeRate * 100)}% platform fee
            </p>
          ) : null}
        </div>

        {!hasActivity ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-8 py-14 text-center">
            <CardStackIcon className="mx-auto size-10 text-muted-foreground/30" />
            <p className="mt-5 font-display text-2xl font-semibold text-foreground md:text-3xl">
              No earnings yet
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              When renters book your costumes and clear review, cleared and pending earnings appear
              here.
            </p>
            <Link
              href="/vendor/inventory"
              className="hover-snap mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90"
            >
              Open inventory
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="p-4 font-medium">Order</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Costume</th>
                      <th className="p-4 font-medium">Base</th>
                      <th className="p-4 font-medium">Surcharge</th>
                      <th className="p-4 font-medium">Gross</th>
                      <th className="p-4 font-medium">Fee</th>
                      <th className="p-4 font-medium">Net</th>
                      <th className="p-4 text-right font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {ledger.sorted.map((reservation) => {
                      const firstItem = reservation.items?.[0];
                      const costumeName =
                        firstItem?.Costume?.name ||
                        `Costume #${firstItem?.costume_id || reservation.id}`;
                      const baseAmount = Number(reservation.total_price);
                      const surchargeAmount = surchargeTotal(reservation);
                      const gross = grossTotal(reservation);
                      const fee = gross * platformFeeRate;
                      const net = gross - fee;
                      const statusMeta = getReservationStatusMeta(reservation.status);

                      return (
                        <tr key={reservation.id} className="earnings-row">
                          <td className="p-4 text-xs text-muted-foreground">#{reservation.id}</td>
                          <td className="p-4 text-xs text-muted-foreground">
                            {format(new Date(reservation.created_at), "MMM d, yyyy")}
                          </td>
                          <td className="max-w-[220px] truncate p-4 font-display font-semibold text-foreground">
                            {costumeName}
                          </td>
                          <td className="p-4 text-muted-foreground">{formatPeso(baseAmount)}</td>
                          <td className="p-4 text-muted-foreground">{formatPeso(surchargeAmount)}</td>
                          <td className="p-4 text-muted-foreground">{formatPeso(gross)}</td>
                          <td className="p-4 text-muted-foreground">-{formatPeso(fee)}</td>
                          <td className="p-4 font-semibold text-primary">{formatPeso(net)}</td>
                          <td className="p-4 text-right">
                            <span
                              className={cn(
                                "inline-flex rounded-xl border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest",
                                statusMeta.className
                              )}
                            >
                              {statusMeta.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 md:hidden">
              {ledger.sorted.map((reservation) => {
                const firstItem = reservation.items?.[0];
                const costumeName =
                  firstItem?.Costume?.name ||
                  `Costume #${firstItem?.costume_id || reservation.id}`;
                const gross = grossTotal(reservation);
                const fee = gross * platformFeeRate;
                const net = gross - fee;
                const statusMeta = getReservationStatusMeta(reservation.status);

                return (
                  <article
                    key={reservation.id}
                    className="earnings-mobile-card rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-lg font-semibold text-foreground">
                          {costumeName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          #{reservation.id} ·{" "}
                          {format(new Date(reservation.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold text-primary">{formatPeso(net)}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded-xl border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest",
                          statusMeta.className
                        )}
                      >
                        {statusMeta.label}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Gross {formatPeso(gross)} · Fee -{formatPeso(fee)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      <aside className="mt-10 max-w-2xl rounded-xl border border-border bg-muted/30 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Note
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Verify payments and advance fulfillment from{" "}
          <Link
            href="/vendor/reservations"
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            reservations
          </Link>
          . Keep at least one active method in{" "}
          <Link
            href="/vendor/settings"
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            settings
          </Link>{" "}
          so renters can pay you.
        </p>
      </aside>
    </div>
  );
}
