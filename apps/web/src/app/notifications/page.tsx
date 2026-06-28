"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BellIcon as Bell } from "@radix-ui/react-icons";
import { toast } from "sonner";

import { NotificationDetailPanel } from "@/components/notifications/NotificationDetailPanel";
import { NotificationRow } from "@/components/notifications/NotificationRow";
import { NotificationsHero } from "@/components/notifications/NotificationsHero";
import { buttonVariants } from "@/components/ui/button";
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

const actionLabelClass = "text-[10px] font-semibold uppercase tracking-widest";

function NotificationsPageSkeleton() {
  return (
    <div className="min-h-screen account-page-shell">
      <div className="mx-auto w-full max-w-[1200px] px-6 pb-24 pt-10">
        <div className="mb-10 overflow-hidden rounded-2xl border border-border bg-card px-6 py-8 sm:px-8 sm:py-10">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-4 h-10 w-64" />
          <Skeleton className="mt-3 h-4 w-full max-w-md" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
          <div className="panel-card divide-y divide-border overflow-hidden">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-2 px-6 py-5">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
          <div className="panel-card p-7">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-6 h-8 w-2/3" />
            <Skeleton className="mt-4 h-24 w-full" />
          </div>
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
        if (!cancelled) setItems(notifications);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof ApiError ? error.message : "Failed to load notifications");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
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
        setItems((current) => current.map((item) => (item.id === notification.id ? updated : item)));
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
      <div className="min-h-screen account-page-shell">
        <div className="mx-auto w-full max-w-[1200px] px-6 pb-24 pt-20 text-center">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-6 animate-fade-up">
            <div className="rounded-full border border-border bg-card p-5 text-muted-foreground/30">
              <Bell className="size-10" />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Call board pass required</p>
              <h1 className="font-display text-3xl font-semibold text-foreground">Notifications</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Sign in to see updates about reservations, payments, and vendor activity.
              </p>
            </div>
            <Link
              href="/login?next=/notifications"
              className={cn(buttonVariants({ size: "lg" }), "h-10 px-6 hover-snap", actionLabelClass)}
            >
              Log in to continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen account-page-shell">
      <div className="mx-auto w-full max-w-[1200px] px-6 pb-24 pt-10">
        {isLoading ? (
          <div className="mb-10 overflow-hidden rounded-2xl border border-border bg-card px-6 py-8 sm:px-8 sm:py-10">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="mt-4 h-10 w-64" />
            <Skeleton className="mt-3 h-4 w-full max-w-md" />
          </div>
        ) : (
          <NotificationsHero
            unreadCount={unreadCount}
            totalCount={items.length}
            markingAll={markingAll}
            onMarkAll={() => void handleMarkAll()}
          />
        )}

        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
            <div className="panel-card divide-y divide-border overflow-hidden">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="space-y-2 px-6 py-5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
            <div className="panel-card p-7">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-6 h-8 w-2/3" />
              <Skeleton className="mt-4 h-24 w-full" />
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="panel-card flex flex-col items-center gap-6 px-8 py-20 text-center animate-fade-up">
            <div className="rounded-full border border-border bg-brand-gold-soft/50 p-5 text-accent-foreground/40">
              <Bell className="size-10" />
            </div>
            <div className="max-w-sm space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Quiet house</p>
              <p className="font-display text-2xl font-semibold text-foreground">All clear</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                New reservation and payment updates will show up on your call board.
              </p>
            </div>
            <Link href="/" className={cn(buttonVariants({ size: "lg" }), "h-10 px-6 hover-snap", actionLabelClass)}>
              Browse costumes
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] animate-fade-up-delay-1">
            <div className="panel-card overflow-hidden shadow-coral-hover">
              <div className="border-b border-border bg-muted/25 px-5 py-4 sm:px-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  All cues · {items.length} total
                </p>
              </div>

              <div className="divide-y divide-border">
                {items.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    isActive={selectedNotification?.id === notification.id}
                    onSelect={() => void handleSelect(notification)}
                  />
                ))}
              </div>
            </div>

            <NotificationDetailPanel notification={selectedNotification} />
          </div>
        )}
      </div>
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
