import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-[var(--radius-sm)] border border-input bg-card px-3.5 py-2 text-sm text-foreground shadow-[inset_0_1px_0_color-mix(in_oklab,white_32%,transparent)] transition-[border-color,box-shadow,background-color,color] duration-[var(--dur-fast)] outline-none selection:bg-primary/20 selection:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-[inset_0_1px_0_color-mix(in_oklab,white_6%,transparent)]",
        "focus-visible:border-ring/60 focus-visible:ring-[4px] focus-visible:ring-ring/14",
        "aria-invalid:border-destructive/45 aria-invalid:ring-[4px] aria-invalid:ring-destructive/12",
        className
      )}
      {...props}
    />
  )
}

export { Input }
