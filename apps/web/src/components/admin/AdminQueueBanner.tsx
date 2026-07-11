import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type AdminQueueBannerProps = {
  title: string;
  description?: string;
  count?: number;
  href?: string;
  ctaLabel?: string;
  className?: string;
  children?: ReactNode;
};

export function AdminQueueBanner({
  title,
  description,
  count,
  href,
  ctaLabel,
  className,
  children,
}: AdminQueueBannerProps) {
  if (count !== undefined && count <= 0 && !children) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-amber-400/30 bg-amber-50/50 p-6 dark:bg-amber-900/10",
        className
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
        Action required
      </p>
      <p className="mt-1 font-display text-xl font-semibold text-foreground">{title}</p>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      {(href && ctaLabel) || children ? (
        <div className="mt-4 flex flex-wrap gap-3">
          {href && ctaLabel ? (
            <Link
              href={href}
              className="inline-flex h-9 items-center rounded-xl border border-foreground bg-primary px-5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {ctaLabel}
            </Link>
          ) : null}
          {children}
        </div>
      ) : null}
    </div>
  );
}
