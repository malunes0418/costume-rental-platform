"use client";

import { CopyIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";

import { resolveApiAsset } from "@/lib/assets";
import type { VendorPaymentMethod } from "@/lib/vendor";
import { cn } from "@/lib/utils";

const actionLabelClass = "text-[10px] font-semibold uppercase tracking-widest";

async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard.");
  } catch {
    toast.error("Unable to copy.");
  }
}

export function PaymentMethodCard({ method }: { method: VendorPaymentMethod }) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
      <div>
        <p className="font-display text-base font-semibold text-foreground">{method.label}</p>
        {method.bank_name ? <p className="mt-1 text-xs text-muted-foreground">Bank: {method.bank_name}</p> : null}
      </div>

      <div className="space-y-3 rounded-lg bg-muted/25 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={cn(actionLabelClass, "text-muted-foreground")}>Account name</p>
            <p className="truncate text-sm text-foreground">{method.account_name}</p>
          </div>
          <button
            type="button"
            onClick={() => void copyToClipboard(method.account_name)}
            className={cn("inline-flex shrink-0 items-center gap-1 text-primary", actionLabelClass)}
          >
            <CopyIcon className="size-3" />
            Copy
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={cn(actionLabelClass, "text-muted-foreground")}>Account number</p>
            <p className="truncate text-sm tabular-nums text-foreground">{method.account_number}</p>
          </div>
          <button
            type="button"
            onClick={() => void copyToClipboard(method.account_number)}
            className={cn("inline-flex shrink-0 items-center gap-1 text-primary", actionLabelClass)}
          >
            <CopyIcon className="size-3" />
            Copy
          </button>
        </div>
      </div>

      {method.instructions ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{method.instructions}</p>
      ) : null}

      {method.qr_image_url ? (
        <div className="inline-block overflow-hidden rounded-xl border border-border bg-muted/20 p-2">
          <img
            src={resolveApiAsset(method.qr_image_url)}
            alt={`${method.label} QR code`}
            className="size-36 object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}
