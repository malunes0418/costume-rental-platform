"use client";

import { BellIcon as Bell, CheckIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type RefObject } from "react";

import {
  markAllNotificationsRead,
  markNotificationRead,
  myNotifications,
  type Notification,
} from "@/lib/account";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/useClickOutside";

const triggerClass =
  "relative inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-[0_1px_0_color-mix(in_oklab,white_35%,transparent)] transition-[border-color,background-color,color] duration-[var(--dur-fast)] hover:border-[color:color-mix(in_oklab,var(--color-brand)_18%,var(--color-border))] hover:bg-accent hover:text-foreground dark:shadow-[0_1px_0_color-mix(in_oklab,white_7%,transparent)]";

function relativeTime(iso?: string): string {
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

function typeLabel(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const outsideRefs: RefObject<HTMLElement | null>[] = [panelRef, triggerRef];

  useClickOutside({
    ref: outsideRefs,
    callback: () => setOpen(false),
  });

  useEffect(() => {
    if (!open) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    myNotifications()
      .then((response) => {
        if (!cancelled) setItems(response);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleMarkAll() {
    if (!user || markingAll) return;
    setMarkingAll(true);

    try {
      await markAllNotificationsRead();
      setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    } catch {
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleOpenNotification(notification: Notification) {
    if (!user) return;

    if (!notification.is_read) {
      try {
        const updated = await markNotificationRead(notification.id);
        setItems((current) => current.map((item) => (item.id === notification.id ? updated : item)));
      } catch {
      }
    }

    setOpen(false);
    router.push(`/notifications?notification=${notification.id}`);
  }

  const unreadCount = items.filter((item) => !item.is_read).length;

  if (!user) return null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(open ? `${triggerClass} border-[color:color-mix(in_oklab,var(--color-brand)_18%,var(--color-border))] bg-accent text-foreground` : triggerClass)}
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 size-2 rounded-full bg-[color:var(--color-brand)] ring-2 ring-background"
          />
        ) : null}
      </button>

      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className="surface-elevated absolute right-0 top-full z-[100] mt-2 flex w-[24rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[var(--radius-xl)]"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              {unreadCount > 0 ? (
                <span className="rounded-full border border-[color:color-mix(in_oklab,var(--color-brand)_18%,var(--color-border))] bg-[color:color-mix(in_oklab,var(--color-brand)_8%,var(--color-card))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand)]">
                  {unreadCount}
                </span>
              ) : null}
            </div>

            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={markingAll}
                className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="flex max-h-[26rem] flex-col overflow-y-auto">
            {isLoading && items.length === 0 ? (
              <div className="space-y-3 px-5 py-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-[var(--radius-md)] border border-border bg-card px-4 py-3">
                    <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
                    <div className="mt-2 h-3 w-48 animate-pulse rounded-full bg-muted" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
                <div className="flex size-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
                  <Bell className="size-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">All clear</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    New platform events and renter activity will show up here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 px-3 py-3">
                {items.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleOpenNotification(notification)}
                    className={cn(
                      "w-full rounded-[var(--radius-md)] border px-4 py-3 text-left transition-colors",
                      notification.is_read
                        ? "border-transparent bg-transparent hover:border-border hover:bg-accent/60"
                        : "border-[color:color-mix(in_oklab,var(--color-brand)_12%,var(--color-border))] bg-[color:color-mix(in_oklab,var(--color-brand)_5%,var(--color-card))] hover:bg-[color:color-mix(in_oklab,var(--color-brand)_8%,var(--color-card))]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {!notification.is_read ? (
                            <span className="size-2 rounded-full bg-[color:var(--color-brand)]" />
                          ) : null}
                          <p className="truncate text-sm font-semibold text-foreground">{notification.title}</p>
                        </div>
                        {notification.message ? (
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {notification.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {typeLabel(notification.type)}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">{relativeTime(notification.created_at)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 ? (
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {items.length} total
              </p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push("/notifications");
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-foreground transition-colors hover:text-[color:var(--color-brand)]"
              >
                <CheckIcon className="size-3.5" />
                View all
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
