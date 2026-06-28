"use client";

import { BellIcon as Bell } from "@radix-ui/react-icons";

import type { Notification } from "@/lib/account";
import { fullNotificationDate, getNotificationTypeMeta, relativeNotificationTime } from "@/lib/notificationDisplay";
import { NotificationTypeChip } from "@/components/notifications/NotificationTypeChip";
import { cn } from "@/lib/utils";

interface NotificationDetailPanelProps {
  notification: Notification | null;
}

export function NotificationDetailPanel({ notification }: NotificationDetailPanelProps) {
  if (!notification) {
    return (
      <div className="panel-card flex min-h-72 flex-col items-center justify-center gap-4 px-8 py-16 text-center lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-full border border-border bg-muted/30 p-5 text-muted-foreground/25">
          <Bell className="size-9" />
        </div>
        <div className="max-w-xs space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Select a cue</p>
          <p className="font-display text-xl font-semibold text-foreground">Pick from the call board</p>
          <p className="text-sm text-muted-foreground">Choose a notification to read the full message and timestamp.</p>
        </div>
      </div>
    );
  }

  const meta = getNotificationTypeMeta(notification.type);

  return (
    <aside
      className={cn(
        "panel-card overflow-hidden shadow-coral-hover lg:sticky lg:top-24 lg:self-start",
        meta.tone === "gold" && "ring-1 ring-accent/20",
        meta.tone === "coral" && "ring-1 ring-primary/15"
      )}
    >
      <div
        className={cn(
          "border-b border-border px-6 py-5 sm:px-7",
          meta.tone === "gold" && "bg-brand-gold-soft/70",
          meta.tone === "coral" && "bg-brand-coral-soft/70",
          meta.tone === "neutral" && "bg-muted/40"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <NotificationTypeChip type={notification.type} />
          <span className="text-xs tabular-nums text-muted-foreground">
            {relativeNotificationTime(notification.created_at)}
          </span>
        </div>
      </div>

      <div className="space-y-6 p-6 sm:p-7">
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {!notification.is_read ? "New cue" : "Cue details"}
          </p>
          <h2 className="font-display text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            {notification.title}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {notification.message || "No additional details were provided."}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-muted/25 px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Received</p>
          <p className="mt-2 text-sm text-foreground">{fullNotificationDate(notification.created_at)}</p>
        </div>
      </div>
    </aside>
  );
}
