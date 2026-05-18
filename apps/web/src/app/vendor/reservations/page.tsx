"use client";

import { useCallback, useEffect, useState } from "react";
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
  advanceReservationLifecycle,
  approveReservation,
  listVendorReservations,
  rejectReservation,
  requestReservationSurcharge,
  type Reservation
} from "@/lib/vendor";

const NEXT_VENDOR_LIFECYCLE_STATUS: Partial<Record<ReservationStatus, ReservationStatus>> = {
  CONFIRMED: "OUTBOUND_SCHEDULED",
  OUTBOUND_SCHEDULED: "OUTBOUND_IN_PROGRESS",
  OUTBOUND_IN_PROGRESS: "WITH_RENTER",
  WITH_RENTER: "RETURN_SCHEDULED",
  RETURN_SCHEDULED: "RETURN_IN_PROGRESS",
  RETURN_IN_PROGRESS: "RETURNED",
  RETURNED: "COMPLETED"
};

const OPERATION_TIMELINE: ReservationStatus[] = [...FULFILLMENT_OPERATION_STATUSES];

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
        "inline-flex rounded-sm border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest",
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
  return {
    label: "Payment Settled",
    className: "border-emerald-400/40 text-emerald-700 dark:text-emerald-400"
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

function nextOperationalStatus(reservation: Reservation) {
  return NEXT_VENDOR_LIFECYCLE_STATUS[reservation.status] || null;
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
      return;
    }

    const pendingAdjustment = getPendingAdjustment(selectedReservation);
    setSurchargeAmount(pendingAdjustment ? String(pendingAdjustment.amount) : "");
    setSurchargeNote(pendingAdjustment?.note || "");
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

  async function handleAdvanceLifecycle(id: number, status: ReservationStatus) {
    if (!user) return;

    setActioningId(id);
    try {
      await advanceReservationLifecycle(id, status);
      toast.success(`Reservation moved to ${getReservationStatusMeta(status).label}.`);
      await fetchReservations(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to update fulfillment lifecycle."));
    } finally {
      setActioningId(null);
    }
  }

  const selectedPayment = selectedReservation ? getFeaturedPayment(selectedReservation) : null;
  const selectedVendorDecision = selectedReservation ? getVendorDecisionMeta(selectedReservation) : null;
  const selectedReceiptStatus = selectedReservation ? getReceiptStatusMeta(selectedReservation) : null;
  const canReviewSelectedReservation = selectedReservation ? canVendorReviewReservation(selectedReservation) : false;
  const selectedPendingAdjustment = selectedReservation ? getPendingAdjustment(selectedReservation) : null;
  const selectedNextStatus = selectedReservation ? nextOperationalStatus(selectedReservation) : null;
  const selectedPaidSurcharge = selectedReservation ? getPaidAdjustmentTotal(selectedReservation) : 0;

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 pb-32 pt-10">
        <div className="mb-10 space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-32 pt-10">
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="animate-fade-up text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Orders
          </p>
          <h1 className="animate-fade-up-delay-1 font-playfair text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Reservations
          </h1>
          <p className="animate-fade-up-delay-2 max-w-2xl text-sm text-muted-foreground">
            Review submitted fulfillment details exactly as the renter chose them, request any outside-area surcharge when necessary, and guide every approved booking through the handoff lifecycle.
          </p>
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="flex flex-col items-center gap-8 rounded-sm border border-border bg-card px-12 py-24 text-center">
          <div className="text-muted-foreground/20">
            <CalendarIcon className="size-12" />
          </div>
          <div className="space-y-2">
            <p className="font-playfair text-3xl font-semibold text-foreground">No reservations yet.</p>
            <p className="text-muted-foreground">When users rent your costumes, they will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-sm border border-border bg-card">
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="border-b border-border bg-muted/50 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
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

                return (
                  <tr key={reservation.id} className="transition-colors hover:bg-muted/30">
                    <td className="p-4">
                      <p className="font-playfair text-base font-semibold text-foreground">
                        {firstItem?.Costume?.name || `Reservation #${reservation.id}`}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        #{reservation.id} · {reservation.items?.length || 0} item
                        {(reservation.items?.length || 0) === 1 ? "" : "s"}
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
                    <td className="p-4 font-semibold text-foreground">
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
                        className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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

          <div className="divide-y divide-border md:hidden">
            {reservations.map((reservation) => {
              const firstItem = reservation.items?.[0];
              const vendorStatus = getVendorDecisionMeta(reservation);
              const paymentStatus = getReceiptStatusMeta(reservation);

              return (
                <div key={reservation.id} className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-playfair text-lg font-semibold text-foreground">
                        {firstItem?.Costume?.name || `Reservation #${reservation.id}`}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        #{reservation.id} · {reservation.User?.name || `User #${reservation.user_id}`}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(reservation.start_date, "MMM d")} - {formatDate(reservation.end_date)}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold text-foreground">
                      {formatMoney(reservation.total_price)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {statusPill(vendorStatus.label, vendorStatus.className)}
                    {statusPill(paymentStatus.label, paymentStatus.className)}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedReservation(reservation)}
                    className="flex h-9 w-full items-center justify-center gap-1.5 rounded-sm border border-border px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <MagnifyingGlassIcon className="size-3.5" />
                    Review Reservation
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={!!selectedReservation} onOpenChange={(open: boolean) => !open && setSelectedReservation(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-sm border border-border bg-background shadow-none sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-playfair text-2xl font-semibold text-foreground">
              Reservation #{selectedReservation?.id}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Review the booking, fulfillment selections, surcharge history, and operational state before you take action.
            </DialogDescription>
          </DialogHeader>

          {selectedReservation && (
            <div className="mt-2 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-sm border border-border bg-muted/20 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Renter</p>
                  <p className="mt-3 font-medium text-foreground">
                    {selectedReservation.User?.name || `User #${selectedReservation.user_id}`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedReservation.User?.email || "No email available"}
                  </p>
                </div>

                <div className="rounded-sm border border-border bg-muted/20 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Status</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedVendorDecision && statusPill(selectedVendorDecision.label, selectedVendorDecision.className)}
                    {selectedReceiptStatus && statusPill(selectedReceiptStatus.label, selectedReceiptStatus.className)}
                  </div>
                </div>

                <div className="rounded-sm border border-border bg-muted/20 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Rental Window</p>
                  <p className="mt-3 text-sm text-foreground">
                    {formatDate(selectedReservation.start_date)} to {formatDate(selectedReservation.end_date)}
                  </p>
                </div>

                <div className="rounded-sm border border-border bg-muted/20 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Financials</p>
                  <p className="mt-3 font-playfair text-2xl font-semibold text-foreground">
                    {formatMoney(Number(selectedReservation.total_price) + selectedPaidSurcharge)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Base quote {formatMoney(selectedReservation.total_price)}
                    {selectedPaidSurcharge > 0 ? ` · Paid surcharge ${formatMoney(selectedPaidSurcharge)}` : ""}
                  </p>
                </div>
              </div>

              <section className="rounded-sm border border-border bg-muted/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Costume Details</p>
                <div className="mt-4 space-y-3">
                  {selectedReservation.items?.map((item) => {
                    const pricingSummary = getReservationItemPricingSummary(item);
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-2 rounded-sm border border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-foreground">{item.Costume?.name || `Costume #${item.costume_id}`}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatMoney(pricingSummary.amount)} {pricingSummary.label}
                          </p>
                        </div>
                        <p className="font-semibold text-foreground">{formatMoney(item.subtotal)}</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {selectedReservation.fulfillment ? (
                <section className="rounded-sm border border-border bg-muted/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Fulfillment Plan</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Review the exact handoff methods, locations, and windows the renter submitted.
                      </p>
                    </div>
                    {selectedReservation.fulfillment.outside_service_area
                      ? statusPill("Outside Service Area", "border-orange-400/40 text-orange-700 dark:text-orange-400")
                      : null}
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-sm border border-border bg-background px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Outbound</p>
                      <p className="mt-2 font-medium text-foreground">
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
                          ? "Vendor collection point"
                          : formatLocationSummary(selectedReservation.fulfillment.outbound_location_snapshot)}
                      </p>
                    </div>

                    <div className="rounded-sm border border-border bg-background px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Return</p>
                      <p className="mt-2 font-medium text-foreground">
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
                          ? "Vendor collection point"
                          : formatLocationSummary(selectedReservation.fulfillment.return_location_snapshot)}
                      </p>
                    </div>
                  </div>

                  {selectedReservation.fulfillment.vendor_approval_note ? (
                    <div className="mt-4 rounded-sm border border-border bg-background px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Vendor Note</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {selectedReservation.fulfillment.vendor_approval_note}
                      </p>
                    </div>
                  ) : null}
                </section>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.95fr)]">
                <section className="rounded-sm border border-border bg-muted/20 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Payments & Adjustments</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Keep initial reservation payments separate from any supplemental surcharge collection.
                  </p>

                  <div className="mt-4 space-y-3">
                    {selectedReservation.payments?.map((payment) => {
                      const paymentStatus = getPaymentStatusMeta(payment.status);

                      return (
                        <div key={payment.id} className="rounded-sm border border-border bg-background px-4 py-3">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium text-foreground">Payment #{payment.id}</p>
                                {statusPill(paymentStatus.label, paymentStatus.className)}
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                  {PAYMENT_PURPOSE_LABELS[payment.payment_purpose]}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {formatMoney(payment.amount)} · Submitted {formatDate(payment.created_at)}
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
                                className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
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
                        <div key={adjustment.id} className="rounded-sm border border-border bg-background px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-foreground">Outside-area surcharge</p>
                            {statusPill(adjustmentStatus.label, adjustmentStatus.className)}
                          </div>
                          <p className="mt-2 text-sm text-foreground">{formatMoney(adjustment.amount)}</p>
                          {adjustment.note ? (
                            <p className="mt-1 text-xs leading-6 text-muted-foreground">{adjustment.note}</p>
                          ) : null}
                        </div>
                      );
                    })}

                    {!selectedReservation.payments?.length && !selectedReservation.adjustments?.length ? (
                      <div className="rounded-sm border border-dashed border-border bg-background px-4 py-8 text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">No financial activity yet</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Payment and surcharge history will appear here as the reservation progresses.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </section>

                <section className="rounded-sm border border-border bg-muted/20 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Receipt Preview</p>
                  <div className="mt-4 overflow-hidden rounded-sm border border-border bg-background">
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

              {selectedReservation.status === "CONFIRMED" ||
              selectedReservation.status === "OUTBOUND_SCHEDULED" ||
              selectedReservation.status === "OUTBOUND_IN_PROGRESS" ||
              selectedReservation.status === "WITH_RENTER" ||
              selectedReservation.status === "RETURN_SCHEDULED" ||
              selectedReservation.status === "RETURN_IN_PROGRESS" ||
              selectedReservation.status === "RETURNED" ||
              selectedReservation.status === "COMPLETED" ? (
                <section className="rounded-sm border border-border bg-muted/20 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Operational Timeline</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-4">
                    {OPERATION_TIMELINE.map((step) => {
                      const meta = getReservationStatusMeta(step);
                      const state = timelineStepState(selectedReservation.status, step);
                      return (
                        <div
                          key={step}
                          className={cn(
                            "rounded-sm border px-3 py-3 text-xs",
                            state === "current" && "border-foreground bg-background text-foreground",
                            state === "complete" && "border-emerald-400/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10 dark:text-emerald-400",
                            state === "upcoming" && "border-border bg-background text-muted-foreground"
                          )}
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-widest">{meta.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              <div className="border-t border-border pt-6">
                {canReviewSelectedReservation ? (
                  <div className="space-y-5">
                    <p className="max-w-2xl text-sm text-muted-foreground">
                      Approve or reject the renter&apos;s submitted fulfillment details exactly as selected. If the address falls outside your practical service area, request a supplemental surcharge instead of changing their chosen methods or windows.
                    </p>

                    <div className="grid gap-4 rounded-sm border border-border bg-muted/20 p-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
                      <div className="space-y-3">
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Outside-area surcharge
                        </label>
                        <input
                          value={surchargeAmount}
                          onChange={(event) => setSurchargeAmount(event.target.value)}
                          placeholder="0.00"
                          className="h-11 w-full rounded-sm border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-foreground"
                        />
                        <textarea
                          value={surchargeNote}
                          onChange={(event) => setSurchargeNote(event.target.value)}
                          rows={4}
                          placeholder="Explain why this address needs an outside-area surcharge."
                          className="w-full rounded-sm border border-border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-foreground"
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
                            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-sm border border-destructive/30 px-4 text-[10px] font-semibold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
                          >
                            <Cross2Icon className="size-3.5" />
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestSurcharge(selectedReservation.id)}
                            disabled={actioningId === selectedReservation.id}
                            className="inline-flex h-10 items-center justify-center rounded-sm border border-orange-400/40 px-4 text-[10px] font-semibold uppercase tracking-widest text-orange-700 transition-colors hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20 disabled:opacity-40"
                          >
                            Request Surcharge
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprove(selectedReservation.id)}
                            disabled={actioningId === selectedReservation.id}
                            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-sm border border-emerald-400/40 px-4 text-[10px] font-semibold uppercase tracking-widest text-emerald-700 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 disabled:opacity-40"
                          >
                            <CheckIcon className="size-3.5" />
                            Approve As Submitted
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : selectedReservation.status === "AWAITING_SURCHARGE_PAYMENT" && selectedPendingAdjustment ? (
                  <div className="rounded-sm border border-orange-400/30 bg-orange-50/60 px-4 py-4 text-sm text-orange-900 dark:bg-orange-900/10 dark:text-orange-200">
                    Waiting for the renter to settle the supplemental request of {formatMoney(selectedPendingAdjustment.amount)} before this reservation can move into fulfillment.
                  </div>
                ) : selectedNextStatus ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-2xl text-sm text-muted-foreground">
                      This reservation has cleared review and payment. Advance it carefully through the operational handoff lifecycle without skipping steps.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAdvanceLifecycle(selectedReservation.id, selectedNextStatus)}
                      disabled={actioningId === selectedReservation.id}
                      className="inline-flex h-10 items-center justify-center rounded-sm border border-foreground bg-foreground px-4 text-[10px] font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/90 disabled:opacity-40"
                    >
                      Mark {getReservationStatusMeta(selectedNextStatus).label}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This reservation is in a terminal or waiting state. Reopen the modal anytime to check the fulfillment record, surcharge history, or payment evidence.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
