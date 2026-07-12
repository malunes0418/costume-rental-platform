"use client";

import Link from "next/link";
import { ArrowRightIcon, ImageIcon } from "@radix-ui/react-icons";
import { resolveApiAsset } from "../lib/assets";
import type { Costume } from "../lib/costumes";
import { getCostumePricingSummary } from "../lib/pricing";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { WishlistButton } from "./WishlistButton";
import { cn } from "@/lib/utils";
import { displayCategory } from "@/components/marketplace/constants";

export type { Costume };

function primaryImage(costume: Costume) {
  const imgs = costume.CostumeImages || [];
  return imgs.find((i) => i.is_primary)?.image_url || imgs[0]?.image_url || "";
}

interface CostumeCardProps {
  costume: Costume;
  savedIds?: Set<number>;
  variant?: "grid" | "list";
  compact?: boolean;
  onWishlistChange?: (costumeId: number, saved: boolean) => void;
}

export function CostumeCard({
  costume,
  savedIds,
  variant = "grid",
  compact = false,
  onWishlistChange,
}: CostumeCardProps) {
  const { user } = useAuth();
  const img = primaryImage(costume);
  const pricingSummary = getCostumePricingSummary(costume);
  const shownCategory = displayCategory(costume);
  const meta = [shownCategory, costume.size, costume.theme].filter(Boolean);
  const initialSaved = savedIds ? savedIds.has(costume.id) : false;
  const isOwnCostume = !!user && costume.owner_id === user.id;

  if (variant === "list") {
    return (
      <article className="panel-card group flex overflow-hidden transition-shadow">
        <Link
          href={`/costumes/${costume.id}`}
          className="relative w-32 shrink-0 overflow-hidden bg-muted sm:w-40"
          aria-label={costume.name}
        >
          {img ? (
            <img
              src={resolveApiAsset(img)}
              alt={costume.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex aspect-[3/4] h-full items-center justify-center text-muted-foreground/20">
              <ImageIcon className="size-8" />
            </div>
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              {shownCategory && (
                <Badge variant="coralSoft" className="rounded-md text-[10px] font-medium">
                  {shownCategory}
                </Badge>
              )}
              {isOwnCostume && (
                <Badge variant="goldSoft" className="rounded-md text-[10px] font-medium">
                  Your listing
                </Badge>
              )}
            </div>
            <Link href={`/costumes/${costume.id}`}>
              <h3 className="line-clamp-2 font-display text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                {costume.name}
              </h3>
            </Link>
            {meta.length > 0 && (
              <p className="mt-1 truncate text-xs text-muted-foreground">{meta.join(" · ")}</p>
            )}
            <p className="mt-2 font-display text-xl font-semibold text-primary">
              ₱{pricingSummary.amount.toLocaleString()}
              <span className="ml-1 text-xs font-normal text-muted-foreground">{pricingSummary.label}</span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
            {!isOwnCostume && (
              <WishlistButton
                costumeId={costume.id}
                ownerId={costume.owner_id}
                initialSaved={initialSaved}
                size="md"
                onSavedChange={(saved) => onWishlistChange?.(costume.id, saved)}
              />
            )}
            <Link
              href={`/costumes/${costume.id}`}
              className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95"
              aria-label={`View ${costume.name}`}
            >
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col">
      <div
        className={cn(
          "costume-card-frame relative w-full overflow-hidden bg-muted",
          compact ? "aspect-[4/5] rounded-lg" : "aspect-[3/4]"
        )}
      >
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
              <ImageIcon className={compact ? "size-8" : "size-12"} />
            </div>
          )}
        </Link>

        {shownCategory && (
          <Badge
            variant="coralSoft"
            className={cn(
              "pointer-events-none absolute rounded-md border-0 font-medium backdrop-blur-sm",
              compact
                ? "left-2 top-2 text-[9px]"
                : "left-3 top-3 text-[10px]"
            )}
          >
            {shownCategory}
          </Badge>
        )}

        {isOwnCostume ? (
          <Badge
            variant="goldSoft"
            className={cn(
              "pointer-events-none absolute rounded-md font-medium backdrop-blur-sm",
              compact ? "right-2 top-2 text-[9px]" : "right-3 top-3 text-[10px]"
            )}
          >
            Your listing
          </Badge>
        ) : (
          <div className={compact ? "absolute right-1.5 top-1.5" : "absolute right-3 top-3"}>
            <WishlistButton
              costumeId={costume.id}
              ownerId={costume.owner_id}
              initialSaved={initialSaved}
              size={compact ? "sm" : "md"}
              onSavedChange={(saved) => onWishlistChange?.(costume.id, saved)}
            />
          </div>
        )}

        {!compact ? (
          <Link
            href={`/costumes/${costume.id}`}
            className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-md transition-all group-hover:opacity-100 hover:scale-105 active:scale-95"
            aria-label={`View ${costume.name}`}
          >
            <ArrowRightIcon className="size-4" />
          </Link>
        ) : null}
      </div>

      <div className={compact ? "mt-2 space-y-0.5" : "mt-3 space-y-1"}>
        <Link href={`/costumes/${costume.id}`} tabIndex={-1} aria-hidden="true">
          <p
            className={cn(
              "line-clamp-2 font-display leading-snug text-foreground transition-colors group-hover:text-primary",
              compact ? "text-sm" : "text-base"
            )}
          >
            {costume.name}
          </p>
        </Link>
        {meta.length > 0 && (
          <p className="truncate text-[11px] text-muted-foreground">{meta.join(" · ")}</p>
        )}
        <p className={cn("costume-card-price font-display text-primary", compact ? "text-sm" : "text-lg")}>
          ₱{pricingSummary.amount.toLocaleString()}
          <span className="ml-1 text-[10px] font-normal text-muted-foreground">{pricingSummary.label}</span>
        </p>
      </div>
    </article>
  );
}

export function CostumeCardSkeleton({ variant = "grid" }: { variant?: "grid" | "list" }) {
  if (variant === "list") {
    return (
      <div className="panel-card flex overflow-hidden" aria-hidden="true">
        <div className="costume-loading-shimmer w-32 shrink-0 self-stretch min-h-28 sm:w-40" />
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <Skeleton className="mb-1 h-4 w-20 rounded-md" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="mt-1 h-3 w-1/2" />
            <div className="mt-2 flex items-baseline gap-1">
              <Skeleton className="h-6 w-14" />
              <Skeleton className="h-2.5 w-14" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
            <Skeleton className="size-10 rounded-sm" />
            <Skeleton className="size-10 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <article className="flex flex-col" aria-hidden="true">
      <div className="costume-card-frame relative aspect-[3/4] w-full overflow-hidden bg-muted">
        <div className="costume-loading-shimmer absolute inset-0" />
        <Skeleton className="absolute left-3 top-3 h-[18px] w-[4.5rem] rounded-md bg-secondary" />
        <Skeleton className="absolute right-3 top-3 size-9 rounded-sm bg-secondary" />
      </div>
      <div className="mt-3 space-y-1">
        <Skeleton className="h-5 w-[90%]" />
        <Skeleton className="h-[11px] w-[70%]" />
        <div className="costume-card-price flex items-baseline gap-1">
          <Skeleton className="h-[1.375rem] w-14" />
          <Skeleton className="h-2.5 w-14" />
        </div>
      </div>
    </article>
  );
}
