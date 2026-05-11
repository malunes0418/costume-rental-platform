"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { listVendorReservations, approveReservation, rejectReservation, type Reservation } from "@/lib/vendor";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CheckIcon, Cross2Icon, CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";

export default function VendorReservationsPage() {
  const { token } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchReservations() {
    if (!token) return;
    try {
      const res = await listVendorReservations(token) as any;
      setReservations(Array.isArray(res) ? res : (res.data || []));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReservations();
  }, [token]);

  async function handleApprove(id: number) {
    if (!token) return;
    try {
      await approveReservation(id, token);
      toast.success("Reservation approved.");
      fetchReservations();
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve reservation");
    }
  }

  async function handleReject(id: number) {
    if (!token) return;
    try {
      await rejectReservation(id, token);
      toast.success("Reservation rejected.");
      fetchReservations();
    } catch (err: any) {
      toast.error(err?.message || "Failed to reject reservation");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 pb-32 pt-10">
        <div className="mb-10 space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-32 pt-10">
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground animate-fade-up">
            Orders
          </p>
          <h1 className="font-playfair text-4xl font-semibold tracking-tight text-foreground animate-fade-up-delay-1 md:text-5xl">
            Reservations
          </h1>
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="flex flex-col items-center gap-8 border border-border rounded-sm py-24 px-12 text-center bg-card">
          <div className="text-muted-foreground/20">
            <CalendarIcon className="size-12" />
          </div>
          <div className="space-y-2">
            <p className="font-playfair text-3xl font-semibold text-foreground">
              No reservations yet.
            </p>
            <p className="text-muted-foreground">
              When users rent your costumes, they will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">Costume</th>
                <th className="p-4 font-medium">Dates</th>
                <th className="p-4 font-medium">Total Price</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reservations.map((res) => {
                const costumeName = res.Costume?.name || `Costume #${res.costume_id}`;
                return (
                  <tr key={res.id} className="transition-colors hover:bg-muted/30">
                    <td className="p-4 text-xs text-muted-foreground">#{res.id}</td>
                    <td className="p-4 font-playfair font-semibold">{costumeName}</td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {format(new Date(res.start_date), "MMM d")} - {format(new Date(res.end_date), "MMM d, yyyy")}
                    </td>
                    <td className="p-4 font-semibold text-foreground">
                      ₱{Number(res.total_price).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "inline-flex rounded-sm border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest",
                        res.status === "APPROVED" ? "border-emerald-400/40 text-emerald-700 dark:text-emerald-400" :
                        res.status === "PENDING" ? "border-amber-400/40 text-amber-700 dark:text-amber-400" :
                        res.status === "COMPLETED" ? "border-blue-400/40 text-blue-700 dark:text-blue-400" :
                        "border-destructive/30 text-destructive"
                      )}>
                        {res.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {res.status === "PENDING" && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(res.id)}
                            className="flex size-7 items-center justify-center rounded-sm border border-emerald-400/40 text-emerald-700 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                            title="Approve"
                          >
                            <CheckIcon className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleReject(res.id)}
                            className="flex size-7 items-center justify-center rounded-sm border border-destructive/30 text-destructive transition-colors hover:bg-destructive/10"
                            title="Reject"
                          >
                            <Cross2Icon className="size-3.5" />
                          </button>
                        </div>
                      )}
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
