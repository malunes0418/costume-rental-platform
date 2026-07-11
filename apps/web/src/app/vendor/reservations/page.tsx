"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  CheckIcon,
  Cross2Icon,
  ExternalLinkIcon,
  ImageIcon,
  MagnifyingGlassIcon
} from "@radix-ui/react-icons";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { resolveApiAsset } from "@/lib/assets";
import { useAuth } from "@/lib/auth";
import {
  FULFILLMENT_METHOD_LABELS,
  formatLocationSummary,
  inferFulfillmentWindowSlot,
  type ReservationAdjustment
} from "@/lib/fulfillment";
import { getReservationItemPricingSummary } from "@/lib/pricing";
import {
  FULFILLMENT_OPERATION_STATUSES,
  PAYMENT_PURPOSE_LABELS,
  getPaymentStatusMeta,
  getReservationStatusMeta,
  type ReservationStatus
} from "@/lib/reservationStatus";
import { cn } from "@/lib/utils";
import {
  approveReservation,
  completeReservation,
  confirmVendorReturn,
  dispatchReservation,
  listVendorReservations,
  previewLalamoveDispatch,
  rejectReservation,
  reviewVendorPayment,
  requestReservationSurcharge,
  waiveReservationAdjustment,
  getReservationDelivery,
  type Reservation
} from "@/lib/vendor";
import type { DeliveryOrder, LalamoveDispatchQuote } from "@/lib/fulfillment";

const OPERATION_TIMELINE: ReservationStatus[] = [...FULFILLMENT_OPERATION_STATUSES];

const NEEDS_ATTENTION_STATUSES = new Set<ReservationStatus>([
  "PENDING_PAYMENT",
  "PENDING_VENDOR_REVIEW",
  "AWAITING_SURCHARGE_PAYMENT"
]);

const IN_MOTION_STATUSES = new Set<ReservationStatus>([
  "CONFIRMED",
  "DELIVERY_SCHEDULED",
  "WITH_RENTER",
  "RETURN_PENDING",
  "RETURNED"
]);

function formatDate(date?: string, pattern = "MMM d, yyyy") {
  if (!date) return "-";
  return format(new Date(date), pattern);
}

function formatMoney(value: number | string) {
  return `PHP ${Number(value).toLocaleString()}`;
}

function statusPill(label: string, className: string) {
  return (
    <span
      className={cn(
        "inline-flex rounded-xl border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest",
        className
      )}
    >
      {label}
    </span>
  );
}

function getFeaturedPayment(reservation: Reservation) {
  return reservation.payments?.find((payment) => payment.proof_url) ?? reservation.payments?.[0] ?? null;
}

function getPendingAdjustment(reservation: Reservation) {
  return reservation.adjustments?.find((adjustment) => adjustment.status === "PENDING") ?? null;
}

function getPaidAdjustmentTotal(reservation: Reservation) {
  return (reservation.adjustments || [])
    .filter((adjustment) => adjustment.status === "PAID")
    .reduce((sum, adjustment) => sum + Number(adjustment.amount), 0);
}

function getVendorDecisionMeta(reservation: Reservation) {
  const initialPayment = reservation.payments?.find(
    (payment) => payment.payment_purpose === "INITIAL_RESERVATION" && payment.proof_url
  );

  if (reservation.status === "PENDING_PAYMENT" && initialPayment?.status === "PENDING") {
    return {
      label: "Payment Verification",
      className: "border-amber-400/40 text-amber-700 dark:text-amber-400"
    };
  }

  return getReservationStatusMeta(reservation.status);
}

function canVendorReviewReservation(reservation: Reservation) {
  return reservation.status === "PENDING_VENDOR_REVIEW";
}

function getReceiptStatusMeta(reservation: Reservation) {
  const paymentWithProof = getFeaturedPayment(reservation);
  if (paymentWithProof) {
    if (paymentWithProof.status === "APPROVED" && reservation.status === "PENDING_VENDOR_REVIEW") {
      return {
        label: "Ready for Vendor Review",
        className: "border-amber-400/40 text-amber-700 dark:text-amber-400"
      };
    }
    return getPaymentStatusMeta(paymentWithProof.status);
  }
  if (reservation.status === "PENDING_PAYMENT") {
    return {
      label: "Awaiting Receipt",
      className: "border-border text-muted-foreground"
    };
  }
  if (reservation.status === "CART") {
    return {
      label: "Not Checked Out",
      className: "border-border text-muted-foreground"
    };
  }
  return {
    label: "No Payment Record",
    className: "border-border text-muted-foreground"
  };
}

function getAdjustmentStatusMeta(adjustment: ReservationAdjustment) {
  if (adjustment.status === "PAID") {
    return {
      label: "Paid",
      className: "border-emerald-400/40 text-emerald-700 dark:text-emerald-400"
    };
  }
  if (adjustment.status === "PENDING") {
    return {
      label: "Awaiting Payment",
      className: "border-orange-400/40 text-orange-700 dark:text-orange-400"
    };
  }
  if (adjustment.status === "WAIVED") {
    return {
      label: "Waived",
      className: "border-border text-muted-foreground"
    };
  }
  return {
    label: "Rejected",
    className: "border-destructive/30 text-destructive"
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatWindowLabel(start?: string | null, end?: string | null) {
  const slot = inferFulfillmentWindowSlot(start, end);
  if (!start || !end) return "Window pending";
  return slot ? `${formatDate(start)} - ${slot.toLowerCase()}` : `${formatDate(start)} - timed window`;
}

function reservationStatusMeta(reservation: Reservation, status: ReservationStatus) {
  return getReservationStatusMeta(status, {
    outboundMethod: reservation.fulfillment?.outbound_method
  });
}

function timelineStepState(current: ReservationStatus, step: ReservationStatus) {
  const currentIndex = OPERATION_TIMELINE.indexOf(current);
  const stepIndex = OPERATION_TIMELINE.indexOf(step);
  if (current === step) return "current";
  if (currentIndex >= 0 && stepIndex >= 0 && stepIndex < currentIndex) return "complete";
  return "upcoming";
}

export default function VendorReservationsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [surchargeAmount, setSurchargeAmount] = useState("");
  const [surchargeNote, setSurchargeNote] = useState("");
  const [dispatchProof, setDispatchProof] = useState<File | null>(null);
  const [returnProof, setReturnProof] = useState<File | null>(null);
  const [lalamoveQuote, setLalamoveQuote] = useState<LalamoveDispatchQuote | null>(null);
  const [lalamoveQuoteLoading, setLalamoveQuoteLoading] = useState(false);
  const [lalamoveQuoteError, setLalamoveQuoteError] = useState<string | null>(null);
  const [selectedDeliveryOrders, setSelectedDeliveryOrders] = useState<DeliveryOrder[]>([]);

  const fetchReservations = useCallback(
    async (showError = true) => {
      if (!user) return;

      try {
        const response = await listVendorReservations();
        setReservations(response);
        setSelectedReservation((current) =>
          current ? response.find((reservation) => reservation.id === current.id) || null : current
        );
      } catch (error: unknown) {
        if (showError) {
          toast.error(getErrorMessage(error, "Failed to load reservations."));
        }
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    void fetchReservations();
  }, [fetchReservations, user]);

  useEffect(() => {
    if (!selectedReservation) {
      setSurchargeAmount("");
      setSurchargeNote("");
      setLalamoveQuote(null);
      setLalamoveQuoteError(null);
      setSelectedDeliveryOrders([]);
      return;
    }

    const pendingAdjustment = getPendingAdjustment(selectedReservation);
    setSurchargeAmount(pendingAdjustment ? String(pendingAdjustment.amount) : "");
    setSurchargeNote(pendingAdjustment?.note || "");
    setLalamoveQuote(null);
    setLalamoveQuoteError(null);

    let cancelled = false;
    getReservationDelivery(selectedReservation.id)
      .then((response) => {
        if (!cancelled) {
          setSelectedDeliveryOrders(
            [response.outbound, response.return].filter((o): o is DeliveryOrder => o !== null)
          );
        }
      })
      .catch(() => {
        if (!cancelled) setSelectedDeliveryOrders([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedReservation]);

  async function handleApprove(id: number) {
    if (!user) return;

    setActioningId(id);
    try {
      await approveReservation(id);
      toast.success("Reservation approved.");
      await fetchReservations(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to approve reservation."));
    } finally {
      setActioningId(null);
    }
  }

  async function handlePaymentReview(paymentId: number, status: "APPROVED" | "REJECTED") {
    setActioningId(paymentId);
    try {
      await reviewVendorPayment(paymentId, status);
      toast.success(status === "APPROVED" ? "Payment verified." : "Payment receipt rejected.");
      await fetchReservations(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to review payment receipt."));
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(id: number) {
    if (!user) return;

    setActioningId(id);
    try {
      await rejectReservation(id);
      toast.success("Reservation rejected.");
      await fetchReservations(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to reject reservation."));
    } finally {
      setActioningId(null);
    }
  }

  async function handleRequestSurcharge(id: number) {
    if (!user) return;

    setActioningId(id);
    try {
      await requestReservationSurcharge(id, {
        amount: surchargeAmount,
        note: surchargeNote
      });
      toast.success("Surcharge request sent to renter.");
      await fetchReservations(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to request surcharge."));
    } finally {
      setActioningId(null);
    }
  }

  async function handleFetchLalamoveQuote(id: number) {
    setLalamoveQuoteLoading(true);
    setLalamoveQuoteError(null);
    try {
      const result = await previewLalamoveDispatch(id);
      if (result.quote) {
        setLalamoveQuote(result.quote);
      } else {
        setLalamoveQuoteError(
          result.provider === "MANUAL"
            ? "Lalamove is not configured for this vendor. Use manual dispatch."
            : "Could not get a Lalamove quote — ensure both vendor and renter locations have coordinates."
        );
      }
    } catch (error: unknown) {
      setLalamoveQuoteError(getErrorMessage(error, "Unable to fetch Lalamove quote."));
    } finally {
      setLalamoveQuoteLoading(false);
    }
  }

  async function handleDispatch(id: number) {
    if (!user) return;
    setActioningId(id);
    try {
      await dispatchReservation(id, dispatchProof || undefined);
      toast.success("Reservation dispatched.");
      setDispatchProof(null);
      setLalamoveQuote(null);
      await fetchReservations(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to dispatch reservation."));
    } finally {
      setActioningId(null);
    }
  }

  async function handleConfirmReturn(id: number) {
    if (!user) return;
    setActioningId(id);
    try {
      await confirmVendorReturn(id, returnProof || undefined);
      toast.success("Return confirmed.");
      setReturnProof(null);
      await fetchReservations(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to confirm return."));
    } finally {
      setActioningId(null);
    }
  }

  async function handleComplete(id: number) {
    if (!user) return;
    setActioningId(id);
    try {
      await completeReservation(id);
      toast.success("Rental completed.");
      await fetchReservations(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to complete rental."));
    } finally {
      setActioningId(null);
    }
  }

  async function handleWaiveSurcharge(reservationId: number, adjustmentId: number) {
    if (!user) return;
    setActioningId(reservationId);
    try {
      await waiveReservationAdjustment(reservationId, adjustmentId);
      toast.success("Surcharge waived.");
      await fetchReservations(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to waive surcharge."));
    } finally {
      setActioningId(null);
    }
  }

  const selectedPayment = selectedReservation ? getFeaturedPayment(selectedReservation) : null;
  const selectedVendorDecision = selectedReservation ? getVendorDecisionMeta(selectedReservation) : null;
  const selectedReceiptStatus = selectedReservation ? getReceiptStatusMeta(selectedReservation) : null;
  const canReviewSelectedReservation = selectedReservation ? canVendorReviewReservation(selectedReservation) : false;
  const selectedPendingAdjustment = selectedReservation ? getPendingAdjustment(selectedReservation) : null;
  const selectedPaidSurcharge = selectedReservation ? getPaidAdjustmentTotal(selectedReservation) : 0;
  const selectedOutsideServiceArea = Boolean(selectedReservation?.fulfillment?.outside_service_area);
  const canVerifySelectedPayment = Boolean(selectedPayment?.proof_url && selectedPayment.status === "PENDING");

  const boardCounts = useMemo(() => {
    let needsAttention = 0;
    let inMotion = 0;
    let completed = 0;

    for (const reservation of reservations) {
      if (NEEDS_ATTENTION_STATUSES.has(reservation.status)) {
        needsAttention += 1;
      } else if (IN_MOTION_STATUSES.has(reservation.status)) {
        inMotion += 1;
      } else if (reservation.status === "COMPLETED") {
        completed += 1;
      }
    }

    return {
      total: reservations.length,
      needsAttention,
      inMotion,
      completed
    };
  }, [reservations]);

  const selectedCostumeName =
    selectedReservation?.items?.[0]?.Costume?.name ||
    (selectedReservation ? `Reservation #${selectedReservation.id}` : "");

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="mb-8 space-y-3">
          <Skeleton className="h-3 w-28 rounded-full" />
          <Skeleton className="h-10 w-56 rounded-xl" />
          <Skeleton className="h-4 w-full max-w-md rounded-full" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-12">
      <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Orders
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Reservations
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Verify receipts, approve delivery plans, and move each rental from confirmation through return.
          </p>
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Reservation counts">
          <div className="flex items-baseline gap-2">
            <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total</dt>
            <dd className="font-display text-xl font-semibold tabular-nums text-foreground">
              {boardCounts.total}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Needs you</dt>
            <dd
              className={cn(
                "font-display text-xl font-semibold tabular-nums",
                boardCounts.needsAttention > 0
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-foreground"
              )}
            >
              {boardCounts.needsAttention}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">In motion</dt>
            <dd className="font-display text-xl font-semibold tabular-nums text-foreground">
              {boardCounts.inMotion}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Closed</dt>
            <dd className="font-display text-xl font-semibold tabular-nums text-foreground">
              {boardCounts.completed}
            </dd>
          </div>
        </dl>
      </header>

      {reservations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-8 py-14 text-center">
          <CalendarIcon className="mx-auto size-10 text-muted-foreground/30" />
          <p className="mt-5 font-display text-2xl font-semibold text-foreground md:text-3xl">
            No reservations yet
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            When renters book your costumes, they appear here for payment review, approval, and delivery.
          </p>
        </div>
      ) : (
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                All bookings
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-foreground">
                Reservation list
              </h2>
            </div>
            {boardCounts.needsAttention > 0 ? (
              <p className="text-xs text-muted-foreground">
                {boardCounts.needsAttention} booking{boardCounts.needsAttention === 1 ? "" : "s"} need a decision
              </p>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="border-b border-border bg-muted/40 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="p-4 font-medium">Reservation</th>
                  <th className="p-4 font-medium">Renter</th>
                  <th className="p-4 font-medium">Dates</th>
                  <th className="p-4 font-medium">Quoted</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reservations.map((reservation) => {
                  const firstItem = reservation.items?.[0];
                  const vendorStatus = getVendorDecisionMeta(reservation);
                  const paymentStatus = getReceiptStatusMeta(reservation);
                  const paidSurcharge = getPaidAdjustmentTotal(reservation);
                  const needsYou = NEEDS_ATTENTION_STATUSES.has(reservation.status);

                  return (
                    <tr key={reservation.id} className="reservations-row">
                      <td className="p-4">
                        <p className="font-display text-base font-semibold text-foreground">
                          {firstItem?.Costume?.name || `Reservation #${reservation.id}`}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          #{reservation.id} · {reservation.items?.length || 0} item
                          {(reservation.items?.length || 0) === 1 ? "" : "s"}
                          {needsYou ? " · Needs review" : ""}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-foreground">
                          {reservation.User?.name || `User #${reservation.user_id}`}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {reservation.User?.email || "No email available"}
                        </p>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {formatDate(reservation.start_date, "MMM d")} - {formatDate(reservation.end_date)}
                      </td>
                      <td className="p-4 font-semibold text-primary">
                        {formatMoney(Number(reservation.total_price) + paidSurcharge)}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5">
                          {statusPill(vendorStatus.label, vendorStatus.className)}
                          {statusPill(paymentStatus.label, paymentStatus.className)}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedReservation(reservation)}
                          className="hover-snap inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90"
                        >
                          <MagnifyingGlassIcon className="size-3.5" />
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="space-y-3 p-3 md:hidden">
              {reservations.map((reservation) => {
                const firstItem = reservation.items?.[0];
                const vendorStatus = getVendorDecisionMeta(reservation);
                const paymentStatus = getReceiptStatusMeta(reservation);
                const paidSurcharge = getPaidAdjustmentTotal(reservation);

                return (
                  <div
                    key={reservation.id}
                    className="reservations-mobile-card space-y-4 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-display text-lg font-semibold text-foreground">
                          {firstItem?.Costume?.name || `Reservation #${reservation.id}`}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          #{reservation.id} · {reservation.User?.name || `User #${reservation.user_id}`}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDate(reservation.start_date, "MMM d")} - {formatDate(reservation.end_date)}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold text-primary">
                        {formatMoney(Number(reservation.total_price) + paidSurcharge)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {statusPill(vendorStatus.label, vendorStatus.className)}
                      {statusPill(paymentStatus.label, paymentStatus.className)}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedReservation(reservation)}
                      className="hover-snap flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90"
                    >
                      <MagnifyingGlassIcon className="size-3.5" />
                      Review reservation
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <Dialog open={!!selectedReservation} onOpenChange={(open: boolean) => !open && setSelectedReservation(null)}>
        <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-background p-0 shadow-coral sm:max-w-4xl">
          <div className="relative shrink-0 overflow-hidden border-b border-border px-6 pb-6 pt-7 sm:px-8 sm:pb-7 sm:pt-8">
            <div className="reservation-modal-header-glow pointer-events-none absolute inset-0" aria-hidden="true" />
            <DialogHeader className="relative space-y-3 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
                  Reservation #{selectedReservation?.id}
                </p>
                {selectedVendorDecision
                  ? statusPill(selectedVendorDecision.label, selectedVendorDecision.className)
                  : null}
                {selectedReceiptStatus
                  ? statusPill(selectedReceiptStatus.label, selectedReceiptStatus.className)
                  : null}
              </div>
              <DialogTitle className="font-display text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
                {selectedCostumeName}
              </DialogTitle>
              <DialogDescription className="max-w-[58ch] text-sm leading-relaxed text-muted-foreground">
                Review the booking, delivery plan, surcharge history, and status — then take the next action.
              </DialogDescription>
            </DialogHeader>
          </div>

          {selectedReservation && (
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Renter</p>
                  <p className="mt-3 font-display text-xl font-semibold text-foreground">
                    {selectedReservation.User?.name || `User #${selectedReservation.user_id}`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedReservation.User?.email || "No email available"}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Rental window</p>
                  <p className="mt-3 font-display text-xl font-semibold text-foreground">
                    {formatDate(selectedReservation.start_date, "MMM d")} – {formatDate(selectedReservation.end_date)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(selectedReservation.start_date)} to {formatDate(selectedReservation.end_date)}
                  </p>
                </div>

                <div className="reservation-modal-finance rounded-xl p-5 md:col-span-2">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                        Quoted total
                      </p>
                      <p className="mt-3 font-display text-4xl font-semibold leading-none tracking-tight text-foreground md:text-5xl">
                        {formatMoney(Number(selectedReservation.total_price) + selectedPaidSurcharge)}
                      </p>
                      <p className="mt-3 text-sm text-muted-foreground">
                        Base {formatMoney(selectedReservation.total_price)}
                        {selectedPaidSurcharge > 0
                          ? ` · Paid surcharge ${formatMoney(selectedPaidSurcharge)}`
                          : " · No surcharge paid"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedVendorDecision
                        ? statusPill(selectedVendorDecision.label, selectedVendorDecision.className)
                        : null}
                      {selectedReceiptStatus
                        ? statusPill(selectedReceiptStatus.label, selectedReceiptStatus.className)
                        : null}
                    </div>
                  </div>
                </div>
              </div>

              <section className="rounded-xl border border-border bg-card p-5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Costume details</p>
                <div className="mt-4 space-y-3">
                  {selectedReservation.items?.map((item) => {
                    const pricingSummary = getReservationItemPricingSummary(item);
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-2 rounded-xl border border-border bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-display text-lg font-semibold text-foreground">
                            {item.Costume?.name || `Costume #${item.costume_id}`}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatMoney(pricingSummary.amount)} {pricingSummary.label}
                          </p>
                        </div>
                        <p className="font-display text-xl font-semibold text-primary">
                          {formatMoney(item.subtotal)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {selectedReservation.fulfillment ? (
                <section className="rounded-xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Delivery plan</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Exact methods, locations, and windows the renter submitted.
                      </p>
                    </div>
                    {selectedReservation.fulfillment.outside_service_area
                      ? statusPill("Outside Service Area", "border-orange-400/40 text-orange-700 dark:text-orange-400")
                      : null}
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-border bg-muted/20 px-4 py-4">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Outbound</p>
                      <p className="mt-2 font-display text-lg font-semibold text-foreground">
                        {FULFILLMENT_METHOD_LABELS[selectedReservation.fulfillment.outbound_method]}
                      </p>
                      <p className="mt-1 text-xs leading-6 text-muted-foreground">
                        {selectedReservation.fulfillment.outbound_method === "PICKUP"
                          ? formatWindowLabel(
                              selectedReservation.fulfillment.pickup_window_start,
                              selectedReservation.fulfillment.pickup_window_end
                            )
                          : formatWindowLabel(
                              selectedReservation.fulfillment.delivery_window_start,
                              selectedReservation.fulfillment.delivery_window_end
                            )}
                      </p>
                      <p className="mt-2 text-xs leading-6 text-muted-foreground">
                        {selectedReservation.fulfillment.outbound_method === "PICKUP"
                          ? "Atelier location"
                          : formatLocationSummary(selectedReservation.fulfillment.outbound_location_snapshot)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/20 px-4 py-4">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Return</p>
                      <p className="mt-2 font-display text-lg font-semibold text-foreground">
                        {FULFILLMENT_METHOD_LABELS[selectedReservation.fulfillment.return_method]}
                      </p>
                      <p className="mt-1 text-xs leading-6 text-muted-foreground">
                        {formatWindowLabel(
                          selectedReservation.fulfillment.return_window_start,
                          selectedReservation.fulfillment.return_window_end
                        )}
                      </p>
                      <p className="mt-2 text-xs leading-6 text-muted-foreground">
                        {selectedReservation.fulfillment.return_method === "PICKUP"
                          ? "Atelier location"
                          : formatLocationSummary(selectedReservation.fulfillment.return_location_snapshot)}
                      </p>
                    </div>
                  </div>

                  {selectedReservation.fulfillment.vendor_approval_note ? (
                    <div className="mt-4 rounded-xl border border-border bg-muted/20 px-4 py-4">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Vendor note</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {selectedReservation.fulfillment.vendor_approval_note}
                      </p>
                    </div>
                  ) : null}
                </section>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.95fr)]">
                <section className="rounded-xl border border-border bg-card p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Payments & Adjustments</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Keep initial reservation payments separate from any supplemental surcharge collection.
                  </p>

                  <div className="mt-4 space-y-3">
                    {selectedReservation.payments?.map((payment) => {
                      const paymentStatus = getPaymentStatusMeta(payment.status);

                      return (
                        <div key={payment.id} className="rounded-xl border border-border bg-muted/20 px-4 py-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-display text-lg font-semibold text-foreground">Payment #{payment.id}</p>
                                {statusPill(paymentStatus.label, paymentStatus.className)}
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                  {PAYMENT_PURPOSE_LABELS[payment.payment_purpose]}
                                </span>
                              </div>
                              <p className="font-display text-xl font-semibold text-primary">
                                {formatMoney(payment.amount)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Submitted {formatDate(payment.created_at)}
                              </p>
                              {payment.reservationAdjustment?.note ? (
                                <p className="text-xs leading-6 text-muted-foreground">
                                  Linked note: {payment.reservationAdjustment.note}
                                </p>
                              ) : null}
                              {payment.notes ? (
                                <p className="text-xs italic text-muted-foreground">{payment.notes}</p>
                              ) : null}
                            </div>

                            {payment.proof_url ? (
                              <a
                                href={resolveApiAsset(payment.proof_url)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-primary transition-colors hover:text-primary/80"
                              >
                                Open Receipt
                                <ExternalLinkIcon className="size-3" />
                              </a>
                            ) : (
                              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                No receipt file
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {selectedReservation.adjustments?.map((adjustment) => {
                      const adjustmentStatus = getAdjustmentStatusMeta(adjustment);
                      return (
                        <div key={adjustment.id} className="rounded-xl border border-border bg-muted/20 px-4 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-display text-lg font-semibold text-foreground">Outside-area surcharge</p>
                            {statusPill(adjustmentStatus.label, adjustmentStatus.className)}
                          </div>
                          <p className="mt-2 font-display text-2xl font-semibold text-primary">{formatMoney(adjustment.amount)}</p>
                          {adjustment.note ? (
                            <p className="mt-1 text-xs leading-6 text-muted-foreground">{adjustment.note}</p>
                          ) : null}
                        </div>
                      );
                    })}

                    {!selectedReservation.payments?.length && !selectedReservation.adjustments?.length ? (
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">No financial activity yet</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Payment and surcharge history will appear here as the reservation progresses.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </section>

                <section className="rounded-xl border border-border bg-card p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Receipt Preview</p>
                  <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted/20">
                    {selectedPayment?.proof_url ? (
                      <img
                        src={resolveApiAsset(selectedPayment.proof_url)}
                        alt={`Payment receipt for reservation ${selectedReservation.id}`}
                        className="max-h-[24rem] w-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-6 py-10 text-center text-muted-foreground">
                        <ImageIcon className="size-8 opacity-40" />
                        <div className="space-y-1">
                          <p className="text-[10px] font-semibold uppercase tracking-widest">No receipt to preview</p>
                          <p className="text-sm">Once a renter uploads proof of payment, you can review it here.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {FULFILLMENT_OPERATION_STATUSES.includes(selectedReservation.status) ? (
                <section className="rounded-xl border border-border bg-card p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Operational Timeline</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-4">
                    {OPERATION_TIMELINE.map((step) => {
                      const meta = reservationStatusMeta(selectedReservation, step);
                      const state = timelineStepState(selectedReservation.status, step);
                      return (
                        <div
                          key={step}
                          className={cn(
                            "rounded-xl border px-3 py-4 text-xs",
                            state === "current" && "border-primary/40 bg-primary text-primary-foreground shadow-coral",
                            state === "complete" && "border-emerald-400/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10 dark:text-emerald-400",
                            state === "upcoming" && "border-border bg-muted/20 text-muted-foreground"
                          )}
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-widest">{meta.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              <div className="reservation-modal-actions -mx-6 -mb-6 rounded-b-2xl px-6 py-6 sm:-mx-8 sm:px-8 sm:py-7">
                {canVerifySelectedPayment && selectedPayment ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">Next action</p>
                      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                        Confirm that this receipt matches payment received through your payment method before reviewing the booking.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handlePaymentReview(selectedPayment.id, "REJECTED")}
                        disabled={actioningId === selectedPayment.id}
                        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-background px-5 text-[10px] font-semibold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
                      >
                        <Cross2Icon className="size-3.5" />
                        Reject Receipt
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePaymentReview(selectedPayment.id, "APPROVED")}
                        disabled={actioningId === selectedPayment.id}
                        className="hover-snap inline-flex h-11 items-center justify-center gap-1.5 rounded-md bg-primary px-5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90 disabled:opacity-40"
                      >
                        <CheckIcon className="size-3.5" />
                        Verify Payment
                      </button>
                    </div>
                  </div>
                ) : canReviewSelectedReservation ? (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">Next action</p>
                      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                        Review the submitted fulfillment details exactly as selected. Approve or reject the booking, or request a supplemental surcharge if the delivery address falls outside your practical service area.
                      </p>
                    </div>

                    {selectedOutsideServiceArea && !selectedPendingAdjustment ? (
                      <div className="rounded-xl border border-orange-400/30 bg-orange-50/60 px-4 py-3 text-sm text-orange-900 dark:bg-orange-900/10 dark:text-orange-200">
                        This delivery location is outside your configured service areas. Consider requesting a surcharge before approving.
                      </div>
                    ) : null}

                    <div className="grid gap-4 rounded-xl border border-border bg-background/80 p-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
                      <div className="space-y-3">
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Outside-area surcharge
                        </label>
                        <input
                          value={surchargeAmount}
                          onChange={(event) => setSurchargeAmount(event.target.value)}
                          placeholder="0.00"
                          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
                        />
                        <textarea
                          value={surchargeNote}
                          onChange={(event) => setSurchargeNote(event.target.value)}
                          rows={4}
                          placeholder="Explain why this address needs an outside-area surcharge."
                          className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                        />
                      </div>

                      <div className="flex flex-col justify-between gap-4">
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>
                            Use surcharge requests only after you&apos;ve reviewed the exact delivery location. The renter&apos;s original reservation amount stays unchanged, and any supplemental payment will be tracked separately.
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={() => handleReject(selectedReservation.id)}
                            disabled={actioningId === selectedReservation.id}
                            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-background px-5 text-[10px] font-semibold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
                          >
                            <Cross2Icon className="size-3.5" />
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestSurcharge(selectedReservation.id)}
                            disabled={actioningId === selectedReservation.id}
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-orange-400/40 bg-background px-5 text-[10px] font-semibold uppercase tracking-widest text-orange-700 transition-colors hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20 disabled:opacity-40"
                          >
                            Request Surcharge
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprove(selectedReservation.id)}
                            disabled={actioningId === selectedReservation.id}
                            className="hover-snap inline-flex h-11 items-center justify-center gap-1.5 rounded-md bg-primary px-5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90 disabled:opacity-40"
                          >
                            <CheckIcon className="size-3.5" />
                            Approve As Submitted
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : selectedReservation.status === "AWAITING_SURCHARGE_PAYMENT" && selectedPendingAdjustment ? (
                  <div className="space-y-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">Next action</p>
                    <div className="rounded-xl border border-orange-400/30 bg-orange-50/60 px-4 py-4 text-sm text-orange-900 dark:bg-orange-900/10 dark:text-orange-200">
                      Waiting for the renter to settle the supplemental request of {formatMoney(selectedPendingAdjustment.amount)} before this reservation can move into fulfillment.
                    </div>
                    <button
                      type="button"
                      onClick={() => handleWaiveSurcharge(selectedReservation.id, selectedPendingAdjustment.id)}
                      disabled={actioningId === selectedReservation.id}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-[10px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                    >
                      Waive Surcharge
                    </button>
                  </div>
                ) : selectedReservation.status === "CONFIRMED" ? (
                  <div className="space-y-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">Next action</p>
                    {selectedReservation.fulfillment?.delivery_provider === "LALAMOVE" ? (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="max-w-2xl text-sm text-muted-foreground">
                            This reservation uses Lalamove courier delivery. Get a fresh quote before confirming dispatch.
                          </p>
                          <span className="inline-flex items-center rounded-xl border border-orange-400/40 bg-orange-50/60 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-orange-800 dark:bg-orange-950/20 dark:text-orange-300">
                            Lalamove
                          </span>
                        </div>

                        {lalamoveQuote ? (
                          <div className="rounded-xl border border-primary/20 bg-background p-5 shadow-coral">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Live quote</p>
                            <p className="mt-2 font-display text-3xl font-semibold text-foreground">
                              {lalamoveQuote.price_currency} {Number(lalamoveQuote.price_amount).toLocaleString()}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Vehicle: {lalamoveQuote.service_type} · Quote valid for a few minutes
                            </p>
                          </div>
                        ) : lalamoveQuoteError ? (
                          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                            {lalamoveQuoteError}
                          </div>
                        ) : null}

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void handleFetchLalamoveQuote(selectedReservation.id)}
                            disabled={lalamoveQuoteLoading}
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-[10px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                          >
                            {lalamoveQuoteLoading ? "Fetching quote…" : lalamoveQuote ? "Refresh quote" : "Get Lalamove quote"}
                          </button>

                          {lalamoveQuote ? (
                            <button
                              type="button"
                              onClick={() => void handleDispatch(selectedReservation.id)}
                              disabled={actioningId === selectedReservation.id}
                              className="hover-snap inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90 disabled:opacity-40"
                            >
                              {actioningId === selectedReservation.id ? "Booking…" : "Confirm & book Lalamove"}
                            </button>
                          ) : null}
                        </div>

                        <details className="group">
                          <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground">
                            Manual dispatch instead
                          </summary>
                          <div className="mt-3 space-y-3 rounded-xl border border-border bg-background p-4">
                            <p className="text-xs text-muted-foreground">
                              Attach a photo and dispatch without Lalamove. Use this as a fallback.
                            </p>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(event) => setDispatchProof(event.target.files?.[0] || null)}
                              className="block w-full text-xs text-muted-foreground file:mr-4 file:rounded-xl file:border file:border-border file:bg-background file:px-3 file:py-2 file:text-[10px] file:font-semibold file:uppercase file:tracking-widest"
                            />
                            <button
                              type="button"
                              onClick={() => void handleDispatch(selectedReservation.id)}
                              disabled={actioningId === selectedReservation.id}
                              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-[10px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                            >
                              Manual dispatch
                            </button>
                          </div>
                        </details>
                      </div>
                    ) : (
                      <>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                          Dispatch the costume when it is ready for delivery. A photo is optional but recommended.
                        </p>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(event) => setDispatchProof(event.target.files?.[0] || null)}
                          className="block w-full text-xs text-muted-foreground file:mr-4 file:rounded-xl file:border file:border-border file:bg-background file:px-3 file:py-2 file:text-[10px] file:font-semibold file:uppercase file:tracking-widest"
                        />
                        <button
                          type="button"
                          onClick={() => void handleDispatch(selectedReservation.id)}
                          disabled={actioningId === selectedReservation.id}
                          className="hover-snap inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90 disabled:opacity-40"
                        >
                          Dispatch Costume
                        </button>
                      </>
                    )}

                    {selectedDeliveryOrders.length > 0 ? (
                      <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Active delivery orders</p>
                        {selectedDeliveryOrders.map((order) => (
                          <div key={order.id} className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                {order.leg} leg
                              </span>
                              {order.status ? (
                                <span className="rounded-xl border border-border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                                  {order.status}
                                </span>
                              ) : null}
                            </div>
                            {order.driver_name ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Driver: {order.driver_name}
                                {order.driver_phone ? ` · ${order.driver_phone}` : ""}
                              </p>
                            ) : null}
                            {order.share_link ? (
                              <a
                                href={order.share_link}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-primary transition-colors hover:text-primary/80"
                              >
                                Track on Lalamove
                                <ExternalLinkIcon className="size-3" />
                              </a>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : selectedReservation.status === "DELIVERY_SCHEDULED" || selectedReservation.status === "WITH_RENTER" ? (
                  <div className="space-y-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">Status</p>
                    <div className="rounded-xl border border-border bg-background px-4 py-4 text-sm text-muted-foreground">
                      Waiting for the renter to {selectedReservation.status === "DELIVERY_SCHEDULED" ? "confirm receipt with a photo" : "initiate the return with a photo"}.
                      {selectedReservation.fulfillment?.renter_received_proof_url ? (
                        <a
                          href={resolveApiAsset(selectedReservation.fulfillment.renter_received_proof_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-primary"
                        >
                          View renter receipt proof
                          <ExternalLinkIcon className="size-3" />
                        </a>
                      ) : null}
                      {selectedReservation.fulfillment?.return_initiated_proof_url ? (
                        <a
                          href={resolveApiAsset(selectedReservation.fulfillment.return_initiated_proof_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-primary"
                        >
                          View renter return proof
                          <ExternalLinkIcon className="size-3" />
                        </a>
                      ) : null}
                    </div>

                    {selectedDeliveryOrders.length > 0 ? (
                      <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Lalamove delivery orders</p>
                        {selectedDeliveryOrders.map((order) => (
                          <div key={order.id} className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                {order.leg} leg
                              </span>
                              {order.status ? (
                                <span className="rounded-xl border border-border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                                  {order.status}
                                </span>
                              ) : null}
                            </div>
                            {order.driver_name ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Driver: {order.driver_name}
                                {order.driver_phone ? ` · ${order.driver_phone}` : ""}
                              </p>
                            ) : null}
                            {order.share_link ? (
                              <a
                                href={order.share_link}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-primary transition-colors hover:text-primary/80"
                              >
                                Track on Lalamove
                                <ExternalLinkIcon className="size-3" />
                              </a>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : selectedReservation.status === "RETURN_PENDING" ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">Next action</p>
                      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                        Confirm the costume has been returned. You can attach an optional photo for your records.
                      </p>
                    </div>
                    {selectedReservation.fulfillment?.return_initiated_proof_url ? (
                      <a
                        href={resolveApiAsset(selectedReservation.fulfillment.return_initiated_proof_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-primary"
                      >
                        View renter return proof
                        <ExternalLinkIcon className="size-3" />
                      </a>
                    ) : null}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(event) => setReturnProof(event.target.files?.[0] || null)}
                      className="block w-full text-xs text-muted-foreground file:mr-4 file:rounded-xl file:border file:border-border file:bg-background file:px-3 file:py-2 file:text-[10px] file:font-semibold file:uppercase file:tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => handleConfirmReturn(selectedReservation.id)}
                      disabled={actioningId === selectedReservation.id}
                      className="hover-snap inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90 disabled:opacity-40"
                    >
                      Confirm Return Received
                    </button>
                  </div>
                ) : selectedReservation.status === "RETURNED" ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">Next action</p>
                      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                        Close out the rental once inspection is complete.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleComplete(selectedReservation.id)}
                      disabled={actioningId === selectedReservation.id}
                      className="hover-snap inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground shadow-coral transition-colors hover:bg-primary/90 disabled:opacity-40"
                    >
                      Complete Rental
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">Status</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      This reservation is in a terminal or waiting state. Reopen the modal anytime to check the fulfillment record, surcharge history, or payment evidence.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
