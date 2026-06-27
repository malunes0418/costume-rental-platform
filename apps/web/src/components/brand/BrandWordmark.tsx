import { Sparkle } from "@/components/brand/Sparkle";
import { cn } from "@/lib/utils";

type BrandWordmarkSize = "sm" | "md" | "lg";

const WORDMARK_CLASSES: Record<BrandWordmarkSize, string> = {
  sm: "text-[1.125rem] leading-none",
  md: "text-[1.25rem] leading-none",
  lg: "text-[1.5rem] leading-none",
};

function SnapA({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative mx-[0.02em] inline-flex w-[0.52em] flex-col items-center justify-end align-baseline",
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 12 10" className="h-[0.7em] w-full text-current">
        <path
          d="M1.25 8.75 6 1.75 10.75 8.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.85"
        />
      </svg>
      <Sparkle
        animated={false}
        className="absolute -bottom-[0.42em] left-1/2 size-[0.42em] -translate-x-1/2"
        size="sm"
      />
    </span>
  );
}

type BrandWordmarkProps = {
  className?: string;
  size?: BrandWordmarkSize;
};

/** Text lockup — uses site sans so it stays in sync with typography changes. */
export function BrandWordmark({ className, size = "md" }: BrandWordmarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-sans font-bold tracking-tight",
        WORDMARK_CLASSES[size],
        className
      )}
      style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
    >
      <span className="text-foreground">Sn</span>
      <SnapA className="text-foreground" />
      <span className="text-foreground">p</span>
      <span className="text-primary">Cos</span>
    </span>
  );
}
