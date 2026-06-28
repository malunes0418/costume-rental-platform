"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { categoryFilters } from "./constants";
import { RangeSlider } from "./RangeSlider";

export interface MarketplaceFilters {
  category?: string;
  size?: string;
  gender?: string;
  theme?: string;
  priceMin?: number;
  priceMax?: number;
}

interface FilterSidebarProps {
  filters: MarketplaceFilters;
  facets: {
    sizes: string[];
    genders: string[];
    themes: string[];
  };
  priceBounds: { min: number; max: number };
  onChange: (next: Partial<MarketplaceFilters>) => void;
  className?: string;
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border pb-5 last:border-0 last:pb-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function CheckboxOption({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
        checked
          ? "bg-brand-coral-soft/60 text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 shrink-0 rounded border-border accent-primary focus-visible:ring-2 focus-visible:ring-primary/30"
      />
      <span className={cn(checked && "font-medium text-foreground")}>{label}</span>
    </label>
  );
}

export function FilterSidebar({
  filters,
  facets,
  priceBounds,
  onChange,
  className,
}: FilterSidebarProps) {
  const priceMin = filters.priceMin ?? priceBounds.min;
  const priceMax = filters.priceMax ?? priceBounds.max;

  return (
    <aside
      className={cn(
        "marketplace-filter-panel sticky top-[calc(var(--navbar-height,7.5rem)+1rem)] w-56 shrink-0 self-start rounded-2xl border border-border p-5 lg:w-60",
        className
      )}
      aria-label="Filters"
    >
      <div className="mb-5 flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-foreground">Filters</h2>
      </div>

      <div className="space-y-5">
        <FilterSection title="Category">
          <div className="space-y-0.5">
            {categoryFilters.filter((c) => c.value).map(({ value, label }) => (
              <CheckboxOption
                key={value}
                id={`filter-category-${value}`}
                label={label}
                checked={filters.category === value}
                onChange={(checked) => onChange({ category: checked ? value : undefined })}
              />
            ))}
          </div>
        </FilterSection>

        {facets.sizes.length > 0 && (
          <FilterSection title="Size">
            <div className="space-y-0.5">
              {facets.sizes.map((size) => (
                <CheckboxOption
                  key={size}
                  id={`filter-size-${size}`}
                  label={size}
                  checked={filters.size === size}
                  onChange={(checked) => onChange({ size: checked ? size : undefined })}
                />
              ))}
            </div>
          </FilterSection>
        )}

        {facets.genders.length > 0 && (
          <FilterSection title="Gender">
            <div className="space-y-0.5">
              {facets.genders.map((gender) => (
                <CheckboxOption
                  key={gender}
                  id={`filter-gender-${gender}`}
                  label={gender}
                  checked={filters.gender === gender}
                  onChange={(checked) => onChange({ gender: checked ? gender : undefined })}
                />
              ))}
            </div>
          </FilterSection>
        )}

        {facets.themes.length > 0 && (
          <FilterSection title="Theme">
            <div className="space-y-0.5 max-h-40 overflow-y-auto pr-1">
              {facets.themes.map((theme) => (
                <CheckboxOption
                  key={theme}
                  id={`filter-theme-${theme}`}
                  label={theme}
                  checked={filters.theme === theme}
                  onChange={(checked) => onChange({ theme: checked ? theme : undefined })}
                />
              ))}
            </div>
          </FilterSection>
        )}

        <FilterSection title="Price range">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={priceBounds.min}
              max={priceMax}
              value={priceMin}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!Number.isFinite(val)) return;
                onChange({ priceMin: Math.min(Math.max(val, priceBounds.min), priceMax) });
              }}
              className="h-9 rounded-lg text-sm"
              aria-label="Minimum price"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              min={priceMin}
              max={priceBounds.max}
              value={priceMax}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!Number.isFinite(val)) return;
                onChange({ priceMax: Math.max(Math.min(val, priceBounds.max), priceMin) });
              }}
              className="h-9 rounded-lg text-sm"
              aria-label="Maximum price"
            />
          </div>
          <div className="mt-4 px-1">
            <RangeSlider
              min={priceBounds.min}
              max={priceBounds.max}
              valueMin={priceMin}
              valueMax={priceMax}
              onChange={(lo, hi) => onChange({ priceMin: lo, priceMax: hi })}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            ₱{priceMin.toLocaleString()} – ₱{priceMax.toLocaleString()}
          </p>
        </FilterSection>
      </div>
    </aside>
  );
}
