"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { listVendorReservations, type Reservation } from "@/lib/vendor";
import { Skeleton } from "@/components/ui/skeleton";
import { CardStackIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function VendorEarningsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchEarnings() {
      try {
        const res = await listVendorReservations() as any;
        setReservations(Array.isArray(res) ? res : (res.data || []));
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchEarnings();
  }, [user]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 pb-32 pt-10">
        <div className="mb-10 space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-10">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate metrics
  // Assume platform takes 10% fee
  const PLATFORM_FEE_RATE = 0.10;
  
  const completedReservations = reservations.filter(r => r.status === "COMPLETED");
  const pendingReservations = reservations.filter(r => r.status === "APPROVED");
  
  const totalRevenueGross = completedReservations.reduce((sum, r) => sum + Number(r.total_price), 0);
  const totalRevenueNet = totalRevenueGross * (1 - PLATFORM_FEE_RATE);
  
  const pendingBalanceGross = pendingReservations.reduce((sum, r) => sum + Number(r.total_price), 0);
  const pendingBalanceNet = pendingBalanceGross * (1 - PLATFORM_FEE_RATE);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-32 pt-10">
      <div className="mb-10">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground animate-fade-up">
          Financials
        </p>
        <h1 className="font-playfair text-4xl font-semibold tracking-tight text-foreground animate-fade-up-delay-1 md:text-5xl">
          Earnings
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-12">
        <div className="flex flex-col gap-5 rounded-sm border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground leading-tight">
              Cleared Revenue
            </p>
          </div>
          <p className="font-playfair text-4xl font-semibold tracking-tight text-foreground leading-none">
            ₱{totalRevenueNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-auto pt-2">
            From {completedReservations.length} completed orders
          </p>
        </div>

        <div className="flex flex-col gap-5 rounded-sm border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground leading-tight">
              Pending Balance
            </p>
          </div>
          <p className="font-playfair text-4xl font-semibold tracking-tight text-foreground leading-none">
            ₱{pendingBalanceNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-auto pt-2">
            Releasing upon completion
          </p>
        </div>
        
        <div className="flex flex-col gap-5 rounded-sm border border-emerald-400/30 bg-emerald-50 dark:bg-emerald-900/10 p-6">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 leading-tight">
              Next Payout
            </p>
          </div>
          <p className="font-playfair text-4xl font-semibold tracking-tight text-emerald-900 dark:text-emerald-300 leading-none">
            ₱0.00
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-auto pt-2">
            No payouts scheduled
          </p>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Transaction History
        </p>
      </div>

      {reservations.length === 0 ? (
        <div className="flex flex-col items-center gap-8 border border-border rounded-sm py-24 px-12 text-center bg-card">
          <div className="text-muted-foreground/20">
            <CardStackIcon className="size-12" />
          </div>
          <div className="space-y-2">
            <p className="font-playfair text-3xl font-semibold text-foreground">
              No transactions yet.
            </p>
            <p className="text-muted-foreground">
              When users rent your costumes and complete payment, earnings will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">Order ID</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Costume</th>
                <th className="p-4 font-medium">Gross</th>
                <th className="p-4 font-medium">Fee (10%)</th>
                <th className="p-4 font-medium">Net Earned</th>
                <th className="p-4 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reservations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((res) => {
                const costumeName = res.Costume?.name || `Costume #${res.costume_id}`;
                const gross = Number(res.total_price);
                const fee = gross * PLATFORM_FEE_RATE;
                const net = gross - fee;
                
                return (
                  <tr key={res.id} className="transition-colors hover:bg-muted/30">
                    <td className="p-4 text-xs text-muted-foreground">#{res.id}</td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {format(new Date(res.created_at), "MMM d, yyyy")}
                    </td>
                    <td className="p-4 font-playfair font-semibold truncate max-w-[200px]">{costumeName}</td>
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
                      <span className={cn(
                        "inline-flex rounded-sm border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest",
                        res.status === "COMPLETED" ? "border-emerald-400/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10" :
                        res.status === "APPROVED" ? "border-amber-400/40 text-amber-700 dark:text-amber-400" :
                        "border-muted text-muted-foreground"
                      )}>
                        {res.status === "COMPLETED" ? "Cleared" : res.status === "APPROVED" ? "Pending" : res.status}
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
