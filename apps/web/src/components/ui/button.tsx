import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[var(--radius-md)] border text-sm font-semibold whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--dur-fast)] outline-none select-none focus-visible:border-ring/60 focus-visible:ring-4 focus-visible:ring-ring/18 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive/45 aria-invalid:ring-4 aria-invalid:ring-destructive/12 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-foreground bg-foreground text-background shadow-[0_1px_0_color-mix(in_oklab,var(--color-foreground)_18%,transparent)] hover:bg-[color:color-mix(in_oklab,var(--color-foreground)_90%,var(--color-background)_10%)]",
        brand:
          "border-[color:color-mix(in_oklab,var(--color-brand)_30%,var(--color-border))] bg-brand text-brand-foreground shadow-[0_14px_30px_color-mix(in_oklab,var(--color-brand)_16%,transparent)] hover:bg-[color:color-mix(in_oklab,var(--color-brand)_88%,var(--color-foreground)_12%)]",
        outline:
          "border-border bg-card text-foreground shadow-[0_1px_0_color-mix(in_oklab,var(--color-foreground)_5%,transparent)] hover:border-[color:color-mix(in_oklab,var(--color-brand)_16%,var(--color-border))] hover:bg-[color:color-mix(in_oklab,var(--color-brand)_4%,var(--color-card))] aria-expanded:bg-accent",
        brandOutline:
          "border-[color:color-mix(in_oklab,var(--color-brand)_24%,var(--color-border))] bg-[color:color-mix(in_oklab,var(--color-brand)_6%,var(--color-card))] text-[color:color-mix(in_oklab,var(--color-brand)_74%,var(--color-foreground))] hover:bg-[color:color-mix(in_oklab,var(--color-brand)_12%,var(--color-card))] hover:text-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-accent aria-expanded:bg-accent",
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground aria-expanded:bg-accent",
        destructive:
          "border-[color:color-mix(in_oklab,var(--color-destructive)_26%,var(--color-border))] bg-[color:color-mix(in_oklab,var(--color-destructive)_10%,var(--color-card))] text-destructive hover:bg-[color:color-mix(in_oklab,var(--color-destructive)_16%,var(--color-card))] focus-visible:border-destructive/40 focus-visible:ring-destructive/14",
        link: "h-auto rounded-none border-none bg-transparent px-0 py-0 text-[color:var(--color-brand)] shadow-none hover:text-foreground",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-xs in-data-[slot=button-group]:rounded-[var(--radius-sm)] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-[var(--radius-sm)] px-3 text-sm in-data-[slot=button-group]:rounded-[var(--radius-sm)] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 text-sm has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs":
          "size-7 rounded-[var(--radius-sm)] in-data-[slot=button-group]:rounded-[var(--radius-sm)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9 rounded-[var(--radius-sm)] in-data-[slot=button-group]:rounded-[var(--radius-sm)]",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
