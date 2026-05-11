"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  myNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from "@/lib/account";
import { BellIcon as Bell, CheckIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/useClickOutside";

// ── relative time formatter ───────────────────────────────────────────────────

function relativeTime(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── type label formatter ──────────────────────────────────────────────────────

function typeLabel(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── component ─────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const { token } = useAuth();
  const [items, setItems]     = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const panelRef  = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useClickOutside<any>({
    ref: [panelRef, triggerRef],
    callback: () => setOpen(false),
  });

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Fetch notifications
  useEffect(() => {
    if (!token) { setItems([]); setIsLoading(false); return; }
    let cancelled = false;
    setIsLoading(true);
    myNotifications(token)
      .then((res) => { if (!cancelled) setItems(res); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  // Mark all read when panel opens
  useEffect(() => {
    if (!open || !token) return;
    const hasUnread = items.some((n) => !n.is_read);
    if (!hasUnread) return;
    markAllNotificationsRead(token)
      .then(() => setItems((xs) => xs.map((n) => ({ ...n, is_read: true }))))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleMarkAll() {
    if (!token || markingAll) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead(token);
      setItems((xs) => xs.map((n) => ({ ...n, is_read: true })));
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleMarkOne(n: Notification) {
    if (!token || n.is_read) return;
    try {
      const updated = await markNotificationRead(token, n.id);
      setItems((xs) => xs.map((x) => (x.id === n.id ? updated : x)));
    } catch {
      // silent
    }
  }

  const unreadCount = items.filter((n) => !n.is_read).length;

  if (!token) return null;

  return (
    <div className="relative">
      {/* ── Trigger ── */}
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative flex size-9 items-center justify-center rounded-sm border transition-colors",
          open
            ? "border-foreground/20 bg-muted text-foreground"
            : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
        )}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 size-1.5 rounded-full bg-foreground ring-1 ring-background"
          />
        )}
      </button>

      {/* ── Panel ── */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className={cn(
            "absolute right-0 top-full z-[100] mt-2 w-[360px] max-w-[calc(100vw-2rem)]",
            "flex flex-col border border-border bg-background shadow-none",
            "rounded-sm overflow-hidden",
            "animate-fade-up"
          )}
          style={{ animationDuration: "200ms" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <p className="font-playfair text-base font-semibold text-foreground">
                Notifications
              </p>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-sm border border-border bg-muted px-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={markingAll}
                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                <CheckIcon className="size-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex max-h-[400px] flex-col overflow-y-auto divide-y divide-border">
            {isLoading && items.length === 0 ? (
              /* Skeleton */
              <div className="flex flex-col divide-y divide-border">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2 px-5 py-4">
                    <div className="h-3 w-1/3 rounded-sm bg-muted animate-pulse" />
                    <div className="h-3 w-2/3 rounded-sm bg-muted animate-pulse" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-4 px-5 py-16 text-center">
                <div className="text-muted-foreground/20">
                  <Bell className="size-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-playfair text-lg font-semibold text-foreground">
                    All clear
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You&apos;re fully up to date.
                  </p>
                </div>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleMarkOne(n)}
                  className={cn(
                    "group w-full text-left px-5 py-4 transition-colors hover:bg-muted/50",
                    !n.is_read && "bg-muted/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {/* Unread dot */}
                      <span
                        className={cn(
                          "mt-1.5 size-1.5 shrink-0 rounded-full transition-opacity",
                          !n.is_read
                            ? "bg-foreground opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          "text-sm leading-snug",
                          !n.is_read ? "font-semibold text-foreground" : "font-medium text-foreground/75"
                        )}>
                          {n.title}
                        </p>
                        {n.message && (
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {n.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="shrink-0 flex flex-col items-end gap-1.5 mt-0.5">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {typeLabel(n.type)}
                      </span>
                      <span className="text-[10px] tabular-nums text-muted-foreground/60">
                        {relativeTime(n.created_at)}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer — only when there are items */}
          {items.length > 0 && (
            <div className="border-t border-border px-5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {items.length} {items.length === 1 ? "notification" : "notifications"} total
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
