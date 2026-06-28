"use client";

import Link from "next/link";
import { ImageIcon, TrashIcon } from "@radix-ui/react-icons";

import type { ViewMode } from "@/components/marketplace/ResultsToolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { resolveApiAsset } from "@/lib/assets";
import type { ReservationWithItems } from "@/lib/account";
import { cn } from "@/lib/utils";

interface SavedCartItemProps {
  reservation: ReservationWithItems;
  view: ViewMode;
  title: string;
  image: string;
  days: number;
  dateLabel: string;
  missingSummary: string | null;
  statusLabel: string;
  statusClassName: string;
  selectable: boolean;
  isSelected: boolean;
  isRemoving: boolean;
  onToggle: () => void;
  onRemove: () => void;
  costumeHref?: string | null;
}

export function SavedCartItem({
  reservation,
  view,
  title,
  image,
  days,
  dateLabel,
  missingSummary,
  statusLabel,
  statusClassName,
  selectable,
  isSelected,
  isRemoving,
  onToggle,
  onRemove,
  costumeHref
}: SavedCartItemProps) {
  const checkboxId = `cart-item-${reservation.id}`;

  const removeButton = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-destructive"
      onClick={onRemove}
      disabled={isRemoving}
      aria-label={`Remove ${title} from saved cart`}
    >
      <TrashIcon data-icon="inline-start" className="size-3.5" />
      {isRemoving ? "Removing..." : "Remove"}
    </Button>
  );

  if (view === "grid") {
    return (
      <article className="panel-card group flex flex-col overflow-hidden shadow-coral-hover transition-shadow">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {image ? (
            <img src={resolveApiAsset(image)} alt={title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
              <ImageIcon className="size-6" />
            </div>
          )}

          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-1.5">
            {selectable ? (
              <div className="rounded-md border border-border/80 bg-background/90 p-0.5 shadow-sm backdrop-blur-sm">
                <Checkbox
                  id={checkboxId}
                  checked={isSelected}
                  onCheckedChange={onToggle}
                  aria-label={`Select ${title} for checkout`}
                />
              </div>
            ) : (
              <span className="rounded-md bg-background/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur-sm">
                Setup
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="size-7 bg-background/90 text-muted-foreground shadow-sm backdrop-blur-sm hover:text-destructive"
              onClick={onRemove}
              disabled={isRemoving}
              aria-label={`Remove ${title} from saved cart`}
            >
              <TrashIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="space-y-1 p-2.5">
          {costumeHref ? (
            <Link
              href={costumeHref}
              className="line-clamp-2 font-display text-sm font-semibold leading-snug text-foreground hover:text-primary"
            >
              {title}
            </Link>
          ) : (
            <p className="line-clamp-2 font-display text-sm font-semibold leading-snug text-foreground">{title}</p>
          )}
          <p className="line-clamp-2 text-[11px] leading-4 text-muted-foreground">
            {dateLabel}
            {days > 0 && ` · ${days}d`}
          </p>
          {missingSummary ? (
            <p className="line-clamp-2 text-[10px] leading-4 text-muted-foreground">{missingSummary}</p>
          ) : null}
          <Badge
            variant="outline"
            className={cn("max-w-full truncate rounded-md px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide", statusClassName)}
          >
            {statusLabel}
          </Badge>
        </div>
      </article>
    );
  }

  return (
    <article className="flex gap-4 rounded-lg px-1 py-4 transition-colors hover:bg-muted/30 sm:gap-5">
      {selectable ? (
        <div className="flex shrink-0 items-start pt-3">
          <Checkbox
            id={checkboxId}
            checked={isSelected}
            onCheckedChange={onToggle}
            aria-label={`Select ${title} for checkout`}
          />
        </div>
      ) : (
        <div className="w-4 shrink-0" />
      )}

      <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted shadow-sm sm:size-20">
        {image ? (
          <img src={resolveApiAsset(image)} alt={title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
            <ImageIcon className="size-6" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {selectable ? (
            <Label
              htmlFor={checkboxId}
              className="cursor-pointer truncate font-display text-lg font-semibold text-foreground"
            >
              {title}
            </Label>
          ) : costumeHref ? (
            <Link href={costumeHref} className="truncate font-display text-lg font-semibold text-foreground hover:text-primary">
              {title}
            </Link>
          ) : (
            <p className="truncate font-display text-lg font-semibold text-foreground">{title}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {dateLabel}
            {days > 0 && ` · ${days} day${days !== 1 ? "s" : ""}`}
          </p>
          {missingSummary ? <p className="mt-2 text-xs text-muted-foreground">{missingSummary}</p> : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge variant="outline" className={cn("rounded-md", statusClassName)}>
            {statusLabel}
          </Badge>
          {removeButton}
        </div>
      </div>
    </article>
  );
}
