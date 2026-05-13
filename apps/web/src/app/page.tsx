"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../lib/api";
import { CostumeCard, CostumeCardSkeleton } from "../components/CostumeCard";
import { listCostumes, type Costume, type CostumeListQuery } from "../lib/costumes";
import { myWishlist } from "../lib/account";
import { useAuth } from "../lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MagnifyingGlassIcon as Search, ChevronLeftIcon as ChevronLeft, ChevronRightIcon as ChevronRight, ExclamationTriangleIcon as AlertCircle } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

const sortOptions = [
  { value: "_newest",   label: "Newest" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc",label: "Price: High → Low" },
] as const;

const categoryFilters = [
  { value: "",          label: "All" },
  { value: "superhero", label: "Superhero" },
  { value: "halloween", label: "Halloween" },
  { value: "historical",label: "Historical" },
  { value: "fantasy",   label: "Fantasy" },
  { value: "anime",     label: "Anime" },
  { value: "theatrical",label: "Theatrical" },
  { value: "vintage",   label: "Vintage" },
  { value: "sci_fi",    label: "Sci-Fi" },
];

// Animated spotlight words
const spotlightWords = ["Extraordinary", "Theatrical", "Unforgettable", "Iconic"];

export default function Home() {
  const { user } = useAuth();
  const [query, setQuery]         = useState<CostumeListQuery>({ page: 1, pageSize: 12 });
  const [qText, setQText]         = useState("");
  const [items, setItems]         = useState<Costume[]>([]);
  const [total, setTotal]         = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [wordIdx, setWordIdx]     = useState(0);
  const [wordVisible, setWordVisible] = useState(true);
  const [savedIds, setSavedIds]   = useState<Set<number>>(new Set());

  const canPrev = (query.page || 1) > 1;
  const canNext = useMemo(() => {
    const page     = query.page || 1;
    const pageSize = query.pageSize || 12;
    return page * pageSize < total;
  }, [query.page, query.pageSize, total]);

  // Cycling spotlight words
  useEffect(() => {
    const interval = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => {
        setWordIdx((i) => (i + 1) % spotlightWords.length);
        setWordVisible(true);
      }, 300);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Fetch wishlist IDs so hearts show correct state
  useEffect(() => {
    if (!user) { setSavedIds(new Set()); return; }
    myWishlist()
      .then((items) => setSavedIds(new Set(items.map((i) => i.costume_id))))
      .catch(() => {});
  }, [user]);

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
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "Failed to load costumes");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [query]);

  return (
    <div className="flex flex-1 flex-col bg-background">

      {/* ─── Hero ─── */}
      <section className="relative px-6 pb-24 pt-32 text-center max-w-[1000px] mx-auto flex flex-col items-center">
        <div className="animate-fade-up">
          <div className="inline-flex items-center rounded-sm border border-border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Premium Costume Rentals
          </div>
        </div>

        <h1
          className="animate-fade-up-delay-1 mt-10 font-playfair font-semibold text-foreground tracking-tight"
          style={{
            fontSize: "clamp(3rem, 8vw, 6.5rem)",
            lineHeight: 1.05,
          }}
        >
          Wear Something{" "}
          <span
            className="inline-block italic text-muted-foreground"
            style={{
              minWidth: "8ch",
              transition: "opacity 400ms ease, transform 400ms ease",
              opacity: wordVisible ? 1 : 0,
              transform: wordVisible ? "translateY(0)" : "translateY(12px)",
            }}
          >
            {spotlightWords[wordIdx]}
          </span>
        </h1>

        <p className="animate-fade-up-delay-2 mt-8 max-w-[600px] text-lg leading-relaxed text-muted-foreground">
          Browse curated costumes for parties, shoots, events, and theatre.
          Book with clear pricing and instant availability.
        </p>

        {/* Search bar */}
        <form
          id="costume-search-form"
          className="animate-fade-up-delay-3 mt-16 w-full max-w-[800px]"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery((q) => ({ ...q, q: qText.trim() || undefined, page: 1 }));
          }}
        >
          <div className="flex flex-col md:flex-row items-center gap-4 rounded-md border border-border bg-card p-2">
            <Search className="ml-3 h-5 w-5 text-muted-foreground shrink-0 hidden md:block" />
            <Input
              id="search-input"
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="Search: pirate, vintage, superhero…"
              aria-label="Search costumes"
              className="flex-1 h-12 border-0 bg-transparent text-base focus-visible:ring-0 px-4 md:px-2 rounded-none placeholder:text-muted-foreground/60 shadow-none"
            />
            <div className="h-8 w-px bg-border hidden md:block" />
            <Select
              value={query.sort || "_newest"}
              onValueChange={(val: string) =>
                setQuery((q) => ({
                  ...q,
                  sort: (val === "_newest" ? undefined : val) as CostumeListQuery["sort"],
                  page: 1,
                }))
              }
            >
              <SelectTrigger
                id="sort-select"
                aria-label="Sort costumes"
                className="w-full md:w-[200px] h-12 border-0 bg-transparent focus:ring-0 rounded-none text-base shadow-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border shadow-none">
                {sortOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-foreground">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              id="search-btn"
              type="submit"
              className="w-full md:w-auto h-12 px-8 rounded-md bg-foreground text-background font-semibold tracking-widest uppercase text-xs hover:bg-foreground/90"
            >
              Search
            </Button>
          </div>
        </form>

        {/* Stats */}
        <div className="animate-fade-up-delay-3 mt-20 flex flex-wrap justify-center gap-16 md:gap-32 border-t border-border pt-12 w-full max-w-[800px]">
          {[
            { label: "Costumes",   value: total > 0 ? `${total}+` : "..." },
            { label: "Categories", value: "12+" },
            { label: "Avg. Rating",value: "4.9 ★" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center flex flex-col gap-3">
              <div className="text-3xl md:text-5xl font-semibold font-playfair text-foreground">
                {value}
              </div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Category pills ─── */}
      <section className="px-6 pb-16 pt-8" aria-label="Filter by category">
        <div className="mx-auto flex max-w-[1200px] gap-8 overflow-x-auto justify-start md:justify-center">
          {categoryFilters.map(({ value, label }) => {
            const isActive = (query.category || "") === value;
            return (
              <button
                key={value}
                type="button"
                id={`category-${value || "all"}`}
                onClick={() =>
                  setQuery((q) => ({ ...q, category: value || undefined, page: 1 }))
                }
                className={cn(
                  "shrink-0 text-xs font-semibold uppercase tracking-widest whitespace-nowrap pb-2 transition-all",
                  isActive
                    ? "text-foreground border-b-2 border-foreground"
                    : "text-muted-foreground border-b-2 border-transparent hover:text-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── Listings ─── */}
      <section
        className="mx-auto w-full max-w-[1200px] px-6 pb-32 pt-8"
        aria-label="Costume listings"
      >
        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-10 rounded-md border-border bg-transparent">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Grid */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-x-6 gap-y-12">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <CostumeCardSkeleton key={i} />)
            : items.length
              ? items.map((c) => <CostumeCard key={c.id} costume={c} savedIds={savedIds} />)
              : (
                <div className="col-span-full rounded-md border border-border bg-transparent p-24 text-center">
                  <div className="mb-6 flex justify-center text-muted-foreground/30">
                    <Search className="size-12" />
                  </div>
                  <p className="font-playfair text-3xl text-foreground">
                    No costumes found.
                  </p>
                  <p className="mt-4 text-muted-foreground">Try adjusting your filters or search terms.</p>
                </div>
              )}
        </div>

        {/* Pagination */}
        {(canPrev || canNext) && (
          <div className="mt-20 flex items-center justify-center gap-6">
            <Button
              id="prev-page-btn"
              type="button"
              variant="outline"
              disabled={!canPrev || isLoading}
              onClick={() =>
                setQuery((q) => ({ ...q, page: Math.max(1, (q.page || 1) - 1) }))
              }
              className="h-12 px-6 rounded-md border border-border bg-transparent text-xs font-semibold uppercase tracking-widest text-foreground hover:bg-muted"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Prev
            </Button>
            <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Page {query.page || 1} {total > 0 && `of ${Math.ceil(total / (query.pageSize || 12))}`}
            </span>
            <Button
              id="next-page-btn"
              type="button"
              disabled={!canNext || isLoading}
              onClick={() =>
                setQuery((q) => ({ ...q, page: (q.page || 1) + 1 }))
              }
              className="h-12 px-6 rounded-md border-0 bg-foreground text-background text-xs font-semibold uppercase tracking-widest hover:bg-foreground/90"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
