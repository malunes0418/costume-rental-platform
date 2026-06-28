export function relativeNotificationTime(iso?: string): string {
  if (!iso) return "";

  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function fullNotificationDate(iso?: string): string {
  if (!iso) return "No timestamp";

  return new Date(iso).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function notificationTypeLabel(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getNotificationTypeMeta(type: string) {
  const normalized = type.toLowerCase();

  if (normalized.includes("payment") || normalized.includes("surcharge")) {
    return {
      label: notificationTypeLabel(type),
      chipClassName: "border-accent/35 bg-brand-gold-soft text-accent-foreground",
      tone: "gold" as const,
    };
  }

  if (
    normalized.includes("reservation") ||
    normalized.includes("booking") ||
    normalized.includes("delivery") ||
    normalized.includes("return")
  ) {
    return {
      label: notificationTypeLabel(type),
      chipClassName: "border-primary/30 bg-brand-coral-soft text-primary",
      tone: "coral" as const,
    };
  }

  if (normalized.includes("vendor") || normalized.includes("review")) {
    return {
      label: notificationTypeLabel(type),
      chipClassName: "border-border bg-muted/60 text-foreground",
      tone: "neutral" as const,
    };
  }

  return {
    label: notificationTypeLabel(type),
    chipClassName: "border-border bg-muted/40 text-muted-foreground",
    tone: "neutral" as const,
  };
}
