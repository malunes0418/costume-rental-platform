"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ExclamationTriangleIcon as AlertCircle } from "@radix-ui/react-icons";
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
import { addReservationToCart } from "@/lib/account";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/CartContext";
import type { CostumeDetailResponse } from "@/lib/costumes";
import { getAvailability } from "@/lib/costumes";
import {
  FULFILLMENT_METHOD_LABELS,
  FULFILLMENT_WINDOW_LABELS,
  isLocationOutsideServiceAreas,
  modeAllowsMethod,
  type FulfillmentMethod,
  type FulfillmentWindowSlot,
  type ReservationFulfillmentSelectionInput,
  type SavedLocation,
  type SavedLocationInput
} from "@/lib/fulfillment";
import { calculateCostumePrice, countRentalDaysInclusive } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const currencyFormatter = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 });
const WINDOW_OPTIONS: FulfillmentWindowSlot[] = ["MORNING", "AFTERNOON", "EVENING"];

type WizardStep = "dates" | "handoff" | "location" | "review";
export type ReservationWizardIntent = "reserve" | "cart";

const STEP_LABELS: Record<WizardStep, string> = {
  dates: "Dates",
  handoff: "Handoff",
  location: "Location",
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
    is_default: false
  };
}

function methodOptionsForMode(mode: CostumeDetailResponse["effective_fulfillment"]["outbound_mode"]) {
  return (["PICKUP", "DELIVERY"] as FulfillmentMethod[]).filter((method) => modeAllowsMethod(mode, method));
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

export interface ReservationWizardProps {
  costumeId: number;
  data: CostumeDetailResponse;
  savedLocations: SavedLocation[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intent: ReservationWizardIntent;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

export function ReservationWizard({
  costumeId,
  data,
  savedLocations,
  open,
  onOpenChange,
  intent,
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

  const [outboundMethod, setOutboundMethod] = useState<FulfillmentMethod>("PICKUP");
  const [returnMethod, setReturnMethod] = useState<FulfillmentMethod>("PICKUP");
  const [pickupWindowSlot, setPickupWindowSlot] = useState<FulfillmentWindowSlot>("AFTERNOON");
  const [deliveryWindowSlot, setDeliveryWindowSlot] = useState<FulfillmentWindowSlot>("AFTERNOON");
  const [returnWindowSlot, setReturnWindowSlot] = useState<FulfillmentWindowSlot>("AFTERNOON");
  const [outboundLocationMode, setOutboundLocationMode] = useState<"saved" | "new">("saved");
  const [returnLocationMode, setReturnLocationMode] = useState<"saved" | "new">("saved");
  const [selectedOutboundLocationId, setSelectedOutboundLocationId] = useState<number | null>(null);
  const [selectedReturnLocationId, setSelectedReturnLocationId] = useState<number | null>(null);
  const [newOutboundLocation, setNewOutboundLocation] = useState<SavedLocationInput>(() => emptyLocationDraft());
  const [newReturnLocation, setNewReturnLocation] = useState<SavedLocationInput>(() => emptyLocationDraft());
  const [useSameLocationForReturn, setUseSameLocationForReturn] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("dates");
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);

    const outboundOptions = methodOptionsForMode(data.effective_fulfillment.outbound_mode);
    const returnOptions = methodOptionsForMode(data.effective_fulfillment.return_mode);
    setOutboundMethod(outboundOptions[0] || "PICKUP");
    setReturnMethod(returnOptions[0] || "PICKUP");
  }, [open, data, initialStartDate, initialEndDate]);

  useEffect(() => {
    const defaultLocation = savedLocations.find((location) => location.is_default) || savedLocations[0];
    if (!defaultLocation) {
      setOutboundLocationMode("new");
      setReturnLocationMode("new");
      setSelectedOutboundLocationId(null);
      setSelectedReturnLocationId(null);
      return;
    }

    setSelectedOutboundLocationId(defaultLocation.id);
    setSelectedReturnLocationId(defaultLocation.id);
    setOutboundLocationMode("saved");
    setReturnLocationMode("saved");
  }, [savedLocations, open]);

  useEffect(() => {
    if (isStartDateOpen || !shouldAutoOpenEndDate) return;
    const timer = window.setTimeout(() => {
      setIsEndDateOpen(true);
      setShouldAutoOpenEndDate(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isStartDateOpen, shouldAutoOpenEndDate]);

  const outboundNeedsLocation = outboundMethod === "DELIVERY";
  const canReuseReturnLocation =
    outboundMethod === "DELIVERY" && returnMethod === "DELIVERY" && useSameLocationForReturn;
  const returnNeedsSeparateLocation = returnMethod === "DELIVERY" && !canReuseReturnLocation;
  const needsLocationStep = outboundNeedsLocation || returnNeedsSeparateLocation;

  const activeSteps = useMemo<WizardStep[]>(() => {
    const steps: WizardStep[] = ["dates", "handoff"];
    if (needsLocationStep) steps.push("location");
    steps.push("review");
    return steps;
  }, [needsLocationStep]);

  const stepIndex = activeSteps.indexOf(step);

  const rentalDays = useMemo(
    () => (startDate && endDate ? countRentalDaysInclusive(startDate, endDate) : 0),
    [startDate, endDate]
  );
  const quote = useMemo(
    () => (rentalDays > 0 ? calculateCostumePrice(data.costume, rentalDays) : null),
    [data.costume, rentalDays]
  );
  const fulfillmentFees = useMemo(() => {
    const outboundFee =
      outboundMethod === "PICKUP"
        ? Number(data.effective_fulfillment.outbound_pickup_fee)
        : Number(data.effective_fulfillment.outbound_delivery_fee);
    const returnFee =
      returnMethod === "PICKUP"
        ? Number(data.effective_fulfillment.return_pickup_fee)
        : Number(data.effective_fulfillment.return_delivery_fee);
    return outboundFee + returnFee;
  }, [data, outboundMethod, returnMethod]);
  const totalPreview = useMemo(() => Number(quote?.subtotal || 0) + fulfillmentFees, [quote, fulfillmentFees]);

  const vendorLocationLine = useMemo(() => {
    if (!data.effective_fulfillment.primary_location) return null;
    return [
      data.effective_fulfillment.primary_location.address_line_1,
      data.effective_fulfillment.primary_location.barangay,
      data.effective_fulfillment.primary_location.city
    ]
      .filter(Boolean)
      .join(", ");
  }, [data]);

  const outboundLocationOutsideServiceArea = useMemo(() => {
    if (outboundMethod !== "DELIVERY") return false;
    const serviceAreas = data.effective_fulfillment.service_areas;
    if (!serviceAreas?.length) return false;

    let location: { area?: string | null; city?: string | null; province?: string | null } | null = null;
    if (outboundLocationMode === "saved" && selectedOutboundLocationId) {
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
    outboundMethod,
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
    return {
      outbound_method: outboundMethod,
      return_method: returnMethod,
      pickup_window_slot: outboundMethod === "PICKUP" ? pickupWindowSlot : null,
      delivery_window_slot: outboundMethod === "DELIVERY" ? deliveryWindowSlot : null,
      return_window_slot: returnWindowSlot,
      outbound_location:
        outboundMethod === "DELIVERY"
          ? buildLocationSelection(outboundLocationMode, selectedOutboundLocationId, newOutboundLocation)
          : null,
      return_location:
        returnMethod === "DELIVERY" && !canReuseReturnLocation
          ? buildLocationSelection(returnLocationMode, selectedReturnLocationId, newReturnLocation)
          : null,
      use_same_location_for_return: canReuseReturnLocation
    };
  }

  function validateLocationStep(): boolean {
    if (outboundNeedsLocation) {
      if (outboundLocationMode === "saved" && !selectedOutboundLocationId) {
        toast.error("Choose a saved delivery location.");
        return false;
      }
      if (outboundLocationMode === "new" && !locationComplete(newOutboundLocation)) {
        toast.error("Complete the outbound delivery address.");
        return false;
      }
    }
    if (returnNeedsSeparateLocation) {
      if (returnLocationMode === "saved" && !selectedReturnLocationId) {
        toast.error("Choose a return pickup location.");
        return false;
      }
      if (returnLocationMode === "new" && !locationComplete(newReturnLocation)) {
        toast.error("Complete the return pickup address.");
        return false;
      }
    }
    return true;
  }

  function goNext() {
    if (step === "dates") {
      if (!startDate || !endDate) {
        toast.error("Please choose start and end dates.");
        return;
      }
      setStep("handoff");
      return;
    }
    if (step === "handoff") {
      setStep(needsLocationStep ? "location" : "review");
      return;
    }
    if (step === "location") {
      if (!validateLocationStep()) return;
      setStep("review");
    }
  }

  function goBack() {
    if (step === "review") {
      setStep(needsLocationStep ? "location" : "handoff");
      return;
    }
    if (step === "location") {
      setStep("handoff");
      return;
    }
    if (step === "handoff") {
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
    if (needsLocationStep && !validateLocationStep()) return;

    setIsSubmitting(true);
    try {
      await addReservationToCart({
        costumeId,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        fulfillment: buildFulfillmentPayload()
      });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Start date</Label>
                <Popover open={isStartDateOpen} onOpenChange={(open: boolean) => { setIsStartDateOpen(open); if (open) { setIsEndDateOpen(false); setShouldAutoOpenEndDate(false); } }}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("h-11 w-full justify-start font-normal", !startDate && "text-muted-foreground")}>
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
                <Popover open={isEndDateOpen} onOpenChange={(open: boolean) => { setIsEndDateOpen(open); if (open) setIsStartDateOpen(false); }}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("h-11 w-full justify-start font-normal", !endDate && "text-muted-foreground")}>
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

        {step === "handoff" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">How should this costume reach you and return?</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Outbound</Label>
                <Select value={outboundMethod} onValueChange={(value: string) => setOutboundMethod(value as FulfillmentMethod)}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {methodOptionsForMode(data.effective_fulfillment.outbound_mode).map((m) => (
                      <SelectItem key={m} value={m}>{FULFILLMENT_METHOD_LABELS[m]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Return</Label>
                <Select value={returnMethod} onValueChange={(value: string) => setReturnMethod(value as FulfillmentMethod)}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {methodOptionsForMode(data.effective_fulfillment.return_mode).map((m) => (
                      <SelectItem key={m} value={m}>{FULFILLMENT_METHOD_LABELS[m]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {outboundMethod === "PICKUP" ? (
              <div className="space-y-2">
                <Label>Pickup window</Label>
                <Select value={pickupWindowSlot} onValueChange={(value: string) => setPickupWindowSlot(value as FulfillmentWindowSlot)}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WINDOW_OPTIONS.map((slot) => (
                      <SelectItem key={slot} value={slot}>{FULFILLMENT_WINDOW_LABELS[slot]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Delivery window</Label>
                <Select value={deliveryWindowSlot} onValueChange={(value: string) => setDeliveryWindowSlot(value as FulfillmentWindowSlot)}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WINDOW_OPTIONS.map((slot) => (
                      <SelectItem key={slot} value={slot}>{FULFILLMENT_WINDOW_LABELS[slot]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Return window</Label>
              <Select value={returnWindowSlot} onValueChange={(value: string) => setReturnWindowSlot(value as FulfillmentWindowSlot)}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WINDOW_OPTIONS.map((slot) => (
                    <SelectItem key={slot} value={slot}>{FULFILLMENT_WINDOW_LABELS[slot]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {vendorLocationLine ? (
              <p className="text-sm text-muted-foreground">
                Vendor handoff: <span className="text-foreground">{vendorLocationLine}</span>
              </p>
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

        {step === "location" ? (
          <div className="space-y-6">
            {outboundNeedsLocation ? (
              <div className="space-y-4">
                <p className="text-sm font-medium text-foreground">Outbound delivery location</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button type="button" variant={outboundLocationMode === "saved" ? "default" : "outline"} onClick={() => setOutboundLocationMode("saved")}>
                    Saved location
                  </Button>
                  <Button type="button" variant={outboundLocationMode === "new" ? "default" : "outline"} onClick={() => setOutboundLocationMode("new")}>
                    New address
                  </Button>
                </div>
                {outboundLocationMode === "saved" && savedLocations.length > 0 ? (
                  <Select value={selectedOutboundLocationId ? String(selectedOutboundLocationId) : undefined} onValueChange={(value: string) => setSelectedOutboundLocationId(Number(value))}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Choose location" /></SelectTrigger>
                    <SelectContent>
                      {savedLocations.map((loc) => (
                        <SelectItem key={loc.id} value={String(loc.id)}>{loc.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
                {outboundLocationMode === "new" ? (
                  <SavedLocationFields layout="single" value={newOutboundLocation} onChange={setNewOutboundLocation} />
                ) : null}
              </div>
            ) : null}

            {outboundMethod === "DELIVERY" && returnMethod === "DELIVERY" ? (
              <label className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
                <input type="checkbox" checked={useSameLocationForReturn} onChange={(e) => setUseSameLocationForReturn(e.target.checked)} className="size-4" />
                <span className="text-sm">Use same location for return pickup</span>
              </label>
            ) : null}

            {returnNeedsSeparateLocation ? (
              <div className="space-y-4 border-t border-border pt-6">
                <p className="text-sm font-medium text-foreground">Return pickup location</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button type="button" variant={returnLocationMode === "saved" ? "default" : "outline"} onClick={() => setReturnLocationMode("saved")}>
                    Saved location
                  </Button>
                  <Button type="button" variant={returnLocationMode === "new" ? "default" : "outline"} onClick={() => setReturnLocationMode("new")}>
                    New address
                  </Button>
                </div>
                {returnLocationMode === "saved" && savedLocations.length > 0 ? (
                  <Select value={selectedReturnLocationId ? String(selectedReturnLocationId) : undefined} onValueChange={(value: string) => setSelectedReturnLocationId(Number(value))}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Choose location" /></SelectTrigger>
                    <SelectContent>
                      {savedLocations.map((loc) => (
                        <SelectItem key={loc.id} value={String(loc.id)}>{loc.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
                {returnLocationMode === "new" ? (
                  <SavedLocationFields layout="single" value={newReturnLocation} onChange={setNewReturnLocation} />
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {step === "review" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {startDate && endDate ? (
                <Badge variant="outline">{format(startDate, "MMM d")} – {format(endDate, "MMM d, yyyy")}</Badge>
              ) : null}
              <Badge variant="outline">{FULFILLMENT_METHOD_LABELS[outboundMethod]} out</Badge>
              <Badge variant="outline">{FULFILLMENT_METHOD_LABELS[returnMethod]} return</Badge>
            </div>
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
