"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "../../lib/api";
import { resolveApiAsset } from "../../lib/assets";
import { useAuth } from "../../lib/auth";
import { myWishlist, removeWishlist, type WishlistItem } from "../../lib/account";
import { getCostumePricingSummary } from "../../lib/pricing";
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
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removing, setRemoving] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    if (user.role === "ADMIN") {
      router.replace("/admin");
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    myWishlist()
      .then((res) => {
        if (!cancelled) setItems(res);
      })
      .catch((e: unknown) => {
        if (!cancelled) toast.error(e instanceof ApiError ? e.message : "Failed to load wishlist");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, isAuthLoading, router]);

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

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 pb-32 pt-24 text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-8">
          <div className="text-muted-foreground/20">
            <Heart className="mx-auto size-16" />
          </div>
          <div className="space-y-3">
            <h1 className="font-display text-4xl font-semibold text-foreground">Wishlist</h1>
            <p className="text-muted-foreground">Sign in to save and revisit your favourite costumes.</p>
          </div>
          <Link
            href="/login?next=/wishlist"
            className="inline-flex h-12 items-center rounded-md bg-primary px-8 text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Log in to continue
          </Link>
        </div>
      </div>
    );
  }

  if (user.role === "ADMIN") {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 pb-32 pt-24 text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-8">
          <div className="text-muted-foreground/20">
            <Heart className="mx-auto size-16" />
          </div>
          <div className="space-y-3">
            <h1 className="font-display text-4xl font-semibold text-foreground">Unavailable</h1>
            <p className="text-muted-foreground">Administrators cannot use the wishlist feature.</p>
          </div>
          <Link
            href="/"
            className="inline-flex h-12 items-center rounded-md bg-primary px-8 text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-32 pt-16">
      <div className="mb-16 flex items-end justify-between gap-6">
        <div className="max-w-xl">
          <p className="animate-fade-up text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Your account
          </p>
          <h1 className="animate-fade-up-delay-1 mt-4 font-display text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
            Wishlist
          </h1>
          <p className="animate-fade-up-delay-2 mt-4 text-base leading-relaxed text-muted-foreground">
            Costumes you&apos;ve saved for later.
          </p>
        </div>

        {!isLoading && items.length > 0 && (
          <p className="animate-fade-up-delay-2 shrink-0 text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "piece" : "pieces"} saved
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4">
              <Skeleton className="aspect-[3/4] w-full rounded-sm" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const costume = it.Costume;
            const images = costume?.CostumeImages || [];
            const image = images.find((img) => img.is_primary)?.image_url || images[0]?.image_url || "";
            const tags = [costume?.category, costume?.theme, costume?.size].filter(Boolean);
            const pricingSummary = costume ? getCostumePricingSummary(costume) : null;
            const isRemoving = removing === it.id;

            return (
              <article
                key={it.id}
                className={cn(
                  "group flex flex-col gap-4 transition-opacity duration-300",
                  isRemoving && "pointer-events-none opacity-30"
                )}
              >
                <Link
                  href={`/costumes/${it.costume_id}`}
                  className="relative block aspect-[3/4] w-full overflow-hidden rounded-sm border border-border bg-muted"
                >
                  {image ? (
                    <img
                      src={resolveApiAsset(image)}
                      alt={costume?.name || "Costume"}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
                      <ImageIcon className="size-12" />
                    </div>
                  )}

                  {costume?.category && (
                    <span className="absolute left-4 top-4 rounded-sm border border-border bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-foreground backdrop-blur-sm">
                      {costume.category}
                    </span>
                  )}
                </Link>

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg font-semibold text-foreground">
                      {costume?.name || `Costume #${it.costume_id}`}
                    </p>
                    {tags.length > 0 && (
                      <p className="mt-0.5 truncate text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {tags.join(" · ")}
                      </p>
                    )}
                    {pricingSummary && (
                      <p className="mt-1 text-sm text-foreground">
                        PHP {pricingSummary.amount.toLocaleString()}
                        <span className="ml-1 text-xs text-muted-foreground">{pricingSummary.label}</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(it)}
                    disabled={isRemoving}
                    aria-label={`Remove ${costume?.name || "costume"} from wishlist`}
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    <X className="size-3" />
                  </button>
                </div>

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
        <div className="flex flex-col items-center gap-8 rounded-sm border border-border px-12 py-32 text-center">
          <div className="text-muted-foreground/20">
            <Heart className="size-12" />
          </div>
          <div className="space-y-2">
            <p className="font-display text-3xl font-semibold text-foreground">
              Nothing saved yet.
            </p>
            <p className="text-muted-foreground">
              Tap the heart on any costume to add it here.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-12 items-center rounded-md bg-primary px-8 text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Browse costumes
          </Link>
        </div>
      )}
    </div>
  );
}
