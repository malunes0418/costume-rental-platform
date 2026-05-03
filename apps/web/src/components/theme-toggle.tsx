"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { MoonIcon as Moon, SunIcon as Sun } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render after client mount
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  function toggle() {
    setTheme(isDark ? "light" : "dark");
  }

  // Render a stable placeholder before mount to avoid layout shift
  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className="flex size-9 items-center justify-center rounded-sm border border-transparent"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "group relative flex size-9 items-center justify-center rounded-sm border transition-colors duration-200",
        "border-transparent text-muted-foreground",
        "hover:border-border hover:text-foreground"
      )}
    >
      {/* Sun — visible in light mode */}
      <Sun
        className={cn(
          "absolute size-4 transition-all duration-300",
          isDark
            ? "opacity-0 scale-75 rotate-45"
            : "opacity-100 scale-100 rotate-0"
        )}
      />

      {/* Moon — visible in dark mode */}
      <Moon
        className={cn(
          "absolute size-4 transition-all duration-300",
          isDark
            ? "opacity-100 scale-100 rotate-0"
            : "opacity-0 scale-75 -rotate-45"
        )}
      />
    </button>
  );
}
