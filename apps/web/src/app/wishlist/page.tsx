"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { resolveApiAsset } from "../../lib/assets";
import { useAuth } from "../../lib/auth";
import { myWishlist, removeWishlist, type WishlistItem } from "../../lib/account";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HeartIcon as Heart,
  Cross1Icon as X,
  ImageIcon,
  ArrowRightIcon as ArrowRight,
} from "@radix-ui/react-icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function WishlistPage() {
  const { user } = useAuth();
  const [items, setItems]         = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removing, setRemoving]   = useState<number | null>(null);

  useEffect(() => {
    if (!user) { setItems([]); setIsLoading(false); return; }
    let cancelled = false;
    setIsLoading(true);
    myWishlist()
      .then((res) => { if (!cancelled) setItems(res); })
      .catch((e: unknown) => {
        if (!cancelled) toast.error(e instanceof ApiError ? e.message : "Failed to load wishlist");
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  async function handleRemove(item: WishlistItem) {
    if (!user) return;
    setRemoving(item.id);
    try {
      await removeWishlist(item.costume_id);
      setItems((xs) => xs.filter((x) => x.id !== item.id));
      toast.success("Removed from wishlist.");
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Could not remove item.");
    } finally {
      setRemoving(null);
    }
  }

  // ── unauthenticated ───────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 pb-32 pt-24 text-center">
        <div className="mx-auto max-w-sm flex flex-col items-center gap-8">
          <div className="text-muted-foreground/20">
            <Heart className="mx-auto size-16" />
          </div>
          <div className="space-y-3">
            <h1 className="font-playfair text-4xl font-semibold text-foreground">Wishlist</h1>
            <p className="text-muted-foreground">Sign in to save and revisit your favourite costumes.</p>
          </div>
          <Link
            href="/login?next=/wishlist"
            className="inline-flex h-12 items-center rounded-md bg-foreground px-8 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
          >
            Log in to continue
          </Link>
        </div>
      </div>
    );
  }

  // ── main ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-32 pt-16">

      {/* ── Page header ── */}
      <div className="mb-16 flex items-end justify-between gap-6">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground animate-fade-up">
            Your account
          </p>
          <h1 className="mt-4 font-playfair text-5xl font-semibold tracking-tight text-foreground animate-fade-up-delay-1 md:text-6xl">
            Wishlist
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground animate-fade-up-delay-2">
            Costumes you&apos;ve saved for later.
          </p>
        </div>

        {!isLoading && items.length > 0 && (
          <p className="shrink-0 text-sm text-muted-foreground animate-fade-up-delay-2">
            {items.length} {items.length === 1 ? "piece" : "pieces"} saved
          </p>
        )}
      </div>

      {/* ── Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4">
              <Skeleton className="w-full aspect-[3/4] rounded-sm" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const c    = it.Costume;
            const imgs = c?.CostumeImages || [];
            const img  = imgs.find((i) => i.is_primary)?.image_url || imgs[0]?.image_url || "";
            const tags = [c?.category, c?.theme, c?.size].filter(Boolean);
            const isRemoving = removing === it.id;

            return (
              <article
                key={it.id}
                className={cn(
                  "group flex flex-col gap-4 transition-opacity duration-300",
                  isRemoving && "opacity-30 pointer-events-none"
                )}
              >
                {/* Image */}
                <Link
                  href={`/costumes/${it.costume_id}`}
                  className="block w-full overflow-hidden rounded-sm border border-border bg-muted aspect-[3/4] relative"
                >
                  {img ? (
                    <img
                      src={resolveApiAsset(img)}
                      alt={c?.name || "Costume"}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
                      <ImageIcon className="size-12" />
                    </div>
                  )}

                  {/* Category label overlay */}
                  {c?.category && (
                    <span className="absolute left-4 top-4 rounded-sm border border-border bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-foreground backdrop-blur-sm">
                      {c.category}
                    </span>
                  )}
                </Link>

                {/* Info row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-playfair text-lg font-semibold text-foreground">
                      {c?.name || `Costume #${it.costume_id}`}
                    </p>
                    {tags.length > 0 && (
                      <p className="mt-0.5 truncate text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {tags.join(" · ")}
                      </p>
                    )}
                    {c?.base_price_per_day != null && (
                      <p className="mt-1 text-sm text-foreground">
                        ₱{Number(c.base_price_per_day).toLocaleString()}
                        <span className="ml-1 text-xs text-muted-foreground">/ day</span>
                      </p>
                    )}
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => handleRemove(it)}
                    disabled={isRemoving}
                    aria-label={`Remove ${c?.name || "costume"} from wishlist`}
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    <X className="size-3" />
                  </button>
                </div>

                {/* View CTA */}
                <Link
                  href={`/costumes/${it.costume_id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                >
                  View costume <ArrowRight className="size-3" />
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        /* ── Empty state ── */
        <div className="flex flex-col items-center gap-8 border border-border rounded-sm py-32 px-12 text-center">
          <div className="text-muted-foreground/20">
            <Heart className="size-12" />
          </div>
          <div className="space-y-2">
            <p className="font-playfair text-3xl font-semibold text-foreground">
              Nothing saved yet.
            </p>
            <p className="text-muted-foreground">
              Tap the heart on any costume to add it here.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-12 items-center rounded-sm bg-foreground px-8 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
          >
            Browse costumes
          </Link>
        </div>
      )}

    </div>
  );
}
