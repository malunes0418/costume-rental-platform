"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CreditCard,
  Loader2,
  Mail,
  Megaphone,
  MessageSquare,
  RotateCcw,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

import { Sparkle } from "@/components/brand/Sparkle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/account";
import { cn } from "@/lib/utils";

type CategoryPrefix = "reservations" | "payments" | "messages" | "marketing";

const CATEGORIES: Array<{
  prefix: CategoryPrefix;
  label: string;
  description: string;
  Icon: typeof CalendarDays;
  accent: "coral" | "gold" | "muted";
}> = [
  {
    prefix: "reservations",
    label: "Reservations",
    description: "Confirmations, status changes, and handoff reminders.",
    Icon: CalendarDays,
    accent: "coral",
  },
  {
    prefix: "payments",
    label: "Payments",
    description: "Receipts, proof-of-payment updates, and balance notices.",
    Icon: CreditCard,
    accent: "gold",
  },
  {
    prefix: "messages",
    label: "Messages",
    description: "Direct notes from vendors about your rentals.",
    Icon: MessageSquare,
    accent: "coral",
  },
  {
    prefix: "marketing",
    label: "Marketing",
    description: "Featured costumes, promos, and platform news. Off by default.",
    Icon: Megaphone,
    accent: "muted",
  },
];

function preferenceFields(prefs: NotificationPreferences) {
  return {
    reservations_email: prefs.reservations_email,
    reservations_push: prefs.reservations_push,
    payments_email: prefs.payments_email,
    payments_push: prefs.payments_push,
    messages_email: prefs.messages_email,
    messages_push: prefs.messages_push,
    marketing_email: prefs.marketing_email,
    marketing_push: prefs.marketing_push,
  };
}

function preferencesEqual(a: NotificationPreferences, b: NotificationPreferences) {
  const fieldsA = preferenceFields(a);
  const fieldsB = preferenceFields(b);
  return (Object.keys(fieldsA) as Array<keyof typeof fieldsA>).every(
    (key) => fieldsA[key] === fieldsB[key]
  );
}

function NotificationsLoadingSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}

type ChannelToggleProps = {
  channel: "email" | "push";
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

function ChannelToggle({ channel, checked, onChange, label }: ChannelToggleProps) {
  const Icon = channel === "email" ? Mail : Smartphone;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:scale-[1.02] active:scale-[0.98]",
        checked
          ? "bg-primary text-primary-foreground shadow-coral"
          : "bg-muted/80 text-muted-foreground hover:bg-muted"
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {channel}
    </button>
  );
}

export function NotificationsPanel() {
  const [savedPreferences, setSavedPreferences] = useState<NotificationPreferences | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getNotificationPreferences()
      .then((prefs) => {
        if (!cancelled) {
          setSavedPreferences(prefs);
          setPreferences(prefs);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof ApiError ? error.message : "Failed to load notification preferences");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const isDirty = useMemo(() => {
    if (!preferences || !savedPreferences) return false;
    return !preferencesEqual(preferences, savedPreferences);
  }, [preferences, savedPreferences]);

  const enabledCount = useMemo(() => {
    if (!preferences) return 0;
    const fields = preferenceFields(preferences);
    return Object.values(fields).filter(Boolean).length;
  }, [preferences]);

  function togglePreference(key: keyof NotificationPreferences, checked: boolean) {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: checked });
  }

  function resetForm() {
    if (savedPreferences) setPreferences(savedPreferences);
  }

  function muteMarketing() {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      marketing_email: false,
      marketing_push: false,
    });
  }

  async function handleSave() {
    if (!preferences) return;

    setIsSaving(true);
    try {
      const saved = await updateNotificationPreferences(preferenceFields(preferences));
      setSavedPreferences(saved);
      setPreferences(saved);
      toast.success("Notification preferences saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save preferences.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || !preferences) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-up">
        <header className="mb-8">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-4 h-8 w-48" />
          <Skeleton className="mt-3 h-12 w-full max-w-md" />
        </header>
        <NotificationsLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkle size="sm" animated />
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
              Backstage alerts
            </p>
          </div>
          <h2 className="section-heading mt-3">Notifications</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Choose how SnapCos reaches you — email for the record, push for the moment. Reservation
            and payment alerts keep your rentals on track.
          </p>
        </div>

        <p className="shrink-0 text-xs text-muted-foreground">
          <span className="font-display text-2xl font-semibold text-foreground">{enabledCount}</span>
          <span className="ml-1.5">channels on</span>
        </p>
      </header>

      <div className="panel-card overflow-hidden">
        <div className="relative border-b border-border px-6 py-5 md:px-8">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background: `
                radial-gradient(ellipse 65% 100% at 12% 50%, oklch(0.68 0.16 28 / 0.07), transparent 55%),
                radial-gradient(ellipse 50% 75% at 88% 40%, oklch(0.80 0.12 80 / 0.08), transparent 50%)
              `,
            }}
          />

          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="size-3.5" aria-hidden="true" />
              <span>Email</span>
              <span className="text-border">·</span>
              <Smartphone className="size-3.5" aria-hidden="true" />
              <span>Push</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 rounded-full px-3 text-[10px] uppercase tracking-widest"
              onClick={muteMarketing}
            >
              Mute marketing
            </Button>
          </div>
        </div>

        <ul className="divide-y divide-border">
          {CATEGORIES.map(({ prefix, label, description, Icon, accent }, index) => {
            const emailKey = `${prefix}_email` as keyof NotificationPreferences;
            const pushKey = `${prefix}_push` as keyof NotificationPreferences;
            const emailOn = Boolean(preferences[emailKey]);
            const pushOn = Boolean(preferences[pushKey]);

            return (
              <li
                key={prefix}
                className={cn("px-6 py-5 md:px-8", index === 0 && "animate-fade-up-delay-1")}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div
                      className={cn(
                        "detail-chip-icon mt-0.5",
                        accent === "coral" && "detail-chip-icon--coral",
                        accent === "gold" && "detail-chip-icon--gold",
                        accent === "muted" && "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-base font-semibold text-foreground">{label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                    <ChannelToggle
                      channel="email"
                      checked={emailOn}
                      onChange={(checked) => togglePreference(emailKey, checked)}
                      label={`${label} email notifications`}
                    />
                    <ChannelToggle
                      channel="push"
                      checked={pushOn}
                      onChange={(checked) => togglePreference(pushKey, checked)}
                      label={`${label} push notifications`}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div
          className={cn(
            "grid border-t border-border bg-muted/20 transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            isDirty ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between md:px-8">
              <p className="text-xs text-muted-foreground">You have unsaved notification changes.</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full px-4"
                  onClick={resetForm}
                  disabled={isSaving}
                >
                  <RotateCcw className="size-3.5" />
                  Discard
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full px-5 shadow-coral"
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save preferences"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
