"use client";

import Link from "next/link";
import { resolveApiAsset } from "../lib/assets";
import type { Costume } from "../lib/costumes";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon } from "@radix-ui/react-icons";
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

  return (
    <article className="group flex flex-col gap-4">
      <div className="relative w-full overflow-hidden rounded-sm border border-border bg-muted aspect-[3/4]">
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

        {costume.category && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-sm border border-border bg-background/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-foreground backdrop-blur-sm">
            {costume.category}
          </span>
        )}

        {isOwnCostume ? (
          <span className="pointer-events-none absolute right-3 top-3 rounded-sm border border-foreground/15 bg-foreground px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-background shadow-sm">
            Your listing
          </span>
        ) : (
          <div className="absolute right-3 top-3">
            <WishlistButton costumeId={costume.id} ownerId={costume.owner_id} initialSaved={initialSaved} size="md" />
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/costumes/${costume.id}`}
          className="min-w-0 flex-1"
          tabIndex={-1}
          aria-hidden="true"
        >
          <p className="truncate font-playfair text-lg font-semibold text-foreground group-hover:opacity-70 transition-opacity">
            {costume.name}
          </p>
          {tags.length > 0 && (
            <p className="mt-0.5 truncate text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {tags.join(" \u00B7 ")}
            </p>
          )}
        </Link>

        <div className="shrink-0 text-right">
          <p className="font-playfair text-lg font-semibold text-foreground">{"\u20B1"}{price}</p>
          <p className="text-[10px] text-muted-foreground">/ day</p>
        </div>
      </div>
    </article>
  );
}

export function CostumeCardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="w-full aspect-[3/4] rounded-sm" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
