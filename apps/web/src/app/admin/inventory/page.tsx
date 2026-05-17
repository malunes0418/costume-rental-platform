"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ExclamationTriangleIcon,
  EyeClosedIcon,
  EyeOpenIcon,
  PersonIcon,
} from "@radix-ui/react-icons";

import {
  AdminEmptyState,
  AdminResponsiveFilterRail,
  AdminSectionCard,
  AdminStatusBadge,
} from "@/components/admin/AdminPrimitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adminListInventory,
  adminUpdateCostumeStatus,
  type AdminInventoryItem,
} from "@/lib/admin";

function inventoryStatusTone(status?: string) {
  const normalized = status?.toUpperCase();
  if (normalized === "ACTIVE") return "success" as const;
  if (normalized === "FLAGGED") return "warning" as const;
  if (normalized === "HIDDEN") return "danger" as const;
  return "neutral" as const;
}

function inventoryStatusPriority(status?: string) {
  const normalized = status?.toUpperCase() || "ACTIVE";
  if (normalized === "FLAGGED") return 0;
  if (normalized === "HIDDEN") return 1;
  if (normalized === "ACTIVE") return 2;
  return 3;
}

const FILTERS = ["ALL", "ACTIVE", "FLAGGED", "HIDDEN"] as const;

export default function AdminInventoryPage() {
  const [items, setItems] = useState<AdminInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<number | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");

  useEffect(() => {
    adminListInventory()
      .then((inventory) => setItems(inventory))
      .catch(() => toast.error("Failed to load global inventory."))
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = useMemo(() => {
    const scopedItems =
      filter === "ALL"
        ? items
        : items.filter((item) => (item.status || "ACTIVE").toUpperCase() === filter);

    return [...scopedItems].sort((left, right) => {
      const statusDelta =
        inventoryStatusPriority(left.status) - inventoryStatusPriority(right.status);
      if (statusDelta !== 0) return statusDelta;
      return right.id - left.id;
    });
  }, [filter, items]);

  const metrics = useMemo(() => {
    return {
      total: items.length,
      active: items.filter((item) => (item.status || "ACTIVE").toUpperCase() === "ACTIVE").length,
      flagged: items.filter((item) => (item.status || "").toUpperCase() === "FLAGGED").length,
      hidden: items.filter((item) => (item.status || "").toUpperCase() === "HIDDEN").length,
    };
  }, [items]);

  async function updateStatus(id: number, status: "ACTIVE" | "HIDDEN" | "FLAGGED") {
    setActioning(id);
    try {
      await adminUpdateCostumeStatus(id, status);
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, status } : item))
      );
      toast.success(`Listing marked as ${status.toLowerCase()}.`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Moderation action failed.");
    } finally {
      setActioning(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-56 rounded-[var(--radius-xl)]" />
        <Skeleton className="h-[560px] rounded-[var(--radius-xl)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminSectionCard
        eyebrow="Moderation priorities"
        title="Keep inventory readable and storefront-safe"
        description="Review flagged listings first, confirm which listings should stay hidden, and keep the live catalog clean."
        actions={
          <div className="rounded-full border border-border bg-background px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground">
            {metrics.total} listing{metrics.total === 1 ? "" : "s"}
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Needs review
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {metrics.flagged}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Listings already flagged for moderation attention.
            </p>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Live catalog
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {metrics.active}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Listings currently visible to renters on the storefront.
            </p>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Hidden inventory
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {metrics.hidden}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Listings intentionally removed from shopper visibility.
            </p>
          </div>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        eyebrow="Inventory moderation"
        title="Review listings without extra noise"
        description="Filter the catalog by moderation state, then take the next action directly from each listing row."
        actions={
          <AdminResponsiveFilterRail
            label="Status"
            value={filter}
            options={FILTERS.map((status) => ({
              value: status,
              label: status === "ALL" ? "All" : status,
            }))}
            onChange={(value) => setFilter(value as (typeof FILTERS)[number])}
          />
        }
      >
        {filteredItems.length === 0 ? (
          <AdminEmptyState
            title="No listings match this filter."
            description="Change the status filter to see another slice of platform inventory."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-border text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Listing</th>
                  <th className="pb-3 font-medium">Vendor</th>
                  <th className="pb-3 font-medium">Signals</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((item) => {
                  const vendorName =
                    item.owner?.VendorProfile?.business_name || item.owner?.name || "Unknown vendor";
                  const status = item.status || "ACTIVE";
                  const listingDetails =
                    [item.category, item.theme, item.size].filter(Boolean).join(" / ") || "--";

                  return (
                    <tr key={item.id}>
                      <td className="py-4">
                        <p className="font-semibold text-foreground">{item.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">#{item.id}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{listingDetails}</p>
                      </td>
                      <td className="py-4">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                            <PersonIcon className="size-3.5" />
                          </span>
                          <p className="text-muted-foreground">{vendorName}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="space-y-1">
                          <p className="text-foreground">
                            PHP {Number(item.base_price_per_day).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Stock: {item.stock}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="space-y-2">
                          <AdminStatusBadge label={status} tone={inventoryStatusTone(status)} />
                          {status.toUpperCase() === "FLAGGED" ? (
                            <p className="text-xs text-muted-foreground">
                              Review for visibility or policy issues.
                            </p>
                          ) : status.toUpperCase() === "HIDDEN" ? (
                            <p className="text-xs text-muted-foreground">
                              Hidden from storefront browsing.
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Currently visible to shoppers.
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-end gap-2">
                          {status.toUpperCase() !== "HIDDEN" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={actioning === item.id}
                              onClick={() => void updateStatus(item.id, "HIDDEN")}
                            >
                              <EyeClosedIcon className="size-4" />
                              Hide
                            </Button>
                          ) : null}
                          {status.toUpperCase() !== "ACTIVE" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={actioning === item.id}
                              onClick={() => void updateStatus(item.id, "ACTIVE")}
                            >
                              <EyeOpenIcon className="size-4" />
                              Restore
                            </Button>
                          ) : null}
                          {status.toUpperCase() !== "FLAGGED" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              disabled={actioning === item.id}
                              onClick={() => void updateStatus(item.id, "FLAGGED")}
                            >
                              <ExclamationTriangleIcon className="size-4" />
                              Flag
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminSectionCard>
    </div>
  );
}
