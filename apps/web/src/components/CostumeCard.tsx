"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  ImageIcon,
  PersonIcon,
  SewingPinFilledIcon,
} from "@radix-ui/react-icons";

import { resolveApiAsset } from "../lib/assets";
import type { Costume } from "../lib/costumes";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { WishlistButton } from "./WishlistButton";

// Re-export for convenience in parent pages.
export type { Costume };

function primaryImage(costume: Costume) {
  const imgs = costume.CostumeImages || [];
  return imgs.find((i) => i.is_primary)?.image_url || imgs[0]?.image_url || "";
}

interface CostumeCardProps {
  costume: Costume;
  /** Set of costume IDs already saved to the user's wishlist. */
  savedIds?: Set<number>;
}

export function CostumeCard({ costume, savedIds }: CostumeCardProps) {
  const { user } = useAuth();
  const img = primaryImage(costume);
  const price = Number(costume.base_price_per_day).toLocaleString();
  const tags = [costume.theme, costume.size].filter(Boolean);
  const initialSaved = savedIds ? savedIds.has(costume.id) : false;
  const isOwnCostume = !!user && costume.owner_id === user.id;
  const vendorName =
    costume.owner?.VendorProfile?.business_name || costume.owner?.name || "SnapCos vendor";

  return (
    <article className="group surface-panel flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] transition-[transform,border-color,box-shadow] duration-[var(--dur-slow)] hover:-translate-y-1 hover:border-[color:color-mix(in_oklab,var(--color-brand)_16%,var(--color-border))]">
      <div className="relative aspect-[3/4] w-full overflow-hidden border-b border-border bg-muted">
        <Link
          href={`/costumes/${costume.id}`}
          id={`costume-card-${costume.id}`}
          aria-label={costume.name}
          className="block h-full w-full"
        >
          {img ? (
            <img
              src={resolveApiAsset(img)}
              alt={costume.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
              <ImageIcon className="size-12" />
            </div>
          )}
        </Link>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-24 bg-gradient-to-b from-black/16 via-black/5 to-transparent" />

        <div className="absolute left-3 top-3 z-[2] flex flex-wrap items-center gap-2">
          {costume.category ? (
            <span className="rounded-full border border-border/80 bg-background/92 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-foreground backdrop-blur-sm">
              {costume.category}
            </span>
          ) : null}
          {costume.status && costume.status !== "ACTIVE" ? (
            <span className="rounded-full border border-[color:color-mix(in_oklab,var(--color-gold)_28%,var(--color-border))] bg-background/92 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:color-mix(in_oklab,var(--color-gold)_64%,var(--color-foreground))] backdrop-blur-sm">
              {costume.status}
            </span>
          ) : null}
        </div>

        {isOwnCostume ? (
          <span className="pointer-events-none absolute right-3 top-3 z-[2] rounded-full border border-foreground/15 bg-foreground px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-background shadow-sm">
            Your listing
          </span>
        ) : (
          <div className="absolute right-3 top-3 z-[2]">
            <WishlistButton
              costumeId={costume.id}
              ownerId={costume.owner_id}
              initialSaved={initialSaved}
              size="md"
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                <PersonIcon className="size-3" />
                <span className="truncate">{vendorName}</span>
              </p>
              <Link href={`/costumes/${costume.id}`} className="block">
                <h3 className="line-clamp-2 font-display text-[1.45rem] text-foreground transition-colors group-hover:text-[color:var(--color-brand)]">
                  {costume.name}
                </h3>
              </Link>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                From
              </p>
              <p className="mt-1 font-display text-2xl text-foreground">PHP {price}</p>
              <p className="text-xs text-muted-foreground">per day</p>
            </div>
          </div>

          {costume.description ? (
            <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
              {costume.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              >
                <SewingPinFilledIcon className="size-3" />
                {tag}
              </span>
            ))
          ) : (
            <span className="rounded-full border border-dashed border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Curated rental piece
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Clear daily pricing and booking details before checkout.
          </p>
          <Link
            href={`/costumes/${costume.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-brand)] transition-colors hover:text-foreground"
          >
            View details
            <ArrowRightIcon className="size-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function CostumeCardSkeleton() {
  return (
    <div className="surface-panel flex flex-col overflow-hidden rounded-[var(--radius-lg)]">
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      <div className="flex flex-col gap-3 p-5">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}
