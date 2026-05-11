"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { adminListPayments, adminReviewPayment, type AdminPayment } from "@/lib/admin";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckIcon, Cross2Icon, ImageIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { resolveApiAsset } from "@/lib/assets";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusChip({ status }: { status: string }) {
  const s = status?.toUpperCase();
  const cls =
    s === "APPROVED" ? "border-emerald-400/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
    : s === "PENDING" ? "border-amber-400/30 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
    : s === "REJECTED" ? "border-destructive/20 bg-destructive/5 text-destructive"
    : "border-border bg-muted/50 text-muted-foreground";
  return <span className={`rounded-sm border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest ${cls}`}>{status}</span>;
}

export default function AdminPaymentsPage() {
  const { token, user } = useAuth();
  const [all, setAll]           = useState<AdminPayment[]>([]);
  const [filter, setFilter]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [actioning, setActioning] = useState<number | null>(null);
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!token || user?.role !== "ADMIN") return;
    adminListPayments(token)
      .then((v) => setAll(Array.isArray(v) ? v : (v as any)?.data || []))
      .catch(() => toast.error("Failed to load payments."))
      .finally(() => setLoading(false));
  }, [token, user]);

  async function handle(paymentId: number, status: "APPROVED" | "REJECTED") {
    if (!token) return;
    setActioning(paymentId);
    try {
      await adminReviewPayment(paymentId, status, "", token);
      toast.success(`Payment ${status.toLowerCase()}.`);
      setAll((ps) => ps.map((p) => p.id === paymentId ? { ...p, status } : p));
    } catch (e: any) {
      toast.error(e?.message || "Action failed.");
    } finally {
      setActioning(null);
    }
  }

  const items = filter ? all.filter((p) => p.status?.toUpperCase() === filter) : all;
  const totalApproved = all.filter(p => p.status === "APPROVED").reduce((s, p) => s + Number(p.amount), 0);
  const pendingCount  = all.filter(p => p.status === "PENDING").length;

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
          <h1 className="mt-2 font-playfair text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Payments
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {all.length} total · ₱{Number(totalApproved).toLocaleString()} approved
            {pendingCount > 0 && <span className="ml-2 font-semibold text-amber-700 dark:text-amber-400">· {pendingCount} pending</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["", "PENDING", "APPROVED", "REJECTED"].map((s) => (
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
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-sm" />)}
        </div>
      ) : (
        <div className="rounded-sm border border-border divide-y divide-border bg-card">
          {items.length === 0 && (
            <p className="px-6 py-16 text-center text-sm text-muted-foreground">No payments match this filter.</p>
          )}
          {items.map((p) => (
            <div key={p.id} className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-muted/30">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-playfair text-base font-semibold text-foreground">Payment #{p.id}</p>
                  {p.proof_url && (
                    <button
                      type="button"
                      onClick={() => setViewReceiptUrl(resolveApiAsset(p.proof_url!))}
                      className="inline-flex items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <ImageIcon className="size-3" /> Receipt
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Reservation #{p.reservation_id} · User #{p.user_id} · {fmt(p.created_at)}
                </p>
                {p.notes && <p className="mt-1 text-xs text-muted-foreground italic">{p.notes}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-playfair text-base font-semibold text-foreground">
                  ₱{Number(p.amount).toLocaleString()}
                </span>
                <StatusChip status={p.status} />
                {p.status === "PENDING" && (
                  <>
                    <button
                      type="button"
                      disabled={actioning === p.id}
                      onClick={() => handle(p.id, "APPROVED")}
                      className="flex h-8 items-center gap-1.5 rounded-sm border border-emerald-400/40 px-3 text-[10px] font-semibold uppercase tracking-widest text-emerald-700 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 disabled:opacity-40"
                    >
                      <CheckIcon className="size-3" /> Approve
                    </button>
                    <button
                      type="button"
                      disabled={actioning === p.id}
                      onClick={() => handle(p.id, "REJECTED")}
                      className="flex h-8 items-center gap-1.5 rounded-sm border border-destructive/30 px-3 text-[10px] font-semibold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
                    >
                      <Cross2Icon className="size-3" /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Receipt Modal */}
      <Dialog open={!!viewReceiptUrl} onOpenChange={(open) => !open && setViewReceiptUrl(null)}>
        <DialogContent className="sm:max-w-md rounded-sm border border-border bg-background shadow-none">
          <DialogHeader>
            <DialogTitle className="font-playfair text-2xl font-semibold text-foreground">
              Proof of Payment
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Review the uploaded receipt before taking action.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 overflow-hidden rounded-sm border border-border bg-muted">
            {viewReceiptUrl && (
              <img
                src={viewReceiptUrl}
                alt="Payment Receipt"
                className="w-full h-auto object-contain max-h-[60vh]"
                loading="lazy"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
