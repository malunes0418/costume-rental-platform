"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Sparkle } from "@/components/brand/Sparkle";
import { SavedLocationFields } from "@/components/SavedLocationFields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import {
  createSavedLocation,
  deleteSavedLocation,
  listSavedLocations,
  updateSavedLocation,
} from "@/lib/account";
import { formatLocationSummary, type SavedLocation, type SavedLocationInput } from "@/lib/fulfillment";
import { cn } from "@/lib/utils";

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
    is_default: false,
    latitude: null,
    longitude: null,
    geocode_failed: false,
  };
}

function AddressesLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

export function AddressesPanel() {
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationDraft, setLocationDraft] = useState<SavedLocationInput>(() => emptyLocationDraft());
  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [deletingLocationId, setDeletingLocationId] = useState<number | null>(null);

  const isEditing = editingLocationId !== null;

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    listSavedLocations()
      .then((locations) => {
        if (!cancelled) setSavedLocations(locations);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof ApiError ? error.message : "Failed to load addresses");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function openAddModal() {
    setEditingLocationId(null);
    setLocationDraft(emptyLocationDraft());
    setIsModalOpen(true);
  }

  function openEditModal(location: SavedLocation) {
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
      is_default: location.is_default,
      latitude: location.latitude ?? null,
      longitude: location.longitude ?? null,
      geocode_failed: location.geocode_failed ?? false,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingLocationId(null);
    setLocationDraft(emptyLocationDraft());
  }

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

      closeModal();
      toast.success(editingLocationId ? "Address updated." : "Address saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save address.");
    } finally {
      setIsSavingLocation(false);
    }
  }

  async function handleDeleteLocation(locationId: number) {
    setDeletingLocationId(locationId);
    try {
      await deleteSavedLocation(locationId);
      setSavedLocations((current) => current.filter((location) => location.id !== locationId));

      if (editingLocationId === locationId) {
        closeModal();
      }

      toast.success("Address removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete address.");
    } finally {
      setDeletingLocationId(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkle size="sm" animated />
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
              Handoff points
            </p>
          </div>
          <h2 className="section-heading mt-3">Saved addresses</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Where costumes meet you — studios, homes, event venues. Vendors use these for delivery and
            return windows.
          </p>
        </div>

        <Button
          type="button"
          onClick={openAddModal}
          className="shrink-0 rounded-full px-5 shadow-coral"
        >
          <Plus className="size-4" />
          Add address
        </Button>
      </header>

      {isLoading ? (
        <AddressesLoadingSkeleton />
      ) : savedLocations.length > 0 ? (
        <ul className="space-y-4">
          {savedLocations.map((location, index) => (
            <li
              key={location.id}
              className={cn("panel-card p-0", index === 0 && "animate-fade-up-delay-1")}
            >
              <article className="flex gap-4 p-5 md:p-6">
                <div className="detail-chip-icon detail-chip-icon--coral mt-0.5">
                  <MapPin className="size-4" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
                      {location.label}
                    </h3>
                    {location.is_default ? (
                      <span className="rounded-full bg-brand-coral-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
                        Default
                      </span>
                    ) : null}
                    {location.latitude && location.longitude ? (
                      <span className="rounded-full border border-emerald-400/40 bg-emerald-50/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                        Delivery quoting ready
                      </span>
                    ) : location.geocode_failed ? (
                      <span className="rounded-full border border-orange-400/40 bg-orange-50/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-orange-700 dark:bg-orange-950/20 dark:text-orange-300">
                        Geocode failed
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {formatLocationSummary(location)}
                  </p>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {location.contact_name}
                    <span className="mx-1.5 text-border">·</span>
                    {location.phone_number}
                  </p>

                  {location.geocode_failed ? (
                    <p className="mt-2 text-xs leading-relaxed text-orange-700 dark:text-orange-300">
                      We couldn&apos;t geocode this address. Live delivery quotes will fall back to fixed fees.
                      Try re-saving with a more specific address to retry.
                    </p>
                  ) : null}

                  {location.notes ? (
                    <p className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                      {location.notes}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${location.label}`}
                    onClick={() => openEditModal(location)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${location.label}`}
                    onClick={() => void handleDeleteLocation(location.id)}
                    disabled={deletingLocationId === location.id}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    {deletingLocationId === location.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </Button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div className="panel-card flex flex-col items-center px-6 py-14 text-center">
          <div className="detail-chip-icon detail-chip-icon--coral mb-5 size-14">
            <MapPin className="size-6" aria-hidden="true" />
          </div>
          <p className="font-display text-xl font-semibold text-foreground">No addresses yet</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Add where you want costumes delivered and picked up — home, studio, or venue.
          </p>
          <Button
            type="button"
            onClick={openAddModal}
            className="mt-6 rounded-full px-6 shadow-coral"
          >
            <Plus className="size-4" />
            Add your first address
          </Button>
        </div>
      )}

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) closeModal();
          else setIsModalOpen(true);
        }}
      >
        <DialogContent className="flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl">
          <div className="shrink-0 border-b border-border px-6 py-5 pr-12">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="font-display text-xl">
                {isEditing ? "Edit address" : "Add address"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update the details vendors see at handoff."
                  : "Save a spot for costume delivery and return."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <SavedLocationFields value={locationDraft} onChange={setLocationDraft} />
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-muted/20 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" className="rounded-full" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full px-6 shadow-coral"
              onClick={() => void handleSaveLocation()}
              disabled={isSavingLocation}
            >
              {isSavingLocation ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : isEditing ? (
                "Save changes"
              ) : (
                "Save address"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
