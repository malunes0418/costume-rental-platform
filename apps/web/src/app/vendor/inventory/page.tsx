"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { listVendorCostumes, deleteVendorCostume } from "@/lib/vendor";
import Link from "next/link";
import { AddCostumeModal } from "@/components/AddCostumeModal";
import { EditCostumeModal } from "@/components/EditCostumeModal";
import { toast } from "sonner";
import { resolveApiAsset } from "@/lib/assets";
import {
  TrashIcon as Trash,
  Pencil1Icon as Pencil,
  ImageIcon,
} from "@radix-ui/react-icons";
import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ── helpers ───────────────────────────────────────────────────────────────────

function resolveImage(costume: any): string {
  const imgs = costume?.CostumeImages || [];
  const primary = imgs.find((i: any) => i.is_primary) || imgs[0];
  if (!primary) return "";
  return resolveApiAsset(primary.image_url);
}

// ── component ─────────────────────────────────────────────────────────────────

export default function VendorInventoryPage() {
  const { user } = useAuth();

  const [costumes, setCostumes]                 = useState<any[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [requiresSubscription, setRequiresSubscription] = useState(false);
  const [selectedCostume, setSelectedCostume]   = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget]         = useState<number | null>(null);
  const [isDeleting, setIsDeleting]             = useState(false);

  async function refreshCostumes() {
    if (!user) return;
    try {
      const res = await listVendorCostumes() as any;
      setCostumes(Array.isArray(res) ? res : (res.data || []));
    } catch { /* silent */ }
  }

  async function confirmDelete() {
    if (!deleteTarget || !user) return;
    setIsDeleting(true);
    try {
      await deleteVendorCostume(deleteTarget);
      toast.success("Listing removed.");
      await refreshCostumes();
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete listing.");
    } finally {
      setIsDeleting(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    async function fetchData() {
      try {
        const costumesRes = await listVendorCostumes() as any;
        setCostumes(Array.isArray(costumesRes) ? costumesRes : (costumesRes.data || []));
      } catch (err: any) {
        if (err?.body?.code === "SUBSCRIPTION_REQUIRED" || err?.status === 402 || err?.status === 403) {
          setRequiresSubscription(true);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  // ── loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 pb-32 pt-10">
        <div className="mb-10 space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4">
              <Skeleton className="aspect-[3/4] w-full rounded-sm" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-32 pt-10">

      {/* Header */}
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground animate-fade-up">
            Inventory
          </p>
          <h1 className="font-playfair text-4xl font-semibold tracking-tight text-foreground animate-fade-up-delay-1 md:text-5xl">
            Costume Listings
          </h1>
        </div>

        <div className="shrink-0 animate-fade-up-delay-1">
          <AddCostumeModal onSuccess={refreshCostumes} disabled={requiresSubscription} />
        </div>
      </div>

      {/* Subscription gate */}
      {requiresSubscription ? (
        <div className="flex flex-col items-center gap-8 border border-border rounded-sm py-24 px-12 text-center bg-card">
          <div className="text-muted-foreground/20">
            <CreditCard className="size-12" />
          </div>
          <div className="space-y-2 max-w-md">
            <p className="font-playfair text-3xl font-semibold text-foreground">
              Subscription required.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You need an active vendor subscription to list costumes, manage inventory, and accept reservations.
            </p>
          </div>
          <Link
            href="/vendor/subscription"
            className="inline-flex h-12 items-center rounded-sm bg-foreground px-8 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
          >
            Manage subscription
          </Link>
        </div>
      ) : costumes.length === 0 ? (
        /* Empty listings */
        <div className="flex flex-col items-center gap-8 border border-border rounded-sm py-24 px-12 text-center bg-card">
          <div className="text-muted-foreground/20">
            <ImageIcon className="size-12" />
          </div>
          <div className="space-y-2">
            <p className="font-playfair text-3xl font-semibold text-foreground">
              No listings yet.
            </p>
            <p className="text-muted-foreground">
              Add your first costume to start renting.
            </p>
          </div>
          <AddCostumeModal onSuccess={refreshCostumes} />
        </div>
      ) : (
        <>
          {/* Section label */}
          <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Your listings · {costumes.length}
            </p>
          </div>

          {/* Costume grid */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {costumes.map((c) => {
              const img = resolveImage(c);
              return (
                <article
                  key={c.id}
                  className="group flex flex-col gap-4"
                >
                  {/* Image — click to edit */}
                  <div
                    className="relative w-full overflow-hidden rounded-sm border border-border bg-muted aspect-[3/4] cursor-pointer"
                    onClick={() => setSelectedCostume(c)}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={c.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
                        <ImageIcon className="size-12" />
                      </div>
                    )}

                    {/* Overlay actions on hover */}
                    <div className="absolute inset-0 flex items-end justify-end gap-2 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        aria-label="Edit costume"
                        onClick={(e) => { e.stopPropagation(); setSelectedCostume(c); }}
                        className="flex size-8 items-center justify-center rounded-sm border border-border bg-background/90 text-foreground backdrop-blur-sm transition-colors hover:bg-muted"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete costume"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(c.id); }}
                        className="flex size-8 items-center justify-center rounded-sm border border-destructive/30 bg-background/90 text-destructive backdrop-blur-sm transition-colors hover:bg-destructive/10"
                      >
                        <Trash className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-playfair text-base font-semibold text-foreground">
                        {c.name}
                      </p>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {[c.category, c.size].filter(Boolean).join(" · ") || "Costume"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-playfair text-base font-semibold text-foreground">
                        ₱{Number(c.base_price_per_day).toLocaleString()}
                      </p>
                      <p className="text-[9px] text-muted-foreground">/ day</p>
                    </div>
                  </div>

                  {/* Stock badge */}
                  <span className={cn(
                    "w-fit rounded-sm border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest",
                    c.stock > 0
                      ? "border-emerald-400/40 text-emerald-700 dark:text-emerald-400"
                      : "border-destructive/30 text-destructive"
                  )}>
                    {c.stock > 0 ? "In stock" : "Out of stock"}
                  </span>
                </article>
              );
            })}
          </div>
        </>
      )}

      {/* Edit modal */}
      <EditCostumeModal
        costume={selectedCostume}
        onClose={() => setSelectedCostume(null)}
        onSuccess={refreshCostumes}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-sm border border-border bg-background shadow-none">
          <DialogHeader>
            <DialogTitle className="font-playfair text-2xl font-semibold text-foreground">
              Remove listing?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              This will permanently delete the costume and all of its images. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="flex h-10 items-center justify-center rounded-sm border border-border px-6 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex h-10 items-center justify-center rounded-sm border border-destructive/40 bg-destructive/10 px-6 text-xs font-semibold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
            >
              {isDeleting ? "Removing…" : "Remove listing"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
