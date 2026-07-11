"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { adminListAuditLogs, type AdminAuditLog } from "@/lib/admin";
import { toast } from "sonner";
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
} from "@radix-ui/react-icons";

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

export default function AdminAuditPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [drawer, setDrawer] = useState<AdminAuditLog | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, action, entityType]);

  const load = useCallback(async () => {
    if (!user || user.role !== "ADMIN") return;
    setLoading(true);
    try {
      const res = await adminListAuditLogs({
        q: debouncedQ || undefined,
        action: action || undefined,
        entityType: entityType || undefined,
        page,
        pageSize,
      });
      setRows(res.data || []);
      setTotal(res.total || 0);
    } catch {
      toast.error("Failed to load audit logs.");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [user, debouncedQ, action, entityType, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns: AdminDataTableColumn<AdminAuditLog>[] = useMemo(
    () => [
      {
        key: "action",
        header: "Action",
        cell: (item) => (
          <div>
            <p className="font-semibold text-foreground">{item.action}</p>
            <p className="text-[11px] text-muted-foreground">
              {item.entity_type} #{item.entity_id}
            </p>
          </div>
        ),
      },
      {
        key: "actor",
        header: "Actor",
        cell: (item) => (
          <span className="text-xs">{item.actor?.name || item.actor?.email || `#${item.actor_id}`}</span>
        ),
      },
      {
        key: "created",
        header: "When",
        cell: (item) => <span className="text-[11px] text-muted-foreground">{fmt(item.created_at)}</span>,
      },
    ],
    []
  );

  return (
    <div className="space-y-8 p-6 md:p-10">
      <AdminPageHeader
        eyebrow="Compliance"
        title="Audit log"
        description="Append-only record of admin mutations. Read-only."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search action, entity, reason…"
            className="pl-9"
          />
        </div>
        <Input
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="Action filter"
          className="w-44"
        />
        <Input
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          placeholder="Entity type"
          className="w-40"
        />
      </div>

      <AdminDataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={loading}
        emptyTitle="No audit entries"
        emptyDescription="Admin actions will appear here as they happen."
        onRowClick={setDrawer}
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

      <AdminDetailDrawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawer?.action || "Audit entry"}
        description={
          drawer ? `${drawer.entity_type} #${drawer.entity_id} · ${fmt(drawer.created_at)}` : undefined
        }
      >
        {drawer && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Actor
                </p>
                <p>{drawer.actor?.name || drawer.actor?.email || `#${drawer.actor_id}`}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Reason
                </p>
                <p>{drawer.reason || "—"}</p>
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Before
              </p>
              <pre className="overflow-auto rounded-xl border border-border bg-muted/40 p-3 text-[11px]">
                {JSON.stringify(drawer.before_json ?? null, null, 2)}
              </pre>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                After
              </p>
              <pre className="overflow-auto rounded-xl border border-border bg-muted/40 p-3 text-[11px]">
                {JSON.stringify(drawer.after_json ?? null, null, 2)}
              </pre>
            </div>
            {drawer.metadata && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Metadata
                </p>
                <pre className="overflow-auto rounded-xl border border-border bg-muted/40 p-3 text-[11px]">
                  {JSON.stringify(drawer.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </AdminDetailDrawer>
    </div>
  );
}
