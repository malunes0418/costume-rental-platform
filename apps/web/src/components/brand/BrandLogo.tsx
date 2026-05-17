"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandLogoVariant = "full" | "mark";
type BrandLogoSize = "sm" | "md" | "lg";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
  size?: BrandLogoSize;
  variant?: BrandLogoVariant;
};

const MARK_IMAGE = {
  src: "/brand/snapcos-mark.png",
  width: 445,
  height: 555,
} as const;

const SIZE_MAP: Record<
  BrandLogoSize,
  {
    box: string;
    image: string;
    wordmark: string;
    descriptor: string;
    gap: string;
  }
> = {
  sm: {
    box: "size-8 rounded-[1rem] p-1.5",
    image: "size-5",
    wordmark: "text-lg",
    descriptor: "text-[8px] tracking-[0.22em]",
    gap: "gap-2.5",
  },
  md: {
    box: "size-10 rounded-[1.15rem] p-2",
    image: "size-6",
    wordmark: "text-[1.45rem]",
    descriptor: "text-[9px] tracking-[0.26em]",
    gap: "gap-3",
  },
  lg: {
    box: "size-12 rounded-[1.35rem] p-2.5",
    image: "size-7",
    wordmark: "text-[1.75rem]",
    descriptor: "text-[10px] tracking-[0.28em]",
    gap: "gap-3.5",
  },
};

function BrandMark({
  priority = false,
  size = "md",
}: Pick<BrandLogoProps, "priority" | "size">) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center border border-[color:color-mix(in_oklab,var(--color-gold)_16%,var(--color-border))] bg-[color:color-mix(in_oklab,var(--color-background)_55%,var(--color-card))] shadow-[0_1px_0_color-mix(in_oklab,white_45%,transparent),0_10px_24px_color-mix(in_oklab,var(--color-foreground)_8%,transparent)] dark:shadow-[0_1px_0_color-mix(in_oklab,white_8%,transparent),0_12px_26px_color-mix(in_oklab,black_30%,transparent)]",
        SIZE_MAP[size].box
      )}
    >
      <Image
        alt="SnapCos mark"
        className={cn("object-contain", SIZE_MAP[size].image)}
        height={MARK_IMAGE.height}
        priority={priority}
        src={MARK_IMAGE.src}
        width={MARK_IMAGE.width}
      />
    </span>
  );
}

function BrandWordmark({ size = "md" }: Pick<BrandLogoProps, "size">) {
  return (
    <span className="flex min-w-0 flex-col leading-none">
      <span className={cn("display text-foreground", SIZE_MAP[size].wordmark)}>SnapCos</span>
      <span
        className={cn(
          "mt-1 truncate font-semibold uppercase text-muted-foreground",
          SIZE_MAP[size].descriptor
        )}
      >
        Costume Rental Platform
      </span>
    </span>
  );
}

export function BrandLogo({
  className,
  priority = false,
  size = "md",
  variant = "full",
}: BrandLogoProps) {
  if (variant === "mark") {
    return (
      <span className={cn("inline-flex items-center", className)}>
        <BrandMark priority={priority} size={size} />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex min-w-0 items-center", SIZE_MAP[size].gap, className)}>
      <BrandMark priority={priority} size={size} />
      <BrandWordmark size={size} />
    </span>
  );
}
