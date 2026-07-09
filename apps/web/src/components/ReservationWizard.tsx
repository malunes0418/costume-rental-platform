"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronDownIcon, ExclamationTriangleIcon as AlertCircle } from "@radix-ui/react-icons";
import { toast } from "sonner";

import { SavedLocationFields } from "@/components/SavedLocationFields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { addReservationToCart, configureCartReservation, getFulfillmentPreferences } from "@/lib/account";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/CartContext";
import type { CostumeDetailResponse } from "@/lib/costumes";
import { getAvailability } from "@/lib/costumes";
import {
  FULFILLMENT_WINDOW_LABELS,
  buildFulfillmentPayloadFromPreferences,
  formatLocationSummary,
  fulfillmentFeesForBookingMethods,
  hasCompleteDeliveryProfile,
  isLocationOutsideServiceAreas,
  modeAllowsMethod,
  resolveDeliveryBookingMethods,
  type FulfillmentPreferences,
  type FulfillmentWindowSlot,
  type ReservationFulfillmentSelectionInput,
  type SavedLocation,
  type SavedLocationInput
} from "@/lib/fulfillment";
import { calculateCostumePrice, countRentalDaysInclusive } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const currencyFormatter = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 });
const WINDOW_OPTIONS: FulfillmentWindowSlot[] = ["MORNING", "AFTERNOON", "EVENING"];

type WizardStep = "dates" | "delivery" | "review";
export type ReservationWizardIntent = "reserve" | "cart";

const STEP_LABELS: Record<WizardStep, string> = {
  dates: "Dates",
  delivery: "Delivery",
  review: "Review"
};

function fmtMoney(value: number) {
  return `₱${currencyFormatter.format(Number(value) || 0)}`;
}

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
    geocode_failed: false
  };
}

function locationComplete(location: SavedLocationInput) {
  return Boolean(
    location.label.trim() &&
      location.contact_name.trim() &&
      location.phone_number.trim() &&
      location.address_line_1.trim() &&
      location.city.trim()
  );
}

export interface ReservationWizardProps {
  costumeId: number;
  data: CostumeDetailResponse;
  savedLocations: SavedLocation[];
  fulfillmentPreferences?: FulfillmentPreferences | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intent: ReservationWizardIntent;
  reservationId?: number;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

export function ReservationWizard({
  costumeId,
  data,
  savedLocations,
  fulfillmentPreferences: fulfillmentPreferencesProp,
  open,
  onOpenChange,
  intent,
  reservationId,
  initialStartDate,
  initialEndDate
}: ReservationWizardProps) {
  const { user } = useAuth();
  const { openCart, triggerRefresh } = useCart();

  const [step, setStep] = useState<WizardStep>("dates");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  const [shouldAutoOpenEndDate, setShouldAutoOpenEndDate] = useState(false);

  const [loadedPreferences, setLoadedPreferences] = useState<FulfillmentPreferences | null>(null);
  const fulfillmentPreferences = fulfillmentPreferencesProp ?? loadedPreferences;
  const [deliveryWindowSlot, setDeliveryWindowSlot] = useState<FulfillmentWindowSlot>("AFTERNOON");
  const [returnWindowSlot, setReturnWindowSlot] = useState<FulfillmentWindowSlot>("AFTERNOON");
  const [outboundLocationMode, setOutboundLocationMode] = useState<"saved" | "new">("saved");
  const [selectedOutboundLocationId, setSelectedOutboundLocationId] = useState<number | null>(null);
  const [newOutboundLocation, setNewOutboundLocation] = useState<SavedLocationInput>(() => emptyLocationDraft());
  const [showDeliveryOverride, setShowDeliveryOverride] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const profileComplete = useMemo(
    () => hasCompleteDeliveryProfile(fulfillmentPreferences, savedLocations),
    [fulfillmentPreferences, savedLocations]
  );

  const activeSteps = useMemo<WizardStep[]>(
    () => (profileComplete ? ["dates", "review"] : ["dates", "delivery", "review"]),
    [profileComplete]
  );

  useEffect(() => {
    if (!open) return;
    setStep("dates");
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
    setShowDeliveryOverride(false);
  }, [open, initialStartDate, initialEndDate]);

  useEffect(() => {
    if (!open || !user || fulfillmentPreferencesProp !== undefined) return;

    let cancelled = false;
    getFulfillmentPreferences()
      .then((preferences) => {
        if (cancelled) return;
        setLoadedPreferences(preferences);
        if (preferences.default_delivery_window_slot) {
          setDeliveryWindowSlot(preferences.default_delivery_window_slot);
        }
        if (preferences.default_return_window_slot) {
          setReturnWindowSlot(preferences.default_return_window_slot);
        }
        if (preferences.default_saved_location_id) {
          setSelectedOutboundLocationId(preferences.default_saved_location_id);
          setOutboundLocationMode("saved");
        }
      })
      .catch(() => {
        if (!cancelled) setLoadedPreferences(null);
      });

    return () => {
      cancelled = true;
    };
  }, [open, user, fulfillmentPreferencesProp]);

  useEffect(() => {
    const defaultLocation = savedLocations.find((location) => location.is_default) || savedLocations[0];
    if (!defaultLocation) {
      setOutboundLocationMode("new");
      setSelectedOutboundLocationId(null);
      return;
    }

    if (!fulfillmentPreferences?.default_saved_location_id) {
      setSelectedOutboundLocationId(defaultLocation.id);
      setOutboundLocationMode("saved");
    }
  }, [savedLocations, open, fulfillmentPreferences?.default_saved_location_id]);

  useEffect(() => {
    if (isStartDateOpen || !shouldAutoOpenEndDate) return;
    const timer = window.setTimeout(() => {
      setIsEndDateOpen(true);
      setShouldAutoOpenEndDate(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isStartDateOpen, shouldAutoOpenEndDate]);

  const stepIndex = activeSteps.indexOf(step);

  const rentalDays = useMemo(
    () => (startDate && endDate ? countRentalDaysInclusive(startDate, endDate) : 0),
    [startDate, endDate]
  );
  const quote = useMemo(
    () => (rentalDays > 0 ? calculateCostumePrice(data.costume, rentalDays) : null),
    [data.costume, rentalDays]
  );
  const bookingMethods = useMemo(
    () => resolveDeliveryBookingMethods(data.effective_fulfillment),
    [data.effective_fulfillment]
  );
  const fulfillmentFees = useMemo(
    () => fulfillmentFeesForBookingMethods(data.effective_fulfillment, bookingMethods),
    [data.effective_fulfillment, bookingMethods]
  );
  const totalPreview = useMemo(() => Number(quote?.subtotal || 0) + fulfillmentFees, [quote, fulfillmentFees]);

  const effectiveLocationId =
    selectedOutboundLocationId ?? fulfillmentPreferences?.default_saved_location_id ?? null;
  const selectedLocation = savedLocations.find((entry) => entry.id === effectiveLocationId);

  const outboundLocationOutsideServiceArea = useMemo(() => {
    const serviceAreas = data.effective_fulfillment.service_areas;
    if (!serviceAreas?.length) return false;

    let location: { area?: string | null; city?: string | null; province?: string | null } | null = null;
    if (profileComplete && !showDeliveryOverride && selectedLocation) {
      location = { area: selectedLocation.area, city: selectedLocation.city, province: selectedLocation.province };
    } else if (outboundLocationMode === "saved" && selectedOutboundLocationId) {
      const saved = savedLocations.find((entry) => entry.id === selectedOutboundLocationId);
      if (saved) location = { area: saved.area, city: saved.city, province: saved.province };
    } else if (outboundLocationMode === "new" && locationComplete(newOutboundLocation)) {
      location = {
        area: newOutboundLocation.area,
        city: newOutboundLocation.city,
        province: newOutboundLocation.province
      };
    }
    return isLocationOutsideServiceAreas(location, serviceAreas);
  }, [
    data,
    profileComplete,
    showDeliveryOverride,
    selectedLocation,
    outboundLocationMode,
    selectedOutboundLocationId,
    savedLocations,
    newOutboundLocation
  ]);

  function handleStartDateSelect(nextDate: Date | undefined) {
    setStartDate(nextDate);
    if (!nextDate) return;
    if (endDate && endDate < nextDate) setEndDate(undefined);
    setIsStartDateOpen(false);
    setShouldAutoOpenEndDate(true);
  }

  function handleEndDateSelect(nextDate: Date | undefined) {
    setEndDate(nextDate);
    if (!nextDate) return;
    setIsEndDateOpen(false);
  }

  async function checkAvailability() {
    if (!startDate || !endDate) {
      toast.error("Choose dates to check availability.");
      return;
    }
    try {
      const response = await getAvailability(
        costumeId,
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd")
      );
      if (response.length === 0) {
        toast.success("Available! No overlapping reservations.");
      } else {
        toast.error("These dates overlap an existing reservation.");
      }
    } catch (nextError: unknown) {
      toast.error(nextError instanceof ApiError ? nextError.message : "Availability check failed");
    }
  }

  function buildLocationSelection(mode: "saved" | "new", selectedId: number | null, draft: SavedLocationInput) {
    if (mode === "saved" && selectedId) return { saved_location_id: selectedId };
    if (mode === "new") {
      if (!locationComplete(draft)) {
        throw new Error("Complete the delivery location details before adding this reservation");
      }
      return { new_location: { ...draft, is_default: false }, save_as_default: Boolean(draft.is_default) };
    }
    throw new Error("Choose or create a delivery location");
  }

  function buildFulfillmentPayload(): ReservationFulfillmentSelectionInput {
    if (profileComplete && fulfillmentPreferences && !showDeliveryOverride) {
      return buildFulfillmentPayloadFromPreferences(fulfillmentPreferences, data.effective_fulfillment);
    }

    if (profileComplete && fulfillmentPreferences && showDeliveryOverride) {
      return buildFulfillmentPayloadFromPreferences(fulfillmentPreferences, data.effective_fulfillment, {
        saved_location_id: selectedOutboundLocationId,
        delivery_window_slot: deliveryWindowSlot,
        return_window_slot: returnWindowSlot,
        outbound_location:
          outboundLocationMode === "new" && locationComplete(newOutboundLocation)
            ? buildLocationSelection(outboundLocationMode, selectedOutboundLocationId, newOutboundLocation)
            : selectedOutboundLocationId
              ? { saved_location_id: selectedOutboundLocationId }
              : undefined
      });
    }

    const { outbound_method, return_method, use_same_location_for_return } = bookingMethods;

    const payload: ReservationFulfillmentSelectionInput = {
      outbound_method,
      return_method,
      return_window_slot: returnWindowSlot,
      return_location: null,
      use_same_location_for_return
    };

    if (outbound_method === "DELIVERY") {
      payload.delivery_window_slot = deliveryWindowSlot;
      payload.outbound_location = buildLocationSelection(
        outboundLocationMode,
        selectedOutboundLocationId,
        newOutboundLocation
      );
    } else {
      payload.pickup_window_slot = deliveryWindowSlot;
    }

    return payload;
  }

  function validateDeliveryStep(): boolean {
    if (profileComplete && !showDeliveryOverride) return true;

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

  function goNext() {
    if (step === "dates") {
      if (!startDate || !endDate) {
        toast.error("Please choose start and end dates.");
        return;
      }
      setStep(profileComplete ? "review" : "delivery");
      return;
    }
    if (step === "delivery") {
      if (!validateDeliveryStep()) return;
      setStep("review");
    }
  }

  function goBack() {
    if (step === "review") {
      setStep(profileComplete && !showDeliveryOverride ? "dates" : "delivery");
      return;
    }
    if (step === "delivery") {
      setStep("dates");
    }
  }

  async function handleConfirm() {
    if (!user) {
      toast.error("Please log in to reserve.");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please choose dates first.");
      return;
    }
    if (!modeAllowsMethod(data.effective_fulfillment.outbound_mode, "DELIVERY")) {
      toast.error("This costume is pickup-only and cannot be booked with delivery.");
      return;
    }
    if (!validateDeliveryStep()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        fulfillment: buildFulfillmentPayload()
      };

      if (reservationId) {
        await configureCartReservation(reservationId, payload);
      } else {
        await addReservationToCart({
          costumeId,
          ...payload
        });
      }
      triggerRefresh();
      const openDrawer = intent === "reserve";
      toast.success(openDrawer ? "Added to cart." : "Costume added to cart.");
      onOpenChange(false);
      if (openDrawer) openCart();
    } catch (nextError: unknown) {
      toast.error(nextError instanceof Error ? nextError.message : "Failed to add to cart");
    } finally {
      setIsSubmitting(false);
    }
  }

  const settingsReturnUrl = `/costumes/${costumeId}`;
  const canOpen = open && !!user;

  return (
    <Dialog open={canOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">
            {intent === "reserve" ? "Reserve this look" : "Add to cart"}
          </DialogTitle>
          <DialogDescription>{data.costume.name}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          {activeSteps.map((s, index) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  index <= stepIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {index + 1}
              </div>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:inline",
                  index === stepIndex ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {STEP_LABELS[s]}
              </span>
              {index < activeSteps.length - 1 ? (
                <div className="h-px flex-1 bg-border" aria-hidden="true" />
              ) : null}
            </div>
          ))}
        </div>

        {step === "dates" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">When do you need this costume?</p>
            {!profileComplete ? (
              <Alert className="rounded-lg border-amber-400/40 bg-amber-50/60 dark:bg-amber-950/20">
                <AlertCircle className="size-4 text-amber-700 dark:text-amber-300" />
                <AlertTitle className="text-sm">Set up delivery defaults</AlertTitle>
                <AlertDescription className="text-sm">
                  Save your address and time windows once in{" "}
                  <Link
                    href={`/account/settings?next=${encodeURIComponent(settingsReturnUrl)}`}
                    className="font-medium underline underline-offset-2"
                  >
                    account settings
                  </Link>{" "}
                  to skip delivery details on future bookings.
                </AlertDescription>
              </Alert>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Start date</Label>
                <Popover
                  modal
                  open={isStartDateOpen}
                  onOpenChange={(nextOpen: boolean) => {
                    setIsStartDateOpen(nextOpen);
                    if (nextOpen) {
                      setIsEndDateOpen(false);
                      setShouldAutoOpenEndDate(false);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("h-11 w-full justify-start font-normal", !startDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {startDate ? format(startDate, "MMM d, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={handleStartDateSelect} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End date</Label>
                <Popover
                  modal
                  open={isEndDateOpen}
                  onOpenChange={(nextOpen: boolean) => {
                    setIsEndDateOpen(nextOpen);
                    if (nextOpen) setIsStartDateOpen(false);
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("h-11 w-full justify-start font-normal", !endDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {endDate ? format(endDate, "MMM d, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={handleEndDateSelect} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={() => void checkAvailability()}>
              Check availability
            </Button>
          </div>
        ) : null}

        {step === "delivery" ? (
          <div className="space-y-6">
            <Alert className="rounded-lg border-amber-400/40 bg-amber-50/60 dark:bg-amber-950/20">
              <AlertCircle className="size-4 text-amber-700 dark:text-amber-300" />
              <AlertTitle className="text-sm">Complete your delivery profile</AlertTitle>
              <AlertDescription className="text-sm">
                <Link
                  href={`/account/settings?next=${encodeURIComponent(settingsReturnUrl)}`}
                  className="font-medium underline underline-offset-2"
                >
                  Set defaults in account settings
                </Link>{" "}
                to skip this step next time.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">Where should we deliver this costume?</p>
            <div className="space-y-4">
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
                    {savedLocations.map((loc) => (
                      <SelectItem key={loc.id} value={String(loc.id)}>
                        {loc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              {outboundLocationMode === "new" ? (
                <SavedLocationFields
                  layout="single"
                  value={newOutboundLocation}
                  onChange={setNewOutboundLocation}
                />
              ) : null}
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

            <p className="text-sm text-muted-foreground">
              {bookingMethods.return_method === "DELIVERY"
                ? "Return pickup uses the same address as delivery."
                : "Return is at the vendor location on your end date."}
            </p>

            {outboundLocationOutsideServiceArea ? (
              <Alert className="rounded-lg border-orange-400/40 bg-orange-50/60 dark:bg-orange-950/20">
                <AlertCircle className="size-4 text-orange-700 dark:text-orange-300" />
                <AlertTitle className="text-sm">Outside service area</AlertTitle>
                <AlertDescription className="text-sm">
                  Delivery may incur an outside-area surcharge during vendor review.
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        ) : null}

        {step === "review" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {startDate && endDate ? (
                <Badge variant="outline">
                  {format(startDate, "MMM d")} – {format(endDate, "MMM d, yyyy")}
                </Badge>
              ) : null}
              <Badge variant="outline">Delivery to you</Badge>
              <Badge variant="outline">
                {bookingMethods.return_method === "DELIVERY"
                  ? "Return pickup at same address"
                  : "Return at vendor location"}
              </Badge>
            </div>

            {profileComplete && selectedLocation ? (
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
                <p className="font-medium text-foreground">Using your saved delivery defaults</p>
                <p className="mt-1 text-muted-foreground">{formatLocationSummary(selectedLocation)}</p>
                <p className="mt-1 text-muted-foreground">
                  {FULFILLMENT_WINDOW_LABELS[deliveryWindowSlot]} ·{" "}
                  {FULFILLMENT_WINDOW_LABELS[returnWindowSlot]} return
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-3 h-8 px-0 text-xs font-semibold uppercase tracking-widest"
                  onClick={() => setShowDeliveryOverride((current) => !current)}
                >
                  <ChevronDownIcon
                    className={cn("mr-1 size-3 transition-transform", showDeliveryOverride && "rotate-180")}
                  />
                  Change delivery details
                </Button>
              </div>
            ) : null}

            {showDeliveryOverride ? (
              <div className="space-y-4 rounded-xl border border-dashed border-border p-4">
                {savedLocations.length > 0 ? (
                  <Select
                    value={selectedOutboundLocationId ? String(selectedOutboundLocationId) : undefined}
                    onValueChange={(value: string) => setSelectedOutboundLocationId(Number(value))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Choose location" />
                    </SelectTrigger>
                    <SelectContent>
                      {savedLocations.map((loc) => (
                        <SelectItem key={loc.id} value={String(loc.id)}>
                          {loc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              </div>
            ) : null}

            {quote ? (
              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {quote.pricingMode === "PACKAGE"
                      ? `${fmtMoney(Number(data.costume.package_price))} package`
                      : `${fmtMoney(Number(data.costume.base_price_per_day))} × ${rentalDays} day${rentalDays === 1 ? "" : "s"}`}
                  </span>
                  <span className="font-semibold">{fmtMoney(quote.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fulfillment fees</span>
                  <span className="font-semibold">{fmtMoney(fulfillmentFees)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="font-medium">Total</span>
                  <span className="font-display text-xl font-semibold text-primary">{fmtMoney(totalPreview)}</span>
                </div>
              </div>
            ) : null}

            {outboundLocationOutsideServiceArea ? (
              <Alert className="rounded-lg border-orange-400/40 bg-orange-50/60 dark:bg-orange-950/20">
                <AlertCircle className="size-4 text-orange-700 dark:text-orange-300" />
                <AlertTitle className="text-sm">Outside service area</AlertTitle>
                <AlertDescription className="text-sm">
                  Delivery may incur an outside-area surcharge during vendor review.
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          {step !== "dates" ? (
            <Button type="button" variant="outline" onClick={goBack}>
              Back
            </Button>
          ) : null}
          {step !== "review" ? (
            <Button type="button" onClick={goNext}>
              Next
            </Button>
          ) : (
            <Button type="button" onClick={() => void handleConfirm()} disabled={isSubmitting}>
              {intent === "reserve" ? "Confirm reservation" : "Add to cart"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
