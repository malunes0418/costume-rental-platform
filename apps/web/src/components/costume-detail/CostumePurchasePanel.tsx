"use client";

import {
  ExclamationTriangleIcon as AlertCircle,
  LayersIcon,
  MagicWandIcon,
  PersonIcon,
  RulerSquareIcon,
  StarFilledIcon
} from "@radix-ui/react-icons";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function StarRating({ rating, className }: { rating: number; className?: string }) {
  const rounded = Math.round(rating);

  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarFilledIcon
          key={star}
          className={cn("size-3.5", star <= rounded ? "text-primary" : "text-muted-foreground/25")}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

interface CostumePurchasePanelProps {
  name: string;
  detailPills: string[];
  metaLine: string;
  avgRating: number | null;
  ratingCount: number;
  priceAmount: number;
  priceLabel: string;
  pricingNote: string;
  vendorDisplayName: string;
  hasVendor: boolean;
  isOwnCostume: boolean;
  isAddingToCart: boolean;
  onReserve: () => void;
  onAddToCart: () => void;
  formatMoney: (value: number) => string;
  showActions?: boolean;
  className?: string;
}

export function CostumePurchasePanel({
  name,
  detailPills,
  metaLine,
  avgRating,
  ratingCount,
  priceAmount,
  priceLabel,
  pricingNote,
  vendorDisplayName,
  hasVendor,
  isOwnCostume,
  isAddingToCart,
  onReserve,
  onAddToCart,
  formatMoney,
  showActions = true,
  className
}: CostumePurchasePanelProps) {
  return (
    <aside className={cn("animate-fade-up-delay-1 xl:sticky xl:top-[calc(var(--navbar-height)+1.25rem)] xl:self-start", className)}>
      <div className="costume-ticket floating-panel relative p-6 sm:p-7">
        <div className="pointer-events-none absolute inset-0 costume-ticket-glow" aria-hidden="true" />

        <div className="relative space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {detailPills.map((pill, index) => (
              <Badge
                key={pill}
                variant={index % 2 === 0 ? "coralSoft" : "goldSoft"}
                className="rounded-md text-[10px] font-semibold uppercase tracking-wide"
              >
                {pill}
              </Badge>
            ))}
            {isOwnCostume ? (
              <Badge variant="goldSoft" className="rounded-md text-[10px] font-semibold uppercase tracking-wide">
                Your listing
              </Badge>
            ) : null}
          </div>

          <div className="space-y-3 border-b border-border/80 pb-5">
            <h1 className="font-display text-3xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-[2.125rem]">
              {name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-muted-foreground">
              {metaLine ? <span>{metaLine}</span> : null}
              {metaLine ? <span aria-hidden="true" className="text-border">·</span> : null}
              {avgRating ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-coral-soft px-2.5 py-0.5">
                  <StarRating rating={avgRating} />
                  <span className="font-semibold text-primary">{avgRating.toFixed(1)}</span>
                </span>
              ) : (
                <Badge variant="goldSoft" className="rounded-md text-[10px] font-semibold uppercase tracking-wide">
                  <StarFilledIcon className="mr-1 size-3 animate-sparkle" aria-hidden="true" />
                  New listing
                </Badge>
              )}
              <span aria-hidden="true" className="text-border">·</span>
              <span>
                {ratingCount} review{ratingCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div className="costume-price-block rounded-xl px-5 py-5">
            <div className="flex items-end justify-between gap-4">
              <p className="font-display text-4xl font-semibold tracking-tight text-primary">
                {formatMoney(priceAmount)}
              </p>
              <p className="max-w-[9.5rem] text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {priceLabel}
              </p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{pricingNote}</p>
          </div>

          {hasVendor ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-sm">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Listed by</span>
              <span className="font-semibold text-foreground">{vendorDisplayName}</span>
              <Badge variant="goldSoft" className="rounded-md text-[10px] font-semibold uppercase tracking-wide">
                Verified vendor
              </Badge>
            </div>
          ) : null}

          {isOwnCostume ? (
            <Alert className="rounded-xl border-border bg-muted/30">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Your listing</AlertTitle>
              <AlertDescription>You cannot add your own costume to your cart.</AlertDescription>
            </Alert>
          ) : showActions ? (
            <div className="grid gap-3 pt-1">
              <Button className="h-12 text-base font-semibold hover-snap" onClick={onReserve}>
                Reserve now
              </Button>
              <Button
                variant="outline"
                className="h-12 text-base font-semibold"
                onClick={onAddToCart}
                disabled={isAddingToCart}
              >
                {isAddingToCart ? "Adding..." : "Add to cart"}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="costume-ticket-notch costume-ticket-notch--left" aria-hidden="true" />
        <div className="costume-ticket-notch costume-ticket-notch--right" aria-hidden="true" />
      </div>
    </aside>
  );
}

interface CostumeCallSheetProps {
  details: Array<{
    label: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: "coral" | "gold";
  }>;
  pricingLabel: string;
  pricingDescription: string;
}

export function CostumeCallSheet({ details, pricingLabel, pricingDescription }: CostumeCallSheetProps) {
  return (
    <div className="panel-card overflow-hidden">
      <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {details.map((detail) => {
          const Icon = detail.icon;
          return (
            <div key={detail.label} className="flex items-start gap-3 px-5 py-4 sm:px-6 sm:py-5">
              <div
                className={cn(
                  "detail-chip-icon",
                  detail.tone === "coral" ? "detail-chip-icon--coral" : "detail-chip-icon--gold"
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{detail.label}</p>
                <p className="mt-1 font-semibold text-foreground">{detail.value}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="costume-pricing-callout border-t border-border px-5 py-4 sm:px-6 sm:py-5">
        <p className="font-semibold text-foreground">{pricingLabel}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{pricingDescription}</p>
      </div>
    </div>
  );
}

export const costumeCallSheetIcons = {
  category: LayersIcon,
  theme: MagicWandIcon,
  size: RulerSquareIcon,
  audience: PersonIcon
};
