"use client";

import { useEffect, useState } from "react";

import {
  AddressAutocompleteInput,
  type ResolvedAddressFields
} from "@/components/AddressAutocompleteInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SavedLocationInput } from "@/lib/fulfillment";

type EntryMode = "search" | "manual";

function hasResolvedCoords(value: SavedLocationInput) {
  return (
    value.latitude != null &&
    value.longitude != null &&
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude)
  );
}

export function SavedLocationFields({
  value,
  onChange,
  showDefaultToggle = true,
  layout = "double"
}: {
  value: SavedLocationInput;
  onChange: (value: SavedLocationInput) => void;
  showDefaultToggle?: boolean;
  layout?: "single" | "double";
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const [entryMode, setEntryMode] = useState<EntryMode>(() =>
    apiKey && !value.address_line_1?.trim() ? "search" : "manual"
  );
  const [locationConfirmed, setLocationConfirmed] = useState(() => hasResolvedCoords(value));

  useEffect(() => {
    if (!apiKey) {
      setEntryMode("manual");
    }
  }, [apiKey]);

  const isSingle = layout === "single";
  const showAddressFields = entryMode === "manual" || locationConfirmed || Boolean(value.address_line_1?.trim());

  function update<K extends keyof SavedLocationInput>(key: K, nextValue: SavedLocationInput[K]) {
    const next = { ...value, [key]: nextValue };
    if ((key === "address_line_1" || key === "city") && locationConfirmed) {
      next.latitude = null;
      next.longitude = null;
      next.geocode_failed = false;
      setLocationConfirmed(false);
    }
    onChange(next);
  }

  function handleResolved(fields: ResolvedAddressFields) {
    setLocationConfirmed(true);
    onChange({
      ...value,
      address_line_1: fields.address_line_1,
      address_line_2: value.address_line_2 || fields.address_line_2 || "",
      barangay: fields.barangay || "",
      city: fields.city,
      province: fields.province || "",
      postal_code: fields.postal_code || "",
      country: fields.country || "Philippines",
      area: fields.area || value.area || "",
      latitude: fields.latitude,
      longitude: fields.longitude,
      geocode_failed: false
    });
  }

  function switchToManual() {
    setEntryMode("manual");
    setLocationConfirmed(false);
    onChange({
      ...value,
      latitude: null,
      longitude: null,
      geocode_failed: false
    });
  }

  function switchToSearch() {
    setEntryMode("search");
    setLocationConfirmed(false);
  }

  return (
    <div className={isSingle ? "grid gap-4" : "grid gap-4 md:grid-cols-2"}>
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Label</Label>
        <Input
          value={value.label}
          onChange={(event) => update("label", event.target.value)}
          placeholder="Home, Studio, Event hall"
          className="h-11 rounded-sm"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Contact name</Label>
        <Input
          value={value.contact_name}
          onChange={(event) => update("contact_name", event.target.value)}
          placeholder="Who should receive the handoff?"
          className="h-11 rounded-sm"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Phone number</Label>
        <Input
          value={value.phone_number}
          onChange={(event) => update("phone_number", event.target.value)}
          placeholder="+63..."
          className="h-11 rounded-sm"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Area</Label>
        <Input
          value={value.area || ""}
          onChange={(event) => update("area", event.target.value)}
          placeholder="Makati CBD, BGC, Tomas Morato..."
          className="h-11 rounded-sm"
        />
      </div>

      {entryMode === "search" && apiKey ? (
        <div className={isSingle ? "space-y-3" : "space-y-3 md:col-span-2"}>
          <AddressAutocompleteInput onResolved={handleResolved} />
          {locationConfirmed ? (
            <p className="rounded-sm border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
              Location found — delivery quotes enabled. You can still tweak unit/floor details below.
            </p>
          ) : null}
          <button
            type="button"
            onClick={switchToManual}
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Can&apos;t find your address? Enter it manually
          </button>
        </div>
      ) : (
        <div className={isSingle ? "space-y-2" : "space-y-2 md:col-span-2"}>
          <p className="rounded-sm border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Manual entry — we&apos;ll estimate coordinates from the written address when you save. Live
            courier quotes work best when you search and pick a suggestion instead.
          </p>
          {apiKey ? (
            <button
              type="button"
              onClick={switchToSearch}
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Back to address search
            </button>
          ) : null}
        </div>
      )}

      {showAddressFields ? (
        <>
          <div className={isSingle ? "space-y-2" : "space-y-2 md:col-span-2"}>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Address line 1</Label>
            <Input
              value={value.address_line_1}
              onChange={(event) => update("address_line_1", event.target.value)}
              placeholder="Street, building, floor"
              className="h-11 rounded-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Address line 2</Label>
            <Input
              value={value.address_line_2 || ""}
              onChange={(event) => update("address_line_2", event.target.value)}
              placeholder="Unit, floor, building name"
              className="h-11 rounded-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Barangay</Label>
            <Input
              value={value.barangay || ""}
              onChange={(event) => update("barangay", event.target.value)}
              placeholder="Optional"
              className="h-11 rounded-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">City</Label>
            <Input
              value={value.city}
              onChange={(event) => update("city", event.target.value)}
              placeholder="City"
              className="h-11 rounded-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Province</Label>
            <Input
              value={value.province || ""}
              onChange={(event) => update("province", event.target.value)}
              placeholder="Province"
              className="h-11 rounded-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Postal code</Label>
            <Input
              value={value.postal_code || ""}
              onChange={(event) => update("postal_code", event.target.value)}
              placeholder="Optional"
              className="h-11 rounded-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Country</Label>
            <Input
              value={value.country || "Philippines"}
              onChange={(event) => update("country", event.target.value)}
              placeholder="Philippines"
              className="h-11 rounded-sm"
            />
          </div>
        </>
      ) : null}

      <div className={isSingle ? "space-y-2" : "space-y-2 md:col-span-2"}>
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Notes</Label>
        <textarea
          value={value.notes || ""}
          onChange={(event) => update("notes", event.target.value)}
          placeholder="Gate pass, parking note, landmark, or timing nuance..."
          className="min-h-24 w-full rounded-sm border border-input bg-transparent px-3 py-3 text-sm outline-none transition-colors focus:border-ring"
        />
      </div>

      {showDefaultToggle ? (
        <label className={isSingle ? "flex items-center gap-3" : "flex items-center gap-3 md:col-span-2"}>
          <input
            type="checkbox"
            checked={Boolean(value.is_default)}
            onChange={(event) => update("is_default", event.target.checked)}
            className="size-4 rounded border-border"
          />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Set as default location</span>
        </label>
      ) : null}
    </div>
  );
}
