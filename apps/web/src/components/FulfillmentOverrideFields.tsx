"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  DELIVERY_ONLY,
  FULFILLMENT_MODE_LABELS,
  narrowingOptionsForMode,
  type FulfillmentMode,
  type VendorFulfillmentSettings
} from "@/lib/fulfillment";

export type OverrideChoice = FulfillmentMode | "INHERIT";

function optionsForMode(mode: FulfillmentMode) {
  return narrowingOptionsForMode(mode).map((value) => ({
    value,
    label: FULFILLMENT_MODE_LABELS[value]
  }));
}

export function FulfillmentOverrideFields({
  vendorSettings,
  outboundValue,
  returnValue,
  onOutboundChange,
  onReturnChange
}: {
  vendorSettings: VendorFulfillmentSettings | null;
  outboundValue: OverrideChoice;
  returnValue: OverrideChoice;
  onOutboundChange: (value: OverrideChoice) => void;
  onReturnChange: (value: OverrideChoice) => void;
}) {
  if (DELIVERY_ONLY) {
    return null;
  }

  const outboundBase = vendorSettings?.outbound_mode ?? "BOTH";
  const returnBase = vendorSettings?.return_mode ?? "BOTH";

  return (
    <section className="space-y-4 border-t border-border/50 pt-6">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Fulfillment availability
        </p>
        <p className="max-w-[60ch] text-sm leading-7 text-muted-foreground">
          Each costume can inherit the house defaults or narrow them to a more selective handoff. Overrides can never widen beyond what your atelier offers overall.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Outbound method</Label>
          <Select value={outboundValue} onValueChange={(value: string) => onOutboundChange(value as OverrideChoice)}>
            <SelectTrigger className="h-11 w-full rounded-sm">
              <SelectValue placeholder="Choose outbound availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INHERIT">
                Inherit vendor default ({FULFILLMENT_MODE_LABELS[outboundBase]})
              </SelectItem>
              {optionsForMode(outboundBase).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Return method</Label>
          <Select value={returnValue} onValueChange={(value: string) => onReturnChange(value as OverrideChoice)}>
            <SelectTrigger className="h-11 w-full rounded-sm">
              <SelectValue placeholder="Choose return availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INHERIT">
                Inherit vendor default ({FULFILLMENT_MODE_LABELS[returnBase]})
              </SelectItem>
              {optionsForMode(returnBase).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!vendorSettings ? (
        <p className="text-xs leading-6 text-muted-foreground">
          Vendor-wide fulfillment defaults have not been saved yet. These overrides will inherit the platform fallback until you set your atelier defaults.
        </p>
      ) : null}
    </section>
  );
}
