"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { adminListReservations, type AdminReservation } from "@/lib/admin";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusChip({ status }: { status: string }) {
  const s = status?.toUpperCase();
  const cls =
    s === "APPROVED" || s === "COMPLETED" ? "border-emerald-400/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
    : s === "PENDING" ? "border-amber-400/30 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
    : s === "REJECTED" || s === "CANCELLED" ? "border-destructive/20 bg-destructive/5 text-destructive"
    : "border-border bg-muted/50 text-muted-foreground";
  return <span className={`rounded-sm border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest ${cls}`}>{status}</span>;
}

const STATUSES = ["", "PENDING", "APPROVED", "COMPLETED", "CANCELLED", "REJECTED"];

export default function AdminReservationsPage() {
  const { token, user } = useAuth();
  const [all, setAll]           = useState<AdminReservation[]>([]);
  const [filter, setFilter]     = useState("");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!token || user?.role !== "ADMIN") return;
    adminListReservations(token)
      .then((v) => setAll(Array.isArray(v) ? v : (v as any)?.data || []))
      .catch(() => toast.error("Failed to load reservations."))
      .finally(() => setLoading(false));
  }, [token, user]);

  const items = filter ? all.filter((r) => r.status?.toUpperCase() === filter) : all;
  const totalRevenue = all.filter(r => r.status === "COMPLETED" || r.status === "APPROVED")
    .reduce((s, r) => s + Number(r.total_price), 0);

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

        {/* Filter pills */}
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
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
              )}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-sm" />)}
        </div>
      ) : (
        <div className="rounded-sm border border-border divide-y divide-border">
          {items.length === 0 && (
            <p className="px-6 py-16 text-center text-sm text-muted-foreground">No reservations match this filter.</p>
          )}
          {items.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="font-playfair text-base font-semibold text-foreground">Reservation #{r.id}</p>
                <p className="text-xs text-muted-foreground">
                  User #{r.user_id} · {fmt(r.start_date)} → {fmt(r.end_date)}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="font-playfair text-base font-semibold text-foreground">
                  ₱{Number(r.total_price).toLocaleString()}
                </span>
                <StatusChip status={r.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
