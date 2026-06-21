import type { FulfillmentMethod } from "./fulfillment";

export const RESERVATION_STATUS_OPTIONS = [
  "CART",
  "PENDING_PAYMENT",
  "PENDING_VENDOR_REVIEW",
  "AWAITING_SURCHARGE_PAYMENT",
  "CONFIRMED",
  "DELIVERY_SCHEDULED",
  "WITH_RENTER",
  "RETURN_PENDING",
  "RETURNED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED_BY_VENDOR"
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUS_OPTIONS)[number];

export const VENDOR_RESERVATION_STATUS_OPTIONS = [
  "NOT_REQUIRED",
  "PENDING_VENDOR_REVIEW",
  "APPROVED_BY_VENDOR",
  "REJECTED_BY_VENDOR"
] as const;

export type VendorReservationStatus = (typeof VENDOR_RESERVATION_STATUS_OPTIONS)[number];

export const PAYMENT_STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS_OPTIONS)[number];
export const PAYMENT_PURPOSE_LABELS = {
  INITIAL_RESERVATION: "Initial Reservation",
  RESERVATION_ADJUSTMENT: "Supplemental Surcharge"
} as const;

export function isReservationStatus(value: string): value is ReservationStatus {
  return RESERVATION_STATUS_OPTIONS.includes(value as ReservationStatus);
}

export function getDeliveryScheduledLabel(outboundMethod?: FulfillmentMethod | null) {
  return outboundMethod === "PICKUP" ? "Ready for Pickup" : "Out for Delivery";
}

export function getReservationStatusMeta(
  status: ReservationStatus,
  options?: { outboundMethod?: FulfillmentMethod | null }
) {
  const deliveryScheduledLabel = getDeliveryScheduledLabel(options?.outboundMethod);

  const statusMap: Record<ReservationStatus, { label: string; className: string }> = {
    CART: {
      label: "In Cart",
      className: "border-border text-muted-foreground"
    },
    PENDING_PAYMENT: {
      label: "Awaiting Payment",
      className: "border-amber-400/40 text-amber-700 dark:text-amber-400"
    },
    PENDING_VENDOR_REVIEW: {
      label: "Vendor Review",
      className: "border-amber-400/40 text-amber-700 dark:text-amber-400"
    },
    AWAITING_SURCHARGE_PAYMENT: {
      label: "Surcharge Requested",
      className: "border-orange-400/40 text-orange-700 dark:text-orange-400"
    },
    CONFIRMED: {
      label: "Confirmed",
      className: "border-emerald-400/40 text-emerald-700 dark:text-emerald-400"
    },
    DELIVERY_SCHEDULED: {
      label: deliveryScheduledLabel,
      className: "border-sky-400/40 text-sky-700 dark:text-sky-400"
    },
    WITH_RENTER: {
      label: "With Renter",
      className: "border-indigo-400/40 text-indigo-700 dark:text-indigo-400"
    },
    RETURN_PENDING: {
      label: "Return Pending",
      className: "border-fuchsia-400/40 text-fuchsia-700 dark:text-fuchsia-400"
    },
    RETURNED: {
      label: "Returned",
      className: "border-teal-400/40 text-teal-700 dark:text-teal-400"
    },
    COMPLETED: {
      label: "Completed",
      className: "border-emerald-400/40 text-emerald-700 dark:text-emerald-400"
    },
    CANCELLED: {
      label: "Cancelled",
      className: "border-destructive/30 text-destructive"
    },
    REJECTED_BY_VENDOR: {
      label: "Declined",
      className: "border-destructive/30 text-destructive"
    }
  };

  return statusMap[status];
}

export function getPaymentStatusMeta(status: PaymentStatus) {
  const statusMap: Record<PaymentStatus, { label: string; className: string }> = {
    PENDING: {
      label: "Payment Verification",
      className: "border-amber-400/40 text-amber-700 dark:text-amber-400"
    },
    APPROVED: {
      label: "Payment Approved",
      className: "border-emerald-400/40 text-emerald-700 dark:text-emerald-400"
    },
    REJECTED: {
      label: "Receipt Rejected",
      className: "border-destructive/30 text-destructive"
    }
  };

  return statusMap[status];
}

export const ACTIVE_VENDOR_EARNING_STATUSES: ReservationStatus[] = [
  "CONFIRMED",
  "DELIVERY_SCHEDULED",
  "WITH_RENTER",
  "RETURN_PENDING",
  "RETURNED"
];

export const FULFILLMENT_OPERATION_STATUSES: ReservationStatus[] = [
  "CONFIRMED",
  "DELIVERY_SCHEDULED",
  "WITH_RENTER",
  "RETURN_PENDING",
  "RETURNED",
  "COMPLETED"
];
