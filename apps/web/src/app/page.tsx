"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../lib/api";
import { CostumeCard, CostumeCardSkeleton } from "../components/CostumeCard";
import { listCostumes, type Costume, type CostumeListQuery } from "../lib/costumes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
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
  const [query, setQuery]         = useState<CostumeListQuery>({ page: 1, pageSize: 12 });
  const [qText, setQText]         = useState("");
  const [items, setItems]         = useState<Costume[]>([]);
  const [total, setTotal]         = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [wordIdx, setWordIdx]     = useState(0);
  const [wordVisible, setWordVisible] = useState(true);

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
    <div className="flex flex-1 flex-col">

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden px-6 pb-16 pt-20 text-center">
        {/* Background radial glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{
            top: "-20%",
            width: "900px",
            height: "600px",
            background:
              "radial-gradient(ellipse at center, rgba(200,155,60,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-[800px]">
          {/* Eyebrow badge */}
          <div className="animate-fade-up">
            <Badge
              variant="secondary"
              className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-primary"
            >
              Premium Costume Rentals
            </Badge>
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-up-delay-1 mt-5 display font-black text-foreground"
            style={{
              fontSize: "clamp(2.4rem, 6vw, 4.5rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
            }}
          >
            Wear Something{" "}
            <span
              className="inline-block italic text-primary"
              style={{
                minWidth: "8ch",
                transition: "opacity 300ms ease, transform 300ms ease",
                opacity: wordVisible ? 1 : 0,
                transform: wordVisible ? "translateY(0)" : "translateY(8px)",
              }}
            >
              {spotlightWords[wordIdx]}
            </span>
          </h1>

          <p className="animate-fade-up-delay-2 mx-auto mt-5 max-w-[520px] text-[1.05rem] leading-[1.7] text-muted-foreground">
            Browse curated costumes for parties, shoots, events, and theatre.
            Book with clear pricing and instant availability.
          </p>

          {/* Search bar */}
          <form
            id="costume-search-form"
            className="animate-fade-up-delay-3 mx-auto mt-10 max-w-[680px]"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery((q) => ({ ...q, q: qText.trim() || undefined, page: 1 }));
            }}
          >
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-2.5 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
              <div className="flex flex-wrap gap-2">
                <Input
                  id="search-input"
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Search: pirate, vintage, superhero…"
                  aria-label="Search costumes"
                  className="flex-1 min-w-[160px] border-border bg-muted text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 focus-visible:border-primary rounded-xl text-[0.9rem]"
                />
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
                    className="w-auto min-w-[160px] border-border bg-muted text-foreground rounded-xl text-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border border-border">
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
                  className="rounded-xl px-6 text-primary-foreground border-0 bg-primary hover:bg-primary/90"
                >
                  <Search data-icon="inline-start" className="mr-2 size-4" />
                  Search
                </Button>
              </div>
            </div>
          </form>

          {/* Stats */}
          <div className="animate-fade-up-delay-3 mt-8 flex flex-wrap justify-center gap-8">
            {[
              { label: "Costumes",   value: total > 0 ? `${total}+` : "..." },
              { label: "Categories", value: "12+" },
              { label: "Avg. Rating",value: "4.9 ★" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-[1.4rem] font-bold display text-primary">
                  {value}
                </div>
                <div className="mt-0.5 text-[0.72rem] uppercase tracking-[0.06em] text-muted-foreground">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Category pills ─── */}
      <section className="overflow-x-auto px-6 pb-6" aria-label="Filter by category">
        <div className="mx-auto flex max-w-[1200px] gap-2" style={{ flexWrap: "nowrap" }}>
          {categoryFilters.map(({ value, label }) => {
            const isActive = (query.category || "") === value;
            return (
              <Button
                key={value}
                type="button"
                id={`category-${value || "all"}`}
                size="sm"
                variant={isActive ? "default" : "outline"}
                onClick={() =>
                  setQuery((q) => ({ ...q, category: value || undefined, page: 1 }))
                }
                className={cn(
                  "shrink-0 rounded-full text-[0.8rem] font-medium whitespace-nowrap px-4 border-0",
                  isActive
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </section>

      <Separator className="mx-auto max-w-[1200px] bg-border" />

      {/* ─── Listings ─── */}
      <section
        className="mx-auto w-full max-w-[1200px] px-6 pb-20 pt-6"
        aria-label="Costume listings"
      >
        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-6 border-destructive/30 bg-destructive/10">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-destructive text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Grid */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <CostumeCardSkeleton key={i} />)
            : items.length
              ? items.map((c) => <CostumeCard key={c.id} costume={c} />)
              : (
                <div className="col-span-full rounded-3xl border border-border bg-card p-16 text-center">
                  <div className="mb-4 flex justify-center text-muted-foreground/30">
                    <Search className="size-16" />
                  </div>
                  <p className="text-[1.1rem] text-muted-foreground display">
                    No costumes found. Try a different search.
                  </p>
                </div>
              )}
        </div>

        {/* Pagination */}
        {(canPrev || canNext) && (
          <div className="mt-12 flex items-center justify-center gap-4">
            <Button
              id="prev-page-btn"
              type="button"
              variant="outline"
              size="sm"
              disabled={!canPrev || isLoading}
              onClick={() =>
                setQuery((q) => ({ ...q, page: Math.max(1, (q.page || 1) - 1) }))
              }
              className="rounded-full border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground gap-1"
            >
              <ChevronLeft className="size-4" data-icon="inline-start" />
              Prev
            </Button>
            <span className="text-sm tabular-nums text-muted-foreground">
              Page {query.page || 1}
              {total > 0 && ` · ${total} total`}
            </span>
            <Button
              id="next-page-btn"
              type="button"
              size="sm"
              disabled={!canNext || isLoading}
              onClick={() =>
                setQuery((q) => ({ ...q, page: (q.page || 1) + 1 }))
              }
              className="rounded-full text-primary-foreground border-0 gap-1 bg-primary hover:bg-primary/90"
            >
              Next
              <ChevronRight className="size-4" data-icon="inline-end" />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
