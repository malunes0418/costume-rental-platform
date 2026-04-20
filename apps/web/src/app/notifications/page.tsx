"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { markNotificationRead, myNotifications, type Notification } from "../../lib/account";

export default function NotificationsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    myNotifications(token)
      .then((res) => {
        if (cancelled) return;
        setItems(res);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "Failed to load notifications");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Log in to view your messages.</p>
          <Link
            href="/login?next=/notifications"
            className="mt-6 inline-flex rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-600"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Updates about your bookings and payments.</p>

      {error ? (
        <div className="mt-6 rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-700 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-3xl border border-black/5 bg-white dark:border-white/10 dark:bg-zinc-950"
            />
          ))
        ) : items.length ? (
          items.map((n) => (
            <div
              key={n.id}
              className={`rounded-3xl border p-5 shadow-sm ${
                n.is_read
                  ? "border-black/5 bg-white dark:border-white/10 dark:bg-zinc-950"
                  : "border-rose-500/20 bg-rose-500/5 dark:border-rose-500/30"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">{n.title}</div>
                  <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{n.message}</div>
                  <div className="mt-2 text-xs text-zinc-500">{n.type}</div>
                </div>
                {!n.is_read ? (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const updated = await markNotificationRead(token, n.id);
                        setItems((xs) => xs.map((x) => (x.id === n.id ? updated : x)));
                      } catch {}
                    }}
                    className="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold hover:bg-white dark:border-white/15 dark:hover:bg-white/5"
                  >
                    Mark read
                  </button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-black/5 bg-white p-8 text-center text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
            You’re all caught up.
          </div>
        )}
      </div>
    </div>
  );
}

