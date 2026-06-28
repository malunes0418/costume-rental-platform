"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { MoonIcon as Moon, SunIcon as Sun } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [snapping, setSnapping] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  function toggle() {
    setSnapping(true);
    setTheme(isDark ? "light" : "dark");
    window.setTimeout(() => setSnapping(false), 350);
  }

  if (!mounted) {
    return (
      <div aria-hidden="true" className="theme-switch" data-state="light">
        <span className="theme-switch-track">
          <span className="theme-switch-glow" />
          <Sun className="theme-switch-track-icon theme-switch-track-icon--sun" />
          <Moon className="theme-switch-track-icon theme-switch-track-icon--moon" />
          <span className="theme-switch-thumb">
            <Sun className="theme-switch-icon theme-switch-icon--sun" />
            <Moon className="theme-switch-icon theme-switch-icon--moon" />
          </span>
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Bring up house lights (switch to light mode)" : "Dim to dark stage (switch to dark mode)"}
      data-state={isDark ? "dark" : "light"}
      onClick={toggle}
      className={cn("theme-switch hover-snap", snapping && "animate-snap")}
    >
      <span className="theme-switch-track">
        <span className="theme-switch-glow" aria-hidden="true" />
        <Sun className="theme-switch-track-icon theme-switch-track-icon--sun" aria-hidden="true" />
        <Moon className="theme-switch-track-icon theme-switch-track-icon--moon" aria-hidden="true" />
        <span className="theme-switch-thumb" aria-hidden="true">
          <Sun className="theme-switch-icon theme-switch-icon--sun" />
          <Moon className="theme-switch-icon theme-switch-icon--moon" />
        </span>
      </span>
    </button>
  );
}
