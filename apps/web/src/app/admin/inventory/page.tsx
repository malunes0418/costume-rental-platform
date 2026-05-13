"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { adminListInventory, adminUpdateCostumeStatus, type AdminInventoryItem } from "@/lib/admin";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { EyeClosedIcon, EyeOpenIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

export default function AdminInventoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<AdminInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    adminListInventory()
      .then((res) => {
        setItems(Array.isArray(res) ? res : (res as any)?.data || []);
      })
      .catch(() => toast.error("Failed to load global inventory."))
      .finally(() => setLoading(false));
  }, [user]);

  async function updateStatus(id: number, status: "ACTIVE" | "HIDDEN" | "FLAGGED") {
    if (!user) return;
    setActioning(id);
    try {
      await adminUpdateCostumeStatus(id, status);
      setItems((curr) => curr.map(item => item.id === id ? { ...item, status } : item));
      toast.success(`Item marked as ${status.toLowerCase()}`);
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
          Global Inventory
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Monitor and moderate all costumes listed across the platform.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-sm" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 border border-border bg-card rounded-sm py-28 text-center">
          <p className="font-playfair text-3xl font-semibold text-foreground">No items found.</p>
          <p className="text-sm text-muted-foreground">The platform currently has no listed costumes.</p>
        </div>
      ) : (
        <div className="rounded-sm border border-border bg-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">Costume Details</th>
                <th className="p-4 font-medium">Pricing</th>
                <th className="p-4 font-medium">Stock</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-muted/30">
                  <td className="p-4 text-xs text-muted-foreground">#{item.id}</td>
                  <td className="p-4">
                    <p className="font-playfair font-semibold text-foreground truncate max-w-[200px]">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{item.category || "Uncategorized"}</p>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    ₱{Number(item.base_price_per_day).toLocaleString(undefined, { minimumFractionDigits: 2 })} / day
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {item.stock} {item.stock === 1 ? "unit" : "units"}
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "inline-flex rounded-sm border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest",
                      item.status === "ACTIVE" ? "border-emerald-400/40 text-emerald-700 dark:text-emerald-400" :
                      item.status === "FLAGGED" ? "border-amber-400/40 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10" :
                      "border-destructive/30 text-destructive bg-destructive/5"
                    )}>
                      {item.status || "ACTIVE"}
                    </span>
                  </td>
                  <td className="p-4 flex items-center justify-end gap-2">
                    {item.status !== "HIDDEN" && (
                      <button
                        type="button"
                        disabled={actioning === item.id}
                        onClick={() => updateStatus(item.id, "HIDDEN")}
                        className="flex h-8 items-center gap-1.5 rounded-sm border border-border px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                        title="Hide Listing"
                      >
                        <EyeClosedIcon className="size-3.5" />
                      </button>
                    )}
                    {item.status !== "ACTIVE" && (
                      <button
                        type="button"
                        disabled={actioning === item.id}
                        onClick={() => updateStatus(item.id, "ACTIVE")}
                        className="flex h-8 items-center gap-1.5 rounded-sm border border-emerald-400/40 px-3 text-[10px] font-semibold uppercase tracking-widest text-emerald-700 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 disabled:opacity-40"
                        title="Restore Listing"
                      >
                        <EyeOpenIcon className="size-3.5" />
                      </button>
                    )}
                    {item.status !== "FLAGGED" && (
                      <button
                        type="button"
                        disabled={actioning === item.id}
                        onClick={() => updateStatus(item.id, "FLAGGED")}
                        className="flex h-8 items-center gap-1.5 rounded-sm border border-amber-400/40 px-3 text-[10px] font-semibold uppercase tracking-widest text-amber-700 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 disabled:opacity-40"
                        title="Flag Listing"
                      >
                        <ExclamationTriangleIcon className="size-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
