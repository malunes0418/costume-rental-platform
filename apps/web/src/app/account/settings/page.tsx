"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GearIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";

import { SavedLocationFields } from "@/components/SavedLocationFields";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  createSavedLocation,
  deleteSavedLocation,
  getFulfillmentPreferences,
  listSavedLocations,
  updateFulfillmentPreferences,
  updateSavedLocation
} from "@/lib/account";
import {
  FULFILLMENT_WINDOW_LABELS,
  formatLocationSummary,
  hasCompleteDeliveryProfile,
  type FulfillmentPreferences,
  type FulfillmentWindowSlot,
  type SavedLocation,
  type SavedLocationInput
} from "@/lib/fulfillment";

const WINDOW_OPTIONS: FulfillmentWindowSlot[] = ["MORNING", "AFTERNOON", "EVENING"];

function emptyLocationDraft(): SavedLocationInput {
  return {
    label: "",
    contact_name: "",
    phone_number: "",
    address_line_1: "",
    address_line_2: "",
    barangay: "",
    city: "",
    province: "",
    postal_code: "",
    country: "Philippines",
    area: "",
    notes: "",
    is_default: false
  };
}

export default function AccountSettingsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");

  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [preferences, setPreferences] = useState<FulfillmentPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationDraft, setLocationDraft] = useState<SavedLocationInput>(() => emptyLocationDraft());
  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [deletingLocationId, setDeletingLocationId] = useState<number | null>(null);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [defaultLocationId, setDefaultLocationId] = useState<string>("");
  const [deliveryWindowSlot, setDeliveryWindowSlot] = useState<FulfillmentWindowSlot>("AFTERNOON");
  const [returnWindowSlot, setReturnWindowSlot] = useState<FulfillmentWindowSlot>("AFTERNOON");

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }
    if (user.role === "ADMIN") {
      router.replace("/admin");
      return;
    }

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
          toast.error(error instanceof ApiError ? error.message : "Failed to load account settings");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, isAuthLoading, router]);

  async function handleSaveLocation() {
    if (
      !locationDraft.label.trim() ||
      !locationDraft.contact_name.trim() ||
      !locationDraft.phone_number.trim() ||
      !locationDraft.address_line_1.trim() ||
      !locationDraft.city.trim()
    ) {
      toast.error("Please complete the label, contact, phone, address, and city.");
      return;
    }

    setIsSavingLocation(true);
    try {
      const saved = editingLocationId
        ? await updateSavedLocation(editingLocationId, locationDraft)
        : await createSavedLocation(locationDraft);

      const nextLocations = editingLocationId
        ? savedLocations.map((location) => (location.id === editingLocationId ? saved : location))
        : [saved, ...savedLocations.filter((location) => location.id !== saved.id)];

      setSavedLocations(
        saved.is_default
          ? nextLocations.map((location) => ({ ...location, is_default: location.id === saved.id }))
          : nextLocations
      );

      if (!defaultLocationId && saved.is_default) {
        setDefaultLocationId(String(saved.id));
      }

      setLocationDraft(emptyLocationDraft());
      setEditingLocationId(null);
      toast.success(editingLocationId ? "Location updated." : "Location saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save location.");
    } finally {
      setIsSavingLocation(false);
    }
  }

  function handleEditLocation(location: SavedLocation) {
    setEditingLocationId(location.id);
    setLocationDraft({
      label: location.label,
      contact_name: location.contact_name,
      phone_number: location.phone_number,
      address_line_1: location.address_line_1,
      address_line_2: location.address_line_2 || "",
      barangay: location.barangay || "",
      city: location.city,
      province: location.province || "",
      postal_code: location.postal_code || "",
      country: location.country || "Philippines",
      area: location.area || "",
      notes: location.notes || "",
      is_default: location.is_default
    });
  }

  async function handleDeleteLocation(locationId: number) {
    setDeletingLocationId(locationId);
    try {
      await deleteSavedLocation(locationId);
      setSavedLocations((current) => current.filter((location) => location.id !== locationId));

      if (defaultLocationId === String(locationId)) {
        setDefaultLocationId("");
      }

      if (editingLocationId === locationId) {
        setEditingLocationId(null);
        setLocationDraft(emptyLocationDraft());
      }

      toast.success("Location removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete location.");
    } finally {
      setDeletingLocationId(null);
    }
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
        default_return_window_slot: returnWindowSlot
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

  if (isAuthLoading || isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 pb-24 pt-16">
        <Skeleton className="mb-8 h-10 w-64" />
        <Skeleton className="mb-4 h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 pb-24 pt-20 text-center">
        <GearIcon className="mx-auto size-12 text-muted-foreground/30" />
        <h1 className="mt-6 font-display text-3xl font-semibold text-foreground">Account settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Log in to manage your delivery preferences.</p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-10 items-center rounded-md bg-primary px-6 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground"
        >
          Log in
        </Link>
      </div>
    );
  }

  const profileComplete = hasCompleteDeliveryProfile(preferences, savedLocations);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-24 pt-16">
      <div className="mb-10 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Account</p>
        <h1 className="font-display text-3xl font-semibold text-foreground">Delivery settings</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Set your default address and time windows once. Future bookings will use these automatically.
        </p>
        {nextUrl && !profileComplete ? (
          <p className="rounded-lg border border-amber-400/40 bg-amber-50/50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
            Complete your delivery profile below to continue booking.
          </p>
        ) : null}
      </div>

      <section className="mb-12 space-y-6">
        <div className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-foreground">Saved addresses</h2>
          <p className="text-sm text-muted-foreground">
            Add delivery addresses you use for costume handoffs.
          </p>
        </div>

        {savedLocations.length > 0 ? (
          <div className="divide-y divide-border border-y border-border">
            {savedLocations.map((location) => (
              <article key={location.id} className="space-y-3 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-lg font-semibold text-foreground">{location.label}</p>
                      {location.is_default ? (
                        <span className="rounded-sm border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Default
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{formatLocationSummary(location)}</p>
                    <p className="text-xs text-muted-foreground">
                      {location.contact_name} · {location.phone_number}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleEditLocation(location)}
                      className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteLocation(location.id)}
                      disabled={deletingLocationId === location.id}
                      className="text-[10px] font-semibold uppercase tracking-widest text-destructive disabled:opacity-40"
                    >
                      {deletingLocationId === location.id ? "Removing" : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">
            No saved addresses yet. Add one below.
          </div>
        )}

        <div className="space-y-5 border-t border-border pt-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {editingLocationId ? "Editing address" : "Add a new address"}
          </p>
          <SavedLocationFields value={locationDraft} onChange={setLocationDraft} />
          <div className="flex gap-3">
            {editingLocationId ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingLocationId(null);
                  setLocationDraft(emptyLocationDraft());
                }}
              >
                Cancel
              </Button>
            ) : null}
            <Button type="button" onClick={() => void handleSaveLocation()} disabled={isSavingLocation}>
              {isSavingLocation ? "Saving..." : editingLocationId ? "Save changes" : "Save address"}
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-6 border-t border-border pt-10">
        <div className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-foreground">Default time windows</h2>
          <p className="text-sm text-muted-foreground">
            Choose when vendors should deliver costumes and pick them up on return.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Default delivery address</Label>
          <Select value={defaultLocationId || undefined} onValueChange={setDefaultLocationId}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Choose address" />
            </SelectTrigger>
            <SelectContent>
              {savedLocations.map((location) => (
                <SelectItem key={location.id} value={String(location.id)}>
                  {location.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Delivery window</Label>
            <Select
              value={deliveryWindowSlot}
              onValueChange={(value: string) => setDeliveryWindowSlot(value as FulfillmentWindowSlot)}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WINDOW_OPTIONS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {FULFILLMENT_WINDOW_LABELS[slot]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Return pickup window</Label>
            <Select
              value={returnWindowSlot}
              onValueChange={(value: string) => setReturnWindowSlot(value as FulfillmentWindowSlot)}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WINDOW_OPTIONS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {FULFILLMENT_WINDOW_LABELS[slot]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="button" onClick={() => void handleSavePreferences()} disabled={isSavingPreferences}>
          {isSavingPreferences ? "Saving..." : "Save delivery preferences"}
        </Button>
      </section>
    </div>
  );
}
