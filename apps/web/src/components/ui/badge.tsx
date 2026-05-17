import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] whitespace-nowrap transition-[background-color,border-color,color,box-shadow] duration-[var(--dur-fast)] focus-visible:border-ring/60 focus-visible:ring-[4px] focus-visible:ring-ring/14 aria-invalid:border-destructive/45 aria-invalid:ring-[4px] aria-invalid:ring-destructive/12 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-foreground bg-foreground text-background [a&]:hover:bg-foreground/88",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-accent",
        destructive:
          "border-[color:color-mix(in_oklab,var(--color-destructive)_24%,var(--color-border))] bg-[color:color-mix(in_oklab,var(--color-destructive)_10%,var(--color-card))] text-destructive [a&]:hover:bg-[color:color-mix(in_oklab,var(--color-destructive)_16%,var(--color-card))]",
        outline:
          "border-border bg-transparent text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "border-transparent bg-transparent text-muted-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "border-transparent bg-transparent px-0 py-0 text-[color:var(--color-brand)] tracking-normal normal-case [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type BadgeProps = React.ComponentPropsWithoutRef<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean };

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
