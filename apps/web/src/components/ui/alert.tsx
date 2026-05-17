import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-1 rounded-[var(--radius-md)] border px-4 py-3.5 text-sm has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3 bg-card shadow-[var(--shadow-card)] [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "border-border/90 text-card-foreground",
        destructive:
          "border-[color:color-mix(in_oklab,var(--color-destructive)_22%,var(--color-border))] bg-[color:color-mix(in_oklab,var(--color-destructive)_8%,var(--color-card))] text-destructive *:data-[slot=alert-description]:text-[color:color-mix(in_oklab,var(--color-destructive)_80%,var(--color-muted-foreground))] [&>svg]:text-current",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 min-h-4 font-semibold tracking-[-0.01em]",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-6",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
