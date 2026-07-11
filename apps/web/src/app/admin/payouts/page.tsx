"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  adminListVendorBalances,
  adminGetVendorPayoutDetail,
  adminListPayouts,
  adminSyncEarningEntries,
  adminCreatePayout,
  adminMarkPayoutPaid,
  adminMarkPayoutFailed,
  adminHoldEarningEntry,
  adminReleaseEarningEntry,
  type AdminVendorBalance,
  type AdminPayout,
} from "@/lib/admin";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AdminPageHeader,
  AdminDataTable,
  AdminDetailDrawer,
  AdminKpiStrip,
  type AdminDataTableColumn,
} from "@/components/admin";
import { Input } from "@/components/ui/input";
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";

function peso(n: number) {
  return `₱${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-xl border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest",
        status === "PAID" || status === "AVAILABLE"
          ? "border-emerald-400/40 text-emerald-700 dark:text-emerald-400"
          : status === "PENDING" || status === "INCLUDED_IN_PAYOUT"
            ? "border-amber-400/40 bg-amber-50 text-amber-700 dark:bg-amber-900/10 dark:text-amber-400"
            : status === "HELD" || status === "FAILED"
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-border bg-muted/50 text-muted-foreground"
      )}
    >
      {status}
    </span>
  );
}

type VendorDetail = Awaited<ReturnType<typeof adminGetVendorPayoutDetail>>;

export default function AdminPayoutsPage() {
  const { user } = useAuth();
  const [view, setView] = useState<"balances" | "payouts">("balances");
  const [balances, setBalances] = useState<AdminVendorBalance[]>([]);
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<VendorDetail | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<AdminPayout | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, view]);

  const load = useCallback(async () => {
    if (!user || user.role !== "ADMIN") return;
    setLoading(true);
    try {
      if (view === "balances") {
        const res = await adminListVendorBalances({
          q: debouncedQ || undefined,
          page,
          pageSize,
        });
        setBalances(res.data || []);
        setTotal(res.total || 0);
      } else {
        const res = await adminListPayouts({ page, pageSize });
        setPayouts(res.data || []);
        setTotal(res.total || 0);
      }
    } catch {
      toast.error("Failed to load payouts.");
      setBalances([]);
      setPayouts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [user, view, debouncedQ, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const kpiItems = useMemo(() => {
    const available = balances.reduce((s, b) => s + b.available_balance, 0);
    const held = balances.reduce((s, b) => s + b.held_balance, 0);
    const pending = balances.reduce((s, b) => s + b.pending_payout_balance, 0);
    const paid = balances.reduce((s, b) => s + b.paid_total, 0);
    return [
      { key: "available", label: "Available", value: peso(available), sub: "ready to pay" },
      { key: "held", label: "Held", value: peso(held), sub: "on hold" },
      { key: "pending", label: "In payout", value: peso(pending), sub: "pending settlement" },
      { key: "paid", label: "Paid", value: peso(paid), sub: "cleared" },
    ];
  }, [balances]);

  async function openVendor(vendorId: number) {
    try {
      const data = await adminGetVendorPayoutDetail(vendorId);
      setDetail(data);
      setNotes("");
    } catch (e: any) {
      toast.error(e?.message || "Failed to load vendor.");
    }
  }

  async function syncEntries() {
    setActioning(true);
    try {
      const res = await adminSyncEarningEntries();
      toast.success(`Synced ${res.created} new earning entr${res.created === 1 ? "y" : "ies"}`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Sync failed.");
    } finally {
      setActioning(false);
    }
  }

  async function createPayout() {
    if (!detail) return;
    const vendorId = Number((detail.vendor as any).id);
    setActioning(true);
    try {
      await adminCreatePayout({
        vendor_id: vendorId,
        notes: notes || undefined,
      });
      toast.success("Payout created");
      const refreshed = await adminGetVendorPayoutDetail(vendorId);
      setDetail(refreshed);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Create payout failed.");
    } finally {
      setActioning(false);
    }
  }

  async function markPaid() {
    if (!selectedPayout) return;
    setActioning(true);
    try {
      await adminMarkPayoutPaid(selectedPayout.id, notes || undefined);
      toast.success("Marked paid");
      setSelectedPayout(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Mark paid failed.");
    } finally {
      setActioning(false);
    }
  }

  async function markFailed() {
    if (!selectedPayout) return;
    setActioning(true);
    try {
      await adminMarkPayoutFailed(selectedPayout.id, notes || undefined);
      toast.success("Marked failed — entries released");
      setSelectedPayout(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Mark failed error.");
    } finally {
      setActioning(false);
    }
  }

  async function toggleHold(entryId: number, hold: boolean) {
    setActioning(true);
    try {
      if (hold) await adminHoldEarningEntry(entryId, notes || undefined);
      else await adminReleaseEarningEntry(entryId, notes || undefined);
      toast.success(hold ? "Entry held" : "Entry released");
      if (detail) {
        const vendorId = Number((detail.vendor as any).id);
        setDetail(await adminGetVendorPayoutDetail(vendorId));
      }
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Hold/release failed.");
    } finally {
      setActioning(false);
    }
  }

  const balanceColumns: AdminDataTableColumn<AdminVendorBalance>[] = useMemo(
    () => [
      {
        key: "vendor",
        header: "Vendor",
        cell: (item) => (
          <div>
            <p className="font-semibold">{item.business_name || item.name || `Vendor #${item.vendor_id}`}</p>
            <p className="text-[11px] text-muted-foreground">{item.email}</p>
          </div>
        ),
      },
      {
        key: "available",
        header: "Available",
        cell: (item) => <span className="tabular-nums">{peso(item.available_balance)}</span>,
      },
      {
        key: "held",
        header: "Held",
        cell: (item) => <span className="tabular-nums">{peso(item.held_balance)}</span>,
      },
      {
        key: "paid",
        header: "Paid",
        cell: (item) => <span className="tabular-nums text-muted-foreground">{peso(item.paid_total)}</span>,
      },
    ],
    []
  );

  const payoutColumns: AdminDataTableColumn<AdminPayout>[] = useMemo(
    () => [
      {
        key: "payout",
        header: "Payout",
        cell: (item) => (
          <div>
            <p className="font-semibold">#{item.id}</p>
            <p className="text-[11px] text-muted-foreground">
              {item.vendor?.name || item.vendor?.email || `Vendor #${item.vendor_id}`}
            </p>
          </div>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        cell: (item) => <span className="tabular-nums font-semibold">{peso(item.amount)}</span>,
      },
      {
        key: "status",
        header: "Status",
        cell: (item) => <StatusChip status={item.status} />,
      },
    ],
    []
  );

  return (
    <div className="space-y-8 p-6 md:p-10">
      <AdminPageHeader
        eyebrow="Finance"
        title="Payouts"
        description="Vendor balances, earning entries, and manual settlements."
        actions={
          <button
            type="button"
            disabled={actioning}
            onClick={() => void syncEntries()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-[10px] font-semibold uppercase tracking-widest disabled:opacity-50"
          >
            <ReloadIcon className="size-3" /> Sync earnings
          </button>
        }
      />

      {view === "balances" && <AdminKpiStrip items={kpiItems} />}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-border bg-card p-1">
          {(
            [
              { value: "balances" as const, label: "Balances" },
              { value: "payouts" as const, label: "Payouts" },
            ] as const
          ).map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setView(t.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest",
                view === t.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {view === "balances" && (
          <div className="relative min-w-[220px] flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search vendors…"
              className="pl-9"
            />
          </div>
        )}
      </div>

      {view === "balances" ? (
        <AdminDataTable
          columns={balanceColumns}
          rows={balances}
          rowKey={(r) => r.vendor_id}
          loading={loading}
          emptyTitle="No vendor balances"
          emptyDescription="Approved vendors with earnings will appear here."
          onRowClick={(row) => void openVendor(row.vendor_id)}
          footer={
            <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
              <span>
                Page {page} of {totalPages} · {total} total
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-border p-1.5 disabled:opacity-40"
                >
                  <ChevronLeftIcon className="size-3.5" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-border p-1.5 disabled:opacity-40"
                >
                  <ChevronRightIcon className="size-3.5" />
                </button>
              </div>
            </div>
          }
        />
      ) : (
        <AdminDataTable
          columns={payoutColumns}
          rows={payouts}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No payouts yet"
          emptyDescription="Created payouts will appear here."
          onRowClick={setSelectedPayout}
          footer={
            <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
              <span>
                Page {page} of {totalPages} · {total} total
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-border p-1.5 disabled:opacity-40"
                >
                  <ChevronLeftIcon className="size-3.5" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-border p-1.5 disabled:opacity-40"
                >
                  <ChevronRightIcon className="size-3.5" />
                </button>
              </div>
            </div>
          }
        />
      )}

      <AdminDetailDrawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={
          (detail?.vendor as any)?.VendorProfile?.business_name ||
          (detail?.vendor as any)?.name ||
          "Vendor payouts"
        }
        description={(detail?.vendor as any)?.email}
        widthClassName="max-w-xl"
        footer={
          <div className="space-y-3">
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes / reason"
            />
            <button
              type="button"
              disabled={actioning || !detail || detail.balances.available_balance <= 0}
              onClick={() => void createPayout()}
              className="w-full rounded-xl bg-primary px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
            >
              Create payout ({peso(detail?.balances.available_balance || 0)})
            </button>
          </div>
        }
      >
        {detail && (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Available
                </p>
                <p className="font-display text-xl font-semibold">
                  {peso(detail.balances.available_balance)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Held
                </p>
                <p className="font-display text-xl font-semibold">
                  {peso(detail.balances.held_balance)}
                </p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Earning entries
              </p>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {detail.entries.length === 0 && (
                  <p className="text-muted-foreground">No entries yet. Sync completed reservations.</p>
                )}
                {detail.entries.map((entry: any) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-semibold">
                        Res #{entry.reservation_id} · {peso(Number(entry.net_amount))}
                      </p>
                      <StatusChip status={entry.status} />
                    </div>
                    {(entry.status === "AVAILABLE" || entry.status === "HELD") && (
                      <button
                        type="button"
                        disabled={actioning}
                        onClick={() => void toggleHold(entry.id, entry.status !== "HELD")}
                        className="rounded-lg border border-border px-2 py-1 text-[9px] font-semibold uppercase tracking-widest disabled:opacity-50"
                      >
                        {entry.status === "HELD" ? "Release" : "Hold"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </AdminDetailDrawer>

      <AdminDetailDrawer
        open={!!selectedPayout}
        onClose={() => setSelectedPayout(null)}
        title={selectedPayout ? `Payout #${selectedPayout.id}` : "Payout"}
        description={selectedPayout ? peso(selectedPayout.amount) : undefined}
        footer={
          selectedPayout?.status === "PENDING" ? (
            <div className="space-y-3">
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes / failure reason"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={actioning}
                  onClick={() => void markPaid()}
                  className="flex-1 rounded-xl bg-primary px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
                >
                  Mark paid
                </button>
                <button
                  type="button"
                  disabled={actioning}
                  onClick={() => void markFailed()}
                  className="flex-1 rounded-xl border border-destructive/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-destructive disabled:opacity-50"
                >
                  Mark failed
                </button>
              </div>
            </div>
          ) : undefined
        }
      >
        {selectedPayout && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusChip status={selectedPayout.status} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Payment method snapshot
              </p>
              <pre className="overflow-auto rounded-xl border border-border bg-muted/40 p-3 text-[11px]">
                {JSON.stringify(selectedPayout.payment_method_snapshot ?? null, null, 2)}
              </pre>
            </div>
            {selectedPayout.failure_reason && (
              <p className="text-destructive">{selectedPayout.failure_reason}</p>
            )}
          </div>
        )}
      </AdminDetailDrawer>
    </div>
  );
}
