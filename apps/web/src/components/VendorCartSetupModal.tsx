"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ExclamationTriangleIcon as AlertCircle } from "@radix-ui/react-icons";
import { toast } from "sonner";

import { SavedLocationFields } from "@/components/SavedLocationFields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { configureCartReservation, getFulfillmentPreferences, type ReservationWithItems } from "@/lib/account";
import { getCostume, type CostumeDetailResponse } from "@/lib/costumes";
import {
  FULFILLMENT_WINDOW_LABELS,
  buildFulfillmentPayloadFromPreferences,
  hasCompleteDeliveryProfile,
  normalizeSavedLocationId,
  resolveDeliveryBookingMethods,
  type FulfillmentPreferences,
  type FulfillmentWindowSlot,
  type ReservationFulfillmentSelectionInput,
  type SavedLocation,
  type SavedLocationInput
} from "@/lib/fulfillment";
import { cn } from "@/lib/utils";

const WINDOW_OPTIONS: FulfillmentWindowSlot[] = ["MORNING", "AFTERNOON", "EVENING"];

type DateRange = { start?: Date; end?: Date };

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

function locationComplete(location: SavedLocationInput) {
  return (
    location.label.trim() &&
    location.contact_name.trim() &&
    location.phone_number.trim() &&
    location.address_line_1.trim() &&
    location.city.trim()
  );
}

function parseDate(value?: string | null) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export interface VendorCartSetupModalProps {
  vendorName: string;
  reservations: ReservationWithItems[];
  savedLocations: SavedLocation[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function VendorCartSetupModal({
  vendorName,
  reservations,
  savedLocations,
  open,
  onOpenChange,
  onSaved
}: VendorCartSetupModalProps) {
  const [dateRanges, setDateRanges] = useState<Record<number, DateRange>>({});
  const [fulfillmentPreferences, setFulfillmentPreferences] = useState<FulfillmentPreferences | null>(null);
  const [deliveryWindowSlot, setDeliveryWindowSlot] = useState<FulfillmentWindowSlot>("AFTERNOON");
  const [returnWindowSlot, setReturnWindowSlot] = useState<FulfillmentWindowSlot>("AFTERNOON");
  const [outboundLocationMode, setOutboundLocationMode] = useState<"saved" | "new">("saved");
  const [selectedOutboundLocationId, setSelectedOutboundLocationId] = useState<number | null>(null);
  const [newOutboundLocation, setNewOutboundLocation] = useState<SavedLocationInput>(() => emptyLocationDraft());
  const [openDatePicker, setOpenDatePicker] = useState<string | null>(null);
  const [fulfillmentTemplate, setFulfillmentTemplate] = useState<CostumeDetailResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cartItems = useMemo(
    () => reservations.filter((reservation) => reservation.status === "CART"),
    [reservations]
  );

  const profileComplete = useMemo(
    () => hasCompleteDeliveryProfile(fulfillmentPreferences, savedLocations),
    [fulfillmentPreferences, savedLocations]
  );

  useEffect(() => {
    if (!open) return;

    const nextRanges: Record<number, DateRange> = {};
    for (const reservation of cartItems) {
      nextRanges[reservation.id] = {
        start: parseDate(reservation.start_date),
        end: parseDate(reservation.end_date)
      };
    }
    setDateRanges(nextRanges);

    let cancelled = false;
    getFulfillmentPreferences()
      .then((preferences) => {
        if (cancelled) return;
        setFulfillmentPreferences(preferences);
        if (preferences.default_delivery_window_slot) {
          setDeliveryWindowSlot(preferences.default_delivery_window_slot);
        }
        if (preferences.default_return_window_slot) {
          setReturnWindowSlot(preferences.default_return_window_slot);
        }
        if (preferences.default_saved_location_id) {
          const locationId = normalizeSavedLocationId(preferences.default_saved_location_id);
          setSelectedOutboundLocationId(locationId);
          setOutboundLocationMode("saved");
          return;
        }

        const defaultLocation = savedLocations.find((location) => location.is_default) || savedLocations[0];
        if (!defaultLocation) {
          setOutboundLocationMode("new");
          setSelectedOutboundLocationId(null);
        } else {
          setOutboundLocationMode("saved");
          setSelectedOutboundLocationId(defaultLocation.id);
        }
      })
      .catch(() => {
        if (!cancelled) setFulfillmentPreferences(null);
      });

    const firstCostumeId = cartItems[0]?.items?.[0]?.costume_id;
    if (!firstCostumeId) {
      setFulfillmentTemplate(null);
      return () => {
        cancelled = true;
      };
    }

    getCostume(firstCostumeId)
      .then((detail) => {
        if (!cancelled) setFulfillmentTemplate(detail);
      })
      .catch(() => {
        if (!cancelled) setFulfillmentTemplate(null);
      });

    return () => {
      cancelled = true;
    };
  }, [open, cartItems, savedLocations]);

  function buildLocationSelection() {
    if (outboundLocationMode === "saved" && selectedOutboundLocationId) {
      return { saved_location_id: selectedOutboundLocationId };
    }
    if (outboundLocationMode === "new" && locationComplete(newOutboundLocation)) {
      return {
        new_location: { ...newOutboundLocation, is_default: false },
        save_as_default: Boolean(newOutboundLocation.is_default)
      };
    }
    throw new Error("Choose or complete a delivery address");
  }

  function buildSharedFulfillment(): ReservationFulfillmentSelectionInput {
    const effective = fulfillmentTemplate?.effective_fulfillment ?? {
      outbound_mode: "BOTH" as const,
      return_mode: "BOTH" as const
    };

    if (profileComplete && fulfillmentPreferences) {
      return buildFulfillmentPayloadFromPreferences(fulfillmentPreferences, effective);
    }

    const { outbound_method, return_method, use_same_location_for_return } = effective
      ? resolveDeliveryBookingMethods(effective)
      : { outbound_method: "DELIVERY" as const, return_method: "DELIVERY" as const, use_same_location_for_return: true };

    const payload: ReservationFulfillmentSelectionInput = {
      outbound_method,
      return_method,
      return_window_slot: returnWindowSlot,
      return_location: null,
      use_same_location_for_return
    };

    if (outbound_method === "DELIVERY") {
      payload.delivery_window_slot = deliveryWindowSlot;
      payload.outbound_location = buildLocationSelection();
    } else {
      payload.pickup_window_slot = deliveryWindowSlot;
    }

    return payload;
  }

  function validate(): boolean {
    for (const reservation of cartItems) {
      const range = dateRanges[reservation.id];
      const name = reservation.items?.[0]?.Costume?.name || "Costume";
      if (!range?.start || !range?.end) {
        toast.error(`Choose dates for ${name}.`);
        return false;
      }
    }

    if (profileComplete) return true;

    if (outboundLocationMode === "saved" && !selectedOutboundLocationId) {
      toast.error("Choose a delivery address.");
      return false;
    }
    if (outboundLocationMode === "new" && !locationComplete(newOutboundLocation)) {
      toast.error("Complete the delivery address.");
      return false;
    }

    return true;
  }

  async function handleSave() {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const fulfillment = buildSharedFulfillment();

      await Promise.all(
        cartItems.map((reservation) => {
          const range = dateRanges[reservation.id];
          if (!range?.start || !range?.end) {
            throw new Error("Missing dates for a cart item");
          }
          return configureCartReservation(reservation.id, {
            startDate: format(range.start, "yyyy-MM-dd"),
            endDate: format(range.end, "yyyy-MM-dd"),
            fulfillment
          });
        })
      );

      toast.success("Booking details saved.");
      onOpenChange(false);
      onSaved();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save booking details");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle className="font-display">Complete booking</DialogTitle>
          <DialogDescription>
            {profileComplete
              ? `Set rental dates for each costume from ${vendorName}. Your saved delivery defaults will apply automatically.`
              : `Set rental dates for each costume from ${vendorName}. Delivery and return pickup apply to all costumes from this vendor.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Rental dates</h3>
            {cartItems.map((reservation) => {
              const name = reservation.items?.[0]?.Costume?.name || `Costume #${reservation.id}`;
              const range = dateRanges[reservation.id] || {};

              return (
                <div key={reservation.id} className="space-y-3 rounded-xl border border-border p-4">
                  <p className="font-medium text-foreground">{name}</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Start date</Label>
                      <Popover
                        modal
                        open={openDatePicker === `${reservation.id}-start`}
                        onOpenChange={(nextOpen: boolean) =>
                          setOpenDatePicker(nextOpen ? `${reservation.id}-start` : null)
                        }
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-11 w-full justify-start font-normal",
                              !range.start && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 size-4" />
                            {range.start ? format(range.start, "MMM d, yyyy") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={range.start}
                            onSelect={(nextDate) => {
                              setDateRanges((current) => ({
                                ...current,
                                [reservation.id]: {
                                  ...current[reservation.id],
                                  start: nextDate,
                                  end:
                                    current[reservation.id]?.end &&
                                    nextDate &&
                                    current[reservation.id].end! < nextDate
                                      ? undefined
                                      : current[reservation.id]?.end
                                }
                              }));
                              setOpenDatePicker(null);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>End date</Label>
                      <Popover
                        modal
                        open={openDatePicker === `${reservation.id}-end`}
                        onOpenChange={(nextOpen: boolean) =>
                          setOpenDatePicker(nextOpen ? `${reservation.id}-end` : null)
                        }
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-11 w-full justify-start font-normal",
                              !range.end && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 size-4" />
                            {range.end ? format(range.end, "MMM d, yyyy") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={range.end}
                            onSelect={(nextDate) => {
                              setDateRanges((current) => ({
                                ...current,
                                [reservation.id]: {
                                  ...current[reservation.id],
                                  end: nextDate
                                }
                              }));
                              setOpenDatePicker(null);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {!profileComplete ? (
            <section className="space-y-4 border-t border-border pt-6">
              <Alert className="rounded-lg border-amber-400/40 bg-amber-50/60 dark:bg-amber-950/20">
                <AlertCircle className="size-4 text-amber-700 dark:text-amber-300" />
                <AlertTitle className="text-sm">Set up delivery defaults</AlertTitle>
                <AlertDescription className="text-sm">
                  <Link href="/account/settings?next=/reservations" className="font-medium underline underline-offset-2">
                    Save your address and windows in account settings
                  </Link>{" "}
                  to only pick dates here next time.
                </AlertDescription>
              </Alert>

              <h3 className="text-sm font-medium text-foreground">Delivery for this vendor</h3>
              <p className="text-sm text-muted-foreground">
                One address and pickup window set applies to every costume from {vendorName}.
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant={outboundLocationMode === "saved" ? "default" : "outline"}
                  onClick={() => setOutboundLocationMode("saved")}
                >
                  Saved location
                </Button>
                <Button
                  type="button"
                  variant={outboundLocationMode === "new" ? "default" : "outline"}
                  onClick={() => setOutboundLocationMode("new")}
                >
                  New address
                </Button>
              </div>

              {outboundLocationMode === "saved" && savedLocations.length > 0 ? (
                <Select
                  value={selectedOutboundLocationId ? String(selectedOutboundLocationId) : undefined}
                  onValueChange={(value: string) => setSelectedOutboundLocationId(Number(value))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Choose location" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedLocations.map((location) => (
                      <SelectItem key={location.id} value={String(location.id)}>
                        {location.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

              {outboundLocationMode === "new" ? (
                <SavedLocationFields layout="single" value={newOutboundLocation} onChange={setNewOutboundLocation} />
              ) : null}

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

              {fulfillmentTemplate ? (
                <p className="text-xs text-muted-foreground">
                  Delivery fees for this vendor start at PHP{" "}
                  {(
                    Number(fulfillmentTemplate.effective_fulfillment.outbound_delivery_fee) +
                    Number(fulfillmentTemplate.effective_fulfillment.return_delivery_fee)
                  ).toLocaleString()}{" "}
                  per costume.
                </p>
              ) : null}
            </section>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={isSubmitting}>
            Save booking details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
