"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export type AdminDataTableColumn<T> = {
  key: string;
  header: ReactNode;
  className?: string;
  headerClassName?: string;
  cell: (row: T) => ReactNode;
};

type AdminDataTableProps<T> = {
  columns: AdminDataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  selectedKeys?: Set<string | number>;
  onToggleSelect?: (row: T) => void;
  onToggleSelectAll?: () => void;
  selectable?: boolean;
  className?: string;
  footer?: ReactNode;
};

export function AdminDataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyTitle = "No results",
  emptyDescription,
  onRowClick,
  selectedKeys,
  onToggleSelect,
  onToggleSelectAll,
  selectable,
  className,
  footer,
}: AdminDataTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-20 text-center">
        <p className="font-display text-2xl font-semibold text-foreground">{emptyTitle}</p>
        {emptyDescription ? <p className="text-sm text-muted-foreground">{emptyDescription}</p> : null}
      </div>
    );
  }

  const allSelected = selectable && rows.length > 0 && rows.every((row) => selectedKeys?.has(rowKey(row)));

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <tr>
              {selectable ? (
                <th className="w-10 p-4">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={!!allSelected}
                    onChange={() => onToggleSelectAll?.()}
                    className="size-3.5 accent-[hsl(var(--primary))]"
                  />
                </th>
              ) : null}
              {columns.map((col) => (
                <th key={col.key} className={cn("p-4 font-medium", col.headerClassName)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => {
              const key = rowKey(row);
              const selected = selectedKeys?.has(key);
              return (
                <tr
                  key={key}
                  className={cn(
                    "transition-colors hover:bg-muted/30",
                    onRowClick && "cursor-pointer",
                    selected && "bg-primary/5"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable ? (
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select row ${key}`}
                        checked={!!selected}
                        onChange={() => onToggleSelect?.(row)}
                        className="size-3.5 accent-[hsl(var(--primary))]"
                      />
                    </td>
                  ) : null}
                  {columns.map((col) => (
                    <td key={col.key} className={cn("p-4", col.className)}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {footer ? <div className="border-t border-border px-4 py-3">{footer}</div> : null}
    </div>
  );
}
