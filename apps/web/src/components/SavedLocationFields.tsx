"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SavedLocationInput } from "@/lib/fulfillment";

export function SavedLocationFields({
  value,
  onChange,
  showDefaultToggle = true
}: {
  value: SavedLocationInput;
  onChange: (value: SavedLocationInput) => void;
  showDefaultToggle?: boolean;
}) {
  function update<K extends keyof SavedLocationInput>(key: K, nextValue: SavedLocationInput[K]) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
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
      <div className="space-y-2 md:col-span-2">
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
          placeholder="Optional"
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
      <div className="space-y-2 md:col-span-2">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Notes</Label>
        <textarea
          value={value.notes || ""}
          onChange={(event) => update("notes", event.target.value)}
          placeholder="Gate pass, parking note, landmark, or timing nuance..."
          className="min-h-24 w-full rounded-sm border border-input bg-transparent px-3 py-3 text-sm outline-none transition-colors focus:border-ring"
        />
      </div>

      {showDefaultToggle ? (
        <label className="flex items-center gap-3 md:col-span-2">
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
