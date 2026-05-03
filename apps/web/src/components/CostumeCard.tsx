"use client";

import Link from "next/link";
import { resolveApiAsset } from "../lib/assets";
import type { Costume } from "../lib/costumes";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function primaryImage(costume: Costume) {
  const imgs = costume.CostumeImages || [];
  return imgs.find((i) => i.is_primary)?.image_url || imgs[0]?.image_url || "";
}



import { ImageIcon } from "@radix-ui/react-icons";

export function CostumeCard({ costume }: { costume: Costume }) {
  const img   = primaryImage(costume);
  const price = Number(costume.base_price_per_day).toFixed(0);
  const tags  = [costume.theme, costume.size].filter(Boolean);

  return (
    <Link
      href={`/costumes/${costume.id}`}
      id={`costume-card-${costume.id}`}
      className="block text-decoration-none group"
    >
      <Card
        className={cn(
          "overflow-hidden border border-border transition-all duration-300",
          "bg-card text-card-foreground",
          "hover:border-primary/30 hover:-translate-y-1",
          "hover:shadow-lg hover:shadow-primary/5"
        )}
      >
        {/* Image */}
        <div className="relative w-full overflow-hidden bg-muted aspect-[4/3]">
          {img ? (
            <img
              src={resolveApiAsset(img)}
              alt={costume.name}
              loading="lazy"
              className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-secondary/50 text-muted-foreground/30">
              <ImageIcon className="size-12" />
            </div>
          )}

          {/* Category badge */}
          {costume.category && (
            <div className="absolute left-3 top-3">
              <Badge
                variant="secondary"
                className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-widest text-primary"
              >
                {costume.category}
              </Badge>
            </div>
          )}
        </div>

        {/* Card body */}
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-bold leading-tight display">
                {costume.name}
              </p>
              {tags.length > 0 && (
                <p className="mt-1 truncate text-[0.78rem] text-muted-foreground">
                  {tags.join(" · ")}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="shrink-0 text-right">
              <div className="text-[1.15rem] font-black leading-tight text-primary display">
                ₱{price}
              </div>
              <div className="mt-0.5 text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                / day
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/* Skeleton loader for the costume card */
export function CostumeCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-border bg-card">
      <Skeleton className="w-full aspect-[4/3] rounded-none bg-muted" />
      <CardContent className="p-4">
        <Skeleton className="mb-2 h-4 w-3/4 bg-muted" />
        <Skeleton className="h-3 w-2/5 bg-muted" />
      </CardContent>
    </Card>
  );
}
