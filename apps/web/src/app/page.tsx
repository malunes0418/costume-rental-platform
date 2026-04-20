"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../lib/api";
import { CostumeCard, CostumeCardSkeleton } from "../components/CostumeCard";
import { listCostumes, type Costume, type CostumeListQuery } from "../lib/costumes";

const sortOptions = [
  { value: "", label: "Newest" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
] as const;

const categoryFilters = [
  { value: "", label: "All" },
  { value: "superhero", label: "🦸 Superhero" },
  { value: "halloween", label: "🎃 Halloween" },
  { value: "historical", label: "👑 Historical" },
  { value: "fantasy", label: "🧙 Fantasy" },
  { value: "anime", label: "⛩️ Anime" },
  { value: "theatrical", label: "🎭 Theatrical" },
  { value: "vintage", label: "🎩 Vintage" },
  { value: "sci_fi", label: "🚀 Sci-Fi" },
];

// Animated spotlight words
const spotlightWords = ["Extraordinary", "Theatrical", "Unforgettable", "Iconic"];

export default function Home() {
  const [query, setQuery] = useState<CostumeListQuery>({ page: 1, pageSize: 12 });
  const [qText, setQText] = useState("");
  const [items, setItems] = useState<Costume[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wordIdx, setWordIdx] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);

  const canPrev = (query.page || 1) > 1;
  const canNext = useMemo(() => {
    const page = query.page || 1;
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
    <div style={{ flex: 1 }}>
      {/* ─── Hero ─── */}
      <section
        style={{
          position: "relative",
          padding: "5rem 1.5rem 4rem",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        {/* Background radial glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "900px",
            height: "600px",
            background:
              "radial-gradient(ellipse at center, rgba(196,16,42,0.12) 0%, rgba(200,155,60,0.05) 40%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "800px",
            margin: "0 auto",
          }}
        >
          {/* Eyebrow */}
          <div className="animate-fade-up">
            <span className="badge-gold">🎭 Premium Costume Rentals</span>
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-up-delay-1"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.4rem, 6vw, 4.5rem)",
              fontWeight: 900,
              lineHeight: 1.08,
              color: "var(--clr-text)",
              marginTop: "1.25rem",
              letterSpacing: "-0.02em",
            }}
          >
            Wear Something{" "}
            <span
              style={{
                display: "inline-block",
                color: "var(--clr-gold-light)",
                fontStyle: "italic",
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
            className="animate-fade-up-delay-2"
            style={{
              marginTop: "1.25rem",
              fontSize: "1.05rem",
              color: "var(--clr-text-muted)",
              maxWidth: "520px",
              margin: "1.25rem auto 0",
              lineHeight: 1.7,
            }}
          >
            Browse curated costumes for parties, shoots, events, and theatre.
            Book with clear pricing and instant availability.
          </p>

          {/* Search bar */}
          <form
            id="costume-search-form"
            className="animate-fade-up-delay-3"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery((q) => ({ ...q, q: qText.trim() || undefined, page: 1 }));
            }}
            style={{ marginTop: "2.5rem" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                background: "var(--clr-surface)",
                border: "1px solid var(--clr-border)",
                borderRadius: "var(--radius-xl)",
                padding: "0.625rem",
                boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
                maxWidth: "680px",
                margin: "0 auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                <input
                  id="search-input"
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Search: pirate, vintage, superhero…"
                  aria-label="Search costumes"
                  style={{
                    flex: 1,
                    minWidth: "160px",
                    background: "var(--clr-surface-2)",
                    border: "1px solid var(--clr-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "0.75rem 1rem",
                    color: "var(--clr-text)",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.9rem",
                    outline: "none",
                    transition: "border-color 150ms, box-shadow 150ms",
                  }}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--clr-gold)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(200,155,60,0.12)";
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--clr-border)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                />
                <select
                  id="sort-select"
                  value={query.sort || ""}
                  onChange={(e) =>
                    setQuery((q) => ({
                      ...q,
                      sort: (e.target.value || undefined) as CostumeListQuery["sort"],
                      page: 1,
                    }))
                  }
                  aria-label="Sort costumes"
                  style={{
                    background: "var(--clr-surface-2)",
                    border: "1px solid var(--clr-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "0.75rem 1rem",
                    color: "var(--clr-text)",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value} style={{ background: "#1c1618" }}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button
                  id="search-btn"
                  type="submit"
                  className="btn-crimson"
                  style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-lg)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                  Search
                </button>
              </div>
            </div>
          </form>

          {/* Stats */}
          <div
            className="animate-fade-up-delay-3"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "2rem",
              marginTop: "2rem",
              flexWrap: "wrap",
            }}
          >
            {[
              { label: "Costumes", value: total > 0 ? `${total}+` : "..." },
              { label: "Categories", value: "12+" },
              { label: "Avg. Rating", value: "4.9 ★" },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    color: "var(--clr-gold-light)",
                  }}
                >
                  {value}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--clr-text-dim)", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "0.15rem" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Category pills ─── */}
      <section
        style={{
          padding: "0 1.5rem 1.5rem",
          overflowX: "auto",
        }}
        aria-label="Filter by category"
      >
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            maxWidth: "1200px",
            margin: "0 auto",
            flexWrap: "nowrap",
          }}
        >
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
                style={{
                  flexShrink: 0,
                  padding: "0.4rem 0.9rem",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.8rem",
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 150ms",
                  background: isActive ? "var(--clr-crimson)" : "var(--clr-surface)",
                  color: isActive ? "#fff" : "var(--clr-text-muted)",
                  border: isActive
                    ? "1px solid var(--clr-crimson)"
                    : "1px solid var(--clr-border)",
                  boxShadow: isActive ? "0 0 16px var(--clr-crimson-glow)" : "none",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── Listings ─── */}
      <section
        style={{
          padding: "0 1.5rem 5rem",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
        }}
        aria-label="Costume listings"
      >
        {/* Error */}
        {error && (
          <div
            role="alert"
            style={{
              marginBottom: "1.5rem",
              padding: "1rem 1.25rem",
              borderRadius: "var(--radius-md)",
              background: "rgba(196,16,42,0.1)",
              border: "1px solid rgba(196,16,42,0.3)",
              color: "#f87171",
              fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <CostumeCardSkeleton key={i} />)
            : items.length
              ? items.map((c) => <CostumeCard key={c.id} costume={c} />)
              : (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    padding: "4rem 2rem",
                    background: "var(--clr-surface)",
                    border: "1px solid var(--clr-border)",
                    borderRadius: "var(--radius-lg)",
                  }}
                >
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎭</div>
                  <p style={{ color: "var(--clr-text-muted)", fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>
                    No costumes found. Try a different search.
                  </p>
                </div>
              )}
        </div>

        {/* Pagination */}
        {(canPrev || canNext) && (
          <div
            style={{
              marginTop: "3rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
            }}
          >
            <button
              id="prev-page-btn"
              type="button"
              disabled={!canPrev || isLoading}
              onClick={() =>
                setQuery((q) => ({ ...q, page: Math.max(1, (q.page || 1) - 1) }))
              }
              className="btn-ghost"
            >
              ← Prev
            </button>
            <span
              style={{
                fontSize: "0.875rem",
                color: "var(--clr-text-muted)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              Page {query.page || 1}
              {total > 0 && ` · ${total} total`}
            </span>
            <button
              id="next-page-btn"
              type="button"
              disabled={!canNext || isLoading}
              onClick={() =>
                setQuery((q) => ({ ...q, page: (q.page || 1) + 1 }))
              }
              className="btn-crimson"
            >
              Next →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
