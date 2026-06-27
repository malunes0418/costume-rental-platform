"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { listVendorReservations, type Reservation } from "@/lib/vendor";
import { Skeleton } from "@/components/ui/skeleton";
import { CardStackIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ACTIVE_VENDOR_EARNING_STATUSES,
  getReservationStatusMeta
} from "@/lib/reservationStatus";

export default function VendorEarningsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchEarnings() {
      try {
        const value = await listVendorReservations();
        setReservations(value);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    void fetchEarnings();
  }, [user]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 pb-32 pt-10">
        <div className="mb-10 space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const PLATFORM_FEE_RATE = 0.1;
  const surchargeTotal = (reservation: Reservation) =>
    (reservation.adjustments || [])
      .filter((adjustment) => adjustment.status === "PAID")
      .reduce((sum, adjustment) => sum + Number(adjustment.amount), 0);
  const grossTotal = (reservation: Reservation) => Number(reservation.total_price) + surchargeTotal(reservation);

  const completedReservations = reservations.filter((reservation) => reservation.status === "COMPLETED");
  const pendingReservations = reservations.filter((reservation) =>
    ACTIVE_VENDOR_EARNING_STATUSES.includes(reservation.status)
  );
  const awaitingSurchargeReservations = reservations.filter((reservation) => reservation.status === "AWAITING_SURCHARGE_PAYMENT");

  const totalRevenueGross = completedReservations.reduce((sum, reservation) => sum + grossTotal(reservation), 0);
  const totalRevenueNet = totalRevenueGross * (1 - PLATFORM_FEE_RATE);

  const pendingBalanceGross = pendingReservations.reduce((sum, reservation) => sum + grossTotal(reservation), 0);
  const pendingBalanceNet = pendingBalanceGross * (1 - PLATFORM_FEE_RATE);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-32 pt-10">
      <div className="mb-10">
        <p className="animate-fade-up text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Financials
        </p>
        <h1 className="animate-fade-up-delay-1 font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Earnings
        </h1>
      </div>

      <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-2">
            <p className="leading-tight text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Cleared Revenue
            </p>
          </div>
          <p className="font-display text-4xl font-semibold leading-none tracking-tight text-foreground">
            ₱{totalRevenueNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-auto pt-2 text-xs text-muted-foreground">
            From {completedReservations.length} completed orders
          </p>
        </div>

        <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-2">
            <p className="leading-tight text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              In Fulfillment
            </p>
          </div>
          <p className="font-display text-4xl font-semibold leading-none tracking-tight text-foreground">
            ₱{pendingBalanceNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-auto pt-2 text-xs text-muted-foreground">
            Includes any approved supplemental surcharge payments
          </p>
        </div>

        <div className="flex flex-col gap-5 rounded-xl border border-orange-400/30 bg-orange-50 p-6 dark:bg-orange-900/10">
          <div className="flex items-start justify-between gap-2">
            <p className="leading-tight text-[10px] font-semibold uppercase tracking-widest text-orange-700 dark:text-orange-400">
              Awaiting Surcharge
            </p>
          </div>
          <p className="font-display text-4xl font-semibold leading-none tracking-tight text-orange-900 dark:text-orange-300">
            ₱{awaitingSurchargeReservations.reduce((sum, reservation) => sum + Number(reservation.total_price), 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </p>
          <p className="mt-auto pt-2 text-xs text-orange-700 dark:text-orange-400">
            {awaitingSurchargeReservations.length} reservation{awaitingSurchargeReservations.length === 1 ? "" : "s"} paused until supplemental payment clears
          </p>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Transaction History
        </p>
      </div>

      {reservations.length === 0 ? (
        <div className="flex flex-col items-center gap-8 rounded-xl border border-border bg-card px-12 py-24 text-center">
          <div className="text-muted-foreground/20">
            <CardStackIcon className="size-12" />
          </div>
          <div className="space-y-2">
            <p className="font-display text-3xl font-semibold text-foreground">
              No transactions yet.
            </p>
            <p className="text-muted-foreground">
              When users rent your costumes and clear review, earnings will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">Order ID</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Costume</th>
                <th className="p-4 font-medium">Base</th>
                <th className="p-4 font-medium">Surcharge</th>
                <th className="p-4 font-medium">Gross</th>
                <th className="p-4 font-medium">Fee (10%)</th>
                <th className="p-4 font-medium">Net Earned</th>
                <th className="p-4 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reservations
                .slice()
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((reservation) => {
                  const firstItem = reservation.items?.[0];
                  const costumeName = firstItem?.Costume?.name || `Costume #${firstItem?.costume_id || reservation.id}`;
                  const baseAmount = Number(reservation.total_price);
                  const surchargeAmount = surchargeTotal(reservation);
                  const gross = grossTotal(reservation);
                  const fee = gross * PLATFORM_FEE_RATE;
                  const net = gross - fee;
                  const statusMeta = getReservationStatusMeta(reservation.status);

                  return (
                    <tr key={reservation.id} className="transition-colors hover:bg-muted/30">
                      <td className="p-4 text-xs text-muted-foreground">#{reservation.id}</td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {format(new Date(reservation.created_at), "MMM d, yyyy")}
                      </td>
                      <td className="max-w-[220px] truncate p-4 font-display font-semibold">{costumeName}</td>
                      <td className="p-4 text-muted-foreground">
                        ₱{baseAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        ₱{surchargeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        ₱{gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        -₱{fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 font-semibold text-foreground">
                        ₱{net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
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
      )}
    </div>
  );
}
