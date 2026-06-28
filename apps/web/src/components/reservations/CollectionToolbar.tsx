"use client";

import { ChevronLeftIcon, ChevronRightIcon, GridIcon, ViewHorizontalIcon } from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/components/marketplace/ResultsToolbar";

const PAGE_SIZE_OPTIONS = [
  { value: "4", label: "4 per page" },
  { value: "8", label: "8 per page" },
  { value: "12", label: "12 per page" },
  { value: "all", label: "Show all" }
] as const;

interface CollectionToolbarProps {
  noun: string;
  total: number;
  start?: number;
  end?: number;
  page?: number;
  totalPages?: number;
  pageSize: string;
  view?: ViewMode;
  showViewToggle?: boolean;
  showPageSize?: boolean;
  onPageSizeChange: (value: string) => void;
  onViewChange?: (view: ViewMode) => void;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function CollectionToolbar({
  noun,
  total,
  start,
  end,
  page = 0,
  totalPages = 1,
  pageSize,
  view = "list",
  showViewToggle = false,
  showPageSize = true,
  onPageSizeChange,
  onViewChange,
  onPageChange,
  className
}: CollectionToolbarProps) {
  const showPagination = totalPages > 1 && onPageChange;
  const rangeLabel =
    start && end && total > 0 ? (
      <>
        Showing <span className="font-semibold text-foreground">{start}</span>–
        <span className="font-semibold text-foreground">{end}</span> of{" "}
        <span className="font-semibold text-foreground">{total}</span> {noun}
      </>
    ) : (
      <>
        <span className="font-semibold text-foreground">{total}</span> {noun}
        {total === 1 ? "" : "s"}
      </>
    );

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">{rangeLabel}</p>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {showPageSize ? (
          <Select value={pageSize} onValueChange={onPageSizeChange}>
            <SelectTrigger aria-label="Items per page" className="h-9 w-[140px] rounded-lg border-border bg-background text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {showViewToggle && onViewChange ? (
          <div className="flex rounded-lg border border-border p-0.5" role="group" aria-label="View mode">
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
          </div>
        ) : null}

        {showPagination ? (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Previous page"
              disabled={page <= 0}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeftIcon />
            </Button>
            <span className="min-w-[5.5rem] text-center text-xs font-medium text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Next page"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
