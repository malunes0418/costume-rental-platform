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
import { VendorFulfillmentStudio } from "@/components/VendorFulfillmentStudio";
import { ResultsToolbar, type ViewMode } from "@/components/marketplace/ResultsToolbar";
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
import { type VendorFulfillmentSettings } from "@/lib/fulfillment";
import { getCostumePricingSummary } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import {
  deleteVendorCostume,
  getVendorFulfillmentSettings,
  getVendorProfile,
  listVendorCostumes,
  publishVendorCostume,
  type VendorCostume,
  type VendorProfile,
  unpublishVendorCostume,
} from "@/lib/vendor";

type StatusFilter = "all" | "draft" | "active" | "moderated";

function resolveImage(costume: VendorCostume): string {
  const images = costume.CostumeImages || [];
  const primary = images.find((image) => image.is_primary) || images[0];
  if (!primary) return "";
  return resolveApiAsset(primary.image_url);
}

function statusPill(status: VendorCostume["status"]) {
  const classes =
    status === "ACTIVE"
      ? "border-emerald-400/40 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
      : status === "DRAFT"
        ? "border-accent/30 bg-brand-gold-soft text-foreground"
        : status === "FLAGGED"
          ? "border-amber-400/40 bg-amber-50/50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
          : "border-destructive/30 bg-destructive/5 text-destructive";

  return (
    <span
      className={cn(
        "inline-flex rounded-xl border px-2 py-1 text-[9px] font-semibold uppercase tracking-widest",
        classes
      )}
    >
      {status}
    </span>
  );
}

function resolveFulfillmentLine(_costume: VendorCostume, _vendorSettings: VendorFulfillmentSettings | null) {
  return "Delivery outbound · Delivery return";
}

function ListingActions({
  costume,
  canPublish,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
}: {
  costume: VendorCostume;
  canPublish: boolean;
  onEdit: (costume: VendorCostume) => void;
  onDelete: (costumeId: number) => void;
  onPublish: (costumeId: number) => void;
  onUnpublish: (costumeId: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onEdit(costume)}
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-border px-4 text-[10px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
      >
        <Pencil className="size-3.5" />
        Edit
      </button>

      {costume.status === "DRAFT" && canPublish ? (
        <button
          type="button"
          onClick={() => onPublish(costume.id)}
          className="hover-snap inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90"
        >
          Publish
        </button>
      ) : null}

      {costume.status === "ACTIVE" && canPublish ? (
        <button
          type="button"
          onClick={() => onUnpublish(costume.id)}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-border px-4 text-[10px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
        >
          Return to draft
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => onDelete(costume.id)}
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-destructive/30 px-4 text-[10px] font-semibold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/10"
      >
        <Trash className="size-3.5" />
        Delete
      </button>
    </div>
  );
}

function ListingCard({
  costume,
  view,
  canPublish,
  vendorSettings,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
}: {
  costume: VendorCostume;
  view: ViewMode;
  canPublish: boolean;
  vendorSettings: VendorFulfillmentSettings | null;
  onEdit: (costume: VendorCostume) => void;
  onDelete: (costumeId: number) => void;
  onPublish: (costumeId: number) => void;
  onUnpublish: (costumeId: number) => void;
}) {
  const image = resolveImage(costume);
  const pricingSummary = getCostumePricingSummary(costume);
  const meta = [costume.category, costume.size].filter(Boolean).join(" · ") || "Curated piece";
  const moderated = costume.status === "FLAGGED" || costume.status === "HIDDEN";

  if (view === "list") {
    return (
      <article className="inventory-listing-card flex overflow-hidden rounded-xl border border-border bg-card">
        <div className="relative w-28 shrink-0 overflow-hidden bg-muted/40 sm:w-36">
          {image ? (
            <img src={image} alt={costume.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex aspect-[3/4] h-full min-h-[140px] items-center justify-center text-muted-foreground/30">
              <ImageIcon className="size-8" />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {statusPill(costume.status)}
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Stock {costume.stock}
              </p>
            </div>
            <p className="truncate font-display text-2xl font-semibold text-foreground">{costume.name}</p>
            <p className="truncate text-xs text-muted-foreground">{meta}</p>
            <p className="text-xs leading-6 text-muted-foreground">
              {resolveFulfillmentLine(costume, vendorSettings)}
            </p>
            {moderated ? (
              <p className="text-xs leading-6 text-amber-700 dark:text-amber-400">
                Under moderation — refine freely; only admin can restore publishability.
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
            <div className="text-left sm:text-right">
              <p className="font-display text-2xl font-semibold text-primary">
                ₱{pricingSummary.amount.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                {pricingSummary.label}
              </p>
            </div>
            <ListingActions
              costume={costume}
              canPublish={canPublish}
              onEdit={onEdit}
              onDelete={onDelete}
              onPublish={onPublish}
              onUnpublish={onUnpublish}
            />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="inventory-listing-card overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-[3/4] border-b border-border bg-muted/40">
        {image ? (
          <img src={image} alt={costume.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/30">
            <ImageIcon className="size-12" />
          </div>
        )}
        <div className="absolute left-3 top-3">{statusPill(costume.status)}</div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="min-w-0 space-y-1">
          <p className="truncate font-display text-xl font-semibold text-foreground sm:text-2xl">
            {costume.name}
          </p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {meta}
          </p>
          <p className="text-xs leading-6 text-muted-foreground">
            {resolveFulfillmentLine(costume, vendorSettings)}
          </p>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-display text-2xl font-semibold text-primary">
              ₱{pricingSummary.amount.toLocaleString()}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
              {pricingSummary.label}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Stock</p>
            <p className="mt-1 font-display text-lg font-semibold text-foreground">{costume.stock}</p>
          </div>
        </div>

        {moderated ? (
          <div className="rounded-xl border border-amber-400/30 bg-amber-50/40 px-3 py-3 text-xs leading-6 text-muted-foreground dark:bg-amber-950/20">
            Under moderation. You can refine content; only admin can restore publishability.
          </div>
        ) : null}

        <ListingActions
          costume={costume}
          canPublish={canPublish}
          onEdit={onEdit}
          onDelete={onDelete}
          onPublish={onPublish}
          onUnpublish={onUnpublish}
        />
      </div>
    </article>
  );
}

function Section({
  label,
  title,
  description,
  items,
  view,
  canPublish,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
  vendorSettings,
}: {
  label: string;
  title: string;
  description: string;
  items: VendorCostume[];
  view: ViewMode;
  canPublish: boolean;
  onEdit: (costume: VendorCostume) => void;
  onDelete: (costumeId: number) => void;
  onPublish: (costumeId: number) => void;
  onUnpublish: (costumeId: number) => void;
  vendorSettings: VendorFulfillmentSettings | null;
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-2xl font-semibold text-foreground">{title}</p>
          <p className="mt-1 max-w-prose text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {items.length} listing{items.length === 1 ? "" : "s"}
        </p>
      </div>

      <div
        className={cn(
          view === "list"
            ? "flex flex-col gap-3"
            : "grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 sm:gap-5"
        )}
      >
        {items.map((costume) => (
          <ListingCard
            key={costume.id}
            costume={costume}
            view={view}
            canPublish={canPublish}
            vendorSettings={vendorSettings}
            onEdit={onEdit}
            onDelete={onDelete}
            onPublish={onPublish}
            onUnpublish={onUnpublish}
          />
        ))}
      </div>
    </section>
  );
}

export default function VendorInventoryPage() {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [costumes, setCostumes] = useState<VendorCostume[]>([]);
  const [fulfillmentSettings, setFulfillmentSettings] = useState<VendorFulfillmentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCostume, setSelectedCostume] = useState<VendorCostume | null>(null);
  const [costumePendingDelete, setCostumePendingDelete] = useState<VendorCostume | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [fulfillmentOpen, setFulfillmentOpen] = useState(false);

  const refresh = useCallback(async () => {
    const [vendorProfile, costumeList, settings] = await Promise.all([
      getVendorProfile(),
      listVendorCostumes(),
      getVendorFulfillmentSettings(),
    ]);
    setProfile(vendorProfile);
    setCostumes(costumeList);
    setFulfillmentSettings(settings);
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

  useEffect(() => {
    const fulfillmentParam = new URLSearchParams(window.location.search).get("fulfillment");
    if (fulfillmentParam === "1" || fulfillmentParam === "open") {
      setFulfillmentOpen(true);
    }
  }, []);

  const grouped = useMemo(() => {
    return {
      drafts: costumes.filter((costume) => costume.status === "DRAFT"),
      active: costumes.filter((costume) => costume.status === "ACTIVE"),
      moderated: costumes.filter(
        (costume) => costume.status === "HIDDEN" || costume.status === "FLAGGED"
      ),
    };
  }, [costumes]);

  const visibleCount = useMemo(() => {
    if (statusFilter === "draft") return grouped.drafts.length;
    if (statusFilter === "active") return grouped.active.length;
    if (statusFilter === "moderated") return grouped.moderated.length;
    return costumes.length;
  }, [statusFilter, grouped, costumes.length]);

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
      <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-12">
        <div className="mb-8 space-y-3">
          <Skeleton className="h-3 w-28 rounded-full" />
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-full max-w-md rounded-full" />
          <div className="flex flex-wrap gap-3 pt-2">
            <Skeleton className="h-11 w-40 rounded-md" />
            <Skeleton className="h-11 w-44 rounded-xl" />
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 sm:gap-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-xl border border-border bg-card">
              <Skeleton className="aspect-[3/4] w-full rounded-none" />
              <div className="space-y-3 p-4 sm:p-5">
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-3 w-1/2 rounded-full" />
                <div className="flex items-end justify-between pt-2">
                  <Skeleton className="h-7 w-20 rounded-lg" />
                  <Skeleton className="h-6 w-10 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!profile?.canManageDrafts) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-12">
        <div className="max-w-xl space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Inventory
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Inventory opens after you apply
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Submit a vendor application first. Once your boutique is in review, you can build private drafts here.
          </p>
          <Link
            href="/vendor/apply"
            className="hover-snap inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90"
          >
            Start application
          </Link>
        </div>
      </div>
    );
  }

  const needsPayment = profile.blockingReasons.includes("PAYMENT_DETAILS_REQUIRED");
  const storeName = profile.profile?.business_name || "Your atelier";

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-12">
      <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Inventory
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Collection
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            {storeName}: drafts stay private, live pieces are rentable, and moderated looks wait until cleared.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <AddCostumeModal
              onSuccess={refresh}
              disabled={!profile.canManageDrafts}
              vendorSettings={fulfillmentSettings}
            />
            <button
              type="button"
              onClick={() => setFulfillmentOpen(true)}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-6 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
            >
              Fulfillment settings
            </button>
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Collection counts">
          <div className="flex items-baseline gap-2">
            <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Drafts</dt>
            <dd className="font-display text-xl font-semibold tabular-nums text-foreground">
              {grouped.drafts.length}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Live</dt>
            <dd className="font-display text-xl font-semibold tabular-nums text-primary">
              {grouped.active.length}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Moderated</dt>
            <dd className="font-display text-xl font-semibold tabular-nums text-foreground">
              {grouped.moderated.length}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total</dt>
            <dd className="font-display text-xl font-semibold tabular-nums text-foreground">
              {costumes.length}
            </dd>
          </div>
        </dl>
      </header>

      {!profile.canPublish && needsPayment ? (
        <div className="mb-8 max-w-3xl rounded-xl border border-amber-400/40 bg-amber-50/50 px-5 py-4 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
            <RocketIcon className="size-3.5" />
            Payment details required
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Publishing is locked until you add at least one active payment method in settings.
          </p>
          <Link
            href="/vendor/settings"
            className="mt-3 inline-flex h-10 items-center rounded-md bg-primary px-5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90"
          >
            Add payment details
          </Link>
        </div>
      ) : !profile.canPublish ? (
        <div className="mb-8 max-w-3xl rounded-xl border border-border bg-muted/30 px-5 py-4">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <RocketIcon className="size-3.5" />
            Draft mode
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Your boutique is still under review. Shape drafts now — only approved houses can publish and receive reservations.
          </p>
        </div>
      ) : null}

      <div className="mt-8 space-y-8">
        {costumes.length > 0 ? (
          <div className="space-y-3">
            <ResultsToolbar
              count={visibleCount}
              total={costumes.length}
              sort="_newest"
              view={view}
              showSort={false}
              onSortChange={() => {}}
              onViewChange={setView}
            />
            <div className="flex flex-wrap gap-2" role="group" aria-label="Status filter">
              {(
                [
                  { value: "all", label: "All", count: costumes.length },
                  { value: "draft", label: "Drafts", count: grouped.drafts.length },
                  { value: "active", label: "Live", count: grouped.active.length },
                  { value: "moderated", label: "Moderated", count: grouped.moderated.length },
                ] as const
              ).map(({ value, label, count }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors",
                    statusFilter === value
                      ? "border-primary bg-primary text-primary-foreground shadow-coral"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {label}
                  <span
                    className={cn(
                      "tabular-nums",
                      statusFilter === value ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {costumes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-8 py-14 text-center">
            <p className="font-display text-2xl font-semibold text-foreground md:text-3xl">
              No listings yet
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Start with a private draft. Add photography and details, then publish when it feels ready.
            </p>
          </div>
        ) : null}

        {(statusFilter === "all" || statusFilter === "draft") && (
          <Section
            label="Drafts"
            title="Private drafts"
            description="Invisible to shoppers until you publish them."
            items={grouped.drafts}
            view={view}
            canPublish={profile.canPublish}
            onEdit={setSelectedCostume}
            onDelete={handleDeleteRequest}
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
            vendorSettings={fulfillmentSettings}
          />
        )}

        {(statusFilter === "all" || statusFilter === "active") && (
          <Section
            label="Live"
            title="Live listings"
            description="Public pieces that can move through the reservation flow."
            items={grouped.active}
            view={view}
            canPublish={profile.canPublish}
            onEdit={setSelectedCostume}
            onDelete={handleDeleteRequest}
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
            vendorSettings={fulfillmentSettings}
          />
        )}

        {(statusFilter === "all" || statusFilter === "moderated") && (
          <Section
            label="Moderated"
            title="Moderated listings"
            description="Held back from shoppers until the admin team clears them."
            items={grouped.moderated}
            view={view}
            canPublish={profile.canPublish}
            onEdit={setSelectedCostume}
            onDelete={handleDeleteRequest}
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
            vendorSettings={fulfillmentSettings}
          />
        )}
      </div>

      <Dialog open={fulfillmentOpen} onOpenChange={setFulfillmentOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden border-border bg-background p-0 sm:max-w-3xl">
          <DialogHeader className="shrink-0 space-y-3 border-b border-border px-6 py-5 text-left sm:px-8 sm:py-6">
            <DialogTitle className="font-display text-2xl font-semibold text-foreground">
              Fulfillment settings
            </DialogTitle>
            <DialogDescription className="max-w-[58ch] text-sm leading-6 text-muted-foreground">
              Set delivery defaults, service areas, and fees that apply to bookings from this atelier.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
            <VendorFulfillmentStudio
              settings={fulfillmentSettings}
              onSaved={setFulfillmentSettings}
              layout="dialog"
            />
          </div>
        </DialogContent>
      </Dialog>

      <EditCostumeModal
        costume={selectedCostume}
        onClose={() => setSelectedCostume(null)}
        onSuccess={refresh}
        vendorSettings={fulfillmentSettings}
      />

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
              {(() => {
                const pricingSummary = getCostumePricingSummary(costumePendingDelete);
                return (
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
                      <DialogHeader className="space-y-4 px-6 pb-0 pt-6 sm:px-8 sm:pt-8">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Delete listing
                          </p>
                          {statusPill(costumePendingDelete.status)}
                        </div>

                        <div className="space-y-3">
                          <DialogTitle className="font-display text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
                            Remove this piece from inventory?
                          </DialogTitle>
                          <DialogDescription className="max-w-[52ch] text-sm leading-6 text-muted-foreground">
                            We will permanently remove this listing only if it has never been part of a reservation. If it
                            has booking history, we will archive it so past records stay intact.
                          </DialogDescription>
                        </div>
                      </DialogHeader>

                      <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0 space-y-2">
                              <p className="truncate font-display text-2xl font-semibold text-foreground">
                                {costumePendingDelete.name}
                              </p>
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                {[costumePendingDelete.category, costumePendingDelete.size]
                                  .filter(Boolean)
                                  .join(" / ") || "Curated piece"}
                              </p>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="font-display text-2xl font-semibold text-primary">
                                ₱{pricingSummary.amount.toLocaleString()}
                              </p>
                              <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                                {pricingSummary.label}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-border bg-background px-4 py-4">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                              If untouched
                            </p>
                            <p className="mt-2 text-sm leading-6 text-foreground">
                              The listing is removed completely from inventory.
                            </p>
                          </div>
                          <div className="rounded-xl border border-border bg-background px-4 py-4">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                              If previously reserved
                            </p>
                            <p className="mt-2 text-sm leading-6 text-foreground">
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
                          className="h-10 rounded-xl px-5 text-[10px] font-semibold uppercase tracking-widest"
                        >
                          Keep listing
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => void handleConfirmDelete()}
                          disabled={deleteSubmitting}
                          className="h-10 rounded-xl px-5 text-[10px] font-semibold uppercase tracking-widest"
                        >
                          {deleteSubmitting ? "Processing…" : "Delete or archive"}
                        </Button>
                      </DialogFooter>
                    </div>
                  </div>
                );
              })()}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
