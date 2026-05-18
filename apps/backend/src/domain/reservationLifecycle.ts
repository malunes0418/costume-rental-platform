export const RESERVATION_STATUSES = [
  "CART",
  "PENDING_PAYMENT",
  "PENDING_VENDOR_REVIEW",
  "AWAITING_SURCHARGE_PAYMENT",
  "CONFIRMED",
  "OUTBOUND_SCHEDULED",
  "OUTBOUND_IN_PROGRESS",
  "WITH_RENTER",
  "RETURN_SCHEDULED",
  "RETURN_IN_PROGRESS",
  "RETURNED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED_BY_VENDOR"
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const RESERVATION_VENDOR_STATUSES = [
  "NOT_REQUIRED",
  "PENDING_VENDOR_REVIEW",
  "APPROVED_BY_VENDOR",
  "REJECTED_BY_VENDOR"
] as const;

export type ReservationVendorStatus = (typeof RESERVATION_VENDOR_STATUSES)[number];

export const RESERVATION_TRANSITION_RULES: Record<ReservationStatus, ReservationStatus[]> = {
  CART: ["PENDING_PAYMENT"],
  PENDING_PAYMENT: ["PENDING_VENDOR_REVIEW"],
  PENDING_VENDOR_REVIEW: ["CONFIRMED", "AWAITING_SURCHARGE_PAYMENT", "REJECTED_BY_VENDOR"],
  AWAITING_SURCHARGE_PAYMENT: ["CONFIRMED"],
  CONFIRMED: ["OUTBOUND_SCHEDULED"],
  OUTBOUND_SCHEDULED: ["OUTBOUND_IN_PROGRESS"],
  OUTBOUND_IN_PROGRESS: ["WITH_RENTER"],
  WITH_RENTER: ["RETURN_SCHEDULED"],
  RETURN_SCHEDULED: ["RETURN_IN_PROGRESS"],
  RETURN_IN_PROGRESS: ["RETURNED"],
  RETURNED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED_BY_VENDOR: []
};

const BLOCKING_STATUS_SET = new Set<ReservationStatus>([
  "PENDING_PAYMENT",
  "PENDING_VENDOR_REVIEW",
  "AWAITING_SURCHARGE_PAYMENT",
  "CONFIRMED",
  "OUTBOUND_SCHEDULED",
  "OUTBOUND_IN_PROGRESS",
  "WITH_RENTER",
  "RETURN_SCHEDULED",
  "RETURN_IN_PROGRESS",
  "RETURNED",
  "COMPLETED"
]);

const APPROVED_PIPELINE_STATUS_SET = new Set<ReservationStatus>([
  "CONFIRMED",
  "OUTBOUND_SCHEDULED",
  "OUTBOUND_IN_PROGRESS",
  "WITH_RENTER",
  "RETURN_SCHEDULED",
  "RETURN_IN_PROGRESS",
  "RETURNED",
  "COMPLETED"
]);

export function isReservationStatus(value: string): value is ReservationStatus {
  return RESERVATION_STATUSES.includes(value as ReservationStatus);
}

export function isReservationVendorStatus(value: string): value is ReservationVendorStatus {
  return RESERVATION_VENDOR_STATUSES.includes(value as ReservationVendorStatus);
}

export function isBlockingReservationStatus(status: ReservationStatus) {
  return BLOCKING_STATUS_SET.has(status);
}

export function isApprovedReservationStatus(status: ReservationStatus) {
  return APPROVED_PIPELINE_STATUS_SET.has(status);
}

export function getAllowedReservationTransitions(status: ReservationStatus) {
  return RESERVATION_TRANSITION_RULES[status] || [];
}

export function canTransitionReservationStatus(current: ReservationStatus, next: ReservationStatus) {
  if (current === next) return true;
  return getAllowedReservationTransitions(current).includes(next);
}

export function assertReservationTransition(
  current: ReservationStatus,
  next: ReservationStatus,
  entityLabel = "Reservation"
) {
  if (canTransitionReservationStatus(current, next)) {
    return;
  }

  const allowed = getAllowedReservationTransitions(current);
  if (allowed.length === 0) {
    throw new Error(`${entityLabel} cannot move from ${current} to ${next}`);
  }

  throw new Error(`${entityLabel} cannot move from ${current} to ${next}. Allowed next statuses: ${allowed.join(", ")}`);
}

export function deriveVendorReservationStatus(
  status: ReservationStatus,
  currentStatus: ReservationVendorStatus = "NOT_REQUIRED"
): ReservationVendorStatus {
  if (status === "PENDING_VENDOR_REVIEW" || status === "AWAITING_SURCHARGE_PAYMENT") {
    return "PENDING_VENDOR_REVIEW";
  }

  if (status === "REJECTED_BY_VENDOR") {
    return "REJECTED_BY_VENDOR";
  }

  if (isApprovedReservationStatus(status)) {
    return "APPROVED_BY_VENDOR";
  }

  if (status === "CART" || status === "PENDING_PAYMENT") {
    return "NOT_REQUIRED";
  }

  return currentStatus;
}
