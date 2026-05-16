"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  CheckIcon,
  Cross2Icon,
  ExternalLinkIcon,
  ImageIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resolveApiAsset } from "@/lib/assets";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  approveReservation,
  listVendorReservations,
  rejectReservation,
  type Reservation,
  type ReservationPayment,
} from "@/lib/vendor";

const VENDOR_STATUS_META: Record<
  Reservation["vendor_status"],
  { label: string; className: string }
> = {
  PENDING_VENDOR: {
    label: "Needs Review",
    className: "border-amber-400/40 text-amber-700 dark:text-amber-400",
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "border-emerald-400/40 text-emerald-700 dark:text-emerald-400",
  },
  REJECTED_BY_VENDOR: {
    label: "Declined",
    className: "border-destructive/30 text-destructive",
  },
};

const VENDOR_AWAITING_CUSTOMER_META = {
  label: "Waiting on Customer",
  className: "border-border text-muted-foreground",
} as const;

const RESERVATION_STATUS_META: Record<
  Reservation["status"],
  { label: string; className: string }
> = {
  CART: {
    label: "In Cart",
    className: "border-border text-muted-foreground",
  },
  PENDING_PAYMENT: {
    label: "Awaiting Payment",
    className: "border-amber-400/40 text-amber-700 dark:text-amber-400",
  },
  PAID: {
    label: "Paid",
    className: "border-emerald-400/40 text-emerald-700 dark:text-emerald-400",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-destructive/30 text-destructive",
  },
};

const PAYMENT_STATUS_META: Record<
  ReservationPayment["status"],
  { label: string; className: string }
> = {
  PENDING: {
    label: "Receipt Uploaded",
    className: "border-amber-400/40 text-amber-700 dark:text-amber-400",
  },
  APPROVED: {
    label: "Payment Approved",
    className: "border-emerald-400/40 text-emerald-700 dark:text-emerald-400",
  },
  REJECTED: {
    label: "Receipt Rejected",
    className: "border-destructive/30 text-destructive",
  },
};

function formatDate(date?: string, pattern = "MMM d, yyyy") {
  if (!date) return "-";
  return format(new Date(date), pattern);
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

function getVendorDecisionMeta(reservation: Reservation) {
  const paymentWithProof = getFeaturedPayment(reservation);
  if (reservation.vendor_status === "REJECTED_BY_VENDOR") {
    return VENDOR_STATUS_META.REJECTED_BY_VENDOR;
  }
  if (reservation.vendor_status === "PENDING_VENDOR") {
    return VENDOR_STATUS_META.PENDING_VENDOR;
  }
  if (reservation.status === "PENDING_PAYMENT" && paymentWithProof) {
    return VENDOR_STATUS_META.PENDING_VENDOR;
  }
  if (reservation.status === "PENDING_PAYMENT") {
    return VENDOR_AWAITING_CUSTOMER_META;
  }
  return VENDOR_STATUS_META.CONFIRMED;
}

function canVendorReviewReservation(reservation: Reservation) {
  return getVendorDecisionMeta(reservation).label === "Needs Review";
}

function getReceiptStatusMeta(reservation: Reservation) {
  const paymentWithProof = getFeaturedPayment(reservation);
  if (paymentWithProof) {
    return PAYMENT_STATUS_META[paymentWithProof.status];
  }
  if (reservation.status === "PENDING_PAYMENT") {
    return {
      label: "Awaiting Receipt",
      className: "border-border text-muted-foreground",
    };
  }
  return RESERVATION_STATUS_META[reservation.status];
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function VendorReservationsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const fetchReservations = useCallback(async (showError = true) => {
    if (!user) return;

    try {
      const response = await listVendorReservations();
      setReservations(response);
    } catch (error: unknown) {
      if (showError) {
        toast.error(getErrorMessage(error, "Failed to load reservations."));
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    void fetchReservations();
  }, [fetchReservations, user]);

  async function handleApprove(id: number) {
    if (!user) return;

    setActioningId(id);
    try {
      await approveReservation(id);
      toast.success("Reservation approved.");
      setSelectedReservation(null);
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
      setSelectedReservation(null);
      await fetchReservations(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to reject reservation."));
    } finally {
      setActioningId(null);
    }
  }

  const selectedPayment = selectedReservation ? getFeaturedPayment(selectedReservation) : null;
  const selectedVendorDecision = selectedReservation ? getVendorDecisionMeta(selectedReservation) : null;
  const selectedReceiptStatus = selectedReservation ? getReceiptStatusMeta(selectedReservation) : null;
  const canReviewSelectedReservation = selectedReservation ? canVendorReviewReservation(selectedReservation) : false;

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
            Review renter details, uploaded payment proof, and confirm or decline each booking from one place.
          </p>
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="flex flex-col items-center gap-8 rounded-sm border border-border bg-card px-12 py-24 text-center">
          <div className="text-muted-foreground/20">
            <CalendarIcon className="size-12" />
          </div>
          <div className="space-y-2">
            <p className="font-playfair text-3xl font-semibold text-foreground">
              No reservations yet.
            </p>
            <p className="text-muted-foreground">
              When users rent your costumes, they will appear here.
            </p>
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
                <th className="p-4 font-medium">Total</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reservations.map((reservation) => {
                const firstItem = reservation.items?.[0];
                const vendorStatus = getVendorDecisionMeta(reservation);
                const paymentStatus = getReceiptStatusMeta(reservation);

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
                      {formatDate(reservation.start_date, "MMM d")} -{" "}
                      {formatDate(reservation.end_date)}
                    </td>
                    <td className="p-4 font-semibold text-foreground">
                      PHP {Number(reservation.total_price).toLocaleString()}
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
                        {formatDate(reservation.start_date, "MMM d")} -{" "}
                        {formatDate(reservation.end_date)}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold text-foreground">
                      PHP {Number(reservation.total_price).toLocaleString()}
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

      <Dialog
        open={!!selectedReservation}
        onOpenChange={(open: boolean) => !open && setSelectedReservation(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-sm border border-border bg-background shadow-none sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-playfair text-2xl font-semibold text-foreground">
              Reservation #{selectedReservation?.id}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Review the booking details and any uploaded proof of payment before you take action.
            </DialogDescription>
          </DialogHeader>

          {selectedReservation && (
            <div className="mt-2 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-sm border border-border bg-muted/20 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Renter
                  </p>
                  <p className="mt-3 font-medium text-foreground">
                    {selectedReservation.User?.name || `User #${selectedReservation.user_id}`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedReservation.User?.email || "No email available"}
                  </p>
                </div>

                <div className="rounded-sm border border-border bg-muted/20 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Status
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedVendorDecision &&
                      statusPill(
                        selectedVendorDecision.label,
                        selectedVendorDecision.className
                      )}
                    {selectedReceiptStatus &&
                      statusPill(
                        selectedReceiptStatus.label,
                        selectedReceiptStatus.className
                      )}
                  </div>
                </div>

                <div className="rounded-sm border border-border bg-muted/20 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Rental Window
                  </p>
                  <p className="mt-3 text-sm text-foreground">
                    {formatDate(selectedReservation.start_date)} to{" "}
                    {formatDate(selectedReservation.end_date)}
                  </p>
                </div>

                <div className="rounded-sm border border-border bg-muted/20 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Total
                  </p>
                  <p className="mt-3 font-playfair text-2xl font-semibold text-foreground">
                    PHP {Number(selectedReservation.total_price).toLocaleString()}
                  </p>
                </div>
              </div>

              <section className="rounded-sm border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Costume Details
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Review the booked items and line totals tied to this reservation.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {selectedReservation.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-2 rounded-sm border border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {item.Costume?.name || `Costume #${item.costume_id}`}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Quantity {item.quantity} · PHP {Number(item.price_per_day).toLocaleString()} / day
                        </p>
                      </div>
                      <p className="font-semibold text-foreground">
                        PHP {Number(item.subtotal).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.95fr)]">
                <section className="rounded-sm border border-border bg-muted/20 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Payment Review
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Check the renter&apos;s uploaded proof and payment history for this reservation.
                  </p>

                  {selectedReservation.payments?.length ? (
                    <div className="mt-4 space-y-3">
                      {selectedReservation.payments.map((payment) => {
                        const paymentStatus = PAYMENT_STATUS_META[payment.status];

                        return (
                          <div
                            key={payment.id}
                            className="rounded-sm border border-border bg-background px-4 py-3"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-medium text-foreground">
                                    Payment #{payment.id}
                                  </p>
                                  {statusPill(paymentStatus.label, paymentStatus.className)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  PHP {Number(payment.amount).toLocaleString()} · Submitted{" "}
                                  {formatDate(payment.created_at)}
                                </p>
                                {payment.reservation_ids.length > 1 && (
                                  <p className="text-xs text-muted-foreground">
                                    Combined payment for reservations #
                                    {payment.reservation_ids.join(", #")}
                                  </p>
                                )}
                                {payment.notes && (
                                  <p className="text-xs italic text-muted-foreground">
                                    {payment.notes}
                                  </p>
                                )}
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
                    </div>
                  ) : (
                    <div className="mt-4 rounded-sm border border-dashed border-border bg-background px-4 py-8 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Waiting for payment proof
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        The renter has not uploaded a receipt for this reservation yet.
                      </p>
                    </div>
                  )}
                </section>

                <section className="rounded-sm border border-border bg-muted/20 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Receipt Preview
                  </p>
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
                          <p className="text-[10px] font-semibold uppercase tracking-widest">
                            No receipt to preview
                          </p>
                          <p className="text-sm">
                            Once the renter uploads proof of payment, you can review it here.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="border-t border-border pt-6">
                {canReviewSelectedReservation ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-xl text-sm text-muted-foreground">
                      This booking is waiting for your decision. Review the payment proof and booking details, then confirm or decline the reservation.
                    </p>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => handleReject(selectedReservation.id)}
                        disabled={actioningId === selectedReservation.id}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-sm border border-destructive/30 px-4 text-[10px] font-semibold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
                      >
                        <Cross2Icon className="size-3.5" />
                        Reject Reservation
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(selectedReservation.id)}
                        disabled={actioningId === selectedReservation.id}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-sm border border-emerald-400/40 px-4 text-[10px] font-semibold uppercase tracking-widest text-emerald-700 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 disabled:opacity-40"
                      >
                        <CheckIcon className="size-3.5" />
                        Approve Reservation
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This reservation has already been reviewed. You can reopen the modal anytime to check the payment and booking details again.
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
