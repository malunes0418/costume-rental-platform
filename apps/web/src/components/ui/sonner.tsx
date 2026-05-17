"use client";

import {
  CheckCircledIcon as CircleCheckIcon,
  InfoCircledIcon as InfoIcon,
  UpdateIcon as Loader2Icon,
  CrossCircledIcon as OctagonXIcon,
  ExclamationTriangleIcon as TriangleAlertIcon,
} from "@radix-ui/react-icons"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-[var(--radius-lg)] border border-border bg-popover text-popover-foreground shadow-[var(--shadow-overlay)]",
          title: "text-sm font-semibold tracking-[-0.01em]",
          description: "text-sm leading-6 text-muted-foreground",
          actionButton:
            "rounded-[var(--radius-sm)] border border-border bg-card px-3 text-sm font-semibold text-foreground",
          cancelButton:
            "rounded-[var(--radius-sm)] border border-border bg-transparent px-3 text-sm font-semibold text-muted-foreground",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
