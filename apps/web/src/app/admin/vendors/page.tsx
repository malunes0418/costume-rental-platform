"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { adminListPendingVendors, adminListAllVendors, adminApproveVendor, adminRejectVendor, type PendingVendor } from "@/lib/admin";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminVendorsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"PENDING" | "ALL">("PENDING");
  
  const [pendingVendors, setPendingVendors]     = useState<PendingVendor[]>([]);
  const [allVendors, setAllVendors]             = useState<PendingVendor[]>([]);
  
  const [loading, setLoading]     = useState(true);
  const [actioning, setActioning] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    
    setLoading(true);
    
    if (activeTab === "PENDING") {
      adminListPendingVendors()
        .then((v) => setPendingVendors(Array.isArray(v) ? v : (v as any)?.data || []))
        .catch(() => toast.error("Failed to load pending vendors."))
        .finally(() => setLoading(false));
    } else {
      adminListAllVendors()
        .then((v) => setAllVendors(Array.isArray(v) ? v : (v as any)?.data || []))
        .catch(() => toast.error("Failed to load active vendors."))
        .finally(() => setLoading(false));
    }
  }, [user, activeTab]);

  async function handle(userId: number, action: "approve" | "reject") {
    if (!user) return;
    setActioning(userId);
    try {
      if (action === "approve") { await adminApproveVendor(userId); toast.success("Vendor approved."); }
      else { await adminRejectVendor(userId); toast.success("Vendor rejected."); }
      setPendingVendors((vs) => vs.filter((v) => v.user_id !== userId));
    } catch (e: any) {
      toast.error(e?.message || "Action failed.");
    } finally {
      setActioning(null);
    }
  }

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
          <h1 className="mt-2 font-playfair text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Vendors
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage vendor applications and oversee active stores.
          </p>
        </div>
        
        <div className="flex gap-2 p-1 border border-border bg-muted/30 rounded-sm">
          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className={cn(
              "px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest rounded-sm transition-colors",
              activeTab === "PENDING" ? "bg-background shadow-sm border border-border text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={cn(
              "px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest rounded-sm transition-colors",
              activeTab === "ALL" ? "bg-background shadow-sm border border-border text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            All Vendors
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-sm" />)}
        </div>
      ) : activeTab === "PENDING" ? (
        pendingVendors.length === 0 ? (
          <div className="flex flex-col items-center gap-4 border border-border bg-card rounded-sm py-28 text-center">
            <CheckIcon className="size-10 text-muted-foreground/20" />
            <p className="font-playfair text-3xl font-semibold text-foreground">All clear.</p>
            <p className="text-sm text-muted-foreground">No pending applications.</p>
          </div>
        ) : (
          <div className="rounded-sm border border-border divide-y divide-border bg-card">
            {pendingVendors.map((v) => (
              <div key={v.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-muted/30">
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
        )
      ) : (
        allVendors.length === 0 ? (
          <div className="flex flex-col items-center gap-4 border border-border bg-card rounded-sm py-28 text-center">
            <p className="font-playfair text-3xl font-semibold text-foreground">No vendors yet.</p>
            <p className="text-sm text-muted-foreground">Approve some applications first.</p>
          </div>
        ) : (
          <div className="rounded-sm border border-border divide-y divide-border bg-card">
            {allVendors.map((v) => (
              <div key={v.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-muted/30">
                <div>
                  <p className="font-playfair text-lg font-semibold text-foreground">
                    {v.store_name || v.business_name || `Vendor #${v.id}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {v.User?.name && <><span className="text-foreground font-semibold">{v.User.name}</span> · </>}
                    {v.User?.email || `User #${v.user_id}`}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">Joined {fmt(v.created_at)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn(
                    "inline-flex rounded-sm border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest",
                    v.status === "APPROVED" ? "border-emerald-400/40 text-emerald-700 dark:text-emerald-400" :
                    v.status === "PENDING" ? "border-amber-400/40 text-amber-700 dark:text-amber-400" :
                    "border-destructive/30 text-destructive"
                  )}>
                    {v.status}
                  </span>
                  {/* Action menu for active vendors can be added here in the future */}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
