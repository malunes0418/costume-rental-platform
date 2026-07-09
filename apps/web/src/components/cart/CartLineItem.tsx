"use client";

import { ImageIcon } from "@radix-ui/react-icons";

import { Checkbox } from "@/components/ui/checkbox";
import type { ReservationWithItems } from "@/lib/account";
import { isCartReservationDraft } from "@/lib/account";
import { isCheckoutSelectable } from "@/lib/cart";
import { resolveApiAsset } from "@/lib/assets";
import { countRentalDaysInclusive } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const actionLabelClass = "text-[10px] font-semibold uppercase tracking-widest";

function formatDate(date: string) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface CartLineItemProps {
  item: ReservationWithItems;
  isSelected: boolean;
  isRemoving: boolean;
  isProcessing: boolean;
  isLoadingWizard: boolean;
  fulfillmentSummary: string | null;
  fulfillmentLocation: string | null;
  fulfillmentFee: number;
  isLalamoveFulfillment?: boolean;
  returnFeeIsEstimate?: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onCompleteBooking: () => void;
}

export function CartLineItem({
  item,
  isSelected,
  isRemoving,
  isProcessing,
  isLoadingWizard,
  fulfillmentSummary,
  fulfillmentLocation,
  fulfillmentFee,
  isLalamoveFulfillment = false,
  returnFeeIsEstimate = false,
  onToggle,
  onRemove,
  onCompleteBooking,
}: CartLineItemProps) {
  const image = item.items?.[0]?.Costume?.CostumeImages?.[0]?.image_url;
  const name = item.items?.[0]?.Costume?.name || "Costume";
  const days =
    item.start_date && item.end_date ? countRentalDaysInclusive(item.start_date, item.end_date) : 0;
  const isPendingPayment = item.status === "PENDING_PAYMENT";
  const isDraft = item.status === "CART" && isCartReservationDraft(item);
  const selectable = isCheckoutSelectable(item);

  return (
    <div className="group flex gap-3 rounded-xl border border-transparent p-2 transition-colors hover:border-border hover:bg-muted/20">
      {selectable ? (
        <div className="mt-2 shrink-0">
          <Checkbox
            id={`cart-drawer-item-${item.id}`}
            checked={isSelected}
            onCheckedChange={onToggle}
            aria-label={isSelected ? `Deselect ${name}` : `Select ${name}`}
          />
        </div>
      ) : (
        <div className="mt-2 size-4 shrink-0" />
      )}

      <div className="cart-line-spotlight relative size-[5.5rem] shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
        {image ? (
          <img
            src={resolveApiAsset(image)}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
            <ImageIcon className="size-6" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold text-foreground">{name}</p>
            <span
              className={cn(
                "mt-1 inline-flex rounded-md border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest",
                isPendingPayment && "border-accent/35 bg-brand-gold-soft text-accent-foreground",
                isDraft && "border-orange-400/35 bg-orange-50/80 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300",
                !isPendingPayment && !isDraft && "border-primary/25 bg-brand-coral-soft text-primary"
              )}
            >
              {isPendingPayment ? "Ready for receipt" : isDraft ? "Needs setup" : "In cart"}
            </span>
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={isRemoving || isProcessing}
            className={cn(
              "shrink-0 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40",
              actionLabelClass
            )}
          >
            {isRemoving ? "Removing" : "Remove"}
          </button>
        </div>

        {isDraft ? (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-muted-foreground">Choose dates and delivery before checkout.</p>
            <button
              type="button"
              onClick={onCompleteBooking}
              disabled={isLoadingWizard}
              className={cn("text-primary transition-opacity hover:opacity-80 disabled:opacity-40", actionLabelClass)}
            >
              Complete booking
            </button>
          </div>
        ) : (
          <>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatDate(item.start_date || "")} – {formatDate(item.end_date || "")} · {days} day
              {days !== 1 ? "s" : ""}
            </p>
            {fulfillmentSummary ? (
              <p className={cn("mt-1.5", actionLabelClass, "text-muted-foreground")}>{fulfillmentSummary}</p>
            ) : null}
            {fulfillmentLocation ? (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{fulfillmentLocation}</p>
            ) : null}
            {fulfillmentFee > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Includes PHP {Number(fulfillmentFee).toLocaleString()} in fulfillment fees
                {isLalamoveFulfillment ? (
                  <>
                    {" "}
                    <span className="inline-flex items-center rounded-sm border border-orange-400/40 bg-orange-50/60 px-1 py-px text-[8px] font-semibold uppercase tracking-widest text-orange-800 dark:bg-orange-950/20 dark:text-orange-300">
                      Lalamove
                    </span>
                  </>
                ) : null}
                {returnFeeIsEstimate ? (
                  <span className="ml-1 text-[10px] text-muted-foreground">(return fee est.)</span>
                ) : null}
              </p>
            ) : null}
            <p className="mt-2 font-display text-lg font-semibold tabular-nums text-primary">
              PHP {Number(item.total_price).toLocaleString()}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
