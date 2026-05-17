"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  Cross1Icon,
  HeartIcon,
  ImageIcon,
} from "@radix-ui/react-icons";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "../../lib/api";
import { resolveApiAsset } from "../../lib/assets";
import { useAuth } from "../../lib/auth";
import { myWishlist, removeWishlist, type WishlistItem } from "../../lib/account";
import { cn } from "@/lib/utils";

function WishlistGate({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="surface-shell mx-auto max-w-2xl rounded-[var(--radius-xl)] p-10 text-center md:p-12">
        <div className="mx-auto flex max-w-lg flex-col items-center">
          <div className="rounded-full border border-border bg-background p-4 text-muted-foreground">
            <HeartIcon className="size-8" />
          </div>
          <h1 className="mt-6 font-display text-4xl text-foreground">{title}</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{description}</p>
          <Link href={href} className={cn(buttonVariants({ variant: "brand" }), "mt-8")}>
            {cta}
          </Link>
        </div>
      </div>
    </div>
  );
}

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
        if (!cancelled) {
          toast.error(e instanceof ApiError ? e.message : "Failed to load wishlist");
        }
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
      <WishlistGate
        title="Save standout looks for later."
        description="Log in to collect favourites, compare styles, and return when you are ready to book."
        href="/login?next=/wishlist"
        cta="Log in to continue"
      />
    );
  }

  if (user.role === "ADMIN") {
    return (
      <WishlistGate
        title="Wishlist is not available here."
        description="Administrator accounts use the operations workspace and do not keep personal saved looks."
        href="/"
        cta="Return home"
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1160px] px-6 pb-24 pt-10">
      <section className="surface-shell rounded-[var(--radius-xl)] p-7 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="brand-eyebrow inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em]">
              <span className="inline-block size-1.5 rounded-full bg-gold" />
              Customer utility
            </div>
            <h1 className="mt-5 font-display text-4xl text-foreground md:text-5xl">Wishlist</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground md:text-base">
              Keep track of the looks worth revisiting, then jump back into booking when the timing
              is right.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="rounded-full border border-border bg-background px-4 py-2 font-semibold uppercase tracking-[0.22em] text-foreground">
              {isLoading ? "--" : `${items.length} saved`}
            </span>
            <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
              Browse catalog
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-8">
        {isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="surface-panel flex flex-col gap-5 rounded-[var(--radius-xl)] p-5 md:flex-row md:items-center"
              >
                <Skeleton className="h-48 w-full rounded-[var(--radius-lg)] md:h-28 md:w-24" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length ? (
          <div className="grid gap-4">
            {items.map((item) => {
              const costume = item.Costume;
              const images = costume?.CostumeImages || [];
              const image = images.find((img) => img.is_primary)?.image_url || images[0]?.image_url || "";
              const isRemoving = removing === item.id;
              const tags = [costume?.category, costume?.theme, costume?.size].filter(Boolean);
              const vendorName =
                costume?.owner?.VendorProfile?.business_name ||
                costume?.owner?.name ||
                "SnapCos vendor";

              return (
                <article
                  key={item.id}
                  className={cn(
                    "surface-panel flex flex-col gap-5 rounded-[var(--radius-xl)] p-5 transition-opacity md:flex-row md:items-center",
                    isRemoving && "pointer-events-none opacity-40"
                  )}
                >
                  <Link
                    href={`/costumes/${item.costume_id}`}
                    className="block h-52 w-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-muted md:h-28 md:w-24"
                  >
                    {image ? (
                      <img
                        src={resolveApiAsset(image)}
                        alt={costume?.name || "Costume"}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
                        <ImageIcon className="size-8" />
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      {vendorName}
                    </p>
                    <h2 className="mt-2 font-display text-3xl text-foreground md:text-[2rem]">
                      {costume?.name || `Costume #${item.costume_id}`}
                    </h2>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {tags.length > 0 ? (
                        tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-border bg-background px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-dashed border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Curated rental piece
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                      <span className="font-semibold text-foreground">
                        {costume?.base_price_per_day != null
                          ? `PHP ${Number(costume.base_price_per_day).toLocaleString()} / day`
                          : "Pricing unavailable"}
                      </span>
                      <span className="text-muted-foreground">
                        Save now, reserve when your dates are ready.
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:items-end">
                    <Link
                      href={`/costumes/${item.costume_id}`}
                      className={cn(buttonVariants({ variant: "brand" }), "justify-center")}
                    >
                      View costume
                      <ArrowRightIcon className="size-4" />
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      className="justify-center md:justify-end"
                      onClick={() => handleRemove(item)}
                      disabled={isRemoving}
                    >
                      <Cross1Icon className="size-3" />
                      Remove
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="surface-panel rounded-[var(--radius-xl)] p-10 text-center md:p-14">
            <div className="mx-auto flex max-w-lg flex-col items-center">
              <div className="rounded-full border border-border bg-background p-4 text-muted-foreground">
                <HeartIcon className="size-8" />
              </div>
              <h2 className="mt-6 font-display text-4xl text-foreground">Nothing saved yet.</h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Use the heart on any costume card to keep your shortlist handy while you compare
                styles and dates.
              </p>
              <Link href="/" className={cn(buttonVariants({ variant: "brand" }), "mt-8")}>
                Browse costumes
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
