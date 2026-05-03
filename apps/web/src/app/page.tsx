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
import { Search, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const sortOptions = [
  { value: "_newest",   label: "Newest" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc",label: "Price: High → Low" },
] as const;

const categoryFilters = [
  { value: "",          label: "All" },
  { value: "superhero", label: "🦸 Superhero" },
  { value: "halloween", label: "🎃 Halloween" },
  { value: "historical",label: "👑 Historical" },
  { value: "fantasy",   label: "🧙 Fantasy" },
  { value: "anime",     label: "⛩️ Anime" },
  { value: "theatrical",label: "🎭 Theatrical" },
  { value: "vintage",   label: "🎩 Vintage" },
  { value: "sci_fi",    label: "🚀 Sci-Fi" },
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
              "radial-gradient(ellipse at center, rgba(196,16,42,0.12) 0%, rgba(200,155,60,0.05) 40%, transparent 70%)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-[800px]">
          {/* Eyebrow badge */}
          <div className="animate-fade-up">
            <Badge
              variant="secondary"
              className="rounded-full border px-4 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em]"
              style={{
                background: "var(--clr-gold-dim)",
                color: "var(--clr-gold-light)",
                border: "1px solid rgba(200,155,60,0.3)",
              }}
            >
              🎭 Premium Costume Rentals
            </Badge>
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-up-delay-1 mt-5"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.4rem, 6vw, 4.5rem)",
              fontWeight: 900,
              lineHeight: 1.08,
              color: "var(--clr-text)",
              letterSpacing: "-0.02em",
            }}
          >
            Wear Something{" "}
            <span
              className="inline-block italic"
              style={{
                color: "var(--clr-gold-light)",
                minWidth: "8ch",
                transition: "opacity 300ms ease, transform 300ms ease",
                opacity: wordVisible ? 1 : 0,
                transform: wordVisible ? "translateY(0)" : "translateY(8px)",
              }}
            >
              {spotlightWords[wordIdx]}
            </span>
          </h1>

          <p
            className="animate-fade-up-delay-2 mx-auto mt-5 max-w-[520px] text-[1.05rem] leading-[1.7]"
            style={{ color: "var(--clr-text-muted)" }}
          >
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
            <div
              className="flex flex-col gap-3 rounded-2xl border p-2.5 shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
              style={{ background: "var(--clr-surface)", borderColor: "var(--clr-border)" }}
            >
              <div className="flex flex-wrap gap-2">
                <Input
                  id="search-input"
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Search: pirate, vintage, superhero…"
                  aria-label="Search costumes"
                  className="flex-1 min-w-[160px] border-white/10 bg-[var(--clr-surface-2)] text-[var(--clr-text)] placeholder:text-[var(--clr-text-dim)] focus-visible:ring-[var(--clr-gold)]/30 focus-visible:border-[var(--clr-gold)] rounded-xl text-[0.9rem]"
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
                    className="w-auto min-w-[160px] border-white/10 bg-[var(--clr-surface-2)] text-[var(--clr-text)] rounded-xl text-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: "var(--clr-surface-2)", border: "1px solid var(--clr-border)" }}>
                    {sortOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value} style={{ color: "var(--clr-text)" }}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  id="search-btn"
                  type="submit"
                  className="rounded-xl px-6 text-white border-0"
                  style={{ background: "var(--clr-crimson)" }}
                >
                  <Search data-icon="inline-start" />
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
                <div
                  className="text-[1.4rem] font-bold"
                  style={{ fontFamily: "var(--font-display)", color: "var(--clr-gold-light)" }}
                >
                  {value}
                </div>
                <div
                  className="mt-0.5 text-[0.72rem] uppercase tracking-[0.06em]"
                  style={{ color: "var(--clr-text-dim)" }}
                >
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
                  "shrink-0 rounded-full text-[0.8rem] font-medium whitespace-nowrap px-4",
                  isActive
                    ? "border-0 text-white shadow-[0_0_16px_var(--clr-crimson-glow)]"
                    : "border-white/10 bg-transparent text-[var(--clr-text-muted)] hover:text-[var(--clr-text)] hover:bg-white/5"
                )}
                style={isActive ? { background: "var(--clr-crimson)" } : {}}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </section>

      <Separator className="mx-auto max-w-[1200px] bg-white/5" />

      {/* ─── Listings ─── */}
      <section
        className="mx-auto w-full max-w-[1200px] px-6 pb-20 pt-6"
        aria-label="Costume listings"
      >
        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-6 border-red-500/30 bg-red-500/10">
            <AlertCircle className="size-4" />
            <AlertDescription style={{ color: "#f87171" }}>{error}</AlertDescription>
          </Alert>
        )}

        {/* Grid */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <CostumeCardSkeleton key={i} />)
            : items.length
              ? items.map((c) => <CostumeCard key={c.id} costume={c} />)
              : (
                <div
                  className="col-span-full rounded-2xl border p-16 text-center"
                  style={{ background: "var(--clr-surface)", borderColor: "var(--clr-border)" }}
                >
                  <div className="mb-4 text-5xl">🎭</div>
                  <p className="text-[1.1rem]" style={{ color: "var(--clr-text-muted)", fontFamily: "var(--font-display)" }}>
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
              className="rounded-full border-white/10 bg-transparent text-[var(--clr-text-muted)] hover:bg-white/5 hover:text-[var(--clr-text)] gap-1"
            >
              <ChevronLeft data-icon="inline-start" />
              Prev
            </Button>
            <span
              className="text-sm tabular-nums"
              style={{ color: "var(--clr-text-muted)" }}
            >
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
              className="rounded-full text-white border-0 gap-1"
              style={{ background: "var(--clr-crimson)" }}
            >
              Next
              <ChevronRight data-icon="inline-end" />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
