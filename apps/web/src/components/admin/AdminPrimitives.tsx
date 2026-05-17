"use client";

import type { ComponentType, ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type AdminStatusTone = "success" | "warning" | "danger" | "neutral" | "brand";
type AdminFilterOption = {
  value: string;
  label: string;
};

const STATUS_CLASSES: Record<AdminStatusTone, string> = {
  success: "border-emerald-400/40 text-emerald-700 dark:text-emerald-400",
  warning: "border-amber-400/40 text-amber-700 dark:text-amber-400",
  danger: "border-destructive/30 text-destructive",
  neutral: "border-border text-muted-foreground",
  brand: "border-[color:color-mix(in_oklab,var(--color-brand)_24%,var(--color-border))] text-[color:var(--color-brand)]",
};

export function AdminMetricCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="surface-panel rounded-[var(--radius-lg)] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {label}
        </p>
        {Icon ? (
          <span className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-background text-muted-foreground">
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground md:text-3xl">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{hint}</p>
    </div>
  );
}

export function AdminStatusBadge({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: AdminStatusTone;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(STATUS_CLASSES[tone], className)}>
      {label}
    </Badge>
  );
}

export function AdminSectionCard({
  eyebrow,
  title,
  description,
  actions,
  children,
  dense = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  dense?: boolean;
}) {
  return (
    <section className={cn("surface-panel rounded-[var(--radius-xl)]", dense ? "p-5" : "p-6")}>
      <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-foreground md:text-xl">{title}</h2>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AdminEmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[var(--radius-xl)] border border-border bg-background/70 px-6 py-14 text-center">
      {icon ? (
        <div className="rounded-full border border-border bg-background p-3 text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <div>
        <p className="text-xl font-semibold text-foreground">{title}</p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function AdminResponsiveFilterRail({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: AdminFilterOption[];
  onChange: (value: string) => void;
}) {
  const activeLabel = options.find((option) => option.value === value)?.label ?? value;

  return (
    <div className="flex w-full items-center gap-3 md:w-auto">
      <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>

      <div className="min-w-0 flex-1 md:hidden">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger
            aria-label={`${label} filter`}
            size="sm"
            className="w-full min-w-0 rounded-full bg-background"
          >
            <SelectValue>{activeLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent className="surface-elevated">
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="hidden items-center gap-1 rounded-full border border-border bg-background p-1 md:flex">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] transition-colors",
              value === option.value
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
