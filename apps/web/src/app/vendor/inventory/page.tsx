"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ExclamationTriangleIcon,
  EyeOpenIcon,
  ImageIcon,
  Pencil1Icon,
  RocketIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { toast } from "sonner";

import { AddCostumeModal } from "@/components/AddCostumeModal";
import { EditCostumeModal } from "@/components/EditCostumeModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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

type CostumeGroupKey = "drafts" | "active" | "moderated";

type CostumeGroup = {
  key: CostumeGroupKey;
  title: string;
  description: string;
  items: VendorCostume[];
};

type InventoryLayout = "ledger" | "salon" | "strip";

const INVENTORY_LAYOUT_OPTIONS: Array<{
  key: InventoryLayout;
  label: string;
  description: string;
}> = [
  {
    key: "ledger",
    label: "Ledger",
    description: "Balanced and dense. Best when the catalog starts getting long.",
  },
  {
    key: "salon",
    label: "Salon",
    description: "Still premium and image-led, but no longer oversized.",
  },
  {
    key: "strip",
    label: "Strip",
    description: "Fastest to scan. Best when vendors are managing inventory in volume.",
  },
];

function resolveImage(costume: VendorCostume): string {
  const images = costume.CostumeImages || [];
  const primary = images.find((image) => image.is_primary) || images[0];
  if (!primary) return "";
  return resolveApiAsset(primary.image_url);
}

function formatCurrency(value: number | string | null | undefined): string {
  return `PHP ${Number(value || 0).toLocaleString()}`;
}

function listingStatusMeta(status: VendorCostume["status"]) {
  if (status === "ACTIVE") {
    return {
      label: "Live",
      className: "border-emerald-400/40 text-emerald-700 dark:text-emerald-400",
    };
  }
  if (status === "DRAFT") {
    return {
      label: "Draft",
      className: "border-border text-muted-foreground",
    };
  }
  if (status === "FLAGGED") {
    return {
      label: "Flagged",
      className: "border-amber-400/40 text-amber-700 dark:text-amber-400",
    };
  }
  return {
    label: "Hidden",
    className: "border-destructive/30 text-destructive",
  };
}

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{value}</p>
    </div>
  );
}

function LayoutOptionCard({
  option,
  active,
  onSelect,
}: {
  option: (typeof INVENTORY_LAYOUT_OPTIONS)[number];
  active: boolean;
  onSelect: (layout: InventoryLayout) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.key)}
      className={cn(
        "rounded-[var(--radius-lg)] border px-4 py-3 text-left transition-[border-color,background-color,transform] duration-[var(--dur-fast)]",
        active
          ? "border-[color:color-mix(in_oklab,var(--color-brand)_26%,var(--color-border))] bg-[color:color-mix(in_oklab,var(--color-brand)_8%,var(--color-card))]"
          : "border-border bg-background/68 hover:border-[color:color-mix(in_oklab,var(--color-brand)_14%,var(--color-border))] hover:bg-background/88"
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {option.label}
      </p>
      <p className="mt-2 text-sm leading-6 text-foreground">{option.description}</p>
    </button>
  );
}

function ListingThumb({
  image,
  name,
  className,
  iconClassName,
}: {
  image: string;
  name: string;
  className: string;
  iconClassName?: string;
}) {
  return (
    <div className={cn("overflow-hidden border border-border bg-muted", className)}>
      {image ? (
        <img src={image} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
          <ImageIcon className={cn("size-7", iconClassName)} />
        </div>
      )}
    </div>
  );
}

function ListingTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return (
      <span className="rounded-full border border-dashed border-border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Metadata still needed
      </span>
    );
  }

  return (
    <>
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
        >
          {tag}
        </span>
      ))}
    </>
  );
}

function ListingStateBadges({
  costume,
  statusLabel,
  statusClassName,
}: {
  costume: VendorCostume;
  statusLabel: string;
  statusClassName: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline" className={statusClassName}>
        {statusLabel}
      </Badge>
      {costume.stock <= 1 ? (
        <Badge variant="ghost" className="text-amber-700 dark:text-amber-400">
          Low stock
        </Badge>
      ) : null}
    </div>
  );
}

function ListingActions({
  costume,
  canPublish,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
  size = "sm",
}: {
  costume: VendorCostume;
  canPublish: boolean;
  onEdit: (costume: VendorCostume) => void;
  onDelete: (costume: VendorCostume) => void;
  onPublish: (costumeId: number) => void;
  onUnpublish: (costumeId: number) => void;
  size?: "xs" | "sm";
}) {
  return (
    <>
      <Button type="button" size={size} variant="outline" onClick={() => onEdit(costume)}>
        <Pencil1Icon className="size-4" />
        Edit
      </Button>

      {costume.status === "DRAFT" && canPublish ? (
        <Button type="button" size={size} variant="brand" onClick={() => onPublish(costume.id)}>
          <RocketIcon className="size-4" />
          Publish
        </Button>
      ) : null}

      {costume.status === "ACTIVE" && canPublish ? (
        <Button type="button" size={size} variant="outline" onClick={() => onUnpublish(costume.id)}>
          <EyeOpenIcon className="size-4" />
          Return to draft
        </Button>
      ) : null}

      <Button type="button" size={size} variant="destructive" onClick={() => onDelete(costume)}>
        <TrashIcon className="size-4" />
        Delete
      </Button>
    </>
  );
}

function ModerationNotice({ costume }: { costume: VendorCostume }) {
  if (costume.status !== "FLAGGED" && costume.status !== "HIDDEN") {
    return null;
  }

  return (
    <Alert>
      <ExclamationTriangleIcon className="size-4" />
      <AlertTitle>Moderated listing</AlertTitle>
      <AlertDescription>
        This listing is out of circulation for now and needs admin clearance before it can return
        to shoppers.
      </AlertDescription>
    </Alert>
  );
}

function LedgerEconomics({ costume }: { costume: VendorCostume }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-background/72">
      <div className="grid gap-0 sm:grid-cols-[minmax(0,1.35fr)_minmax(110px,0.8fr)_minmax(104px,0.7fr)]">
        <div className="px-4 py-3 sm:border-r sm:border-border">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Daily rate
          </p>
          <div className="mt-1.5 flex items-end gap-2">
            <p className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
              {formatCurrency(costume.base_price_per_day)}
            </p>
            <p className="pb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              per day
            </p>
          </div>
        </div>

        <div className="border-t border-border px-4 py-3 sm:border-t-0 sm:border-r">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Deposit
          </p>
          <p className="mt-1.5 text-base font-semibold text-foreground">
            {formatCurrency(costume.deposit_amount)}
          </p>
        </div>

        <div className="border-t border-border px-4 py-3 sm:border-t-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Units
          </p>
          <p className="mt-1.5 text-base font-semibold text-foreground">{costume.stock}</p>
        </div>
      </div>
    </div>
  );
}

function StripStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-full border border-border bg-background px-3 py-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <span className="ml-2 text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function ListingRow({
  costume,
  canPublish,
  layout,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
}: {
  costume: VendorCostume;
  canPublish: boolean;
  layout: InventoryLayout;
  onEdit: (costume: VendorCostume) => void;
  onDelete: (costume: VendorCostume) => void;
  onPublish: (costumeId: number) => void;
  onUnpublish: (costumeId: number) => void;
}) {
  const image = resolveImage(costume);
  const status = listingStatusMeta(costume.status);
  const tags = [costume.category, costume.theme, costume.size].filter(Boolean);
  const description =
    costume.description ||
    "Add a clearer description so renters understand the fit, tone, and event use immediately.";

  if (layout === "salon") {
    return (
      <article className="surface-panel rounded-[var(--radius-xl)] px-4 py-4">
        <div className="grid gap-4 xl:grid-cols-[96px_minmax(0,1fr)]">
          <ListingThumb
            image={image}
            name={costume.name}
            className="h-28 w-24 rounded-[var(--radius-lg)]"
          />

          <div className="min-w-0 space-y-3">
            <ListingStateBadges
              costume={costume}
              statusLabel={status.label}
              statusClassName={status.className}
            />

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] lg:items-start">
              <div className="min-w-0">
                <h2 className="text-[1.45rem] font-display font-semibold text-foreground">
                  {costume.name}
                </h2>
                <p className="mt-2 max-w-[60ch] line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ListingTags tags={tags} />
                </div>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-[color:color-mix(in_oklab,var(--color-brand)_16%,var(--color-border))] bg-[color:color-mix(in_oklab,var(--color-brand)_5%,var(--color-card))] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Daily rate
                </p>
                <p className="mt-1.5 text-3xl font-semibold tracking-[-0.05em] text-foreground">
                  {formatCurrency(costume.base_price_per_day)}
                </p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Deposit
                    </p>
                    <p className="mt-1 font-semibold text-foreground">
                      {formatCurrency(costume.deposit_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Units ready
                    </p>
                    <p className="mt-1 font-semibold text-foreground">{costume.stock}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <ListingActions
                costume={costume}
                canPublish={canPublish}
                onEdit={onEdit}
                onDelete={onDelete}
                onPublish={onPublish}
                onUnpublish={onUnpublish}
              />
            </div>

            <ModerationNotice costume={costume} />
          </div>
        </div>
      </article>
    );
  }

  if (layout === "strip") {
    return (
      <article className="surface-panel rounded-[var(--radius-xl)] px-4 py-3">
        <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:gap-4">
              <ListingThumb
                image={image}
                name={costume.name}
                className="h-20 w-20 rounded-[var(--radius-lg)]"
                iconClassName="size-6"
              />

              <div className="min-w-0 flex-1">
                <ListingStateBadges
                  costume={costume}
                  statusLabel={status.label}
                  statusClassName={status.className}
                />
                <div className="mt-2 flex flex-col gap-2 xl:flex-row xl:items-baseline xl:gap-3">
                  <h2 className="text-lg font-semibold tracking-[-0.03em] text-foreground">
                    {costume.name}
                  </h2>
                  <p className="line-clamp-1 max-w-[62ch] text-sm text-muted-foreground">
                    {description}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <ListingTags tags={tags} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 2xl:items-end">
            <div className="flex flex-wrap gap-2 2xl:justify-end">
              <StripStat label="Rate" value={`${formatCurrency(costume.base_price_per_day)}/day`} />
              <StripStat label="Deposit" value={formatCurrency(costume.deposit_amount)} />
              <StripStat label="Units" value={costume.stock} />
            </div>

            <div className="flex flex-wrap gap-2 2xl:justify-end">
              <ListingActions
                costume={costume}
                canPublish={canPublish}
                onEdit={onEdit}
                onDelete={onDelete}
                onPublish={onPublish}
                onUnpublish={onUnpublish}
                size="xs"
              />
            </div>
          </div>
        </div>

        <div className="mt-3">
          <ModerationNotice costume={costume} />
        </div>
      </article>
    );
  }

  return (
    <article className="surface-panel rounded-[var(--radius-xl)] px-4 py-3">
      <div className="grid gap-3 xl:grid-cols-[76px_minmax(0,1fr)_minmax(320px,360px)] xl:items-center">
        <ListingThumb
          image={image}
          name={costume.name}
          className="h-24 w-20 rounded-[var(--radius-lg)]"
          iconClassName="size-6"
        />

        <div className="min-w-0">
          <ListingStateBadges
            costume={costume}
            statusLabel={status.label}
            statusClassName={status.className}
          />
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-foreground">
            {costume.name}
          </h2>
          <p className="mt-1 line-clamp-1 max-w-[62ch] text-sm text-muted-foreground">
            {description}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ListingTags tags={tags} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <ListingActions
              costume={costume}
              canPublish={canPublish}
              onEdit={onEdit}
              onDelete={onDelete}
              onPublish={onPublish}
              onUnpublish={onUnpublish}
              size="xs"
            />
          </div>
        </div>

        <LedgerEconomics costume={costume} />
      </div>

      <div className="mt-3">
        <ModerationNotice costume={costume} />
      </div>
    </article>
  );
}

function InventorySection({
  group,
  canPublish,
  layout,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
}: {
  group: CostumeGroup;
  canPublish: boolean;
  layout: InventoryLayout;
  onEdit: (costume: VendorCostume) => void;
  onDelete: (costume: VendorCostume) => void;
  onPublish: (costumeId: number) => void;
  onUnpublish: (costumeId: number) => void;
}) {
  if (group.items.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-lg font-semibold text-foreground">{group.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
        </div>
        <Badge variant="outline">
          {group.items.length} listing{group.items.length === 1 ? "" : "s"}
        </Badge>
      </div>

      <div className="space-y-3">
        {group.items.map((costume) => (
          <ListingRow
            key={costume.id}
            costume={costume}
            canPublish={canPublish}
            layout={layout}
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
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<InventoryLayout>("ledger");
  const [selectedCostume, setSelectedCostume] = useState<VendorCostume | null>(null);
  const [costumePendingDelete, setCostumePendingDelete] = useState<VendorCostume | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    const [vendorProfile, costumeList] = await Promise.all([
      getVendorProfile(),
      listVendorCostumes(),
    ]);
    setProfile(vendorProfile);
    setCostumes(costumeList);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        await refresh();
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Failed to load inventory.");
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [refresh]);

  const grouped = useMemo<CostumeGroup[]>(() => {
    const drafts = costumes.filter((costume) => costume.status === "DRAFT");
    const active = costumes.filter((costume) => costume.status === "ACTIVE");
    const moderated = costumes.filter(
      (costume) => costume.status === "HIDDEN" || costume.status === "FLAGGED"
    );

    return [
      {
        key: "drafts",
        title: "Private drafts",
        description: "Still being refined before publication.",
        items: drafts,
      },
      {
        key: "active",
        title: "Live listings",
        description: "Visible to renters and eligible for booking.",
        items: active,
      },
      {
        key: "moderated",
        title: "Moderated listings",
        description: "Held back until review issues are resolved.",
        items: moderated,
      },
    ];
  }, [costumes]);

  async function handleConfirmDelete() {
    if (!costumePendingDelete) return;

    setDeleteSubmitting(true);
    try {
      const result = await deleteVendorCostume(costumePendingDelete.id);
      toast.success(result.message);
      setCostumePendingDelete(null);
      await refresh();
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to publish listing.");
    }
  }

  async function handleUnpublish(costumeId: number) {
    try {
      await unpublishVendorCostume(costumeId);
      toast.success("Listing returned to draft.");
      await refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update listing.");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 rounded-[var(--radius-xl)]" />
        <Skeleton className="h-64 rounded-[var(--radius-xl)]" />
      </div>
    );
  }

  if (!profile?.canManageDrafts) {
    return (
      <div className="surface-shell rounded-[var(--radius-xl)] p-8 text-center md:p-12">
        <div className="mx-auto max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Inventory access
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">
            Your vendor workspace is not open yet.
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
            Submit the application first. As soon as your account enters review, this inventory
            area opens for draft creation and listing preparation.
          </p>
          <Link href="/vendor/apply" className={cn(buttonVariants({ variant: "brand" }), "mt-8")}>
            Start application
          </Link>
        </div>
      </div>
    );
  }

  const totalListings = costumes.length;
  const liveListings = grouped.find((group) => group.key === "active")?.items.length ?? 0;
  const draftListings = grouped.find((group) => group.key === "drafts")?.items.length ?? 0;
  const moderatedListings = grouped.find((group) => group.key === "moderated")?.items.length ?? 0;

  return (
    <div className="space-y-6">
      <section className="surface-shell rounded-[var(--radius-xl)] p-6 md:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Collection
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-4xl">
              Keep the catalog tight.
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
              Add strong drafts, publish only renter-ready pieces, and keep every listing easy to
              scan.
            </p>
          </div>

          <AddCostumeModal onSuccess={refresh} disabled={!profile.canManageDrafts} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStat label="Total" value={totalListings} />
          <SummaryStat label="Live" value={liveListings} />
          <SummaryStat label="Drafts" value={draftListings} />
          <SummaryStat label="Moderated" value={moderatedListings} />
        </div>

        <div className="mt-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Inventory mockups
              </p>
              <p className="mt-2 max-w-[65ch] text-sm leading-6 text-muted-foreground">
                Three compact directions using the real inventory actions, so we can compare how
                the catalog feels before committing to one treatment.
              </p>
            </div>
            <Badge variant="outline">Live comparison mode</Badge>
          </div>

          <div className="mt-4 grid gap-2 xl:grid-cols-3">
            {INVENTORY_LAYOUT_OPTIONS.map((option) => (
              <LayoutOptionCard
                key={option.key}
                option={option}
                active={layout === option.key}
                onSelect={setLayout}
              />
            ))}
          </div>
        </div>

        {!profile.canPublish ? (
          <Alert className="mt-6">
            <RocketIcon className="size-4" />
            <AlertTitle>Draft mode only</AlertTitle>
            <AlertDescription>
              Your boutique is still under review. You can build drafts now, but only approved
              vendor houses can publish listings and enter the reservation flow.
            </AlertDescription>
          </Alert>
        ) : null}
      </section>

      {totalListings === 0 ? (
        <section className="surface-panel rounded-[var(--radius-xl)] p-10 text-center md:p-14">
          <div className="mx-auto max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              No listings yet
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-4xl">
              Start with one strong draft.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
              Add the best piece first, give it clean metadata and strong imagery, then expand the
              collection once the pattern is working.
            </p>
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          {grouped.map((group) => (
            <InventorySection
              key={group.key}
              group={group}
              canPublish={profile.canPublish}
              layout={layout}
              onEdit={setSelectedCostume}
              onDelete={setCostumePendingDelete}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
            />
          ))}
        </section>
      )}

      <EditCostumeModal
        costume={selectedCostume}
        onClose={() => setSelectedCostume(null)}
        onSuccess={refresh}
      />

      <Dialog
        open={!!costumePendingDelete}
        onOpenChange={(open: boolean) => {
          if (!open && !deleteSubmitting) {
            setCostumePendingDelete(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-3xl">
          {costumePendingDelete ? (
            <div className="grid gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div className="border-b border-border bg-muted lg:border-b-0 lg:border-r">
                {resolveImage(costumePendingDelete) ? (
                  <img
                    src={resolveImage(costumePendingDelete)}
                    alt={costumePendingDelete.name}
                    className="h-56 w-full object-cover lg:h-full"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center text-muted-foreground/30 lg:h-full">
                    <ImageIcon className="size-10" />
                  </div>
                )}
              </div>

              <div className="p-6 sm:p-8">
                <DialogHeader>
                  <DialogTitle>Delete or archive this listing?</DialogTitle>
                  <DialogDescription>
                    We remove listings permanently only if they have never been reserved. If booking
                    history exists, the listing is archived so past records stay intact.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-6 space-y-4">
                  <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Listing
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      {costumePendingDelete.name}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      PHP {Number(costumePendingDelete.base_price_per_day).toLocaleString()} per day
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        If unused
                      </p>
                      <p className="mt-2 text-sm leading-6 text-foreground">
                        The listing is removed completely from inventory.
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        If reserved before
                      </p>
                      <p className="mt-2 text-sm leading-6 text-foreground">
                        The listing is archived quietly while reservation history remains available.
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="mt-6 border-t border-border pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCostumePendingDelete(null)}
                    disabled={deleteSubmitting}
                  >
                    Keep listing
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => void handleConfirmDelete()}
                    disabled={deleteSubmitting}
                  >
                    {deleteSubmitting ? "Processing..." : "Delete or archive"}
                  </Button>
                </DialogFooter>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
