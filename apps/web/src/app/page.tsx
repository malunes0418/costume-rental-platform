"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { ApiError } from "../lib/api";
import { CostumeCard, CostumeCardSkeleton } from "../components/CostumeCard";
import { listCostumes, type Costume, type CostumeListQuery } from "../lib/costumes";
import { myWishlist } from "../lib/account";
import { useAuth } from "../lib/auth";
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
import { MarketplaceHero } from "@/components/marketplace/MarketplaceHero";
import { MarketplaceLoadingStage } from "@/components/marketplace/MarketplaceLoadingStage";

const PAGE_SIZE = 12;

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function MarketplacePageInner() {
  const { user, isLoading: isAuthLoading } = useAuth();
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
        <MarketplaceHero
          variant="browse"
          total={total}
          filteredCount={filteredItems.length}
          query={q}
          category={category}
        />
      )}

      <div
        id="marketplace"
        className="marketplace-content scroll-mt-[calc(var(--navbar-height)+1rem)]"
      >
        {showHero && (
          <MarketplaceHero
            variant="section"
            total={total}
            filteredCount={filteredItems.length}
            query={q}
            category={category}
          />
        )}
        {isApprovedVendor && user && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
            <div className="marketplace-segment" role="group" aria-label="Catalog scope">
              {(["all", "mine"] as const).map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => {
                    setOwnerScope(scope);
                    updateParams({});
                  }}
                  className={cn(
                    "marketplace-segment-btn text-muted-foreground",
                    ownerScope === scope && "marketplace-segment-btn--active"
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
              <div className="marketplace-card-grid grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 md:gap-5">
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
    <div className="marketplace-empty-stage col-span-full rounded-2xl border border-border p-12 text-center sm:p-16">
      <div className="mb-5 flex justify-center">
        <span className="flex size-16 items-center justify-center rounded-2xl border border-border bg-muted/50 text-muted-foreground/40">
          <Search className="size-8" />
        </span>
      </div>
      <p className="font-display text-2xl text-foreground md:text-3xl">
        {scope === "mine" ? "No listings on stage yet." : "No costumes in the wings."}
      </p>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {scope === "mine"
          ? "None of your listings match the current filters — try widening the search or clearing filters."
          : "Adjust filters or search terms — the right character might be one category away."}
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-full bg-primary px-6 text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 hover-snap"
      >
        Clear all filters
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<MarketplaceLoadingStage />}>
      <MarketplacePageInner />
    </Suspense>
  );
}
