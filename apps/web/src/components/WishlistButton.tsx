"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { addWishlist, removeWishlist } from "@/lib/account";
import { HeartIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  costumeId: number;
  initialSaved?: boolean;
  /** Size variant — defaults to "md" */
  size?: "sm" | "md";
  className?: string;
}

export function WishlistButton({
  costumeId,
  initialSaved = false,
  size = "md",
  className,
}: WishlistButtonProps) {
  const { token } = useAuth();
  const [saved, setSaved]       = useState(initialSaved);
  const [loading, setLoading]   = useState(false);

  async function toggle(e: React.MouseEvent) {
    // Prevent the parent link from navigating
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      toast.message("Save to wishlist", {
        description: "Log in to save costumes to your wishlist.",
        action: { label: "Log in", onClick: () => window.location.assign("/login") },
      });
      return;
    }

    if (loading) return;
    setLoading(true);

    // Optimistic update
    const wassaved = saved;
    setSaved(!wassaved);

    try {
      if (wassaved) {
        await removeWishlist(token, costumeId);
        toast.success("Removed from wishlist.");
      } else {
        await addWishlist(token, costumeId);
        toast.success("Saved to wishlist.");
      }
    } catch {
      // Revert on failure
      setSaved(wassaved);
      toast.error("Could not update wishlist. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const isSmall = size === "sm";

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={saved}
      onClick={toggle}
      disabled={loading}
      className={cn(
        // Base
        "flex items-center justify-center rounded-sm border backdrop-blur-sm",
        "transition-all duration-200 disabled:cursor-wait",
        // Sizing
        isSmall ? "size-7" : "size-9",
        // State: unsaved
        !saved && "border-border/60 bg-background/80 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
        // State: saved
        saved && "border-transparent bg-foreground text-background",
        // Scale on press
        "active:scale-90",
        className
      )}
    >
      <HeartIcon
        className={cn(
          "transition-transform duration-200",
          isSmall ? "size-3" : "size-4",
          loading && "animate-pulse",
          saved && "scale-110"
        )}
      />
    </button>
  );
}
