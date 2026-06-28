"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartIcon as Heart } from "@radix-ui/react-icons";
import { toast } from "sonner";

import { CostumeCard, CostumeCardSkeleton } from "@/components/CostumeCard";
import { ResultsToolbar, type ViewMode } from "@/components/marketplace/ResultsToolbar";
import { WishlistHero } from "@/components/wishlist/WishlistHero";
import { WishlistSidebar } from "@/components/wishlist/WishlistSidebar";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { myWishlist, type WishlistItem } from "../../lib/account";
import { cn } from "@/lib/utils";

const actionLabelClass = "text-[10px] font-semibold uppercase tracking-widest";

function AccountGate({
  icon: Icon,
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: typeof Heart;
  eyebrow: string;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="min-h-screen account-page-shell">
      <div className="mx-auto w-full max-w-[1200px] px-6 pb-24 pt-20 text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-6 animate-fade-up">
          <div className="rounded-full border border-border bg-card p-5 text-muted-foreground/30">
            <Icon className="mx-auto size-10" />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
            <h1 className="font-display text-3xl font-semibold text-foreground">{title}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
          <Link
            href={actionHref}
            className={cn(buttonVariants({ size: "lg" }), "h-10 px-6 hover-snap", actionLabelClass)}
          >
            {actionLabel}
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
  const [view, setView] = useState<ViewMode>("grid");

  const costumes = useMemo(
    () => items.map((item) => item.Costume).filter((costume): costume is NonNullable<typeof costume> => Boolean(costume)),
    [items]
  );

  const savedIds = useMemo(() => new Set(costumes.map((costume) => costume.id)), [costumes]);

  const categoryCount = useMemo(() => {
    const categories = new Set(costumes.map((costume) => costume.category).filter(Boolean));
    return categories.size;
  }, [costumes]);

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

  function handleWishlistChange(costumeId: number, saved: boolean) {
    if (!saved) {
      setItems((current) => current.filter((item) => item.costume_id !== costumeId));
    }
  }

  if (!user) {
    return (
      <AccountGate
        icon={Heart}
        eyebrow="Dressing room pass required"
        title="Wishlist"
        description="Sign in to save and revisit your favourite costumes."
        actionHref="/login?next=/wishlist"
        actionLabel="Log in to continue"
      />
    );
  }

  if (user.role === "ADMIN") {
    return (
      <AccountGate
        icon={Heart}
        eyebrow="Unavailable"
        title="Wishlist"
        description="Administrators cannot use the wishlist feature."
        actionHref="/"
        actionLabel="Return home"
      />
    );
  }

  return (
    <div className="min-h-screen account-page-shell">
      <div className="mx-auto w-full max-w-[1200px] px-6 pb-24 pt-10">
        {isLoading ? (
          <div className="mb-10 overflow-hidden rounded-2xl border border-border bg-card px-6 py-8 sm:px-8 sm:py-10">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="mt-4 h-10 w-56" />
            <Skeleton className="mt-3 h-4 w-full max-w-md" />
          </div>
        ) : (
          <WishlistHero savedCount={costumes.length} categoryCount={categoryCount} />
        )}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col gap-6 lg:col-span-8">
            {!isLoading && costumes.length > 0 ? (
              <div className="animate-fade-up">
                <ResultsToolbar
                  count={costumes.length}
                  total={costumes.length}
                  sort="_newest"
                  view={view}
                  showSort={false}
                  onSortChange={() => {}}
                  onViewChange={setView}
                  className="bg-card/80 backdrop-blur-sm"
                />
              </div>
            ) : null}

            {isLoading ? (
              view === "grid" ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 md:gap-5">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <CostumeCardSkeleton key={index} variant="grid" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <CostumeCardSkeleton key={index} variant="list" />
                  ))}
                </div>
              )
            ) : costumes.length > 0 ? (
              <div
                className={cn(
                  "animate-fade-up-delay-1",
                  view === "grid"
                    ? "grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 md:gap-5"
                    : "flex flex-col gap-3"
                )}
              >
                {costumes.map((costume) => (
                  <CostumeCard
                    key={costume.id}
                    costume={costume}
                    savedIds={savedIds}
                    variant={view}
                    compact={view === "grid"}
                    onWishlistChange={handleWishlistChange}
                  />
                ))}
              </div>
            ) : (
              <div className="panel-card flex flex-col items-center gap-6 px-8 py-20 text-center animate-fade-up">
                <div className="rounded-full border border-border bg-brand-coral-soft/50 p-5 text-primary/40">
                  <Heart className="size-10" />
                </div>
                <div className="max-w-sm space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Empty rack</p>
                  <p className="font-display text-2xl font-semibold text-foreground">Nothing saved yet</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Tap the heart on any costume in the marketplace to add it here.
                  </p>
                </div>
                <Link
                  href="/"
                  className={cn(buttonVariants({ size: "lg" }), "h-10 px-6 hover-snap", actionLabelClass)}
                >
                  Browse costumes
                </Link>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 animate-fade-up-delay-2">
            {isLoading ? (
              <div className="panel-card space-y-4 p-6">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            ) : (
              <WishlistSidebar savedCount={costumes.length} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
