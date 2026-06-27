"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { GridIcon, ViewHorizontalIcon } from "@radix-ui/react-icons";
import { sortOptions } from "./constants";

export type ViewMode = "grid" | "list";

interface ResultsToolbarProps {
  count?: number;
  total: number;
  sort: string;
  view: ViewMode;
  showSort?: boolean;
  onSortChange: (sort: string) => void;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

export function ResultsToolbar({
  count,
  total,
  sort,
  view,
  showSort = true,
  onSortChange,
  onViewChange,
  className,
}: ResultsToolbarProps) {
  const displayCount = count ?? total;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{displayCount}</span>
        {total !== displayCount ? ` of ${total}` : ""} result{displayCount === 1 ? "" : "s"}
      </p>

      <div className="flex items-center gap-3">
        {showSort && (
          <Select value={sort || "_newest"} onValueChange={onSortChange}>
          <SelectTrigger
            aria-label="Sort results"
            className="h-9 w-[180px] rounded-lg border-border bg-background text-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        )}

        <div className="flex rounded-lg border border-border p-0.5" role="group" aria-label="View mode">
          <button
            type="button"
            onClick={() => onViewChange("grid")}
            aria-pressed={view === "grid"}
            className={cn(
              "flex size-8 items-center justify-center rounded-md transition-colors",
              view === "grid"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <GridIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange("list")}
            aria-pressed={view === "list"}
            className={cn(
              "flex size-8 items-center justify-center rounded-md transition-colors",
              view === "list"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <ViewHorizontalIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
