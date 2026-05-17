"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveApiAsset } from "@/lib/assets";
import { useAuth } from "@/lib/auth";
import {
  approveReservation,
  listVendorReservations,
  rejectReservation,
  type Reservation,
  type ReservationPayment,
} from "@/lib/vendor";
import { cn } from "@/lib/utils";

const VENDOR_STATUS_META: Record<
  Reservation["vendor_status"],
  { label: string; className: string }
> = {
  PENDING_VENDOR: {
    label: "Needs review",
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

const RESERVATION_STATUS_META: Record<
  Reservation["status"],
  { label: string; className: string }
> = {
  CART: {
    label: "In cart",
    className: "border-border text-muted-foreground",
  },
  PENDING_PAYMENT: {
    label: "Awaiting payment",
    className: "border-border text-muted-foreground",
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
    label: "Receipt uploaded",
    className: "border-amber-400/40 text-amber-700 dark:text-amber-400",
  },
  APPROVED: {
    label: "Payment approved",
    className: "border-emerald-400/40 text-emerald-700 dark:text-emerald-400",
  },
  REJECTED: {
    label: "Receipt rejected",
    className: "border-destructive/30 text-destructive",
  },
};

function formatDate(date?: string, pattern = "MMM d, yyyy") {
  if (!date) return "-";
  return format(new Date(date), pattern);
}

function getFeaturedPayment(reservation: Reservation) {
  return (
    reservation.payments?.find((payment) => payment.proof_url) ??
    reservation.payments?.[0] ??
    null
  );
}

function getVendorDecisionMeta(reservation: Reservation) {
  const paymentWithProof = getFeaturedPayment(reservation);
  if (reservation.vendor_status === "REJECTED_BY_VENDOR") {
    return VENDOR_STATUS_META.REJECTED_BY_VENDOR;
  }
  if (reservation.vendor_status === "PENDING_VENDOR") {
    return paymentWithProof
      ? VENDOR_STATUS_META.PENDING_VENDOR
      : {
          label: "Waiting on customer",
          className: "border-border text-muted-foreground",
        };
  }
  return VENDOR_STATUS_META.CONFIRMED;
}

function canVendorReviewReservation(reservation: Reservation) {
  return getVendorDecisionMeta(reservation).label === "Needs review";
}

function getReceiptStatusMeta(reservation: Reservation) {
  const paymentWithProof = getFeaturedPayment(reservation);
  if (paymentWithProof) {
    return PAYMENT_STATUS_META[paymentWithProof.status];
  }
  if (reservation.status === "PENDING_PAYMENT") {
    return {
      label: "Awaiting receipt",
      className: "border-border text-muted-foreground",
    };
  }
  return RESERVATION_STATUS_META[reservation.status];
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function QueueStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold tracking-[-0.03em] text-foreground">{value}</p>
        <p className="max-w-[10rem] text-right text-xs leading-5 text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

function ReservationSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-border bg-background/70 px-3 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ReservationRow({
  reservation,
  onOpen,
}: {
  reservation: Reservation;
  onOpen: (reservation: Reservation) => void;
}) {
  const firstItem = reservation.items?.[0];
  const vendorStatus = getVendorDecisionMeta(reservation);
  const paymentStatus = getReceiptStatusMeta(reservation);
  const requiresAction = canVendorReviewReservation(reservation);
  const payment = getFeaturedPayment(reservation);

  return (
    <article
      className={cn(
        "surface-panel rounded-[var(--radius-xl)] p-4",
        requiresAction
          ? "border-[color:color-mix(in_oklab,var(--color-brand)_18%,var(--color-border))] bg-[color:color-mix(in_oklab,var(--color-brand)_3%,var(--color-card))]"
          : ""
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={vendorStatus.className}>
              {vendorStatus.label}
            </Badge>
            <Badge variant="outline" className={paymentStatus.className}>
              {paymentStatus.label}
            </Badge>
            {requiresAction ? (
              <Badge variant="outline" className="border-amber-400/40 text-amber-700 dark:text-amber-400">
                Action required
              </Badge>
            ) : null}
          </div>

          <h2 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-foreground md:text-xl">
            {firstItem?.Costume?.name || `Reservation #${reservation.id}`}
          </h2>

          <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="rounded-full border border-border bg-background px-3 py-1.5">
              Reservation #{reservation.id}
            </span>
            <span className="rounded-full border border-border bg-background px-3 py-1.5">
              {reservation.User?.name || `User #${reservation.user_id}`}
            </span>
            <span className="rounded-full border border-border bg-background px-3 py-1.5">
              {formatDate(reservation.start_date, "MMM d")} to{" "}
              {formatDate(reservation.end_date)}
            </span>
          </div>
        </div>

        <div className="w-full lg:w-auto">
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <ReservationSummary
              label="Total"
              value={`PHP ${Number(reservation.total_price).toLocaleString()}`}
            />
            <ReservationSummary
              label="Items"
              value={`${reservation.items?.length || 0}`}
            />
            <ReservationSummary
              label="Receipt"
              value={payment?.proof_url ? "Uploaded" : "Pending"}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          variant={requiresAction ? "brand" : "outline"}
          onClick={() => onOpen(reservation)}
        >
          <MagnifyingGlassIcon className="size-4" />
          {requiresAction ? "Review now" : "Open details"}
        </Button>
      </div>
    </article>
  );
}

function ReservationSection({
  title,
  description,
  reservations,
  onOpen,
}: {
  title: string;
  description: string;
  reservations: Reservation[];
  onOpen: (reservation: Reservation) => void;
}) {
  if (reservations.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-lg font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline">
          {reservations.length} reservation{reservations.length === 1 ? "" : "s"}
        </Badge>
      </div>

      <div className="space-y-3">
        {reservations.map((reservation) => (
          <ReservationRow key={reservation.id} reservation={reservation} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

export default function VendorReservationsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const fetchReservations = useCallback(
    async (showError = true) => {
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
    },
    [user]
  );

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
  const selectedVendorDecision = selectedReservation
    ? getVendorDecisionMeta(selectedReservation)
    : null;
  const selectedReceiptStatus = selectedReservation
    ? getReceiptStatusMeta(selectedReservation)
    : null;
  const canReviewSelectedReservation = selectedReservation
    ? canVendorReviewReservation(selectedReservation)
    : false;

  const metrics = useMemo(() => {
    return reservations.reduce(
      (accumulator, reservation) => {
        if (canVendorReviewReservation(reservation)) accumulator.needsReview += 1;
        if (reservation.status === "PENDING_PAYMENT") accumulator.awaitingPayment += 1;
        if (reservation.vendor_status === "CONFIRMED") accumulator.confirmed += 1;
        if (reservation.vendor_status === "REJECTED_BY_VENDOR") accumulator.declined += 1;
        return accumulator;
      },
      { needsReview: 0, awaitingPayment: 0, confirmed: 0, declined: 0 }
    );
  }, [reservations]);

  const reviewQueue = useMemo(
    () => reservations.filter((reservation) => canVendorReviewReservation(reservation)),
    [reservations]
  );
  const pendingQueue = useMemo(
    () =>
      reservations.filter(
        (reservation) =>
          !canVendorReviewReservation(reservation) &&
          reservation.vendor_status !== "CONFIRMED" &&
          reservation.vendor_status !== "REJECTED_BY_VENDOR"
      ),
    [reservations]
  );
  const handledQueue = useMemo(
    () =>
      reservations.filter(
        (reservation) =>
          reservation.vendor_status === "CONFIRMED" ||
          reservation.vendor_status === "REJECTED_BY_VENDOR"
      ),
    [reservations]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 rounded-[var(--radius-xl)]" />
        <Skeleton className="h-[560px] rounded-[var(--radius-xl)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface-shell rounded-[var(--radius-xl)] p-7 md:p-8">
        <div className="flex flex-col gap-5">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Reservations
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-4xl">
              Keep the queue obvious.
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
              Review paid bookings first, watch the waiting receipts second, and keep handled
              reservations easy to reopen without letting them dominate the page.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <QueueStat
              label="Needs review"
              value={metrics.needsReview}
              hint="Bookings ready for your decision."
            />
            <QueueStat
              label="Awaiting payment"
              value={metrics.awaitingPayment}
              hint="Still waiting on renter proof."
            />
            <QueueStat
              label="Confirmed"
              value={metrics.confirmed}
              hint="Already approved."
            />
            <QueueStat
              label="Declined"
              value={metrics.declined}
              hint="Closed by vendor decision."
            />
          </div>
        </div>
      </section>

      {reservations.length === 0 ? (
        <section className="surface-panel rounded-[var(--radius-xl)] p-10 text-center md:p-14">
          <div className="mx-auto flex max-w-lg flex-col items-center">
            <div className="rounded-full border border-border bg-background p-4 text-muted-foreground">
              <CalendarIcon className="size-8" />
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-foreground">
              No reservations yet.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              When renters start booking your listings, this queue will show who paid, who still
              needs follow-up, and which decisions are blocking progress.
            </p>
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          <ReservationSection
            title="Needs review"
            description="Payment proof is already in. These are the bookings that need a vendor decision now."
            reservations={reviewQueue}
            onOpen={setSelectedReservation}
          />

          <ReservationSection
            title="Waiting on customer"
            description="These reservations are still moving through the payment step."
            reservations={pendingQueue}
            onOpen={setSelectedReservation}
          />

          <ReservationSection
            title="Handled"
            description="Previously confirmed or declined reservations kept here for reference."
            reservations={handledQueue}
            onOpen={setSelectedReservation}
          />
        </section>
      )}

      <Dialog
        open={!!selectedReservation}
        onOpenChange={(open: boolean) => !open && setSelectedReservation(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader className="border-b border-border pb-5">
            <DialogTitle>
              {selectedReservation
                ? `Reservation #${selectedReservation.id}`
                : "Reservation detail"}
            </DialogTitle>
            <DialogDescription>
              Review the renter, the booked pieces, and the payment evidence before confirming or
              declining the booking.
            </DialogDescription>
          </DialogHeader>

          {selectedReservation ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="surface-panel rounded-[var(--radius-xl)] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Renter
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {selectedReservation.User?.name || `User #${selectedReservation.user_id}`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedReservation.User?.email || "No email available"}
                  </p>
                </div>

                <div className="surface-panel rounded-[var(--radius-xl)] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Rental window
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {formatDate(selectedReservation.start_date)} to{" "}
                    {formatDate(selectedReservation.end_date)}
                  </p>
                </div>

                <div className="surface-panel rounded-[var(--radius-xl)] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Vendor status
                  </p>
                  {selectedVendorDecision ? (
                    <Badge variant="outline" className={cn("mt-2", selectedVendorDecision.className)}>
                      {selectedVendorDecision.label}
                    </Badge>
                  ) : null}
                </div>

                <div className="surface-panel rounded-[var(--radius-xl)] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Receipt status
                  </p>
                  {selectedReceiptStatus ? (
                    <Badge variant="outline" className={cn("mt-2", selectedReceiptStatus.className)}>
                      {selectedReceiptStatus.label}
                    </Badge>
                  ) : null}
                </div>
              </div>

              <section className="surface-panel rounded-[var(--radius-xl)] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Booked items
                </p>
                <div className="mt-4 space-y-3">
                  {selectedReservation.items?.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[var(--radius-lg)] border border-border bg-background/70 px-4 py-3"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-foreground">
                            {item.Costume?.name || `Costume #${item.costume_id}`}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Quantity {item.quantity} · PHP{" "}
                            {Number(item.price_per_day).toLocaleString()} per day
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          PHP {Number(item.subtotal).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                <section className="surface-panel rounded-[var(--radius-xl)] p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Payment evidence
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Every payment attached to this reservation, including combined-cart proofs.
                  </p>

                  {selectedReservation.payments?.length ? (
                    <div className="mt-4 space-y-3">
                      {selectedReservation.payments.map((payment) => {
                        const paymentStatus = PAYMENT_STATUS_META[payment.status];

                        return (
                          <div
                            key={payment.id}
                            className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold text-foreground">
                                    Payment #{payment.id}
                                  </p>
                                  <Badge variant="outline" className={paymentStatus.className}>
                                    {paymentStatus.label}
                                  </Badge>
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">
                                  PHP {Number(payment.amount).toLocaleString()} submitted{" "}
                                  {formatDate(payment.created_at)}
                                </p>
                                {payment.reservation_ids.length > 1 ? (
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    Combined payment for reservations #
                                    {payment.reservation_ids.join(", #")}
                                  </p>
                                ) : null}
                                {payment.notes ? (
                                  <p className="mt-2 text-sm italic text-muted-foreground">
                                    {payment.notes}
                                  </p>
                                ) : null}
                              </div>

                              {payment.proof_url ? (
                                <a
                                  href={resolveApiAsset(payment.proof_url)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
                                >
                                  Open receipt
                                  <ExternalLinkIcon className="size-3" />
                                </a>
                              ) : (
                                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                  No receipt file
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Alert className="mt-4">
                      <CalendarIcon className="size-4" />
                      <AlertTitle>Waiting for receipt</AlertTitle>
                      <AlertDescription>
                        The renter has not uploaded proof of payment for this reservation yet.
                      </AlertDescription>
                    </Alert>
                  )}
                </section>

                <section className="surface-panel rounded-[var(--radius-xl)] p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Receipt preview
                  </p>
                  <div className="mt-4 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-background">
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
                          <p className="text-[10px] font-semibold uppercase tracking-[0.24em]">
                            No preview available
                          </p>
                          <p className="text-sm">
                            Once the renter uploads proof of payment, it will appear here.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="border-t border-border pt-6">
                {canReviewSelectedReservation ? (
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                      This booking is waiting on your decision. Review the payment proof and booking
                      details first, then confirm or decline from the same surface.
                    </p>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => void handleReject(selectedReservation.id)}
                        disabled={actioningId === selectedReservation.id}
                      >
                        <Cross2Icon className="size-4" />
                        Reject reservation
                      </Button>
                      <Button
                        type="button"
                        variant="brand"
                        onClick={() => void handleApprove(selectedReservation.id)}
                        disabled={actioningId === selectedReservation.id}
                      >
                        <CheckIcon className="size-4" />
                        Approve reservation
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This reservation has already been handled. Reopen the modal any time you need to
                    check the payment trail or booking details again.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
