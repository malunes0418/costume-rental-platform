"use client";

import type { Notification } from "@/lib/account";
import { relativeNotificationTime } from "@/lib/notificationDisplay";
import { NotificationTypeChip } from "@/components/notifications/NotificationTypeChip";
import { cn } from "@/lib/utils";

interface NotificationRowProps {
  notification: Notification;
  isActive?: boolean;
  compact?: boolean;
  onSelect: () => void;
}

export function NotificationRow({
  notification,
  isActive = false,
  compact = false,
  onSelect,
}: NotificationRowProps) {
  const unread = !notification.is_read;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group w-full text-left transition-colors",
        compact ? "px-4 py-3.5 sm:px-5 sm:py-4" : "px-5 py-5 sm:px-6",
        isActive && "bg-brand-coral-soft/40",
        !isActive && unread && "bg-muted/30",
        !isActive && !unread && "bg-transparent",
        "hover:bg-muted/45"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "mt-2 flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold tabular-nums",
              unread && "bg-primary text-primary-foreground",
              !unread && "border border-border bg-background text-muted-foreground/50"
            )}
          >
            {unread ? "!" : "·"}
          </span>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <NotificationTypeChip type={notification.type} />
              {!compact ? (
                <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                  {relativeNotificationTime(notification.created_at)}
                </span>
              ) : null}
            </div>

            <p
              className={cn(
                "leading-snug text-foreground",
                compact ? "text-sm" : "text-base",
                unread ? "font-semibold" : "font-medium text-foreground/80"
              )}
            >
              {notification.title}
            </p>

            {notification.message ? (
              <p
                className={cn(
                  "mt-1.5 line-clamp-2 leading-relaxed text-muted-foreground",
                  compact ? "text-xs" : "text-sm"
                )}
              >
                {notification.message}
              </p>
            ) : null}
          </div>
        </div>

        {compact ? (
          <span className="shrink-0 pt-1 text-[10px] tabular-nums text-muted-foreground/70">
            {relativeNotificationTime(notification.created_at)}
          </span>
        ) : null}
      </div>
    </button>
  );
}
