"use client";

import { Button } from "@/components/ui/button";

interface CostumeMobileActionBarProps {
  priceLabel: string;
  priceAmount: string;
  isAddingToCart: boolean;
  onReserve: () => void;
  onAddToCart: () => void;
}

export function CostumeMobileActionBar({
  priceLabel,
  priceAmount,
  isAddingToCart,
  onReserve,
  onAddToCart
}: CostumeMobileActionBarProps) {
  return (
    <div className="costume-mobile-bar fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md xl:hidden">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl font-semibold text-primary">{priceAmount}</p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{priceLabel}</p>
        </div>
        <Button variant="outline" className="h-11 shrink-0 px-4 font-semibold" onClick={onAddToCart} disabled={isAddingToCart}>
          {isAddingToCart ? "..." : "Cart"}
        </Button>
        <Button className="h-11 shrink-0 px-5 font-semibold hover-snap" onClick={onReserve}>
          Reserve
        </Button>
      </div>
    </div>
  );
}
