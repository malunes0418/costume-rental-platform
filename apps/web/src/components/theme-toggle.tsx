"use client";

import { MoonIcon as Moon, SunIcon as Sun } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  function toggle() {
    setTheme(isDark ? "light" : "dark");
  }

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "flex size-10 items-center justify-center rounded-full border border-transparent",
          className
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "group relative inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-[0_1px_0_color-mix(in_oklab,white_35%,transparent)] transition-[border-color,background-color,color,transform] duration-[var(--dur-fast)] hover:border-[color:color-mix(in_oklab,var(--color-brand)_18%,var(--color-border))] hover:bg-accent hover:text-foreground dark:shadow-[0_1px_0_color-mix(in_oklab,white_7%,transparent)]",
        className
      )}
    >
      <Sun
        className={cn(
          "absolute size-4 transition-all duration-300",
          isDark ? "rotate-45 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100"
        )}
      />
      <Moon
        className={cn(
          "absolute size-4 transition-all duration-300",
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-45 scale-75 opacity-0"
        )}
      />
    </button>
  );
}
