"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  adminListDisputes,
  adminGetDispute,
  adminCreateDispute,
  adminUpdateDisputeStatus,
  adminAddDisputeMessage,
  type AdminDispute,
  type DisputeStatus,
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

const STATUS_FILTERS = [
  { value: "", label: "Open-ish" },
  { value: "OPEN", label: "Open" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
  { value: "ALL", label: "All" },
];

function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-xl border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest",
        status === "RESOLVED" || status === "CLOSED"
          ? "border-emerald-400/40 text-emerald-700 dark:text-emerald-400"
          : status === "IN_REVIEW"
            ? "border-amber-400/40 bg-amber-50 text-amber-700 dark:bg-amber-900/10 dark:text-amber-400"
            : "border-destructive/30 bg-destructive/5 text-destructive"
      )}
    >
      {status}
    </span>
  );
}

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

export default function AdminDisputesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [drawer, setDrawer] = useState<AdminDispute | null>(null);
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    reservation_id: "",
    subject: "",
    against_user_id: "",
    initial_message: "",
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, status]);

  const load = useCallback(async () => {
    if (!user || user.role !== "ADMIN") return;
    setLoading(true);
    try {
      const res = await adminListDisputes({
        q: debouncedQ || undefined,
        status: status || undefined,
        page,
        pageSize,
      });
      setRows(res.data || []);
      setTotal(res.total || 0);
    } catch {
      toast.error("Failed to load disputes.");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [user, debouncedQ, status, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function openDrawer(row: AdminDispute) {
    try {
      const full = await adminGetDispute(row.id);
      setDrawer(full);
      setMessage("");
      setNote(full.resolution_note || "");
    } catch (e: any) {
      toast.error(e?.message || "Failed to load dispute.");
    }
  }

  async function setDisputeStatus(next: DisputeStatus) {
    if (!drawer) return;
    setActioning(true);
    try {
      const updated = await adminUpdateDisputeStatus(drawer.id, next, note || undefined);
      setDrawer(updated);
      toast.success(`Dispute marked ${next.toLowerCase()}`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Update failed.");
    } finally {
      setActioning(false);
    }
  }

  async function sendMessage() {
    if (!drawer || !message.trim()) return;
    setActioning(true);
    try {
      const updated = await adminAddDisputeMessage(drawer.id, message.trim());
      setDrawer(updated);
      setMessage("");
      toast.success("Message added");
    } catch (e: any) {
      toast.error(e?.message || "Failed to add message.");
    } finally {
      setActioning(false);
    }
  }

  async function createDispute() {
    const reservationId = Number(createForm.reservation_id);
    if (!reservationId || !createForm.subject.trim()) {
      toast.error("Reservation id and subject are required.");
      return;
    }
    setActioning(true);
    try {
      const created = await adminCreateDispute({
        reservation_id: reservationId,
        subject: createForm.subject.trim(),
        against_user_id: createForm.against_user_id
          ? Number(createForm.against_user_id)
          : null,
        initial_message: createForm.initial_message.trim() || undefined,
      });
      toast.success("Dispute opened");
      setShowCreate(false);
      setCreateForm({ reservation_id: "", subject: "", against_user_id: "", initial_message: "" });
      await load();
      setDrawer(created);
    } catch (e: any) {
      toast.error(e?.message || "Create failed.");
    } finally {
      setActioning(false);
    }
  }

  const columns: AdminDataTableColumn<AdminDispute>[] = useMemo(
    () => [
      {
        key: "subject",
        header: "Dispute",
        cell: (item) => (
          <div>
            <p className="font-semibold text-foreground">{item.subject}</p>
            <p className="text-[11px] text-muted-foreground">
              Reservation #{item.reservation_id}
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
        key: "against",
        header: "Against",
        cell: (item) => (
          <span className="text-xs text-muted-foreground">
            {item.againstUser?.name || item.againstUser?.email || "—"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-8 p-6 md:p-10">
      <AdminPageHeader
        eyebrow="Support"
        title="Disputes"
        description="Admin-managed dispute queue and timeline."
        actions={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground"
          >
            <PlusIcon className="size-3" /> Open dispute
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value || "openish"}
              type="button"
              onClick={() => setStatus(f.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest",
                status === f.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-[220px] flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search disputes…"
            className="pl-9"
          />
        </div>
      </div>

      <AdminDataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={loading}
        emptyTitle="No disputes"
        emptyDescription="Opened disputes will appear in this queue."
        onRowClick={(row) => void openDrawer(row)}
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
        title={drawer?.subject || "Dispute"}
        description={drawer ? `Reservation #${drawer.reservation_id}` : undefined}
        widthClassName="max-w-xl"
        footer={
          <div className="space-y-3">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Resolution note"
            />
            <div className="flex flex-wrap gap-2">
              {(["IN_REVIEW", "RESOLVED", "CLOSED", "OPEN"] as DisputeStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={actioning || drawer?.status === s}
                  onClick={() => void setDisputeStatus(s)}
                  className="rounded-xl border border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-widest disabled:opacity-40"
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add timeline message…"
              />
              <button
                type="button"
                disabled={actioning || !message.trim()}
                onClick={() => void sendMessage()}
                className="shrink-0 rounded-xl bg-primary px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        }
      >
        {drawer && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusChip status={drawer.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Opened by
                </p>
                <p>{drawer.opener?.name || drawer.opener?.email || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Against
                </p>
                <p>{drawer.againstUser?.name || drawer.againstUser?.email || "—"}</p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Timeline
              </p>
              <div className="space-y-3">
                {(drawer.messages || []).length === 0 && (
                  <p className="text-muted-foreground">No messages yet.</p>
                )}
                {(drawer.messages || []).map((m) => (
                  <div key={m.id} className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold">
                        {m.author?.name || m.author?.email || `User #${m.author_id}`}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{fmt(m.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{m.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </AdminDetailDrawer>

      <AdminDetailDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Open dispute"
        description="Create an admin-managed dispute for a reservation."
        footer={
          <button
            type="button"
            disabled={actioning}
            onClick={() => void createDispute()}
            className="w-full rounded-xl bg-primary px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            Create dispute
          </button>
        }
      >
        <div className="space-y-3">
          <Input
            value={createForm.reservation_id}
            onChange={(e) => setCreateForm((f) => ({ ...f, reservation_id: e.target.value }))}
            placeholder="Reservation id"
          />
          <Input
            value={createForm.subject}
            onChange={(e) => setCreateForm((f) => ({ ...f, subject: e.target.value }))}
            placeholder="Subject"
          />
          <Input
            value={createForm.against_user_id}
            onChange={(e) => setCreateForm((f) => ({ ...f, against_user_id: e.target.value }))}
            placeholder="Against user id (optional)"
          />
          <Input
            value={createForm.initial_message}
            onChange={(e) => setCreateForm((f) => ({ ...f, initial_message: e.target.value }))}
            placeholder="Initial message (optional)"
          />
        </div>
      </AdminDetailDrawer>
    </div>
  );
}
