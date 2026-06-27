"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { categoryLabel } from "./constants";
import type { MarketplaceFilters } from "./FilterSidebar";

interface FilterChipsProps {
  filters: MarketplaceFilters;
  query?: string;
  priceBounds: { min: number; max: number };
  onRemove: (key: keyof MarketplaceFilters | "q") => void;
  onClearAll: () => void;
  className?: string;
}

type Chip = { key: keyof MarketplaceFilters | "q"; label: string };

function buildChips(
  filters: MarketplaceFilters,
  query: string | undefined,
  priceBounds: { min: number; max: number }
): Chip[] {
  const chips: Chip[] = [];

  if (query?.trim()) {
    chips.push({ key: "q", label: `"${query.trim()}"` });
  }
  if (filters.category) {
    chips.push({ key: "category", label: categoryLabel(filters.category) });
  }
  if (filters.size) {
    chips.push({ key: "size", label: filters.size });
  }
  if (filters.gender) {
    chips.push({ key: "gender", label: filters.gender });
  }
  if (filters.theme) {
    chips.push({ key: "theme", label: filters.theme });
  }
  const hasPriceFilter =
    (filters.priceMin !== undefined && filters.priceMin > priceBounds.min) ||
    (filters.priceMax !== undefined && filters.priceMax < priceBounds.max);
  if (hasPriceFilter) {
    const lo = filters.priceMin ?? priceBounds.min;
    const hi = filters.priceMax ?? priceBounds.max;
    chips.push({ key: "priceMin", label: `₱${lo.toLocaleString()} – ₱${hi.toLocaleString()}` });
  }

  return chips;
}

export function FilterChips({
  filters,
  query,
  priceBounds,
  onRemove,
  onClearAll,
  className,
}: FilterChipsProps) {
  const chips = buildChips(filters, query, priceBounds);

  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => (
        <button
          key={`${chip.key}-${chip.label}`}
          type="button"
          onClick={() => {
            if (chip.key === "priceMin") {
              onRemove("priceMin");
              onRemove("priceMax");
            } else {
              onRemove(chip.key);
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
        >
          {chip.label}
          <Cross2Icon className="size-3" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
