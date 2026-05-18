"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
  type FulfillmentMode,
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
  outbound_mode: FulfillmentMode;
  return_mode: FulfillmentMode;
  outbound_pickup_fee: string;
  outbound_delivery_fee: string;
  return_pickup_fee: string;
  return_delivery_fee: string;
  service_areas_text: string;
};

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
    outbound_mode: settings?.outbound_mode || "BOTH",
    return_mode: settings?.return_mode || "BOTH",
    outbound_pickup_fee: String(settings?.outbound_pickup_fee ?? 0),
    outbound_delivery_fee: String(settings?.outbound_delivery_fee ?? 0),
    return_pickup_fee: String(settings?.return_pickup_fee ?? 0),
    return_delivery_fee: String(settings?.return_delivery_fee ?? 0),
    service_areas_text: serviceAreas
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

export function VendorFulfillmentStudio({
  settings,
  onSaved
}: {
  settings: VendorFulfillmentSettings | null;
  onSaved: (settings: VendorFulfillmentSettings) => void;
}) {
  const [form, setForm] = useState<FormState>(() => formFromSettings(settings));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setForm(formFromSettings(settings));
  }, [settings]);

  const serviceAreaPreview = useMemo(
    () =>
      form.service_areas_text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [form.service_areas_text]
  );

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
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
                notes: form.notes.trim() || null
              }
            : null,
        outbound_mode: form.outbound_mode,
        return_mode: form.return_mode,
        outbound_pickup_fee: form.outbound_pickup_fee,
        outbound_delivery_fee: form.outbound_delivery_fee,
        return_pickup_fee: form.return_pickup_fee,
        return_delivery_fee: form.return_delivery_fee,
        service_areas: parseServiceAreas(form.service_areas_text)
      };

      const nextSettings = await updateVendorFulfillmentSettings(payload);
      onSaved(nextSettings);
      toast.success("Fulfillment settings saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save fulfillment settings.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid gap-10 border-b border-border pb-14 pt-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Fulfillment direction
        </p>
        <h2 className="max-w-xl font-playfair text-4xl font-semibold leading-tight text-foreground">
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
