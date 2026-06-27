import { cn } from "@/lib/utils";

interface SparkleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

const sizeMap = {
  sm: "size-3",
  md: "size-4",
  lg: "size-6",
};

/** 4-point sparkle accent drawn from the SnapCos logo */
export function Sparkle({ className, size = "md", animated = true }: SparkleProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={cn(
        sizeMap[size],
        "text-brand-gold shrink-0",
        animated && "animate-sparkle",
        className
      )}
    >
      <path d="M12 0L13.8 8.2L22 10L13.8 11.8L12 20L10.2 11.8L2 10L10.2 8.2L12 0Z" />
    </svg>
  );
}
