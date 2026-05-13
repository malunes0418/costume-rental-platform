"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { adminListReservations, adminUpdateReservationStatus, type AdminReservation } from "@/lib/admin";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ExclamationTriangleIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusChip({ status }: { status: string }) {
  const s = status?.toUpperCase();
  const cls =
    s === "APPROVED" || s === "COMPLETED" ? "border-emerald-400/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
    : s === "PENDING" ? "border-amber-400/30 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
    : s === "REJECTED" || s === "CANCELLED" || s === "DISPUTED" ? "border-destructive/20 bg-destructive/5 text-destructive"
    : "border-border bg-muted/50 text-muted-foreground";
  return <span className={`rounded-sm border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest ${cls}`}>{status}</span>;
}

const STATUSES = ["", "PENDING", "APPROVED", "COMPLETED", "CANCELLED", "REJECTED", "DISPUTED"];

export default function AdminReservationsPage() {
  const { user } = useAuth();
  const [all, setAll]           = useState<AdminReservation[]>([]);
  const [filter, setFilter]     = useState("");
  const [loading, setLoading]   = useState(true);
  
  // Detailed view state
  const [selectedRes, setSelectedRes] = useState<AdminReservation | null>(null);
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    adminListReservations()
      .then((v) => setAll(Array.isArray(v) ? v : (v as any)?.data || []))
      .catch(() => toast.error("Failed to load reservations."))
      .finally(() => setLoading(false));
  }, [user]);

  const items = filter ? all.filter((r) => r.status?.toUpperCase() === filter) : all;
  const totalRevenue = all.filter(r => r.status === "COMPLETED" || r.status === "APPROVED")
    .reduce((s, r) => s + Number(r.total_price), 0);

  async function handleUpdateStatus(id: number, newStatus: string) {
    if (!user) return;
    setActioning(true);
    try {
      await adminUpdateReservationStatus(id, newStatus);
      setAll((curr) => curr.map(r => r.id === id ? { ...r, status: newStatus } : r));
      if (selectedRes?.id === id) {
        setSelectedRes({ ...selectedRes, status: newStatus });
      }
      toast.success(`Reservation status updated to ${newStatus}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update reservation status.");
    } finally {
      setActioning(false);
    }
  }

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
          <h1 className="mt-2 font-playfair text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Reservations
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {all.length} total · ₱{Number(totalRevenue).toLocaleString()} confirmed revenue
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-sm border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors",
                filter === s
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/40"
              )}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-sm" />)}
        </div>
      ) : (
        <div className="rounded-sm border border-border divide-y divide-border bg-card overflow-hidden">
          {items.length === 0 && (
            <p className="px-6 py-16 text-center text-sm text-muted-foreground">No reservations match this filter.</p>
          )}
          <table className="w-full text-left text-sm hidden md:table">
            <thead className="border-b border-border bg-muted/50 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">Reservation</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Costume Details</th>
                <th className="p-4 font-medium">Dates</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((r) => {
                const costume = r.items?.[0]?.Costume;
                return (
                  <tr key={r.id} className="transition-colors hover:bg-muted/30 group">
                    <td className="p-4">
                      <p className="font-playfair text-base font-semibold text-foreground">#{r.id}</p>
                      <StatusChip status={r.status} />
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-foreground">{r.User?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.User?.email || `User #${r.user_id}`}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-foreground truncate max-w-[200px]">
                        {costume?.name || "Multiple items"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.items?.length || 0} item(s)
                      </p>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {fmt(r.start_date)} →<br/>{fmt(r.end_date)}
                    </td>
                    <td className="p-4 font-playfair font-semibold text-foreground">
                      ₱{Number(r.total_price).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRes(r)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <MagnifyingGlassIcon className="size-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Mobile view */}
          <div className="md:hidden divide-y divide-border">
            {items.map((r) => (
              <div key={r.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-playfair text-base font-semibold text-foreground">#{r.id}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.User?.name || `User #${r.user_id}`}</p>
                  </div>
                  <div className="text-right">
                    <StatusChip status={r.status} />
                    <p className="font-playfair font-semibold text-foreground mt-1">₱{Number(r.total_price).toLocaleString()}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRes(r)}
                  className="w-full flex h-8 items-center justify-center gap-1.5 rounded-sm border border-border px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted"
                >
                  <MagnifyingGlassIcon className="size-3.5" /> View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details & Dispute Modal */}
      <Dialog open={!!selectedRes} onOpenChange={(open: boolean) => !open && setSelectedRes(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-playfair text-2xl">Reservation #{selectedRes?.id}</DialogTitle>
            <DialogDescription>
              View detailed information and moderate this transaction.
            </DialogDescription>
          </DialogHeader>

          {selectedRes && (
            <div className="space-y-6 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Customer</p>
                  <p className="font-medium text-sm">{selectedRes.User?.name || `User #${selectedRes.user_id}`}</p>
                  <p className="text-xs text-muted-foreground">{selectedRes.User?.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Status</p>
                  <div className="pt-1"><StatusChip status={selectedRes.status} /></div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Rental Period</p>
                  <p className="text-sm">{fmt(selectedRes.start_date)} to {fmt(selectedRes.end_date)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Price</p>
                  <p className="font-playfair text-lg font-semibold">₱{Number(selectedRes.total_price).toLocaleString()}</p>
                </div>
              </div>

              <div className="border border-border rounded-sm p-4 bg-muted/20">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Costume Details</p>
                <div className="space-y-2">
                  {selectedRes.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="font-medium">{item.Costume?.name || `Item #${item.costume_id}`}</span>
                      <span className="text-muted-foreground">₱{Number(item.price_at_reservation).toLocaleString()} / day</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-6 space-y-4">
                <div className="flex items-center gap-2 text-destructive">
                  <ExclamationTriangleIcon className="size-4" />
                  <p className="text-xs font-semibold uppercase tracking-widest">Admin Override Actions</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedRes.id, "COMPLETED")}
                    disabled={actioning || selectedRes.status === "COMPLETED"}
                    className="flex h-9 items-center rounded-sm border border-emerald-400/40 px-4 text-[10px] font-semibold uppercase tracking-widest text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-40"
                  >
                    Force Complete
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedRes.id, "CANCELLED")}
                    disabled={actioning || selectedRes.status === "CANCELLED"}
                    className="flex h-9 items-center rounded-sm border border-destructive/30 px-4 text-[10px] font-semibold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
                  >
                    Force Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedRes.id, "DISPUTED")}
                    disabled={actioning || selectedRes.status === "DISPUTED"}
                    className="flex h-9 items-center rounded-sm border border-amber-400/40 px-4 text-[10px] font-semibold uppercase tracking-widest text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-40"
                  >
                    Flag as Disputed
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Overrides bypass the normal vendor/customer flow. Use only when necessary for dispute resolution.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
