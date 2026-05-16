"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BellIcon as Bell, CheckIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  markAllNotificationsRead,
  markNotificationRead,
  myNotifications,
  type Notification,
} from "@/lib/account";
import { cn } from "@/lib/utils";

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

function fullDate(iso?: string): string {
  if (!iso) return "No timestamp";

  return new Date(iso).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function typeLabel(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function NotificationsPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-32 pt-16">
      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Your account
          </p>
          <h1 className="mt-4 font-playfair text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
            Notifications
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Stay on top of reservation updates, payment reviews, and marketplace activity.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="space-y-3 border border-border">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="border-b border-border px-5 py-5 last:border-b-0">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="mt-3 h-4 w-3/4" />
              <Skeleton className="mt-2 h-3 w-full" />
            </div>
          ))}
        </div>
        <div className="border border-border p-8">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-6 h-10 w-2/3" />
          <Skeleton className="mt-4 h-24 w-full" />
        </div>
      </div>
    </div>
  );
}

function NotificationsPageContent() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    myNotifications()
      .then((notifications) => {
        if (!cancelled) {
          setItems(notifications);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof ApiError ? error.message : "Failed to load notifications");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, user]);

  const selectedId = useMemo(() => {
    const value = searchParams.get("notification");
    if (!value) return null;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }, [searchParams]);

  const selectedNotification = useMemo(() => {
    if (items.length === 0) return null;

    return items.find((item) => item.id === selectedId) || items[0];
  }, [items, selectedId]);

  useEffect(() => {
    if (!selectedNotification || selectedNotification.is_read) return;

    markNotificationRead(selectedNotification.id)
      .then((updated) => {
        setItems((current) =>
          current.map((item) => (item.id === selectedNotification.id ? updated : item))
        );
      })
      .catch(() => {});
  }, [selectedNotification]);

  async function handleSelect(notification: Notification) {
    if (!notification.is_read) {
      try {
        const updated = await markNotificationRead(notification.id);
        setItems((current) =>
          current.map((item) => (item.id === notification.id ? updated : item))
        );
      } catch {
        // silent
      }
    }

    router.replace(`/notifications?notification=${notification.id}`, { scroll: false });
  }

  async function handleMarkAll() {
    if (markingAll) return;

    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    } catch (error: unknown) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update notifications");
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = items.filter((item) => !item.is_read).length;

  if (!user && !isAuthLoading) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-6 pb-32 pt-24 text-center">
        <div className="text-muted-foreground/20">
          <Bell className="size-16" />
        </div>
        <div className="max-w-sm space-y-3">
          <h1 className="font-playfair text-4xl font-semibold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            Sign in to see updates about reservations, payments, and vendor activity.
          </p>
        </div>
        <Link
          href="/login?next=/notifications"
          className="inline-flex h-12 items-center rounded-md bg-foreground px-8 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
        >
          Log in to continue
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-32 pt-16">
      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground animate-fade-up">
            Your account
          </p>
          <h1 className="mt-4 font-playfair text-5xl font-semibold tracking-tight text-foreground animate-fade-up-delay-1 md:text-6xl">
            Notifications
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground animate-fade-up-delay-2">
            Stay on top of reservation updates, payment reviews, and marketplace activity.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-sm border border-border px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {unreadCount} unread
          </span>
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={markingAll || unreadCount === 0}
            className="inline-flex h-10 items-center gap-2 rounded-sm border border-border px-4 text-[10px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckIcon className="size-3.5" />
            Mark all read
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div className="space-y-3 border border-border">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="border-b border-border px-5 py-5 last:border-b-0">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="mt-3 h-4 w-3/4" />
                <Skeleton className="mt-2 h-3 w-full" />
              </div>
            ))}
          </div>
          <div className="border border-border p-8">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-6 h-10 w-2/3" />
            <Skeleton className="mt-4 h-24 w-full" />
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-6 border border-border px-10 py-24 text-center">
          <div className="text-muted-foreground/20">
            <Bell className="size-12" />
          </div>
          <div className="space-y-2">
            <p className="font-playfair text-3xl font-semibold text-foreground">All clear</p>
            <p className="text-muted-foreground">
              New reservation and payment updates will show up here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div className="overflow-hidden border border-border">
            <div className="border-b border-border px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                All notifications
              </p>
            </div>

            <div className="divide-y divide-border">
              {items.map((notification) => {
                const isActive = selectedNotification?.id === notification.id;

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleSelect(notification)}
                    className={cn(
                      "w-full px-5 py-5 text-left transition-colors hover:bg-muted/40",
                      isActive && "bg-muted/50",
                      !notification.is_read && "bg-muted/20"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              notification.is_read ? "bg-transparent" : "bg-foreground"
                            )}
                          />
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            {typeLabel(notification.type)}
                          </span>
                        </div>
                        <p
                          className={cn(
                            "mt-3 text-base leading-snug text-foreground",
                            notification.is_read ? "font-medium" : "font-semibold"
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {notification.message || "No additional details were provided."}
                        </p>
                      </div>

                      <span className="shrink-0 pt-0.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                        {relativeTime(notification.created_at)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="border border-border p-8 lg:sticky lg:top-24 lg:self-start">
            {selectedNotification ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex rounded-sm border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {typeLabel(selectedNotification.type)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {relativeTime(selectedNotification.created_at)}
                  </span>
                </div>

                <div className="space-y-3">
                  <h2 className="font-playfair text-3xl font-semibold leading-tight text-foreground">
                    {selectedNotification.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {selectedNotification.message || "No additional details were provided."}
                  </p>
                </div>

                <div className="border-t border-border pt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Received
                  </p>
                  <p className="mt-2 text-sm text-foreground">{fullDate(selectedNotification.created_at)}</p>
                </div>
              </div>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
                <div className="text-muted-foreground/20">
                  <Bell className="size-10" />
                </div>
                <div className="space-y-2">
                  <p className="font-playfair text-2xl font-semibold text-foreground">
                    Select a notification
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Choose an item from the list to see the full message.
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<NotificationsPageSkeleton />}>
      <NotificationsPageContent />
    </Suspense>
  );
}
