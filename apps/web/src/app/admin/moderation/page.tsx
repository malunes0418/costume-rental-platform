"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  adminGetModerationQueue,
  adminCreateContentReport,
  adminResolveContentReport,
  adminUpdateCostumeStatus,
  type AdminContentReport,
  type AdminInventoryItem,
  type CostumeModerationStatus,
} from "@/lib/admin";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AdminPageHeader,
  AdminDataTable,
  AdminDetailDrawer,
  type AdminDataTableColumn,
} from "@/components/admin";
import { Input } from "@/components/ui/input";
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@radix-ui/react-icons";

const TABS = [
  { value: "flagged" as const, label: "Flagged" },
  { value: "reports" as const, label: "Reports" },
];

function StatusChip({ status }: { status?: string }) {
  const s = status || "";
  return (
    <span
      className={cn(
        "inline-flex rounded-xl border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest",
        s === "ACTIVE" || s === "RESOLVED"
          ? "border-emerald-400/40 text-emerald-700 dark:text-emerald-400"
          : s === "FLAGGED" || s === "OPEN"
            ? "border-amber-400/40 bg-amber-50 text-amber-700 dark:bg-amber-900/10 dark:text-amber-400"
            : s === "DISMISSED" || s === "DRAFT"
              ? "border-border bg-muted/50 text-muted-foreground"
              : "border-destructive/30 bg-destructive/5 text-destructive"
      )}
    >
      {s}
    </span>
  );
}

export default function AdminModerationPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"flagged" | "reports">("flagged");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [flagged, setFlagged] = useState<AdminInventoryItem[]>([]);
  const [reports, setReports] = useState<AdminContentReport[]>([]);
  const [drawerCostume, setDrawerCostume] = useState<AdminInventoryItem | null>(null);
  const [drawerReport, setDrawerReport] = useState<AdminContentReport | null>(null);
  const [reason, setReason] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<{
    target_type: "COSTUME" | "USER" | "REVIEW" | "OTHER";
    target_id: string;
    reason: string;
    details: string;
  }>({
    target_type: "COSTUME",
    target_id: "",
    reason: "",
    details: "",
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, tab]);

  const load = useCallback(async () => {
    if (!user || user.role !== "ADMIN") return;
    setLoading(true);
    try {
      const res = await adminGetModerationQueue({
        tab,
        q: debouncedQ || undefined,
        status: tab === "reports" ? "OPEN" : undefined,
        page,
        pageSize,
      });
      setTotal(res.total || 0);
      if (tab === "flagged") {
        setFlagged((res.data as AdminInventoryItem[]) || []);
      } else {
        setReports((res.data as AdminContentReport[]) || []);
      }
    } catch {
      toast.error("Failed to load moderation queue.");
      setFlagged([]);
      setReports([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [user, tab, debouncedQ, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function updateCostume(id: number, next: CostumeModerationStatus) {
    setActioning(true);
    try {
      await adminUpdateCostumeStatus(id, next, reason || undefined);
      toast.success(`Listing marked ${next.toLowerCase()}`);
      setReason("");
      setDrawerCostume(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Action failed.");
    } finally {
      setActioning(false);
    }
  }

  async function resolveReport(status: "RESOLVED" | "DISMISSED", costumeStatus?: CostumeModerationStatus) {
    if (!drawerReport) return;
    setActioning(true);
    try {
      await adminResolveContentReport(drawerReport.id, {
        status,
        resolution_note: reason || undefined,
        costume_status: costumeStatus,
      });
      toast.success(status === "RESOLVED" ? "Report resolved" : "Report dismissed");
      setReason("");
      setDrawerReport(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Resolve failed.");
    } finally {
      setActioning(false);
    }
  }

  async function createReport() {
    const targetId = Number(createForm.target_id);
    if (!targetId || !createForm.reason.trim()) {
      toast.error("Target id and reason are required.");
      return;
    }
    setActioning(true);
    try {
      await adminCreateContentReport({
        target_type: createForm.target_type,
        target_id: targetId,
        reason: createForm.reason.trim(),
        details: createForm.details.trim() || undefined,
      });
      toast.success("Report created");
      setShowCreate(false);
      setCreateForm({ target_type: "COSTUME", target_id: "", reason: "", details: "" });
      setTab("reports");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Create failed.");
    } finally {
      setActioning(false);
    }
  }

  const flaggedColumns: AdminDataTableColumn<AdminInventoryItem>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Listing",
        cell: (item) => (
          <div>
            <p className="font-semibold text-foreground">{item.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {item.vendor?.business_name || item.vendor?.name || "—"}
            </p>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (item) => <StatusChip status={item.status} />,
      },
      {
        key: "stock",
        header: "Stock",
        cell: (item) => <span className="tabular-nums">{item.stock}</span>,
      },
    ],
    []
  );

  const reportColumns: AdminDataTableColumn<AdminContentReport>[] = useMemo(
    () => [
      {
        key: "reason",
        header: "Report",
        cell: (item) => (
          <div>
            <p className="font-semibold text-foreground">{item.reason}</p>
            <p className="text-[11px] text-muted-foreground">
              {item.target_type} #{item.target_id}
            </p>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (item) => <StatusChip status={item.status} />,
      },
      {
        key: "reporter",
        header: "Reporter",
        cell: (item) => (
          <span className="text-xs text-muted-foreground">
            {item.reporter?.name || item.reporter?.email || "—"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-8 p-6 md:p-10">
      <AdminPageHeader
        eyebrow="Trust & safety"
        title="Moderation"
        description="Flagged listings and open content reports."
        actions={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground"
          >
            <PlusIcon className="size-3" /> New report
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-border bg-card p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest",
                tab === t.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-[220px] flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tab === "flagged" ? "Search listings…" : "Search reports…"}
            className="pl-9"
          />
        </div>
      </div>

      {tab === "flagged" ? (
        <AdminDataTable
          columns={flaggedColumns}
          rows={flagged}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No flagged listings"
          emptyDescription="Flagged costumes will appear here."
          onRowClick={setDrawerCostume}
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
          columns={reportColumns}
          rows={reports}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No open reports"
          emptyDescription="Content reports awaiting review will appear here."
          onRowClick={setDrawerReport}
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
        open={!!drawerCostume}
        onClose={() => setDrawerCostume(null)}
        title={drawerCostume?.name || "Listing"}
        description={drawerCostume?.vendor?.business_name || drawerCostume?.vendor?.email}
        footer={
          <div className="space-y-3">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={actioning}
                onClick={() => drawerCostume && void updateCostume(drawerCostume.id, "ACTIVE")}
                className="rounded-xl bg-primary px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
              >
                Activate
              </button>
              <button
                type="button"
                disabled={actioning}
                onClick={() => drawerCostume && void updateCostume(drawerCostume.id, "HIDDEN")}
                className="rounded-xl border border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-widest disabled:opacity-50"
              >
                Hide
              </button>
            </div>
          </div>
        }
      >
        {drawerCostume && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusChip status={drawerCostume.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Stock</span>
              <span>{drawerCostume.stock}</span>
            </div>
            <p className="text-muted-foreground">{drawerCostume.description || "No description."}</p>
          </div>
        )}
      </AdminDetailDrawer>

      <AdminDetailDrawer
        open={!!drawerReport}
        onClose={() => setDrawerReport(null)}
        title={drawerReport?.reason || "Report"}
        description={
          drawerReport ? `${drawerReport.target_type} #${drawerReport.target_id}` : undefined
        }
        footer={
          <div className="space-y-3">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Resolution note"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={actioning}
                onClick={() => void resolveReport("RESOLVED", "HIDDEN")}
                className="rounded-xl bg-primary px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
              >
                Resolve + hide
              </button>
              <button
                type="button"
                disabled={actioning}
                onClick={() => void resolveReport("RESOLVED", "ACTIVE")}
                className="rounded-xl border border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-widest disabled:opacity-50"
              >
                Resolve + clear
              </button>
              <button
                type="button"
                disabled={actioning}
                onClick={() => void resolveReport("DISMISSED")}
                className="rounded-xl border border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-widest disabled:opacity-50"
              >
                Dismiss
              </button>
            </div>
          </div>
        }
      >
        {drawerReport && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusChip status={drawerReport.status} />
            </div>
            <p className="text-muted-foreground">{drawerReport.details || "No details provided."}</p>
            {drawerReport.target && (
              <pre className="overflow-auto rounded-xl border border-border bg-muted/40 p-3 text-[11px]">
                {JSON.stringify(drawerReport.target, null, 2)}
              </pre>
            )}
          </div>
        )}
      </AdminDetailDrawer>

      <AdminDetailDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New content report"
        description="File a report on behalf of support."
        footer={
          <button
            type="button"
            disabled={actioning}
            onClick={() => void createReport()}
            className="w-full rounded-xl bg-primary px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            Create report
          </button>
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1.5 text-xs">
            <span className="font-semibold uppercase tracking-widest text-muted-foreground">
              Target type
            </span>
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              value={createForm.target_type}
              onChange={(e) =>
                setCreateForm((f) => ({
                  ...f,
                  target_type: e.target.value as "COSTUME" | "USER" | "REVIEW" | "OTHER",
                }))
              }
            >
              <option value="COSTUME">Costume</option>
              <option value="USER">User</option>
              <option value="REVIEW">Review</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label className="block space-y-1.5 text-xs">
            <span className="font-semibold uppercase tracking-widest text-muted-foreground">
              Target id
            </span>
            <Input
              value={createForm.target_id}
              onChange={(e) => setCreateForm((f) => ({ ...f, target_id: e.target.value }))}
              placeholder="e.g. 42"
            />
          </label>
          <label className="block space-y-1.5 text-xs">
            <span className="font-semibold uppercase tracking-widest text-muted-foreground">
              Reason
            </span>
            <Input
              value={createForm.reason}
              onChange={(e) => setCreateForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Policy violation"
            />
          </label>
          <label className="block space-y-1.5 text-xs">
            <span className="font-semibold uppercase tracking-widest text-muted-foreground">
              Details
            </span>
            <Input
              value={createForm.details}
              onChange={(e) => setCreateForm((f) => ({ ...f, details: e.target.value }))}
              placeholder="Optional notes"
            />
          </label>
        </div>
      </AdminDetailDrawer>
    </div>
  );
}
