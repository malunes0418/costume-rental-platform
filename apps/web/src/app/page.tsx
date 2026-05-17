"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon as AlertCircle,
  MagnifyingGlassIcon,
  MixerHorizontalIcon,
} from "@radix-ui/react-icons";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CostumeCard, CostumeCardSkeleton } from "../components/CostumeCard";
import { ApiError } from "../lib/api";
import { myWishlist } from "../lib/account";
import { useAuth } from "../lib/auth";
import { listCostumes, type Costume, type CostumeListQuery } from "../lib/costumes";

const sortOptions = [
  { value: "_newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
] as const;

const categoryFilters = [
  { value: "", label: "All categories" },
  { value: "superhero", label: "Superhero" },
  { value: "halloween", label: "Halloween" },
  { value: "historical", label: "Historical" },
  { value: "fantasy", label: "Fantasy" },
  { value: "anime", label: "Anime" },
  { value: "theatrical", label: "Theatrical" },
  { value: "vintage", label: "Vintage" },
  { value: "sci_fi", label: "Sci-Fi" },
] as const;

const DISCOVERY_NOTES = [
  {
    step: "01",
    title: "Browse curated looks",
    body: "Start with costumes that already feel selected, not buried in an overwhelming catalog.",
  },
  {
    step: "02",
    title: "Compare details quickly",
    body: "See category, pricing, and visual style early so shortlists become easier to trust.",
  },
  {
    step: "03",
    title: "Book with fewer surprises",
    body: "Use clear filters and listing details to move toward availability and checkout with confidence.",
  },
] as const;

export default function Home() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState<CostumeListQuery>({ page: 1, pageSize: 12 });
  const [qText, setQText] = useState("");
  const [items, setItems] = useState<Costume[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const isApprovedVendor = user?.vendor_status === "APPROVED";
  const listingScope = query.ownerId === user?.id ? "mine" : "all";
  const scopeLabel = listingScope === "mine" ? "Viewing your listings" : "Viewing all listings";

  const canPrev = (query.page || 1) > 1;
  const canNext = useMemo(() => {
    const page = query.page || 1;
    const pageSize = query.pageSize || 12;
    return page * pageSize < total;
  }, [query.page, query.pageSize, total]);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / (query.pageSize || 12))),
    [query.pageSize, total]
  );
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (query.q) count += 1;
    if (query.category) count += 1;
    if (query.sort) count += 1;
    if (listingScope === "mine") count += 1;
    return count;
  }, [listingScope, query.category, query.q, query.sort]);
  const secondaryCtaHref = user
    ? isApprovedVendor
      ? "/vendor"
      : "/vendor/apply"
    : "/register";
  const secondaryCtaLabel = user
    ? isApprovedVendor
      ? "Open vendor workspace"
      : "List your collection"
    : "Create account";
  const supportingMessage = user
    ? isApprovedVendor
      ? "Manage your listings, reservations, and storefront from one workspace."
      : "Vendors can apply, publish curated listings, and manage bookings in one place."
    : "Renters can browse and book. Vendors can list curated collections and manage reservations.";
  const resultsTitle = query.q
    ? `Results for "${query.q}"`
    : listingScope === "mine"
      ? "Your live catalog"
      : "All available costumes";
  const resultsCopy =
    activeFilterCount > 0
      ? "Your current filters are narrowing the catalog."
      : "Browse costumes with pricing, category, and visual cues surfaced early.";

  useEffect(() => {
    if (isAuthLoading) return;
    if (user?.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (!user) {
      setSavedIds(new Set());
      return;
    }

    myWishlist()
      .then((wishlistItems) => setSavedIds(new Set(wishlistItems.map((item) => item.costume_id))))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (isAuthLoading || isApprovedVendor) return;
    setQuery((currentQuery) =>
      currentQuery.ownerId === undefined
        ? currentQuery
        : { ...currentQuery, ownerId: undefined, page: 1 }
    );
  }, [isApprovedVendor, isAuthLoading]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    listCostumes(query)
      .then((res) => {
        if (cancelled) return;
        setItems(res.data);
        setTotal(res.total);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load costumes");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  function applySearchFilters() {
    setQuery((currentQuery) => ({
      ...currentQuery,
      q: qText.trim() || undefined,
      page: 1,
    }));
  }

  function clearFilters() {
    setQText("");
    setQuery((currentQuery) => ({
      ...currentQuery,
      q: undefined,
      category: undefined,
      sort: undefined,
      ownerId: isApprovedVendor && user && listingScope === "mine" ? user.id : undefined,
      page: 1,
    }));
  }

  if (user?.role === "ADMIN") {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <section className="relative overflow-hidden px-6 pb-12 pt-10 md:pb-16 md:pt-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,color-mix(in_oklab,var(--color-brand)_10%,transparent)_0%,transparent_72%)]"
        />
        <div className="mx-auto grid w-full max-w-[1240px] gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,420px)] lg:items-start">
          <div className="surface-shell relative overflow-hidden rounded-[var(--radius-xl)] p-8 md:p-10 animate-fade-up">
            <div className="max-w-3xl">
              <div className="brand-eyebrow inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em]">
                <span className="inline-block size-1.5 rounded-full bg-gold" />
                Premium costume rentals
              </div>

              <h1 className="mt-6 max-w-2xl font-display text-4xl text-foreground sm:text-5xl lg:text-[3.9rem]">
                Rent the right costume without second-guessing the catalog.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                SnapCos brings curated costumes, clear pricing, and practical search into one
                calmer browsing flow for parties, productions, themed events, and shoots.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#catalog-results"
                  className={cn(
                    buttonVariants({ variant: "brand", size: "lg" }),
                    "rounded-full px-5 text-xs font-semibold uppercase tracking-[0.22em]"
                  )}
                >
                  Browse catalog
                  <ArrowRightIcon className="size-4" />
                </a>
                <Link
                  href={secondaryCtaHref}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "rounded-full px-5 text-xs font-semibold uppercase tracking-[0.22em]"
                  )}
                >
                  {secondaryCtaLabel}
                </Link>
              </div>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                {supportingMessage}
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {DISCOVERY_NOTES.map((note) => (
                  <div
                    key={note.step}
                    className="rounded-[var(--radius-lg)] border border-border bg-background/72 p-4"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      {note.step}
                    </p>
                    <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-foreground">
                      {note.title}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{note.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="surface-panel rounded-[var(--radius-xl)] p-6 md:p-7 animate-fade-up-delay-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Refine the catalog
                </p>
                <h2 className="mt-3 font-display text-3xl text-foreground">
                  Search by style, event, or character.
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                  Start broad, then narrow by category and price until the shortlist feels right.
                </p>
              </div>
              <div className="rounded-full border border-border bg-background p-2 text-muted-foreground">
                <MixerHorizontalIcon className="size-4" />
              </div>
            </div>

            <form
              id="costume-search-form"
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                applySearchFilters();
              }}
            >
              <div className="space-y-2">
                <label
                  htmlFor="search-input"
                  className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
                >
                  Search
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search-input"
                    value={qText}
                    onChange={(event) => setQText(event.target.value)}
                    placeholder="Pirate captain, fantasy armor, vintage glamour"
                    aria-label="Search costumes"
                    className="h-12 rounded-[var(--radius-md)] bg-background pl-11"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Category
                  </label>
                  <Select
                    value={query.category || "__all__"}
                    onValueChange={(value: string) =>
                      setQuery((currentQuery) => ({
                        ...currentQuery,
                        category: value === "__all__" ? undefined : value,
                        page: 1,
                      }))
                    }
                  >
                    <SelectTrigger
                      id="category-select"
                      aria-label="Filter by category"
                      className="h-12 rounded-[var(--radius-md)] bg-background"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="surface-elevated">
                      {categoryFilters.map((option) => (
                        <SelectItem
                          key={option.value || "__all__"}
                          value={option.value || "__all__"}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Sort
                  </label>
                  <Select
                    value={query.sort || "_newest"}
                    onValueChange={(value: string) =>
                      setQuery((currentQuery) => ({
                        ...currentQuery,
                        sort: (value === "_newest" ? undefined : value) as CostumeListQuery["sort"],
                        page: 1,
                      }))
                    }
                  >
                    <SelectTrigger
                      id="sort-select"
                      aria-label="Sort costumes"
                      className="h-12 rounded-[var(--radius-md)] bg-background"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="surface-elevated">
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  id="search-btn"
                  type="submit"
                  variant="brand"
                  className="h-12 flex-1 text-xs font-semibold uppercase tracking-[0.24em]"
                >
                  Search catalog
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 px-5 text-xs font-semibold uppercase tracking-[0.24em]"
                  onClick={clearFilters}
                  disabled={activeFilterCount === 0}
                >
                  Reset
                </Button>
              </div>
            </form>

            {isApprovedVendor && user ? (
              <div className="mt-6 rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Vendor view
                    </p>
                    <p className="mt-1 text-sm text-foreground">{scopeLabel}</p>
                  </div>
                  <div className="flex rounded-full border border-border bg-background p-1">
                    {[
                      { value: "all", label: "All" },
                      { value: "mine", label: "Mine" },
                    ].map(({ value, label }) => {
                      const isActive = listingScope === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setQuery((currentQuery) => ({
                              ...currentQuery,
                              ownerId: value === "mine" ? user.id : undefined,
                              page: 1,
                            }))
                          }
                          className={cn(
                            "rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors",
                            isActive
                              ? "bg-foreground text-background"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      <section
        id="catalog-results"
        className="mx-auto w-full max-w-[1240px] px-6 pb-28 pt-2"
        aria-label="Costume listings"
      >
        <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Catalog
            </p>
            <h2 className="mt-3 font-display text-3xl text-foreground md:text-4xl">
              {resultsTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {resultsCopy}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-background px-3 py-2 font-semibold uppercase tracking-[0.22em] text-foreground">
              {total} result{total === 1 ? "" : "s"}
            </span>
            {activeFilterCount > 0 ? (
              <span className="rounded-full border border-border bg-background px-3 py-2 font-semibold uppercase tracking-[0.22em]">
                {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
              </span>
            ) : null}
            {query.q ? (
              <span className="rounded-full border border-border bg-background px-3 py-2">
                {`Search: "${query.q}"`}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mb-8 flex gap-3 overflow-x-auto pb-2" aria-label="Filter by category">
          {categoryFilters.map(({ value, label }) => {
            const isActive = (query.category || "") === value;
            return (
              <button
                key={value || "__all__"}
                type="button"
                id={`category-${value || "all"}`}
                onClick={() =>
                  setQuery((currentQuery) => ({
                    ...currentQuery,
                    category: value || undefined,
                    page: 1,
                  }))
                }
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors",
                  isActive
                    ? "border-[color:color-mix(in_oklab,var(--color-brand)_22%,var(--color-border))] bg-[color:color-mix(in_oklab,var(--color-brand)_8%,var(--color-background))] text-[color:var(--color-brand)]"
                    : "border-border bg-background text-muted-foreground hover:border-[color:color-mix(in_oklab,var(--color-brand)_16%,var(--color-border))] hover:text-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {error ? (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, idx) => <CostumeCardSkeleton key={idx} />)
            : items.length
              ? items.map((costume) => (
                  <CostumeCard key={costume.id} costume={costume} savedIds={savedIds} />
                ))
              : (
                <div className="surface-panel col-span-full rounded-[var(--radius-xl)] p-12 text-center md:p-16">
                  <div className="mx-auto flex max-w-xl flex-col items-center">
                    <div className="mb-5 rounded-full border border-border bg-background p-4 text-muted-foreground">
                      <MagnifyingGlassIcon className="size-7" />
                    </div>
                    <h3 className="font-display text-3xl text-foreground">
                      {listingScope === "mine"
                        ? "No matching listings yet."
                        : "No matching costumes yet."}
                    </h3>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {listingScope === "mine"
                        ? "Switch back to all listings or loosen the current filters."
                        : "Try a broader search or clear the current filters."}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-6"
                      onClick={clearFilters}
                    >
                      Reset filters
                    </Button>
                  </div>
                </div>
              )}
        </div>

        {canPrev || canNext ? (
          <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-[var(--radius-xl)] border border-border bg-background/70 p-4 sm:flex-row">
            <div className="text-sm text-muted-foreground">
              Page {query.page || 1} of {totalPages}
            </div>
            <div className="flex items-center gap-3">
              <Button
                id="prev-page-btn"
                type="button"
                variant="outline"
                disabled={!canPrev || isLoading}
                onClick={() =>
                  setQuery((currentQuery) => ({
                    ...currentQuery,
                    page: Math.max(1, (currentQuery.page || 1) - 1),
                  }))
                }
              >
                <ChevronLeftIcon className="size-4" />
                Previous
              </Button>
              <Button
                id="next-page-btn"
                type="button"
                variant="brand"
                disabled={!canNext || isLoading}
                onClick={() =>
                  setQuery((currentQuery) => ({
                    ...currentQuery,
                    page: (currentQuery.page || 1) + 1,
                  }))
                }
              >
                Next
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
