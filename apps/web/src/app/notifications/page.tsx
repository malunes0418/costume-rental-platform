"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { markNotificationRead, myNotifications, type Notification } from "../../lib/account";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Bell, CheckCheck } from "lucide-react";

export default function NotificationsPage() {
  const { token } = useAuth();
  const [items, setItems]         = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setItems([]); setIsLoading(false); return; }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    myNotifications(token)
      .then((res) => { if (!cancelled) setItems(res); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof ApiError ? e.message : "Failed to load notifications"); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const unreadCount = items.filter((n) => !n.is_read).length;

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-12">
        <Card
          className="border shadow-sm"
          style={{ background: "var(--clr-surface)", borderColor: "var(--clr-border)", borderRadius: "var(--radius-xl)" }}
        >
          <CardHeader>
            <CardTitle style={{ fontFamily: "var(--font-display)", color: "var(--clr-text)" }}>Notifications</CardTitle>
            <CardDescription style={{ color: "var(--clr-text-muted)" }}>Log in to view your messages.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-full text-white border-0" style={{ background: "var(--clr-crimson)" }}>
              <Link href="/login?next=/notifications">Log in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      {/* Page header */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Bell className="size-6" style={{ color: "var(--clr-crimson)" }} />
            <h1
              className="text-2xl font-black tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--clr-text)" }}
            >
              Notifications
            </h1>
            {!isLoading && unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold"
                style={{ background: "rgba(196,16,42,0.15)", color: "#f87171", border: "1px solid rgba(196,16,42,0.3)" }}
              >
                {unreadCount} new
              </Badge>
            )}
          </div>
          <p className="mt-1.5 text-sm" style={{ color: "var(--clr-text-muted)" }}>
            Updates about your bookings and payments.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 border-red-500/30 bg-red-500/10">
          <AlertCircle className="size-4" />
          <AlertDescription style={{ color: "#f87171" }}>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card
              key={i}
              className="border"
              style={{ background: "var(--clr-surface)", borderColor: "var(--clr-border)", borderRadius: "var(--radius-md)" }}
            >
              <CardContent className="p-5">
                <Skeleton className="mb-2 h-4 w-1/3" style={{ background: "var(--clr-surface-2)" }} />
                <Skeleton className="h-3 w-3/4" style={{ background: "var(--clr-surface-2)" }} />
              </CardContent>
            </Card>
          ))
        ) : items.length ? (
          items.map((n) => (
            <Card
              key={n.id}
              className="border transition-all duration-200"
              style={{
                background: n.is_read ? "var(--clr-surface)" : "rgba(196,16,42,0.04)",
                borderColor: n.is_read ? "var(--clr-border)" : "rgba(196,16,42,0.2)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!n.is_read && (
                        <span
                          className="inline-block size-2 rounded-full shrink-0"
                          style={{ background: "var(--clr-crimson)" }}
                          aria-label="Unread"
                        />
                      )}
                      <p className="font-semibold text-sm" style={{ color: "var(--clr-text)" }}>
                        {n.title}
                      </p>
                      <Badge
                        variant="secondary"
                        className="rounded-full px-2 py-0 text-[0.65rem] font-medium uppercase tracking-wider"
                        style={{ background: "var(--clr-surface-2)", color: "var(--clr-text-dim)", border: "1px solid var(--clr-border)" }}
                      >
                        {n.type}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-sm" style={{ color: "var(--clr-text-muted)" }}>
                      {n.message}
                    </p>
                  </div>
                  {!n.is_read && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const updated = await markNotificationRead(token, n.id);
                          setItems((xs) => xs.map((x) => (x.id === n.id ? updated : x)));
                        } catch { /* silent */ }
                      }}
                      className="shrink-0 rounded-full border-white/10 bg-transparent text-xs hover:bg-white/5 gap-1.5"
                      style={{ color: "var(--clr-text-muted)" }}
                    >
                      <CheckCheck className="size-3.5" />
                      Mark read
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div
            className="rounded-2xl border p-16 text-center"
            style={{ background: "var(--clr-surface)", borderColor: "var(--clr-border)" }}
          >
            <div className="mb-4 text-5xl">✅</div>
            <p className="text-[1.05rem]" style={{ color: "var(--clr-text-muted)", fontFamily: "var(--font-display)" }}>
              You&apos;re all caught up!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
