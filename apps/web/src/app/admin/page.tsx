"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  adminListUsers,
  adminListReservations,
  adminListPayments,
  adminListPendingVendors,
  type AdminUser,
  type AdminReservation,
  type AdminPayment,
  type PendingVendor,
} from "@/lib/admin";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PersonIcon,
  CalendarIcon,
  ArchiveIcon,
  CardStackIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@radix-ui/react-icons";

// ── helpers ────────────────────────────────────────────────────────────────────

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function currency(n: number | string) {
  return `₱${Number(n).toLocaleString()}`;
}

// ── components ─────────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: string }) {
  const s = status?.toUpperCase();
  const cls =
    s === "APPROVED" || s === "ACTIVE" || s === "COMPLETED"
      ? "border-emerald-400/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
      : s === "PENDING"
      ? "border-amber-400/30 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
      : s === "REJECTED" || s === "CANCELLED"
      ? "border-destructive/20 bg-destructive/5 text-destructive"
      : "border-border bg-muted/50 text-muted-foreground";

  return (
    <span className={`rounded-sm border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest ${cls}`}>
      {status}
    </span>
  );
}

function KpiCard({
  label, value, icon: Icon, sub, trend,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  trend?: { dir: "up" | "down"; text: string };
}) {
  return (
    <div className="flex flex-col gap-5 rounded-sm border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground leading-tight">
          {label}
        </p>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-border">
          <Icon className="size-3.5 text-muted-foreground" />
        </div>
      </div>
      <p className="font-playfair text-4xl font-semibold tracking-tight text-foreground leading-none">
        {value}
      </p>
      {(sub || trend) && (
        <div className="flex items-center gap-2 mt-auto">
          {trend && (
            <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${
              trend.dir === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
            }`}>
              {trend.dir === "up"
                ? <ArrowUpIcon className="size-2.5" />
                : <ArrowDownIcon className="size-2.5" />}
              {trend.text}
            </span>
          )}
          {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
        </div>
      )}
    </div>
  );
}

// ── mini bar chart (pure CSS) ──────────────────────────────────────────────────

function MiniBarChart({ data, label }: { data: number[]; label: string }) {
  const max = Math.max(...data, 1);
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex items-end gap-1 h-16">
        {data.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-sm bg-foreground/80 transition-all duration-300"
              style={{ height: `${(v / max) * 52}px`, minHeight: v > 0 ? "4px" : "0" }}
            />
            <span className="text-[8px] text-muted-foreground">{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const { user } = useAuth();

  const [users, setUsers]                   = useState<AdminUser[]>([]);
  const [reservations, setReservations]     = useState<AdminReservation[]>([]);
  const [payments, setPayments]             = useState<AdminPayment[]>([]);
  const [pendingVendors, setPendingVendors] = useState<PendingVendor[]>([]);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    Promise.allSettled([
      adminListUsers(),
      adminListReservations(),
      adminListPayments(),
      adminListPendingVendors(),
    ]).then(([u, r, p, v]) => {
      const safe = <T,>(res: PromiseSettledResult<T>, fallback: T): T =>
        res.status === "fulfilled" ? res.value : fallback;

      const arr = <T,>(val: T) =>
        Array.isArray(val) ? val : ((val as any)?.data ?? []);

      setUsers(arr(safe(u, [])));
      setReservations(arr(safe(r, [])));
      setPayments(arr(safe(p, [])));
      setPendingVendors(arr(safe(v, [])));
    }).finally(() => setLoading(false));
  }, [user]);

  // ── derived analytics ──────────────────────────────────────────────────────

  const totalRevenue    = payments.filter((p) => p.status === "APPROVED").reduce((s, p) => s + Number(p.amount), 0);
  const pendingPayments = payments.filter((p) => p.status === "PENDING").length;
  const pendingCount    = pendingVendors.length;

  // Reservations per day of week (last 7 buckets)
  const byDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return reservations.filter((r) => r.created_at?.slice(0, 10) === key).length;
  });

  // Payment amounts per day (last 7)
  const revByDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return payments
      .filter((p) => p.status === "APPROVED" && p.created_at?.slice(0, 10) === key)
      .reduce((s, p) => s + Number(p.amount), 0);
  });

  // Status breakdown
  const statusGroups = reservations.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const recentActivity = [
    ...reservations.slice(-4).map((r) => ({
      id: `res-${r.id}`,
      label: `Reservation #${r.id}`,
      sub: `${fmt(r.start_date)} → ${fmt(r.end_date)}`,
      amount: currency(r.total_price),
      status: r.status,
      date: r.created_at,
    })),
    ...payments.slice(-4).map((p) => ({
      id: `pay-${p.id}`,
      label: `Payment #${p.id}`,
      sub: `Reservations #${(p.reservation_ids || []).join(', #')}`,
      amount: currency(p.amount),
      status: p.status,
      date: p.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
    .slice(0, 8);

  // ── skeleton ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-sm" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Skeleton className="h-48 col-span-2 rounded-sm" />
          <Skeleton className="h-48 rounded-sm" />
        </div>
      </div>
    );
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-10 space-y-10">

      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Platform overview
        </p>
        <h1 className="mt-2 font-playfair text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Overview
        </h1>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard
          label="Total revenue"
          value={currency(totalRevenue)}
          icon={ArchiveIcon}
          sub="approved payments"
        />
        <KpiCard
          label="Reservations"
          value={reservations.length}
          icon={CalendarIcon}
          sub="all time"
        />
        <KpiCard
          label="Users"
          value={users.length}
          icon={PersonIcon}
          sub="registered accounts"
        />
        <KpiCard
          label="Action required"
          value={pendingCount + pendingPayments}
          icon={CardStackIcon}
          sub={`${pendingCount} vendors · ${pendingPayments} payments`}
          trend={pendingCount + pendingPayments > 0 ? { dir: "up", text: "needs review" } : undefined}
        />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">

        {/* Reservations trend */}
        <div className="xl:col-span-2 rounded-sm border border-border bg-card p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">7-day activity</p>
              <p className="mt-1 font-playfair text-2xl font-semibold text-foreground">Reservations vs Revenue</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <MiniBarChart data={byDay} label="Reservations" />
            <MiniBarChart data={revByDay} label="Revenue (₱)" />
          </div>
        </div>

        {/* Status breakdown */}
        <div className="rounded-sm border border-border bg-card p-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Reservation status
          </p>
          <p className="mt-1 font-playfair text-2xl font-semibold text-foreground mb-6">
            Breakdown
          </p>
          {Object.keys(statusGroups).length === 0 ? (
            <p className="text-sm text-muted-foreground">No data.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(statusGroups).map(([status, count]) => {
                const pct = Math.round((count / reservations.length) * 100);
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {status}
                      </span>
                      <span className="text-xs font-semibold text-foreground">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-foreground transition-all duration-500"
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

      {/* ── Recent activity ── */}
      <div className="rounded-sm border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Recent activity
          </p>
          <p className="mt-0.5 font-playfair text-xl font-semibold text-foreground">
            Latest transactions
          </p>
        </div>
        <div className="divide-y divide-border">
          {recentActivity.length === 0 && (
            <p className="px-6 py-10 text-sm text-muted-foreground text-center">No activity yet.</p>
          )}
          {recentActivity.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.sub}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="font-playfair text-sm font-semibold text-foreground">{item.amount}</span>
                <StatusChip status={item.status} />
                <span className="text-[10px] text-muted-foreground hidden sm:block">{fmt(item.date)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pending alerts ── */}
      {(pendingCount > 0 || pendingPayments > 0) && (
        <div className="rounded-sm border border-amber-400/30 bg-amber-50/50 dark:bg-amber-900/10 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
            Action required
          </p>
          <p className="mt-1 font-playfair text-xl font-semibold text-foreground">
            {pendingCount + pendingPayments} item{pendingCount + pendingPayments !== 1 ? "s" : ""} need your attention
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {pendingCount > 0 && (
              <a
                href="/admin/vendors"
                className="inline-flex h-9 items-center rounded-sm border border-foreground bg-foreground px-5 text-[10px] font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
              >
                Review {pendingCount} vendor{pendingCount !== 1 ? "s" : ""}
              </a>
            )}
            {pendingPayments > 0 && (
              <a
                href="/admin/payments"
                className="inline-flex h-9 items-center rounded-sm border border-border px-5 text-[10px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
              >
                Review {pendingPayments} payment{pendingPayments !== 1 ? "s" : ""}
              </a>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
