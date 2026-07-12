"use client";

import { useState } from "react";
import { MixerHorizontalIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MarketplaceFilterFields,
  countActiveFacets,
  type MarketplaceFacets,
  type MarketplaceFilters,
} from "./FilterSidebar";

interface MobileFiltersProps {
  filters: MarketplaceFilters;
  facets: MarketplaceFacets;
  priceBounds: { min: number; max: number };
  onChange: (next: Partial<MarketplaceFilters>) => void;
  onClearFacets: () => void;
  loading?: boolean;
}

export function MobileFilters({
  filters,
  facets,
  priceBounds,
  onChange,
  onClearFacets,
  loading = false,
}: MobileFiltersProps) {
  const [open, setOpen] = useState(false);
  const activeCount = countActiveFacets(filters, priceBounds);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-9 gap-2 rounded-lg border-border lg:hidden"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <MixerHorizontalIcon className="size-4" />
        Filters
        {activeCount > 0 ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {activeCount}
          </span>
        ) : null}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="fixed inset-x-0 bottom-0 top-auto left-0 right-0 z-[110] flex max-h-[85vh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-t-2xl border-border p-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:rounded-t-2xl"
        >
          <DialogHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
            <DialogTitle className="font-display text-2xl font-semibold">Filters</DialogTitle>
            <DialogDescription>
              Refine by size, gender, theme, and budget. Categories stay in the top nav.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <MarketplaceFilterFields
              filters={filters}
              facets={facets}
              priceBounds={priceBounds}
              onChange={onChange}
              loading={loading}
              idPrefix="mobile-filter"
            />
          </div>

          <DialogFooter className="shrink-0 flex-row gap-3 border-t border-border px-5 py-4 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => {
                onClearFacets();
              }}
              disabled={activeCount === 0}
            >
              Clear facets
            </Button>
            <Button
              type="button"
              className="rounded-xl px-8"
              onClick={() => setOpen(false)}
            >
              Show results
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
