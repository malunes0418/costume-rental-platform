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

const categoryEmoji: Record<string, string> = {
  superhero:  "🦸",
  halloween:  "🎃",
  historical: "👑",
  fantasy:    "🧙",
  anime:      "⛩️",
  theatrical: "🎭",
  vintage:    "🎩",
  sci_fi:     "🚀",
};

function getCategoryEmoji(category?: string | null) {
  if (!category) return "🎭";
  return categoryEmoji[category.toLowerCase()] ?? "🎭";
}

export function CostumeCard({ costume }: { costume: Costume }) {
  const img   = primaryImage(costume);
  const emoji = getCategoryEmoji(costume.category);
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
          "overflow-hidden border transition-all duration-250",
          "border-white/7 bg-[var(--clr-surface)]",
          "hover:border-[rgba(200,155,60,0.3)] hover:-translate-y-1",
          "hover:shadow-[0_16px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(200,155,60,0.1)]"
        )}
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        {/* Image */}
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: "4/3", background: "var(--clr-surface-2)" }}
        >
          {img ? (
            <img
              src={resolveApiAsset(img)}
              alt={costume.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
              style={{ display: "block" }}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--clr-surface-2), var(--clr-surface-3))" }}
            >
              <span className="text-5xl leading-none">{emoji}</span>
            </div>
          )}

          {/* Category badge */}
          {costume.category && (
            <div className="absolute left-3 top-3">
              <Badge
                variant="secondary"
                className="rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-widest"
                style={{
                  background: "var(--clr-gold-dim)",
                  color: "var(--clr-gold-light)",
                  border: "1px solid rgba(200,155,60,0.3)",
                }}
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
              <p
                className="truncate text-base font-bold leading-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--clr-text)" }}
              >
                {costume.name}
              </p>
              {tags.length > 0 && (
                <p
                  className="mt-1 truncate text-[0.78rem]"
                  style={{ color: "var(--clr-text-muted)" }}
                >
                  {tags.join(" · ")}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="shrink-0 text-right">
              <div
                className="text-[1.15rem] font-black leading-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--clr-gold-light)" }}
              >
                ₱{price}
              </div>
              <div
                className="mt-0.5 text-[0.65rem] uppercase tracking-widest"
                style={{ color: "var(--clr-text-dim)" }}
              >
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
    <Card
      className="overflow-hidden border border-white/7"
      style={{ borderRadius: "var(--radius-lg)", background: "var(--clr-surface)" }}
    >
      <Skeleton className="w-full" style={{ aspectRatio: "4/3", borderRadius: 0, background: "var(--clr-surface-2)" }} />
      <CardContent className="p-4">
        <Skeleton className="mb-2 h-4 w-3/4" style={{ background: "var(--clr-surface-2)" }} />
        <Skeleton className="h-3 w-2/5" style={{ background: "var(--clr-surface-2)" }} />
      </CardContent>
    </Card>
  );
}
