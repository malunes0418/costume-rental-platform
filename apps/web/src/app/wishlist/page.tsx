"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { myWishlist, type WishlistItem } from "../../lib/account";
import { CostumeCard, CostumeCardSkeleton } from "@/components/CostumeCard";
import { ResultsToolbar, type ViewMode } from "@/components/marketplace/ResultsToolbar";
import { HeartIcon as Heart } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function AccountGate({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: typeof Heart;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 pb-24 pt-20 text-center">
      <div className="mx-auto flex max-w-sm flex-col items-center gap-6">
        <div className="text-muted-foreground/20">
          <Icon className="mx-auto size-12" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <Link
          href={actionHref}
          className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {actionLabel}
        </Link>
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
        title="Unavailable"
        description="Administrators cannot use the wishlist feature."
        actionHref="/"
        actionLabel="Return home"
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 pb-24 pt-12">
      <header className="mb-8 max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Your account
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Wishlist
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Costumes you&apos;ve saved — browse, compare, and reserve when you&apos;re ready.
        </p>
      </header>

      {!isLoading && costumes.length > 0 ? (
        <ResultsToolbar
          count={costumes.length}
          total={costumes.length}
          sort="_newest"
          view={view}
          showSort={false}
          onSortChange={() => {}}
          onViewChange={setView}
          className="mb-5"
        />
      ) : null}

      {isLoading ? (
        view === "grid" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 md:gap-5">
            {Array.from({ length: 8 }).map((_, index) => (
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
        <div className="flex flex-col items-center gap-6 rounded-xl border border-border bg-card px-8 py-16 text-center">
          <div className="text-muted-foreground/20">
            <Heart className="size-10" />
          </div>
          <div className="space-y-2">
            <p className="font-display text-2xl font-semibold text-foreground">Nothing saved yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Tap the heart on any costume in the marketplace to add it here.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Browse costumes
          </Link>
        </div>
      )}
    </div>
  );
}
