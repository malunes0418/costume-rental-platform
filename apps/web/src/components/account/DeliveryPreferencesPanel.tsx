"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  MapPin,
  Package,
  RotateCcw,
  Sunrise,
  Sun,
  Sunset,
} from "lucide-react";
import { toast } from "sonner";

import { Sparkle } from "@/components/brand/Sparkle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import {
  getFulfillmentPreferences,
  listSavedLocations,
  updateFulfillmentPreferences,
} from "@/lib/account";
import {
  formatLocationSummary,
  hasCompleteDeliveryProfile,
  type FulfillmentPreferences,
  type FulfillmentWindowSlot,
  type SavedLocation,
} from "@/lib/fulfillment";
import { cn } from "@/lib/utils";

const WINDOW_OPTIONS: FulfillmentWindowSlot[] = ["MORNING", "AFTERNOON", "EVENING"];

const WINDOW_META: Record<
  FulfillmentWindowSlot,
  { label: string; hours: string; Icon: typeof Sun }
> = {
  MORNING: { label: "Morning", hours: "9:00 AM – 12:00 PM", Icon: Sunrise },
  AFTERNOON: { label: "Afternoon", hours: "1:00 PM – 4:00 PM", Icon: Sun },
  EVENING: { label: "Evening", hours: "5:00 PM – 8:00 PM", Icon: Sunset },
};

type DeliveryPreferencesPanelProps = {
  nextUrl?: string | null;
};

function DeliveryLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

type WindowPickerProps = {
  label: string;
  description: string;
  value: FulfillmentWindowSlot;
  onChange: (slot: FulfillmentWindowSlot) => void;
  accent: "coral" | "gold";
};

function WindowPicker({ label, description, value, onChange, accent }: WindowPickerProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {WINDOW_OPTIONS.map((slot) => {
          const meta = WINDOW_META[slot];
          const isSelected = value === slot;
          const Icon = meta.Icon;

          return (
            <button
              key={slot}
              type="button"
              onClick={() => onChange(slot)}
              className={cn(
                "rounded-xl border px-3 py-3 text-left transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                "hover:scale-[1.01] active:scale-[0.99]",
                isSelected
                  ? accent === "coral"
                    ? "border-primary bg-brand-coral-soft shadow-coral"
                    : "border-accent bg-brand-gold-soft"
                  : "border-border bg-background/60 hover:border-border/80 hover:bg-muted/30"
              )}
            >
              <Icon
                className={cn(
                  "size-4",
                  isSelected
                    ? accent === "coral"
                      ? "text-primary"
                      : "text-accent-foreground"
                    : "text-muted-foreground"
                )}
                aria-hidden="true"
              />
              <p className="mt-2 text-sm font-medium text-foreground">{meta.label}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{meta.hours}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DeliveryPreferencesPanel({ nextUrl }: DeliveryPreferencesPanelProps) {
  const router = useRouter();
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [preferences, setPreferences] = useState<FulfillmentPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [defaultLocationId, setDefaultLocationId] = useState("");
  const [deliveryWindowSlot, setDeliveryWindowSlot] = useState<FulfillmentWindowSlot>("AFTERNOON");
  const [returnWindowSlot, setReturnWindowSlot] = useState<FulfillmentWindowSlot>("AFTERNOON");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    Promise.all([listSavedLocations(), getFulfillmentPreferences()])
      .then(([locations, prefs]) => {
        if (cancelled) return;
        setSavedLocations(locations);
        setPreferences(prefs);
        setDefaultLocationId(prefs.default_saved_location_id ? String(prefs.default_saved_location_id) : "");
        setDeliveryWindowSlot(prefs.default_delivery_window_slot || "AFTERNOON");
        setReturnWindowSlot(prefs.default_return_window_slot || "AFTERNOON");
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof ApiError ? error.message : "Failed to load delivery preferences");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const savedLocationId = preferences?.default_saved_location_id
    ? String(preferences.default_saved_location_id)
    : "";
  const savedDeliverySlot = preferences?.default_delivery_window_slot || "AFTERNOON";
  const savedReturnSlot = preferences?.default_return_window_slot || "AFTERNOON";

  const isDirty =
    defaultLocationId !== savedLocationId ||
    deliveryWindowSlot !== savedDeliverySlot ||
    returnWindowSlot !== savedReturnSlot;

  const selectedLocation = useMemo(
    () => savedLocations.find((location) => String(location.id) === defaultLocationId),
    [defaultLocationId, savedLocations]
  );

  const profileComplete = hasCompleteDeliveryProfile(preferences, savedLocations);
  const needsProfileForBooking = Boolean(nextUrl && !profileComplete);

  function resetForm() {
    setDefaultLocationId(savedLocationId);
    setDeliveryWindowSlot(savedDeliverySlot);
    setReturnWindowSlot(savedReturnSlot);
  }

  async function handleSavePreferences() {
    if (!defaultLocationId) {
      toast.error("Choose a default delivery address.");
      return;
    }

    setIsSavingPreferences(true);
    try {
      const saved = await updateFulfillmentPreferences({
        default_saved_location_id: Number(defaultLocationId),
        default_delivery_window_slot: deliveryWindowSlot,
        default_return_window_slot: returnWindowSlot,
      });
      setPreferences(saved);
      toast.success("Delivery preferences saved.");

      if (nextUrl && hasCompleteDeliveryProfile(saved, savedLocations)) {
        router.push(nextUrl);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save preferences.");
    } finally {
      setIsSavingPreferences(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-up">
        <header className="mb-8">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-8 w-56" />
          <Skeleton className="mt-3 h-12 w-full max-w-md" />
        </header>
        <DeliveryLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <Sparkle size="sm" animated />
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
            Handoff rhythm
          </p>
        </div>
        <h2 className="section-heading mt-3">Delivery preferences</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Your default drop-off and pickup windows. New reservations inherit these so checkout stays
          fast.
        </p>
      </header>

      {needsProfileForBooking ? (
        <div className="detail-chip mb-6 border-primary/20 bg-brand-coral-soft/50 py-4">
          <div className="detail-chip-icon detail-chip-icon--coral">
            <Package className="size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Finish your delivery profile</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Pick a default address and time windows below to continue booking.
            </p>
          </div>
        </div>
      ) : null}

      <div className="panel-card overflow-hidden">
        <div className="relative border-b border-border px-6 py-6 md:px-8">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background: `
                radial-gradient(ellipse 70% 100% at 15% 50%, oklch(0.68 0.16 28 / 0.07), transparent 55%),
                radial-gradient(ellipse 55% 80% at 90% 35%, oklch(0.80 0.12 80 / 0.09), transparent 50%)
              `,
            }}
          />

          <div className="relative space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-primary" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
                Default address
              </p>
            </div>

            {savedLocations.length > 0 ? (
              <ul className="space-y-2">
                {savedLocations.map((location) => {
                  const isSelected = defaultLocationId === String(location.id);
                  return (
                    <li key={location.id}>
                      <button
                        type="button"
                        onClick={() => setDefaultLocationId(String(location.id))}
                        className={cn(
                          "w-full rounded-xl border px-4 py-3 text-left transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                          isSelected
                            ? "border-primary bg-brand-coral-soft/60 shadow-coral"
                            : "border-border bg-card/80 hover:border-primary/30 hover:bg-muted/20"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-display text-base font-semibold text-foreground">
                              {location.label}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {formatLocationSummary(location)}
                            </p>
                          </div>
                          {location.is_default ? (
                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                              Saved default
                            </span>
                          ) : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Add one under{" "}
                  <span className="font-medium text-foreground">Addresses</span> in the sidebar,
                  then return here.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8 border-b border-border px-6 py-8 md:px-8">
          <WindowPicker
            label="Delivery window"
            description="When vendors should drop off your costume."
            value={deliveryWindowSlot}
            onChange={setDeliveryWindowSlot}
            accent="coral"
          />

          <WindowPicker
            label="Return pickup window"
            description="When vendors collect the costume after your event."
            value={returnWindowSlot}
            onChange={setReturnWindowSlot}
            accent="gold"
          />
        </div>

        {selectedLocation ? (
          <div className="border-b border-border bg-muted/15 px-6 py-4 md:px-8">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Preview
            </p>
            <p className="mt-2 text-sm text-foreground">
              <span className="font-medium">{WINDOW_META[deliveryWindowSlot].label}</span>
              <span className="text-muted-foreground"> delivery</span>
              <span className="mx-2 text-border">→</span>
              <span className="font-medium">{WINDOW_META[returnWindowSlot].label}</span>
              <span className="text-muted-foreground"> return</span>
              <span className="text-muted-foreground"> at </span>
              <span className="font-medium">{selectedLocation.label}</span>
            </p>
          </div>
        ) : null}

        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            isDirty || needsProfileForBooking ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-3 bg-muted/20 px-6 py-4 sm:flex-row sm:items-center sm:justify-between md:px-8">
              <p className="text-xs text-muted-foreground">
                {isDirty ? "You have unsaved delivery preferences." : "Save to continue booking."}
              </p>
              <div className="flex flex-wrap gap-2">
                {isDirty ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full px-4"
                    onClick={resetForm}
                    disabled={isSavingPreferences}
                  >
                    <RotateCcw className="size-3.5" />
                    Discard
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full px-5 shadow-coral"
                  onClick={() => void handleSavePreferences()}
                  disabled={isSavingPreferences || !defaultLocationId}
                >
                  {isSavingPreferences ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : nextUrl && !profileComplete ? (
                    <>
                      Save & continue
                      <ArrowRight className="size-3.5" />
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

      {nextUrl && profileComplete && !isDirty ? (
        <div className="mt-6 text-center">
          <Link
            href={nextUrl}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-4 text-sm font-medium transition-all hover:bg-muted hover:scale-[1.02]"
          >
            Continue booking
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
