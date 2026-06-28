"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { BellIcon as Bell, CheckIcon } from "@radix-ui/react-icons";

import { NotificationRow } from "@/components/notifications/NotificationRow";
import { useClickOutside } from "@/hooks/useClickOutside";
import {
  markAllNotificationsRead,
  markNotificationRead,
  myNotifications,
  type Notification,
} from "@/lib/account";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const actionLabelClass = "text-[10px] font-semibold uppercase tracking-widest";
const PANEL_WIDTH = 380;
const PANEL_GAP = 12;

function getPanelPosition(trigger: HTMLElement) {
  const rect = trigger.getBoundingClientRect();
  const width = Math.min(PANEL_WIDTH, window.innerWidth - 16);
  const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);

  return {
    top: rect.bottom + PANEL_GAP,
    left,
    width,
  };
}

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0, width: PANEL_WIDTH });

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const outsideRefs: RefObject<HTMLElement | null>[] = [panelRef, triggerRef];

  useEffect(() => {
    setMounted(true);
  }, []);

  useClickOutside({
    ref: outsideRefs,
    callback: () => setOpen(false),
  });

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    function updatePosition() {
      if (!triggerRef.current) return;
      setPanelPosition(getPanelPosition(triggerRef.current));
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

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
      .then((res) => {
        if (!cancelled) setItems(res);
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
      // silent
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
        // silent
      }
    }

    setOpen(false);
    router.push(`/notifications?notification=${notification.id}`);
  }

  function handleViewAll() {
    setOpen(false);
    router.push("/notifications");
  }

  const unreadCount = items.filter((item) => !item.is_read).length;

  if (!user) return null;

  const panel =
    open && mounted ? (
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Notifications"
        className={cn("floating-panel fixed z-[200] overflow-hidden animate-fade-up")}
        style={{
          top: panelPosition.top,
          left: panelPosition.left,
          width: panelPosition.width,
          animationDuration: "220ms",
        }}
      >
        <div className="relative border-b border-border bg-brand-coral-soft/50 px-5 py-4">
          <div className="pointer-events-none absolute inset-0 notification-panel-glow" aria-hidden="true" />
          <div className="relative flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-primary">Call board</p>
              <p className="font-display text-base font-semibold text-foreground">Notifications</p>
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={markingAll}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border border-border bg-background/80 px-2.5 py-1.5 transition-colors hover:bg-background disabled:opacity-50",
                  actionLabelClass
                )}
              >
                <CheckIcon className="size-3" />
                Mark all
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex max-h-[min(420px,70vh)] flex-col overflow-y-auto divide-y divide-border bg-card">
          {isLoading && items.length === 0 ? (
            <div className="flex flex-col divide-y divide-border">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2 px-5 py-4">
                  <div className="h-3 w-24 animate-pulse rounded-md bg-muted" />
                  <div className="h-3 w-3/4 animate-pulse rounded-md bg-muted" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
              <div className="rounded-full border border-border bg-muted/30 p-4 text-muted-foreground/25">
                <Bell className="size-7" />
              </div>
              <div className="space-y-1">
                <p className="font-display text-lg font-semibold text-foreground">Quiet house</p>
                <p className="text-xs text-muted-foreground">You&apos;re fully up to date.</p>
              </div>
            </div>
          ) : (
            items.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                compact
                onSelect={() => void handleOpenNotification(notification)}
              />
            ))
          )}
        </div>

        {items.length > 0 ? (
          <div className="flex items-center justify-between gap-4 border-t border-border bg-muted/20 px-5 py-3">
            <p className={cn(actionLabelClass, "text-muted-foreground")}>
              {items.length} {items.length === 1 ? "cue" : "cues"}
              {unreadCount > 0 ? ` · ${unreadCount} unread` : ""}
            </p>
            <button
              type="button"
              onClick={handleViewAll}
              className={cn(actionLabelClass, "text-primary transition-colors hover:text-primary/80")}
            >
              Open call board
            </button>
          </div>
        ) : null}
      </div>
    ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "relative flex size-9 items-center justify-center rounded-full transition-colors",
          open
            ? "bg-brand-coral-soft text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          unreadCount > 0 && !open && "text-primary"
        )}
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold tabular-nums text-primary-foreground ring-2 ring-background"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {mounted && panel ? createPortal(panel, document.body) : null}
    </>
  );
}
