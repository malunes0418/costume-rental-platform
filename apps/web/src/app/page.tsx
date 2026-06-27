"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { ApiError } from "../lib/api";
import { CostumeCard, CostumeCardSkeleton } from "../components/CostumeCard";
import { listCostumes, type Costume, type CostumeListQuery } from "../lib/costumes";
import { myWishlist } from "../lib/account";
import { useAuth } from "../lib/auth";
import { useLandingShell } from "../lib/landing-shell";
import { getCostumePricingSummary } from "../lib/pricing";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChevronLeftIcon as ChevronLeft,
  ChevronRightIcon as ChevronRight,
  ExclamationTriangleIcon as AlertCircle,
  MagnifyingGlassIcon as Search,
} from "@radix-ui/react-icons";
import { HeroSplash } from "@/components/brand/HeroSplash";
import { cn } from "@/lib/utils";
import { FilterSidebar, type MarketplaceFilters } from "@/components/marketplace/FilterSidebar";
import { FilterChips } from "@/components/marketplace/FilterChips";
import { ResultsToolbar, type ViewMode } from "@/components/marketplace/ResultsToolbar";

const PAGE_SIZE = 12;

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function MarketplacePageInner() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { setHeroActive, revealNav, resetHeroNav } = useLandingShell();
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") || undefined;
  const category = searchParams.get("category") || undefined;
  const size = searchParams.get("size") || undefined;
  const gender = searchParams.get("gender") || undefined;
  const theme = searchParams.get("theme") || undefined;
  const sort = searchParams.get("sort") || undefined;
  const view = (searchParams.get("view") as ViewMode) || "grid";
  const page = Math.max(1, parseNumber(searchParams.get("page")) ?? 1);
  const priceMin = parseNumber(searchParams.get("priceMin"));
  const priceMax = parseNumber(searchParams.get("priceMax"));

  const [items, setItems] = useState<Costume[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [ownerScope, setOwnerScope] = useState<"all" | "mine">("all");

  const isApprovedVendor = user?.vendor_status === "APPROVED";

  const serverQuery = useMemo<CostumeListQuery>(() => {
    const query: CostumeListQuery = {
      page,
      pageSize: PAGE_SIZE,
      q,
      category,
      size,
      gender,
      theme,
      sort: sort === "price_asc" || sort === "price_desc" ? sort : undefined,
    };
    if (isApprovedVendor && ownerScope === "mine" && user) {
      query.ownerId = user.id;
    }
    return query;
  }, [page, q, category, size, gender, theme, sort, isApprovedVendor, ownerScope, user]);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined | null>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val === undefined || val === null || val === "") {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      }
      if (resetPage) params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/");
    },
    [router, searchParams]
  );

  const filters: MarketplaceFilters = useMemo(
    () => ({ category, size, gender, theme, priceMin, priceMax }),
    [category, size, gender, theme, priceMin, priceMax]
  );

  const priceBounds = useMemo(() => {
    if (items.length === 0) return { min: 0, max: 10000 };
    const prices = items.map((c) => getCostumePricingSummary(c).amount);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [items]);

  const facets = useMemo(() => {
    const sizes = new Set<string>();
    const genders = new Set<string>();
    const themes = new Set<string>();
    for (const item of items) {
      if (item.size) sizes.add(item.size);
      if (item.gender) genders.add(item.gender);
      if (item.theme) themes.add(item.theme);
    }
    return {
      sizes: [...sizes].sort(),
      genders: [...genders].sort(),
      themes: [...themes].sort(),
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const lo = priceMin ?? priceBounds.min;
    const hi = priceMax ?? priceBounds.max;
    return items.filter((c) => {
      const amount = getCostumePricingSummary(c).amount;
      return amount >= lo && amount <= hi;
    });
  }, [items, priceMin, priceMax, priceBounds]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (user?.role === "ADMIN") router.replace("/admin");
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (!user) {
      setSavedIds(new Set());
      return;
    }
    myWishlist()
      .then((list) => setSavedIds(new Set(list.map((i) => i.costume_id))))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    listCostumes(serverQuery)
      .then((res) => {
        if (cancelled) return;
        setItems(res.data);
        setTotal(res.total);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "Failed to load costumes");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [serverQuery]);

  const canPrev = page > 1;
  const canNext = page * PAGE_SIZE < total;

  const showHero = useMemo(
    () =>
      !q &&
      !category &&
      !size &&
      !gender &&
      !theme &&
      !sort &&
      view === "grid" &&
      page === 1 &&
      priceMin === undefined &&
      priceMax === undefined,
    [q, category, size, gender, theme, sort, view, page, priceMin, priceMax]
  );

  const scrollToMarketplace = useCallback(() => {
    document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    setHeroActive(showHero);
    if (showHero) {
      resetHeroNav();
    } else {
      revealNav();
    }
  }, [showHero, setHeroActive, revealNav, resetHeroNav]);

  useEffect(() => {
    if (!showHero) return;
    const hero = document.getElementById("hero-splash");
    if (!hero) return;

    let ticking = false;

    const syncNavWithScroll = () => {
      const heroBottom = hero.getBoundingClientRect().bottom;
      if (heroBottom > window.innerHeight * 0.5) {
        resetHeroNav();
      } else {
        revealNav();
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        syncNavWithScroll();
        ticking = false;
      });
    };

    syncNavWithScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [showHero, revealNav, resetHeroNav]);

  function handleFilterChange(next: Partial<MarketplaceFilters>) {
    const updates: Record<string, string | null> = {};
    const keys = ["category", "size", "gender", "theme"] as const;
    for (const key of keys) {
      if (key in next) {
        updates[key] = next[key] || null;
      }
    }
    if ("priceMin" in next) {
      updates.priceMin = next.priceMin !== undefined ? String(next.priceMin) : null;
    }
    if ("priceMax" in next) {
      updates.priceMax = next.priceMax !== undefined ? String(next.priceMax) : null;
    }
    updateParams(updates);
  }

  function handleRemoveFilter(key: keyof MarketplaceFilters | "q") {
    if (key === "q") {
      updateParams({ q: null });
      return;
    }
    if (key === "priceMin" || key === "priceMax") {
      updateParams({ priceMin: null, priceMax: null });
      return;
    }
    updateParams({ [key]: null });
  }

  function handleClearAll() {
    router.replace("/");
  }

  if (user?.role === "ADMIN") return null;

  return (
    <div className="marketplace-shell flex flex-1 flex-col">
      {showHero ? (
        <HeroSplash onBrowse={scrollToMarketplace} />
      ) : (
        <div className="border-b border-border bg-card/60">
          <div className="marketplace-content flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <h1 className="font-display text-xl font-semibold text-foreground md:text-2xl">
                Snap Into Character
              </h1>
              <p className="text-sm text-muted-foreground">
                Browse curated costumes for parties, shoots, and theatre.
              </p>
            </div>
            {total > 0 && (
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {total} costume{total === 1 ? "" : "s"} available
              </p>
            )}
          </div>
        </div>
      )}

      <div
        id="marketplace"
        className="marketplace-content scroll-mt-[calc(var(--navbar-height)+1rem)]"
      >
        {showHero && (
          <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-6">
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground md:text-3xl">
                Marketplace
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Filter, sort, and find your next look.
              </p>
            </div>
            {total > 0 && (
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {total} costume{total === 1 ? "" : "s"} available
              </p>
            )}
          </header>
        )}
        {isApprovedVendor && user && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-4">
              {(["all", "mine"] as const).map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => {
                    setOwnerScope(scope);
                    updateParams({});
                  }}
                  className={cn(
                    "pb-1 text-xs font-semibold uppercase tracking-widest transition-colors",
                    ownerScope === scope
                      ? "border-b-2 border-primary text-primary"
                      : "border-b-2 border-transparent text-muted-foreground hover:text-primary"
                  )}
                >
                  {scope === "all" ? "All Listings" : "My Listings"}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {ownerScope === "mine" ? "Viewing your catalog" : "Viewing the full catalog"}
            </p>
          </div>
        )}

        <div className="flex gap-6 lg:gap-8">
          <FilterSidebar
            filters={filters}
            facets={facets}
            priceBounds={priceBounds}
            onChange={handleFilterChange}
            className="hidden lg:block"
          />

          <div className="min-w-0 flex-1 space-y-4">
            <ResultsToolbar
              count={filteredItems.length}
              total={total}
              sort={sort || "_newest"}
              view={view}
              onSortChange={(val) =>
                updateParams({ sort: val === "_newest" ? null : val })
              }
              onViewChange={(v) => updateParams({ view: v === "grid" ? null : v })}
            />

            <FilterChips
              filters={filters}
              query={q}
              priceBounds={priceBounds}
              onRemove={handleRemoveFilter}
              onClearAll={handleClearAll}
            />

            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {view === "grid" ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 md:gap-5">
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => <CostumeCardSkeleton key={i} />)
                  : filteredItems.length
                    ? filteredItems.map((c) => (
                        <CostumeCard key={c.id} costume={c} savedIds={savedIds} variant="grid" />
                      ))
                    : (
                      <EmptyState scope={ownerScope} />
                    )}
              </div>
            ) : (
              <div className="space-y-3">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => <CostumeCardSkeleton key={i} variant="list" />)
                  : filteredItems.length
                    ? filteredItems.map((c) => (
                        <CostumeCard key={c.id} costume={c} savedIds={savedIds} variant="list" />
                      ))
                    : (
                      <EmptyState scope={ownerScope} />
                    )}
              </div>
            )}

            {(canPrev || canNext) && (
              <div className="flex items-center justify-center gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canPrev || isLoading}
                  onClick={() => updateParams({ page: String(page - 1) }, false)}
                  className="rounded-xl"
                >
                  <ChevronLeft className="mr-1 size-4" />
                  Prev
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page}
                  {total > 0 && ` of ${Math.ceil(total / PAGE_SIZE)}`}
                </span>
                <Button
                  type="button"
                  disabled={!canNext || isLoading}
                  onClick={() => updateParams({ page: String(page + 1) }, false)}
                  className="rounded-xl"
                >
                  Next
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ scope }: { scope: "all" | "mine" }) {
  return (
    <div className="col-span-full rounded-xl border border-border bg-card p-16 text-center">
      <div className="mb-4 flex justify-center text-muted-foreground/30">
        <Search className="size-10" />
      </div>
      <p className="font-display text-2xl text-foreground">
        {scope === "mine" ? "No listings yet." : "No costumes found."}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {scope === "mine"
          ? "You do not have any listings that match the current filters."
          : "Try adjusting your filters or search terms."}
      </p>
      <Link href="/" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
        Clear all filters
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="marketplace-shell flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading marketplace…</p>
        </div>
      }
    >
      <MarketplacePageInner />
    </Suspense>
  );
}
