"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { adminGetOverview, type AdminOverviewResponse } from "@/lib/admin";
import { getReservationStatusMeta, isReservationStatus } from "@/lib/reservationStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPageHeader, AdminKpiStrip, AdminQueueBanner } from "@/components/admin";
import {
  PersonIcon,
  CalendarIcon,
  CardStackIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function currency(n: number | string) {
  return `₱${Number(n).toLocaleString()}`;
}

function StatusChip({ status }: { status: string }) {
  const s = status?.toUpperCase();
  const cls = isReservationStatus(s)
    ? getReservationStatusMeta(s).className
    : s === "APPROVED" || s === "ACTIVE" || s === "COMPLETED"
      ? "border-emerald-400/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
      : s === "PENDING"
        ? "border-amber-400/30 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
        : s === "REJECTED" || s === "CANCELLED"
          ? "border-destructive/20 bg-destructive/5 text-destructive"
          : "border-border bg-muted/50 text-muted-foreground";

  return (
    <span className={`rounded-xl border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest ${cls}`}>
      {status}
    </span>
  );
}

function MiniBarChart({ data, label }: { data: number[]; label: string }) {
  const max = Math.max(...data, 1);
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex h-16 items-end gap-1">
        {data.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-xl bg-primary/80 transition-all duration-300"
              style={{ height: `${(v / max) * 52}px`, minHeight: v > 0 ? "4px" : "0" }}
            />
            <span className="text-[8px] text-muted-foreground">{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    adminGetOverview()
      .then(setOverview)
      .catch(() => setOverview(null))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-8 p-8">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Skeleton className="col-span-2 h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="p-6 md:p-10">
        <AdminPageHeader title="Overview" description="Unable to load platform overview." />
      </div>
    );
  }

  const { queues, kpis, series, statusBreakdown, recentActivity } = overview;
  const actionCount =
    queues.pendingVendors +
    queues.flaggedCostumes +
    (queues.openReports || 0) +
    (queues.openDisputes || 0) +
    (queues.pendingPayouts || 0);

  return (
    <div className="space-y-10 p-6 md:p-10">
      <AdminPageHeader eyebrow="Platform overview" title="Overview" />

      <AdminKpiStrip
        items={[
          {
            key: "active",
            label: "Active bookings",
            value: kpis.activeReservations,
            icon: CalendarIcon,
            sub: "in progress",
          },
          {
            key: "reservations",
            label: "Reservations",
            value: kpis.totalReservations,
            icon: CalendarIcon,
            sub: "all time",
          },
          {
            key: "users",
            label: "Users",
            value: kpis.totalUsers,
            icon: PersonIcon,
            sub: "registered accounts",
          },
          {
            key: "action",
            label: "Action required",
            value: actionCount,
            icon: CardStackIcon,
            sub: `${queues.pendingVendors} vendors · ${queues.flaggedCostumes + (queues.openReports || 0)} mod · ${queues.openDisputes || 0} disputes`,
            trend: actionCount > 0 ? { dir: "up", text: "needs review" } : undefined,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-6 rounded-xl border border-border bg-card p-6 xl:col-span-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              7-day activity
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-foreground">
              Reservations vs Quoted Value
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <MiniBarChart data={series.reservationsLast7Days} label="Reservations" />
            <MiniBarChart data={series.quotedValueLast7Days} label="Quoted value (PHP)" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Reservation status
          </p>
          <p className="mb-6 mt-1 font-display text-2xl font-semibold text-foreground">Breakdown</p>
          {Object.keys(statusBreakdown).length === 0 ? (
            <p className="text-sm text-muted-foreground">No data.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(statusBreakdown).map(([status, count]) => {
                const pct = Math.round((count / Math.max(kpis.totalReservations, 1)) * 100);
                return (
                  <div key={status}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {status}
                      </span>
                      <span className="text-xs font-semibold text-foreground">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Recent activity
          </p>
          <p className="mt-0.5 font-display text-xl font-semibold text-foreground">Latest transactions</p>
        </div>
        <div className="divide-y divide-border">
          {recentActivity.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">No activity yet.</p>
          )}
          {recentActivity.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.sub}</p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="font-display text-sm font-semibold text-foreground">
                  {currency(item.amount)}
                </span>
                <StatusChip status={item.status} />
                <span className="hidden text-[10px] text-muted-foreground sm:block">{fmt(item.date)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {queues.pendingVendors > 0 && (
          <AdminQueueBanner
            count={queues.pendingVendors}
            title={`${queues.pendingVendors} vendor application${queues.pendingVendors !== 1 ? "s" : ""} need review`}
            href="/admin/vendors"
            ctaLabel={`Review ${queues.pendingVendors} vendor${queues.pendingVendors !== 1 ? "s" : ""}`}
          />
        )}

        {(queues.flaggedCostumes > 0 || (queues.openReports || 0) > 0) && (
          <AdminQueueBanner
            count={queues.flaggedCostumes + (queues.openReports || 0)}
            title={`${queues.flaggedCostumes} flagged · ${queues.openReports || 0} open report${(queues.openReports || 0) !== 1 ? "s" : ""}`}
            description="Review moderation queues for listings and content reports."
            href="/admin/moderation"
            ctaLabel="Open moderation"
          >
            <span className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-400/40 px-4 text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              <ExclamationTriangleIcon className="size-3" />
              {queues.flaggedCostumes + (queues.openReports || 0)} items
            </span>
          </AdminQueueBanner>
        )}

        {(queues.openDisputes || 0) > 0 && (
          <AdminQueueBanner
            count={queues.openDisputes}
            title={`${queues.openDisputes} open dispute${queues.openDisputes !== 1 ? "s" : ""}`}
            description="Support cases awaiting review or resolution."
            href="/admin/disputes"
            ctaLabel="Open disputes"
          />
        )}

        {(queues.pendingPayouts || 0) > 0 && (
          <AdminQueueBanner
            count={queues.pendingPayouts}
            title={`${queues.pendingPayouts} pending payout${queues.pendingPayouts !== 1 ? "s" : ""}`}
            description="Mark settlements paid or failed after manual transfer."
            href="/admin/payouts"
            ctaLabel="Open payouts"
          />
        )}
      </div>
    </div>
  );
}
