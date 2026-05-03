"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { adminListPendingVendors, adminApproveVendor, adminRejectVendor, type PendingVendor } from "@/lib/admin";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckIcon, Cross2Icon, CardStackIcon } from "@radix-ui/react-icons";

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminVendorsPage() {
  const { token, user } = useAuth();
  const [vendors, setVendors]     = useState<PendingVendor[]>([]);
  const [loading, setLoading]     = useState(true);
  const [actioning, setActioning] = useState<number | null>(null);

  useEffect(() => {
    if (!token || user?.role !== "ADMIN") return;
    adminListPendingVendors(token)
      .then((v) => setVendors(Array.isArray(v) ? v : (v as any)?.data || []))
      .catch(() => toast.error("Failed to load vendors."))
      .finally(() => setLoading(false));
  }, [token, user]);

  async function handle(userId: number, action: "approve" | "reject") {
    if (!token) return;
    setActioning(userId);
    try {
      if (action === "approve") { await adminApproveVendor(userId, token); toast.success("Vendor approved."); }
      else { await adminRejectVendor(userId, token); toast.success("Vendor rejected."); }
      setVendors((vs) => vs.filter((v) => v.user_id !== userId));
    } catch (e: any) {
      toast.error(e?.message || "Action failed.");
    } finally {
      setActioning(null);
    }
  }

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
        <h1 className="mt-2 font-playfair text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Vendor Applications
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review and approve or reject pending vendor applications.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-sm" />)}
        </div>
      ) : vendors.length === 0 ? (
        <div className="flex flex-col items-center gap-4 border border-border rounded-sm py-28 text-center">
          <CheckIcon className="size-10 text-muted-foreground/20" />
          <p className="font-playfair text-3xl font-semibold text-foreground">All clear.</p>
          <p className="text-sm text-muted-foreground">No pending applications.</p>
        </div>
      ) : (
        <div className="rounded-sm border border-border divide-y divide-border">
          {vendors.map((v) => (
            <div key={v.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-playfair text-lg font-semibold text-foreground">
                  {v.store_name || v.business_name || `Vendor Application #${v.id}`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {v.User?.name && <><span className="text-foreground font-semibold">{v.User.name}</span> · </>}
                  {v.User?.email || `User #${v.user_id}`}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Applied {fmt(v.created_at)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={actioning === v.user_id}
                  onClick={() => handle(v.user_id, "approve")}
                  className="flex h-9 items-center gap-1.5 rounded-sm border border-emerald-400/40 px-4 text-[10px] font-semibold uppercase tracking-widest text-emerald-700 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 disabled:opacity-40"
                >
                  <CheckIcon className="size-3" /> Approve
                </button>
                <button
                  type="button"
                  disabled={actioning === v.user_id}
                  onClick={() => handle(v.user_id, "reject")}
                  className="flex h-9 items-center gap-1.5 rounded-sm border border-destructive/30 px-4 text-[10px] font-semibold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
                >
                  <Cross2Icon className="size-3" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
