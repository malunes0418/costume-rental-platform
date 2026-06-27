import Image from "next/image";

import { BrandWordmark } from "@/components/brand/BrandWordmark";
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
  light: "/brand/snapcos-mark.png",
  dark: "/brand/snapcos-mark-dark.png",
  width: 445,
  height: 555,
} as const;

const LOCKUP_CLASSES: Record<BrandLogoSize, string> = {
  sm: "h-8 gap-1.5",
  md: "h-9 gap-2",
  lg: "h-11 gap-2.5",
};

const LOCKUP_MARK_CLASSES: Record<BrandLogoSize, string> = {
  sm: "h-[1.65rem] w-auto",
  md: "h-[1.85rem] w-auto",
  lg: "h-[2.25rem] w-auto",
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

function BrandMarkGraphic({
  priority = false,
  className,
  onDarkBackground = false,
}: {
  priority?: boolean;
  className?: string;
  /** When true, swaps to a light-toned mark on dark surfaces (e.g. navbar lockup). */
  onDarkBackground?: boolean;
}) {
  const imageProps = {
    alt: "",
    "aria-hidden": true as const,
    height: MARK_IMAGE.height,
    priority,
    width: MARK_IMAGE.width,
  };

  if (!onDarkBackground) {
    return (
      <Image
        {...imageProps}
        className={cn("shrink-0 object-contain", className)}
        src={MARK_IMAGE.light}
      />
    );
  }

  return (
    <span className={cn("inline-flex shrink-0 items-center", className)}>
      <span className="inline-flex h-full dark:hidden">
        <Image
          {...imageProps}
          className="h-full w-auto object-contain"
          src={MARK_IMAGE.light}
        />
      </span>
      <span className="hidden h-full dark:inline-flex">
        <Image
          {...imageProps}
          className="h-full w-auto object-contain"
          src={MARK_IMAGE.dark}
        />
      </span>
    </span>
  );
}

function BrandMark({ priority = false, size = "md" }: Pick<BrandLogoProps, "priority" | "size">) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center border border-black/5 bg-[oklch(0.97_0.01_30)] shadow-[0_1px_0_rgba(15,23,42,0.05),0_8px_20px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[oklch(0.92_0.01_30)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04),0_10px_22px_rgba(0,0,0,0.32)]",
        MARK_BOX_CLASSES[size]
      )}
    >
      <BrandMarkGraphic
        className={MARK_IMAGE_CLASSES[size]}
        priority={priority}
      />
    </span>
  );
}

function BrandLockup({ priority = false, size = "md" }: Pick<BrandLogoProps, "priority" | "size">) {
  return (
    <span
      aria-label="SnapCos"
      className={cn("inline-flex items-center select-none", LOCKUP_CLASSES[size])}
    >
      <BrandMarkGraphic
        className={LOCKUP_MARK_CLASSES[size]}
        onDarkBackground
        priority={priority}
      />
      <BrandWordmark size={size} />
    </span>
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
