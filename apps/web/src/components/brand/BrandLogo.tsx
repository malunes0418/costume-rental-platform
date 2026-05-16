"use client";

import Image from "next/image";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

type BrandLogoVariant = "full" | "mark";
type BrandLogoSize = "sm" | "md" | "lg";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
  size?: BrandLogoSize;
  variant?: BrandLogoVariant;
};

const LOCKUP_LIGHT = {
  src: "/brand/snapcos-lockup-light.png",
  width: 1520,
  height: 555,
} as const;

const LOCKUP_DARK = {
  src: "/brand/snapcos-lockup-dark.png",
  width: 1520,
  height: 555,
} as const;

const MARK_IMAGE = {
  src: "/brand/snapcos-mark.png",
  width: 445,
  height: 555,
} as const;

const LOCKUP_CLASSES: Record<BrandLogoSize, string> = {
  sm: "h-8",
  md: "h-9",
  lg: "h-11",
};

const MARK_BOX_CLASSES: Record<BrandLogoSize, string> = {
  sm: "size-7 rounded-[0.9rem] p-1",
  md: "size-8 rounded-[1rem] p-1",
  lg: "size-10 rounded-[1.15rem] p-1.5",
};

const MARK_IMAGE_CLASSES: Record<BrandLogoSize, string> = {
  sm: "size-5",
  md: "size-6",
  lg: "size-7",
};

function BrandMark({ priority = false, size = "md" }: Pick<BrandLogoProps, "priority" | "size">) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center border border-black/5 bg-[oklch(0.97_0.01_30)] shadow-[0_1px_0_rgba(15,23,42,0.05),0_8px_20px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[oklch(0.92_0.01_30)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04),0_10px_22px_rgba(0,0,0,0.32)]",
        MARK_BOX_CLASSES[size]
      )}
    >
      <Image
        alt="SnapCos mark"
        className={cn("object-contain", MARK_IMAGE_CLASSES[size])}
        height={MARK_IMAGE.height}
        priority={priority}
        src={MARK_IMAGE.src}
        width={MARK_IMAGE.width}
      />
    </span>
  );
}

function BrandLockup({ priority = false, size = "md" }: Pick<BrandLogoProps, "priority" | "size">) {
  const { resolvedTheme } = useTheme();
  const lockup = resolvedTheme === "dark" ? LOCKUP_DARK : LOCKUP_LIGHT;

  return (
    <Image
      alt="SnapCos"
      className={cn("block w-auto object-contain", LOCKUP_CLASSES[size])}
      height={lockup.height}
      priority={priority}
      src={lockup.src}
      width={lockup.width}
    />
  );
}

export function BrandLogo({
  className,
  priority = false,
  size = "md",
  variant = "full",
}: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      {variant === "mark" ? (
        <BrandMark priority={priority} size={size} />
      ) : (
        <BrandLockup priority={priority} size={size} />
      )}
    </span>
  );
}
