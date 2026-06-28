import { cn } from "@/lib/utils";

interface CostumeActSectionProps {
  act: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headingId?: string;
}

export function CostumeActSection({
  act,
  title,
  subtitle,
  children,
  className,
  headingId
}: CostumeActSectionProps) {
  return (
    <section className={cn("space-y-5", className)} aria-labelledby={headingId}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="costume-act-label">{act}</p>
          <h2 id={headingId} className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {title}
          </h2>
          {subtitle ? <p className="mt-2 max-w-prose text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
