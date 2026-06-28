import type { Payment, ReservationWithItems } from "./account";
import { FULFILLMENT_METHOD_LABELS, type ReservationAdjustment } from "@/lib/fulfillment";
import {
  getPaymentStatusMeta,
  getReservationStatusMeta,
  type ReservationStatus
} from "./reservationStatus";

export const OPERATION_TIMELINE = [
  "CONFIRMED",
  "DELIVERY_SCHEDULED",
  "WITH_RENTER",
  "RETURN_PENDING",
  "RETURNED",
  "COMPLETED"
] as const;

export type JourneyStep = ReservationStatus | "PAYMENT_REVIEW";

export function primaryImage(reservation: ReservationWithItems) {
  const item = reservation.items?.[0];
  const images = item?.Costume?.CostumeImages || [];
  return images.find((image) => image.is_primary)?.image_url || images[0]?.image_url || "";
}

export function formatReservationDate(value: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function resolveReservationStatus(reservation: ReservationWithItems, payments: Payment[]) {
  const pendingReceipt = payments.some(
    (payment) => payment.status === "PENDING" && Boolean(payment.proof_url)
  );

  if (reservation.status === "PENDING_PAYMENT" && pendingReceipt) {
    return getPaymentStatusMeta("PENDING");
  }

  return getReservationStatusMeta(reservation.status);
}

export function buildReserveAgainHref(reservation: ReservationWithItems) {
  const costumeId = reservation.items?.[0]?.costume_id;
  if (!costumeId || !reservation.start_date || !reservation.end_date) return null;

  const params = new URLSearchParams();
  params.set("startDate", reservation.start_date);
  params.set("endDate", reservation.end_date);

  return `/costumes/${costumeId}?${params.toString()}`;
}

export function resolvePaymentHistoryStatus(payment: Payment, reservation: ReservationWithItems) {
  if (reservation.status === "REJECTED_BY_VENDOR") {
    return {
      label: "Vendor Declined",
      className: "text-destructive border-destructive/30"
    };
  }

  if (reservation.status === "CANCELLED") {
    return {
      label: "Cancelled",
      className: "text-destructive border-destructive/30"
    };
  }

  if (payment.status === "APPROVED" && reservation.status === "PENDING_VENDOR_REVIEW") {
    return {
      label: "Awaiting Vendor Review",
      className: "text-amber-700 border-amber-400/40 dark:text-amber-400"
    };
  }

  return getPaymentStatusMeta(payment.status);
}

export function hasActivePaymentForReservation(payments: Payment[]) {
  return payments.some((payment) => payment.status !== "REJECTED");
}

export function hasActivePaymentForAdjustment(adjustmentId: number, payments: Payment[]) {
  return payments.some(
    (payment) =>
      payment.reservation_adjustment_id === adjustmentId &&
      (payment.status === "PENDING" || payment.status === "APPROVED")
  );
}

export function getPendingAdjustment(reservation: ReservationWithItems) {
  return reservation.adjustments?.find((adjustment) => adjustment.status === "PENDING") ?? null;
}

export function getPaidAdjustmentTotal(reservation: ReservationWithItems) {
  return (reservation.adjustments || [])
    .filter((adjustment) => adjustment.status === "PAID")
    .reduce((sum, adjustment) => sum + Number(adjustment.amount), 0);
}

function hasPendingInitialPaymentProof(payments: Payment[]) {
  return payments.some(
    (payment) =>
      payment.payment_purpose === "INITIAL_RESERVATION" &&
      payment.status === "PENDING" &&
      Boolean(payment.proof_url)
  );
}

export function currentJourneyStep(reservation: ReservationWithItems, payments: Payment[]): JourneyStep {
  if (reservation.status === "PENDING_PAYMENT" && hasPendingInitialPaymentProof(payments)) {
    return "PAYMENT_REVIEW";
  }

  return reservation.status;
}

export function getJourneyStepMeta(step: JourneyStep, outboundMethod?: ReservationWithItems["fulfillment"]) {
  if (step === "PAYMENT_REVIEW") {
    return {
      label: "Payment Verification",
      className: "border-amber-400/40 text-amber-700 dark:text-amber-400"
    };
  }

  return getReservationStatusMeta(step, { outboundMethod: outboundMethod?.outbound_method });
}

export function timelineForReservation(reservation: ReservationWithItems): JourneyStep[] {
  const includesSurcharge =
    reservation.status === "AWAITING_SURCHARGE_PAYMENT" || (reservation.adjustments?.length || 0) > 0;

  const preface: JourneyStep[] = includesSurcharge
    ? ["PENDING_PAYMENT", "PAYMENT_REVIEW", "PENDING_VENDOR_REVIEW", "AWAITING_SURCHARGE_PAYMENT"]
    : ["PENDING_PAYMENT", "PAYMENT_REVIEW", "PENDING_VENDOR_REVIEW"];

  return [...preface, ...OPERATION_TIMELINE];
}

export function timelineStepState(currentStep: JourneyStep, timeline: JourneyStep[], step: JourneyStep) {
  const currentIndex = timeline.indexOf(currentStep);
  const stepIndex = timeline.indexOf(step);
  if (currentStep === step) return "current";
  if (currentIndex >= 0 && stepIndex >= 0 && stepIndex < currentIndex) return "complete";
  return "upcoming";
}

export function reservationFulfillmentSummary(reservation: ReservationWithItems) {
  const fulfillment = reservation.fulfillment;
  if (!fulfillment) return null;

  return `${FULFILLMENT_METHOD_LABELS[fulfillment.outbound_method]} outbound · ${FULFILLMENT_METHOD_LABELS[fulfillment.return_method]} return`;
}

export type { ReservationAdjustment };
