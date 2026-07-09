"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AddressAutocompleteInput,
  type ResolvedAddressFields
} from "@/components/AddressAutocompleteInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  FULFILLMENT_MODE_LABELS,
  LALAMOVE_SERVICE_TYPE_LABELS,
  LALAMOVE_SERVICE_TYPES,
  type DeliveryProvider,
  type FulfillmentMode,
  type LalamoveServiceType,
  type ServiceAreaDefinition,
  type VendorFulfillmentSettings,
  type VendorFulfillmentSettingsInput
} from "@/lib/fulfillment";
import { updateVendorFulfillmentSettings } from "@/lib/vendor";

type FormState = {
  label: string;
  address_line_1: string;
  barangay: string;
  area: string;
  city: string;
  province: string;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  outbound_mode: FulfillmentMode;
  return_mode: FulfillmentMode;
  outbound_pickup_fee: string;
  outbound_delivery_fee: string;
  return_pickup_fee: string;
  return_delivery_fee: string;
  service_areas_text: string;
  delivery_provider: DeliveryProvider;
  lalamove_service_type: LalamoveServiceType;
};

type LocationEntryMode = "search" | "manual";

function formFromSettings(settings: VendorFulfillmentSettings | null): FormState {
  const serviceAreas = (settings?.service_areas || [])
    .map((entry) => entry.label || entry.area || entry.city || entry.province || "")
    .filter(Boolean)
    .join("\n");

  return {
    label: settings?.primary_location?.label || "",
    address_line_1: settings?.primary_location?.address_line_1 || "",
    barangay: settings?.primary_location?.barangay || "",
    area: settings?.primary_location?.area || "",
    city: settings?.primary_location?.city || "",
    province: settings?.primary_location?.province || "",
    notes: settings?.primary_location?.notes || "",
    latitude: settings?.primary_location?.latitude ?? null,
    longitude: settings?.primary_location?.longitude ?? null,
    outbound_mode: settings?.outbound_mode || "BOTH",
    return_mode: settings?.return_mode || "BOTH",
    outbound_pickup_fee: String(settings?.outbound_pickup_fee ?? 0),
    outbound_delivery_fee: String(settings?.outbound_delivery_fee ?? 0),
    return_pickup_fee: String(settings?.return_pickup_fee ?? 0),
    return_delivery_fee: String(settings?.return_delivery_fee ?? 0),
    service_areas_text: serviceAreas,
    delivery_provider: settings?.delivery_provider || "MANUAL",
    lalamove_service_type: settings?.lalamove_service_type || "MOTORCYCLE"
  };
}

function parseServiceAreas(raw: string): ServiceAreaDefinition[] | null {
  const entries = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((label) => ({ label }));

  return entries.length > 0 ? entries : null;
}

function hasCoords(latitude: number | null, longitude: number | null) {
  return (
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  );
}

export function VendorFulfillmentStudio({
  settings,
  onSaved
}: {
  settings: VendorFulfillmentSettings | null;
  onSaved: (settings: VendorFulfillmentSettings) => void;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const [form, setForm] = useState<FormState>(() => formFromSettings(settings));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationEntryMode, setLocationEntryMode] = useState<LocationEntryMode>(() =>
    apiKey && !settings?.primary_location?.address_line_1 ? "search" : "manual"
  );
  const [locationConfirmed, setLocationConfirmed] = useState(() =>
    hasCoords(
      settings?.primary_location?.latitude ?? null,
      settings?.primary_location?.longitude ?? null
    )
  );

  useEffect(() => {
    const next = formFromSettings(settings);
    setForm(next);
    setLocationConfirmed(hasCoords(next.latitude, next.longitude));
    if (!apiKey) {
      setLocationEntryMode("manual");
    } else if (!next.address_line_1.trim()) {
      setLocationEntryMode("search");
    } else {
      setLocationEntryMode("manual");
    }
  }, [settings, apiKey]);

  const serviceAreaPreview = useMemo(
    () =>
      form.service_areas_text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [form.service_areas_text]
  );

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if ((key === "address_line_1" || key === "city") && locationConfirmed) {
        next.latitude = null;
        next.longitude = null;
        setLocationConfirmed(false);
      }
      return next;
    });
  }

  function handleResolved(fields: ResolvedAddressFields) {
    setLocationConfirmed(true);
    setForm((current) => ({
      ...current,
      address_line_1: fields.address_line_1,
      barangay: fields.barangay || "",
      area: fields.area || current.area,
      city: fields.city,
      province: fields.province || "",
      latitude: fields.latitude,
      longitude: fields.longitude
    }));
  }

  function validate() {
    const pickupAllowed = form.outbound_mode !== "DELIVERY" || form.return_mode !== "DELIVERY";
    if (pickupAllowed && (!form.address_line_1.trim() || !form.city.trim())) {
      throw new Error("Primary business location address and city are required whenever pickup is offered");
    }
  }

  async function handleSubmit() {
    try {
      validate();
      setIsSubmitting(true);

      const payload: VendorFulfillmentSettingsInput = {
        primary_location:
          form.address_line_1.trim() || form.city.trim() || form.area.trim() || form.barangay.trim()
            ? {
                label: form.label.trim() || "Primary business location",
                address_line_1: form.address_line_1.trim(),
                barangay: form.barangay.trim() || null,
                area: form.area.trim() || null,
                city: form.city.trim(),
                province: form.province.trim() || null,
                notes: form.notes.trim() || null,
                latitude: form.latitude,
                longitude: form.longitude
              }
            : null,
        outbound_mode: form.outbound_mode,
        return_mode: form.return_mode,
        outbound_pickup_fee: form.outbound_pickup_fee,
        outbound_delivery_fee: form.outbound_delivery_fee,
        return_pickup_fee: form.return_pickup_fee,
        return_delivery_fee: form.return_delivery_fee,
        service_areas: parseServiceAreas(form.service_areas_text),
        delivery_provider: form.delivery_provider,
        lalamove_service_type: form.delivery_provider === "LALAMOVE" ? form.lalamove_service_type : null
      };

      const nextSettings = await updateVendorFulfillmentSettings(payload);
      onSaved(nextSettings);
      toast.success("Fulfillment settings saved.");

      const savedCoords = hasCoords(
        nextSettings.primary_location?.latitude ?? null,
        nextSettings.primary_location?.longitude ?? null
      );
      if (form.delivery_provider === "LALAMOVE" && !savedCoords) {
        toast.warning(
          "Primary location has no coordinates yet — live Lalamove quotes will fall back to your fixed delivery fees."
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save fulfillment settings.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const showAddressFields =
    locationEntryMode === "manual" || locationConfirmed || Boolean(form.address_line_1.trim());

  return (
    <section className="grid gap-10 border-b border-border pb-14 pt-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Fulfillment direction
        </p>
        <h2 className="max-w-xl font-display text-4xl font-semibold leading-tight text-foreground">
          Set the handoff rhythm before each piece enters circulation.
        </h2>
        <p className="max-w-[58ch] text-sm leading-8 text-muted-foreground">
          Define how reservations leave your atelier, how they return, which neighborhoods you reliably serve, and which fixed fees should already be snapped onto every booking.
        </p>
        {serviceAreaPreview.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-2">
            {serviceAreaPreview.map((area) => (
              <span
                key={area}
                className="rounded-sm border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-foreground"
              >
                {area}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-8">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Primary location label</Label>
            <Input
              value={form.label}
              onChange={(event) => updateField("label", event.target.value)}
              placeholder="Main atelier"
              className="h-11 rounded-sm"
            />
          </div>

          {locationEntryMode === "search" && apiKey ? (
            <div className="space-y-3 md:col-span-2">
              <AddressAutocompleteInput
                label="Search primary location"
                placeholder="Search your atelier, studio, or pickup point…"
                onResolved={handleResolved}
              />
              {locationConfirmed ? (
                <p className="rounded-sm border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                  Location found — Lalamove can quote from these coordinates. Tweak details below if needed.
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setLocationEntryMode("manual");
                  setLocationConfirmed(false);
                  setForm((current) => ({ ...current, latitude: null, longitude: null }));
                }}
                className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Can&apos;t find it? Enter the address manually
              </button>
            </div>
          ) : (
            <div className="space-y-2 md:col-span-2">
              <p className="rounded-sm border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Manual entry — we&apos;ll geocode this address on save. Prefer search when enabling Lalamove.
              </p>
              {apiKey ? (
                <button
                  type="button"
                  onClick={() => setLocationEntryMode("search")}
                  className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Back to address search
                </button>
              ) : null}
            </div>
          )}

          {showAddressFields ? (
            <>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Address line 1</Label>
                <Input
                  value={form.address_line_1}
                  onChange={(event) => updateField("address_line_1", event.target.value)}
                  placeholder="Street address or building"
                  className="h-11 rounded-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Barangay</Label>
                <Input
                  value={form.barangay}
                  onChange={(event) => updateField("barangay", event.target.value)}
                  placeholder="Optional"
                  className="h-11 rounded-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Area</Label>
                <Input
                  value={form.area}
                  onChange={(event) => updateField("area", event.target.value)}
                  placeholder="Makati CBD"
                  className="h-11 rounded-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">City</Label>
                <Input
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  placeholder="Makati"
                  className="h-11 rounded-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Province</Label>
                <Input
                  value={form.province}
                  onChange={(event) => updateField("province", event.target.value)}
                  placeholder="Metro Manila"
                  className="h-11 rounded-sm"
                />
              </div>
            </>
          ) : null}

          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Location notes</Label>
            <textarea
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Arrival notes, building wing, concierge instructions..."
              className="min-h-24 w-full rounded-sm border border-input bg-transparent px-3 py-3 text-sm outline-none transition-colors focus:border-ring"
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Default outbound mode</Label>
            <Select value={form.outbound_mode} onValueChange={(value: string) => updateField("outbound_mode", value as FulfillmentMode)}>
              <SelectTrigger className="h-11 w-full rounded-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["BOTH", "PICKUP", "DELIVERY"] as FulfillmentMode[]).map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {FULFILLMENT_MODE_LABELS[mode]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Default return mode</Label>
            <Select value={form.return_mode} onValueChange={(value: string) => updateField("return_mode", value as FulfillmentMode)}>
              <SelectTrigger className="h-11 w-full rounded-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["BOTH", "PICKUP", "DELIVERY"] as FulfillmentMode[]).map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {FULFILLMENT_MODE_LABELS[mode]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Outbound pickup fee</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.outbound_pickup_fee}
              onChange={(event) => updateField("outbound_pickup_fee", event.target.value)}
              className="h-11 rounded-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Outbound delivery fee</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.outbound_delivery_fee}
              onChange={(event) => updateField("outbound_delivery_fee", event.target.value)}
              className="h-11 rounded-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Return pickup fee</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.return_pickup_fee}
              onChange={(event) => updateField("return_pickup_fee", event.target.value)}
              className="h-11 rounded-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Return delivery fee</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.return_delivery_fee}
              onChange={(event) => updateField("return_delivery_fee", event.target.value)}
              className="h-11 rounded-sm"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-sm border border-border p-5">
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Delivery provider</Label>
            <p className="text-xs leading-6 text-muted-foreground">
              Choose how deliveries are fulfilled. Lalamove enables live courier quotes at checkout — the fees you set below become the fallback when quoting is unavailable.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["MANUAL", "LALAMOVE"] as DeliveryProvider[]).map((provider) => (
              <button
                key={provider}
                type="button"
                onClick={() => updateField("delivery_provider", provider)}
                className={`flex flex-col gap-1 rounded-sm border p-4 text-left transition-colors ${
                  form.delivery_provider === provider
                    ? "border-foreground bg-muted/40"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground">
                  {provider === "MANUAL" ? "Manual" : "Lalamove"}
                </span>
                <span className="text-xs leading-5 text-muted-foreground">
                  {provider === "MANUAL"
                    ? "You coordinate delivery yourself and charge fixed fees."
                    : "Live courier quotes power checkout; fixed fees apply if quoting fails."}
                </span>
              </button>
            ))}
          </div>

          {form.delivery_provider === "LALAMOVE" ? (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Vehicle type</Label>
              <Select
                value={form.lalamove_service_type}
                onValueChange={(value: string) => updateField("lalamove_service_type", value as LalamoveServiceType)}
              >
                <SelectTrigger className="h-11 w-full rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LALAMOVE_SERVICE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {LALAMOVE_SERVICE_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs leading-6 text-muted-foreground">
                Select the vehicle type for Lalamove orders. Motorcycle is suitable for most costume deliveries.
              </p>
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Service areas</Label>
          <textarea
            value={form.service_areas_text}
            onChange={(event) => updateField("service_areas_text", event.target.value)}
            placeholder={"One area per line\nMakati CBD\nBGC\nQuezon City"}
            className="min-h-28 w-full rounded-sm border border-input bg-transparent px-3 py-3 text-sm outline-none transition-colors focus:border-ring"
          />
          <p className="text-xs leading-6 text-muted-foreground">
            Use one line per neighborhood, district, or city. These labels are used to flag reservations that may need a later outside-area surcharge.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
          <p className="max-w-[42ch] text-xs leading-6 text-muted-foreground">
            Pickup-enabled configurations should always include a usable atelier location so renters see a clear handoff point.
          </p>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="h-11 rounded-sm px-6 text-[10px] font-semibold uppercase tracking-[0.24em]"
          >
            {isSubmitting ? "Saving..." : "Save fulfillment settings"}
          </Button>
        </div>
      </div>
    </section>
  );
}
