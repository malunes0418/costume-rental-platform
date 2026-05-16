"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ImageIcon,
  Pencil1Icon as Pencil,
  RocketIcon,
  TrashIcon as Trash,
} from "@radix-ui/react-icons";
import { toast } from "sonner";

import { AddCostumeModal } from "@/components/AddCostumeModal";
import { EditCostumeModal } from "@/components/EditCostumeModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveApiAsset } from "@/lib/assets";
import {
  deleteVendorCostume,
  getVendorProfile,
  listVendorCostumes,
  publishVendorCostume,
  type VendorCostume,
  type VendorProfile,
  unpublishVendorCostume,
} from "@/lib/vendor";
import { cn } from "@/lib/utils";

function resolveImage(costume: VendorCostume): string {
  const images = costume.CostumeImages || [];
  const primary = images.find((image) => image.is_primary) || images[0];
  if (!primary) return "";
  return resolveApiAsset(primary.image_url);
}

function statusPill(status: VendorCostume["status"]) {
  const classes =
    status === "ACTIVE"
      ? "border-emerald-400/40 text-emerald-700 dark:text-emerald-400"
      : status === "DRAFT"
        ? "border-border text-muted-foreground"
        : status === "FLAGGED"
          ? "border-amber-400/40 text-amber-700 dark:text-amber-400"
          : "border-destructive/30 text-destructive";

  return (
    <span
      className={cn(
        "inline-flex rounded-sm border px-2 py-1 text-[9px] font-semibold uppercase tracking-widest",
        classes
      )}
    >
      {status}
    </span>
  );
}

function Section({
  title,
  description,
  items,
  canPublish,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
}: {
  title: string;
  description: string;
  items: VendorCostume[];
  canPublish: boolean;
  onEdit: (costume: VendorCostume) => void;
  onDelete: (costumeId: number) => void;
  onPublish: (costumeId: number) => void;
  onUnpublish: (costumeId: number) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-playfair text-3xl font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {items.length} listing{items.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((costume) => {
          const image = resolveImage(costume);
          return (
            <article key={costume.id} className="overflow-hidden rounded-sm border border-border bg-card">
              <div className="relative aspect-[4/5] border-b border-border bg-muted/40">
                {image ? (
                  <img src={image} alt={costume.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground/30">
                    <ImageIcon className="size-12" />
                  </div>
                )}
              </div>

              <div className="space-y-5 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-playfair text-2xl font-semibold text-foreground">{costume.name}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {[costume.category, costume.size].filter(Boolean).join(" / ") || "Curated piece"}
                    </p>
                  </div>
                  {statusPill(costume.status)}
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Daily rate
                    </p>
                    <p className="mt-2 font-playfair text-2xl font-semibold text-foreground">
                      PHP {Number(costume.base_price_per_day).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Stock</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{costume.stock}</p>
                  </div>
                </div>

                {costume.status === "FLAGGED" || costume.status === "HIDDEN" ? (
                  <div className="rounded-sm border border-border bg-muted/30 px-4 py-4 text-sm leading-7 text-muted-foreground">
                    This listing is under moderation. You can still refine the content, but only the admin team can restore it to a publishable state.
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(costume)}
                    className="inline-flex h-9 items-center gap-2 rounded-sm border border-border px-4 text-[10px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </button>

                  {costume.status === "DRAFT" && canPublish ? (
                    <button
                      type="button"
                      onClick={() => onPublish(costume.id)}
                      className="inline-flex h-9 items-center gap-2 rounded-sm bg-foreground px-4 text-[10px] font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
                    >
                      Publish
                    </button>
                  ) : null}

                  {costume.status === "ACTIVE" && canPublish ? (
                    <button
                      type="button"
                      onClick={() => onUnpublish(costume.id)}
                      className="inline-flex h-9 items-center gap-2 rounded-sm border border-border px-4 text-[10px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
                    >
                      Return to draft
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onDelete(costume.id)}
                    className="inline-flex h-9 items-center gap-2 rounded-sm border border-destructive/30 px-4 text-[10px] font-semibold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Trash className="size-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function VendorInventoryPage() {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [costumes, setCostumes] = useState<VendorCostume[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCostume, setSelectedCostume] = useState<VendorCostume | null>(null);
  const [costumePendingDelete, setCostumePendingDelete] = useState<VendorCostume | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    const [vendorProfile, costumeList] = await Promise.all([getVendorProfile(), listVendorCostumes()]);
    setProfile(vendorProfile);
    setCostumes(costumeList);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        await refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load inventory.");
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [refresh]);

  const grouped = useMemo(() => {
    return {
      drafts: costumes.filter((costume) => costume.status === "DRAFT"),
      active: costumes.filter((costume) => costume.status === "ACTIVE"),
      moderated: costumes.filter((costume) => costume.status === "HIDDEN" || costume.status === "FLAGGED"),
    };
  }, [costumes]);

  function handleDeleteRequest(costumeId: number) {
    const costume = costumes.find((item) => item.id === costumeId) ?? null;
    setCostumePendingDelete(costume);
  }

  async function handleConfirmDelete() {
    if (!costumePendingDelete) return;

    setDeleteSubmitting(true);
    try {
      const result = await deleteVendorCostume(costumePendingDelete.id);
      toast.success(result.message);
      setCostumePendingDelete(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete listing.");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  async function handlePublish(costumeId: number) {
    try {
      await publishVendorCostume(costumeId);
      toast.success("Listing published.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to publish listing.");
    }
  }

  async function handleUnpublish(costumeId: number) {
    try {
      await unpublishVendorCostume(costumeId);
      toast.success("Listing returned to draft.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update listing.");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32 rounded-sm" />
          <Skeleton className="h-14 w-80 rounded-sm" />
          <Skeleton className="h-40 w-full rounded-sm" />
        </div>
      </div>
    );
  }

  if (!profile?.canManageDrafts) {
    return (
      <div className="mx-auto max-w-[960px] px-6 py-16">
        <div className="space-y-6 border-b border-border pb-12 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Inventory access</p>
          <h1 className="font-playfair text-5xl font-semibold text-foreground">Your atelier is not open yet.</h1>
          <p className="mx-auto max-w-2xl text-base leading-8 text-muted-foreground">
            Submit a vendor application first. Once your boutique is in review, this inventory workspace will open for draft creation.
          </p>
          <div>
            <Link
              href="/vendor/apply"
              className="inline-flex h-11 items-center justify-center rounded-sm bg-foreground px-6 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
            >
              Apply now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-12">
      <section className="border-b border-border pb-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Inventory atelier
              </p>
              <h1 className="mt-4 max-w-3xl font-playfair text-5xl font-semibold leading-tight text-foreground md:text-6xl">
                Build the collection before you unveil it.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
                Drafts stay private, live listings become rentable, and moderated pieces remain out of circulation until they are resolved.
              </p>
            </div>
          </div>
          <AddCostumeModal onSuccess={refresh} disabled={!profile.canManageDrafts} />
        </div>

        {!profile.canPublish ? (
          <div className="mt-8 max-w-3xl rounded-sm border border-amber-400/40 bg-muted/30 px-5 py-5">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              <RocketIcon className="size-3.5" />
              Draft mode
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Your boutique is still under review. You can shape and refine drafts now, but only approved houses can publish listings and receive reservations.
            </p>
          </div>
        ) : null}
      </section>

      <div className="mt-10 space-y-12">
        {grouped.drafts.length === 0 && grouped.active.length === 0 && grouped.moderated.length === 0 ? (
          <div className="rounded-sm border border-border bg-card px-8 py-16 text-center">
            <p className="font-playfair text-4xl font-semibold text-foreground">No listings yet.</p>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
              Start with a private draft. Add your strongest photography, shape the story, then publish when everything feels gallery-ready.
            </p>
          </div>
        ) : null}

        <Section
          title="Private drafts"
          description="Invisible to shoppers until you choose to publish them."
          items={grouped.drafts}
          canPublish={profile.canPublish}
          onEdit={setSelectedCostume}
          onDelete={handleDeleteRequest}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
        />

        <Section
          title="Live listings"
          description="Public pieces that can move through the reservation flow."
          items={grouped.active}
          canPublish={profile.canPublish}
          onEdit={setSelectedCostume}
          onDelete={handleDeleteRequest}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
        />

        <Section
          title="Moderated listings"
          description="Held back from shoppers until the admin team clears them."
          items={grouped.moderated}
          canPublish={profile.canPublish}
          onEdit={setSelectedCostume}
          onDelete={handleDeleteRequest}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
        />
      </div>

      <EditCostumeModal costume={selectedCostume} onClose={() => setSelectedCostume(null)} onSuccess={refresh} />

      <Dialog
        open={!!costumePendingDelete}
        onOpenChange={(open: boolean) => {
          if (!open && !deleteSubmitting) {
            setCostumePendingDelete(null);
          }
        }}
      >
        <DialogContent className="overflow-hidden border-border bg-background p-0 sm:max-w-2xl">
          {costumePendingDelete ? (
            <>
              <div className="grid gap-0 sm:grid-cols-[minmax(0,232px)_minmax(0,1fr)]">
                <div className="relative border-b border-border bg-muted/40 sm:border-b-0 sm:border-r">
                  {resolveImage(costumePendingDelete) ? (
                    <img
                      src={resolveImage(costumePendingDelete)}
                      alt={costumePendingDelete.name}
                      className="h-48 w-full object-cover sm:h-full sm:min-h-[320px]"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center text-muted-foreground/30 sm:h-full sm:min-h-[320px]">
                      <ImageIcon className="size-12" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col">
                  <DialogHeader className="space-y-5 px-6 pb-0 pt-6 sm:px-8 sm:pt-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                        Inventory atelier
                      </p>
                      {statusPill(costumePendingDelete.status)}
                    </div>

                    <div className="space-y-3">
                      <DialogTitle className="font-playfair text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                        Release this piece from the collection?
                      </DialogTitle>
                      <DialogDescription className="max-w-[52ch] text-sm leading-7 text-muted-foreground">
                        We will permanently remove this listing only if it has never been part of a reservation. If it
                        has booking history, we will archive it quietly so past records stay intact.
                      </DialogDescription>
                    </div>
                  </DialogHeader>

                  <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
                    <div className="rounded-sm border border-border bg-muted/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 space-y-2">
                          <p className="truncate font-playfair text-2xl font-semibold text-foreground">
                            {costumePendingDelete.name}
                          </p>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            {[costumePendingDelete.category, costumePendingDelete.size].filter(Boolean).join(" / ") ||
                              "Curated piece"}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Daily rate
                          </p>
                          <p className="mt-2 font-playfair text-2xl font-semibold text-foreground">
                            PHP {Number(costumePendingDelete.base_price_per_day).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-sm border border-border bg-background px-4 py-4">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          If untouched
                        </p>
                        <p className="mt-2 text-sm leading-7 text-foreground">
                          The listing is removed completely from inventory.
                        </p>
                      </div>
                      <div className="rounded-sm border border-border bg-background px-4 py-4">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          If previously reserved
                        </p>
                        <p className="mt-2 text-sm leading-7 text-foreground">
                          The listing is archived and hidden, while reservation history remains visible.
                        </p>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="border-t border-border bg-muted/10 px-6 py-5 sm:px-8">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCostumePendingDelete(null)}
                      disabled={deleteSubmitting}
                      className="h-10 rounded-sm px-5 text-[10px] font-semibold uppercase tracking-widest"
                    >
                      Keep listing
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => void handleConfirmDelete()}
                      disabled={deleteSubmitting}
                      className="h-10 rounded-sm px-5 text-[10px] font-semibold uppercase tracking-widest"
                    >
                      {deleteSubmitting ? "Processing..." : "Delete or archive"}
                    </Button>
                  </DialogFooter>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
