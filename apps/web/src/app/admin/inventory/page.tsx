"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  adminListInventory,
  adminUpdateCostumeStatus,
  adminBulkUpdateCostumeStatus,
  type AdminInventoryItem,
  type CostumeModerationStatus,
} from "@/lib/admin";
import { getCostumePricingSummary } from "@/lib/pricing";
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
  EyeClosedIcon,
  EyeOpenIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "HIDDEN", label: "Hidden" },
  { value: "FLAGGED", label: "Flagged" },
  { value: "DRAFT", label: "Draft" },
];

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "created_desc", label: "Newest" },
  { value: "created_asc", label: "Oldest" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "stock_desc", label: "Stock high" },
  { value: "stock_asc", label: "Stock low" },
];

function StatusChip({ status }: { status?: string }) {
  const s = status || "ACTIVE";
  return (
    <span
      className={cn(
        "inline-flex rounded-xl border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest",
        s === "ACTIVE"
          ? "border-emerald-400/40 text-emerald-700 dark:text-emerald-400"
          : s === "FLAGGED"
            ? "border-amber-400/40 bg-amber-50 text-amber-700 dark:bg-amber-900/10 dark:text-amber-400"
            : s === "DRAFT"
              ? "border-border bg-muted/50 text-muted-foreground"
              : "border-destructive/30 bg-destructive/5 text-destructive"
      )}
    >
      {s}
    </span>
  );
}

function readStatusFromUrl() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("status") || "";
}

export default function AdminInventoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<AdminInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState(readStatusFromUrl);
  const [sort, setSort] = useState("created_desc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [drawerItem, setDrawerItem] = useState<AdminInventoryItem | null>(null);
  const [reason, setReason] = useState("");
  const [bulkStatus, setBulkStatus] = useState<CostumeModerationStatus>("HIDDEN");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, status, sort]);

  const load = useCallback(async () => {
    if (!user || user.role !== "ADMIN") return;
    setLoading(true);
    try {
      const res = await adminListInventory({
        q: debouncedQ || undefined,
        status: status || undefined,
        sort: sort === "created_desc" ? undefined : sort,
        page,
        pageSize,
      });
      setItems(res.data || []);
      setTotal(res.total || 0);
      setSelected(new Set());
    } catch {
      toast.error("Failed to load global inventory.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [user, debouncedQ, status, sort, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function updateStatus(id: number, next: CostumeModerationStatus, note?: string) {
    setActioning(true);
    try {
      await adminUpdateCostumeStatus(id, next, note || reason || undefined);
      toast.success(`Item marked as ${next.toLowerCase()}`);
      setReason("");
      await load();
      setDrawerItem((curr) => (curr?.id === id ? { ...curr, status: next } : curr));
    } catch (e: any) {
      toast.error(e?.message || "Action failed.");
    } finally {
      setActioning(false);
    }
  }

  async function applyBulk() {
    const ids = [...selected];
    if (ids.length === 0) return;
    setActioning(true);
    try {
      const res = await adminBulkUpdateCostumeStatus(ids, bulkStatus, reason || undefined);
      toast.success(`Updated ${res.updated} listing${res.updated !== 1 ? "s" : ""}`);
      setReason("");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Bulk update failed.");
    } finally {
      setActioning(false);
    }
  }

  const columns: AdminDataTableColumn<AdminInventoryItem>[] = useMemo(
    () => [
      {
        key: "id",
        header: "ID",
        className: "text-xs text-muted-foreground",
        cell: (item) => `#${item.id}`,
      },
      {
        key: "details",
        header: "Costume",
        cell: (item) => (
          <div>
            <p className="max-w-[220px] truncate font-display font-semibold text-foreground">{item.name}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {item.category || "Uncategorized"}
              {item.size ? ` · ${item.size}` : ""}
            </p>
          </div>
        ),
      },
      {
        key: "vendor",
        header: "Vendor",
        cell: (item) => (
          <div>
            <p className="max-w-[160px] truncate text-sm text-foreground">
              {item.vendor?.business_name || item.vendor?.name || "—"}
            </p>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{item.vendor?.email || ""}</p>
          </div>
        ),
      },
      {
        key: "pricing",
        header: "Pricing",
        className: "text-muted-foreground",
        cell: (item) => {
          const pricing = getCostumePricingSummary(item);
          return `PHP ${pricing.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${pricing.label}`;
        },
      },
      {
        key: "stock",
        header: "Stock",
        className: "text-muted-foreground",
        cell: (item) => `${item.stock} ${item.stock === 1 ? "unit" : "units"}`,
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
        title="Inventory"
        description="Search, filter, and moderate costumes across the marketplace."
        actions={
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">{total}</span> listings
            </span>
          </div>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, category, theme…"
            className="h-10 rounded-xl border-border bg-card pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value || "all"}
                type="button"
                onClick={() => setStatus(f.value)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors",
                  status === f.value
                    ? "border border-border bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-9 rounded-xl border border-border bg-card px-3 text-[10px] font-semibold uppercase tracking-widest text-foreground"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Bulk actions · {selected.size} selected
            </p>
            <div className="flex flex-wrap gap-2">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as CostumeModerationStatus)}
                className="h-9 rounded-xl border border-border bg-background px-3 text-xs text-foreground"
              >
                <option value="ACTIVE">Active</option>
                <option value="HIDDEN">Hidden</option>
                <option value="FLAGGED">Flagged</option>
                <option value="DRAFT">Draft</option>
              </select>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (optional)"
                className="h-9 max-w-xs rounded-xl"
              />
            </div>
          </div>
          <button
            type="button"
            disabled={actioning}
            onClick={() => void applyBulk()}
            className="inline-flex h-9 items-center rounded-xl border border-foreground bg-primary px-5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            Apply status
          </button>
        </div>
      )}

      <AdminDataTable
        columns={columns}
        rows={items}
        rowKey={(row) => row.id}
        loading={loading}
        emptyTitle="No items found."
        emptyDescription="Try adjusting search or status filters."
        selectable
        selectedKeys={selected}
        onToggleSelect={(row) => {
          setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(row.id)) next.delete(row.id);
            else next.add(row.id);
            return next;
          });
        }}
        onToggleSelectAll={() => {
          setSelected((prev) => {
            if (items.every((item) => prev.has(item.id))) return new Set();
            return new Set(items.map((item) => item.id));
          });
        }}
        onRowClick={(row) => {
          setDrawerItem(row);
          setReason("");
        }}
        footer={
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex size-8 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                <ChevronLeftIcon className="size-3.5" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex size-8 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                <ChevronRightIcon className="size-3.5" />
              </button>
            </div>
          </div>
        }
      />

      <AdminDetailDrawer
        open={!!drawerItem}
        onClose={() => setDrawerItem(null)}
        title={drawerItem?.name || "Costume"}
        description={
          drawerItem
            ? `#${drawerItem.id} · ${drawerItem.category || "Uncategorized"}`
            : undefined
        }
        footer={
          drawerItem ? (
            <div className="space-y-3">
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for status change (optional)"
                className="h-9 rounded-xl"
              />
              <div className="flex flex-wrap gap-2">
                {drawerItem.status !== "ACTIVE" && (
                  <button
                    type="button"
                    disabled={actioning}
                    onClick={() => void updateStatus(drawerItem.id, "ACTIVE")}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-400/40 px-4 text-[10px] font-semibold uppercase tracking-widest text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-40 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                  >
                    <EyeOpenIcon className="size-3.5" /> Activate
                  </button>
                )}
                {drawerItem.status !== "HIDDEN" && (
                  <button
                    type="button"
                    disabled={actioning}
                    onClick={() => void updateStatus(drawerItem.id, "HIDDEN")}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                  >
                    <EyeClosedIcon className="size-3.5" /> Hide
                  </button>
                )}
                {drawerItem.status !== "FLAGGED" && (
                  <button
                    type="button"
                    disabled={actioning}
                    onClick={() => void updateStatus(drawerItem.id, "FLAGGED")}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-400/40 px-4 text-[10px] font-semibold uppercase tracking-widest text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-40 dark:text-amber-400 dark:hover:bg-amber-900/20"
                  >
                    <ExclamationTriangleIcon className="size-3.5" /> Flag
                  </button>
                )}
              </div>
            </div>
          ) : null
        }
      >
        {drawerItem ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Status</p>
                <div className="mt-2">
                  <StatusChip status={drawerItem.status} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Stock</p>
                <p className="mt-2 font-display text-xl font-semibold text-foreground">{drawerItem.stock}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Pricing</p>
              <p className="mt-2 text-sm text-foreground">
                {(() => {
                  const pricing = getCostumePricingSummary(drawerItem);
                  return `PHP ${pricing.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${pricing.label}`;
                })()}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Vendor</p>
              <p className="mt-2 font-display text-lg font-semibold text-foreground">
                {drawerItem.vendor?.business_name || drawerItem.vendor?.name || "Unassigned"}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{drawerItem.vendor?.email || "—"}</p>
              {drawerItem.vendor?.vendor_status ? (
                <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Vendor status: {drawerItem.vendor.vendor_status}
                </p>
              ) : null}
            </div>

            {(drawerItem.size || drawerItem.gender || drawerItem.theme) && (
              <div className="grid grid-cols-3 gap-3">
                {drawerItem.size ? (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Size</p>
                    <p className="mt-1 text-sm text-foreground">{drawerItem.size}</p>
                  </div>
                ) : null}
                {drawerItem.gender ? (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Gender</p>
                    <p className="mt-1 text-sm text-foreground">{drawerItem.gender}</p>
                  </div>
                ) : null}
                {drawerItem.theme ? (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Theme</p>
                    <p className="mt-1 text-sm text-foreground">{drawerItem.theme}</p>
                  </div>
                ) : null}
              </div>
            )}

            {drawerItem.description ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Description
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {drawerItem.description}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </AdminDetailDrawer>
    </div>
  );
}
