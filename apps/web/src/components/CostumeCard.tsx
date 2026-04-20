"use client";

import Link from "next/link";
import { resolveApiAsset } from "../lib/assets";
import type { Costume } from "../lib/costumes";

function primaryImage(costume: Costume) {
  const imgs = costume.CostumeImages || [];
  return imgs.find((i) => i.is_primary)?.image_url || imgs[0]?.image_url || "";
}

const categoryEmoji: Record<string, string> = {
  superhero: "🦸",
  halloween: "🎃",
  historical: "👑",
  fantasy: "🧙",
  anime: "⛩️",
  theatrical: "🎭",
  vintage: "🎩",
  sci_fi: "🚀",
};

function getCategoryEmoji(category?: string | null) {
  if (!category) return "🎭";
  return categoryEmoji[category.toLowerCase()] ?? "🎭";
}

export function CostumeCard({ costume }: { costume: Costume }) {
  const img = primaryImage(costume);
  const emoji = getCategoryEmoji(costume.category);
  const price = Number(costume.base_price_per_day).toFixed(0);
  const tags = [costume.category, costume.theme, costume.size].filter(Boolean);

  return (
    <Link
      href={`/costumes/${costume.id}`}
      id={`costume-card-${costume.id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <article
        style={{
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          background: "var(--clr-surface)",
          border: "1px solid var(--clr-border)",
          transition: "border-color var(--dur-base) var(--ease-out-expo), transform var(--dur-base) var(--ease-out-expo), box-shadow var(--dur-base) var(--ease-out-expo)",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = "rgba(200,155,60,0.3)";
          el.style.transform = "translateY(-4px)";
          el.style.boxShadow = "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,155,60,0.1)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = "var(--clr-border)";
          el.style.transform = "translateY(0)";
          el.style.boxShadow = "none";
        }}
      >
        {/* Image */}
        <div
          style={{
            aspectRatio: "4/3",
            width: "100%",
            overflow: "hidden",
            background: "var(--clr-surface-2)",
            position: "relative",
          }}
        >
          {img ? (
            <img
              src={resolveApiAsset(img)}
              alt={costume.name}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 500ms var(--ease-out-expo)",
                display: "block",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLImageElement).style.transform = "scale(1.06)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLImageElement).style.transform = "scale(1)";
              }}
            />
          ) : (
            /* Placeholder when no image */
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "0.5rem",
                background: "linear-gradient(135deg, var(--clr-surface-2), var(--clr-surface-3))",
              }}
            >
              <span style={{ fontSize: "3rem", lineHeight: 1 }}>{emoji}</span>
            </div>
          )}

          {/* Category badge overlaid on image */}
          {costume.category && (
            <div
              style={{
                position: "absolute",
                top: "0.75rem",
                left: "0.75rem",
              }}
            >
              <span className="badge-gold">{costume.category}</span>
            </div>
          )}
        </div>

        {/* Card body */}
        <div style={{ padding: "1rem 1.1rem 1.1rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "var(--clr-text)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.3,
                }}
              >
                {costume.name}
              </div>
              {tags.length > 0 && (
                <div
                  style={{
                    marginTop: "0.35rem",
                    fontSize: "0.78rem",
                    color: "var(--clr-text-muted)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {tags.join(" · ")}
                </div>
              )}
            </div>

            {/* Price */}
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  fontSize: "1.15rem",
                  color: "var(--clr-gold-light)",
                  lineHeight: 1.1,
                }}
              >
                ₱{price}
              </div>
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "var(--clr-text-dim)",
                  marginTop: "0.15rem",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                / day
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

/* Skeleton loader for the costume card */
export function CostumeCardSkeleton() {
  return (
    <div
      style={{
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        background: "var(--clr-surface)",
        border: "1px solid var(--clr-border)",
      }}
    >
      <div
        className="skeleton"
        style={{ aspectRatio: "4/3", width: "100%" }}
      />
      <div style={{ padding: "1rem 1.1rem 1.1rem" }}>
        <div className="skeleton" style={{ height: "1rem", width: "70%", marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ height: "0.75rem", width: "45%" }} />
      </div>
    </div>
  );
}
