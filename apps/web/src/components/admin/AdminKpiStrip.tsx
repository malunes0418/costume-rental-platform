import { cn } from "@/lib/utils";

export type AdminKpiItem = {
  key: string;
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ElementType;
  trend?: { dir: "up" | "down"; text: string };
};

type AdminKpiStripProps = {
  items: AdminKpiItem[];
  className?: string;
};

export function AdminKpiStrip({ items, className }: AdminKpiStripProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 xl:grid-cols-4", className)}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.key} className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest leading-tight text-muted-foreground">
                {item.label}
              </p>
              {Icon ? (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-border">
                  <Icon className="size-3.5 text-muted-foreground" />
                </div>
              ) : null}
            </div>
            <p className="font-display text-4xl font-semibold leading-none tracking-tight text-foreground">
              {item.value}
            </p>
            {(item.sub || item.trend) && (
              <div className="mt-auto flex items-center gap-2">
                {item.trend ? (
                  <span
                    className={cn(
                      "text-[10px] font-semibold",
                      item.trend.dir === "up"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive"
                    )}
                  >
                    {item.trend.text}
                  </span>
                ) : null}
                {item.sub ? <span className="text-[10px] text-muted-foreground">{item.sub}</span> : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
