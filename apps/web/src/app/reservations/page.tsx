"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarIcon,
  ExternalLinkIcon,
  IdCardIcon,
  ImageIcon,
  UploadIcon,
} from "@radix-ui/react-icons";

import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCart } from "../../lib/CartContext";
import { ApiError } from "../../lib/api";
import { resolveApiAsset } from "../../lib/assets";
import { useAuth } from "../../lib/auth";
import {
  myPayments,
  myReservations,
  type Payment,
  type ReservationWithItems,
} from "../../lib/account";

function ReservationsGate({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="surface-shell mx-auto max-w-2xl rounded-[var(--radius-xl)] p-10 text-center md:p-12">
        <div className="mx-auto flex max-w-lg flex-col items-center">
          <div className="rounded-full border border-border bg-background p-4 text-muted-foreground">
            <CalendarIcon className="size-8" />
          </div>
          <h1 className="mt-6 font-display text-4xl text-foreground">{title}</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{description}</p>
          <Link href={href} className={cn(buttonVariants({ variant: "brand" }), "mt-8")}>
            {cta}
          </Link>
        </div>
      </div>
    </div>
  );
}

function primaryImage(reservation: ReservationWithItems) {
  const item = reservation.items?.[0];
  const images = item?.Costume?.CostumeImages || [];
  return images.find((image) => image.is_primary)?.image_url || images[0]?.image_url || "";
}

function formatDate(value: string) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysBetween(start: string, end: string) {
  if (!start || !end) return 0;
  return Math.max(
    1,
    Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24))
  );
}

const STATUS_LABEL: Record<string, string> = {
  CART: "In cart",
  PENDING_PAYMENT: "Pending payment",
  PAID: "Approved",
  CANCELLED: "Cancelled",
};

const STATUS_CLASS: Record<string, string> = {
  CART: "border-border text-muted-foreground",
  PENDING_PAYMENT: "border-amber-400/40 text-amber-700 dark:text-amber-400",
  PAID: "border-emerald-400/40 text-emerald-700 dark:text-emerald-400",
  CANCELLED: "border-destructive/30 text-destructive",
};

function resolveReservationStatus(reservation: ReservationWithItems, payments: Payment[]) {
  const hasReceipt = payments.some((payment) => Boolean(payment.proof_url));

  if (
    reservation.status === "PENDING_PAYMENT" &&
    reservation.vendor_status === "PENDING_VENDOR" &&
    hasReceipt
  ) {
    return {
      label: "Under review",
      className: "border-amber-400/40 text-amber-700 dark:text-amber-400",
    };
  }

  return {
    label: STATUS_LABEL[reservation.status] || reservation.status,
    className: STATUS_CLASS[reservation.status] || "border-border text-muted-foreground",
  };
}

function buildReserveAgainHref(reservation: ReservationWithItems) {
  const costumeId = reservation.items?.[0]?.costume_id;
  if (!costumeId) return null;

  const params = new URLSearchParams();
  params.set("startDate", reservation.start_date);
  params.set("endDate", reservation.end_date);
  params.set("quantity", String(reservation.items?.[0]?.quantity || 1));

  return `/costumes/${costumeId}?${params.toString()}`;
}

function resolvePaymentHistoryStatus(payment: Payment, reservation: ReservationWithItems) {
  if (reservation.status === "PAID") {
    return {
      label: "Approved",
      className: "border-emerald-400/40 text-emerald-700 dark:text-emerald-400",
    };
  }

  if (
    reservation.status === "CANCELLED" ||
    reservation.vendor_status === "REJECTED_BY_VENDOR"
  ) {
    return {
      label: "Rejected",
      className: "border-destructive/30 text-destructive",
    };
  }

  if (payment.status === "APPROVED") {
    return {
      label: "Approved",
      className: "border-emerald-400/40 text-emerald-700 dark:text-emerald-400",
    };
  }

  if (payment.status === "REJECTED") {
    return {
      label: "Rejected",
      className: "border-destructive/30 text-destructive",
    };
  }

  if (reservation.vendor_status === "PENDING_VENDOR" && payment.proof_url) {
    return {
      label: "Under review",
      className: "border-amber-400/40 text-amber-700 dark:text-amber-400",
    };
  }

  return {
    label: "Pending",
    className: "border-border text-muted-foreground",
  };
}

function hasActivePaymentForReservation(payments: Payment[]) {
  return payments.some((payment) => payment.status !== "REJECTED");
}

export default function ReservationsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { openCart, refreshKey } = useCart();
  const router = useRouter();
  const [reservations, setReservations] = useState<ReservationWithItems[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const paymentsByReservation = useMemo(() => {
    const map = new Map<number, Payment[]>();
    for (const payment of payments) {
      const ids: number[] = payment.reservation_ids || [];
      for (const reservationId of ids) {
        const list = map.get(reservationId) || [];
        list.push(payment);
        map.set(reservationId, list);
      }
    }
    return map;
  }, [payments]);

  const pendingPaymentReservations = useMemo(
    () =>
      reservations.filter((reservation) => {
        if (reservation.status !== "PENDING_PAYMENT") return false;
        const reservationPayments = paymentsByReservation.get(reservation.id) || [];
        return !hasActivePaymentForReservation(reservationPayments);
      }),
    [paymentsByReservation, reservations]
  );

  const approvedCount = useMemo(
    () => reservations.filter((reservation) => reservation.status === "PAID").length,
    [reservations]
  );
  const underReviewCount = useMemo(
    () =>
      reservations.filter((reservation) => {
        const reservationPayments = paymentsByReservation.get(reservation.id) || [];
        return resolveReservationStatus(reservation, reservationPayments).label === "Under review";
      }).length,
    [paymentsByReservation, reservations]
  );

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      setReservations([]);
      setPayments([]);
      setIsLoading(false);
      return;
    }
    if (user.role === "ADMIN") {
      router.replace("/admin");
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    Promise.all([myReservations(), myPayments()])
      .then(([reservationResponse, paymentResponse]) => {
        if (!cancelled) {
          setReservations(reservationResponse);
          setPayments(paymentResponse);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          toast.error(e instanceof ApiError ? e.message : "Failed to load reservations");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, isAuthLoading, router, refreshKey]);

  if (!user) {
    return (
      <ReservationsGate
        title="Keep every booking in one place."
        description="Log in to track reservation status, upload payment proof, and jump back into checkout when something needs attention."
        href="/login?next=/reservations"
        cta="Log in to continue"
      />
    );
  }

  if (user.role === "ADMIN") {
    return (
      <ReservationsGate
        title="Reservations are not available here."
        description="Administrator accounts use the operations workspace rather than a personal booking history."
        href="/"
        cta="Return home"
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] px-6 pb-24 pt-10">
      <section className="surface-shell rounded-[var(--radius-xl)] p-7 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="brand-eyebrow inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em]">
              <span className="inline-block size-1.5 rounded-full bg-gold" />
              Customer utility
            </div>
            <h1 className="mt-5 font-display text-4xl text-foreground md:text-5xl">
              Reservations
            </h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground md:text-base">
              Review bookings, continue checkout when payment is still due, and keep payment proof
              easy to find.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[var(--radius-lg)] border border-border bg-background/75 px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Total
              </p>
              <p className="mt-2 font-display text-3xl text-foreground">
                {isLoading ? "--" : reservations.length}
              </p>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-border bg-background/75 px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Awaiting payment
              </p>
              <p className="mt-2 font-display text-3xl text-foreground">
                {isLoading ? "--" : pendingPaymentReservations.length}
              </p>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-border bg-background/75 px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Approved
              </p>
              <p className="mt-2 font-display text-3xl text-foreground">
                {isLoading ? "--" : approvedCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="surface-panel flex flex-col gap-5 rounded-[var(--radius-xl)] p-5 md:flex-row md:items-start"
              >
                <Skeleton className="h-52 w-full rounded-[var(--radius-lg)] md:h-28 md:w-24" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-40" />
                </div>
              </div>
            ))
          ) : reservations.length ? (
            reservations.map((reservation) => {
              const image = primaryImage(reservation);
              const firstItem = reservation.items?.[0];
              const title = firstItem?.Costume?.name || `Reservation #${reservation.id}`;
              const reservationPayments = paymentsByReservation.get(reservation.id) || [];
              const days = daysBetween(reservation.start_date, reservation.end_date);
              const status = resolveReservationStatus(reservation, reservationPayments);
              const reserveAgainHref = buildReserveAgainHref(reservation);
              const canContinuePayment =
                reservation.status === "PENDING_PAYMENT" &&
                !hasActivePaymentForReservation(reservationPayments);

              return (
                <article
                  key={reservation.id}
                  className="surface-panel rounded-[var(--radius-xl)] p-5 md:p-6"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start">
                    <div className="h-52 w-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-muted md:h-28 md:w-24">
                      {image ? (
                        <img
                          src={resolveApiAsset(image)}
                          alt={title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
                          <ImageIcon className="size-8" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                            Reservation #{reservation.id}
                          </p>
                          <h2 className="mt-2 font-display text-3xl text-foreground md:text-[2rem]">
                            {title}
                          </h2>
                          <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span className="rounded-full border border-border bg-background px-3 py-1.5">
                              {formatDate(reservation.start_date)} to {formatDate(reservation.end_date)}
                            </span>
                            <span className="rounded-full border border-border bg-background px-3 py-1.5">
                              {days} day{days === 1 ? "" : "s"}
                            </span>
                            <span className="rounded-full border border-border bg-background px-3 py-1.5">
                              PHP {Number(reservation.total_price).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <span
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em]",
                            status.className
                          )}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        {reservation.status === "CART" ? (
                          <Button type="button" variant="brand" onClick={openCart}>
                            <IdCardIcon className="size-4" />
                            Continue in cart
                          </Button>
                        ) : null}
                        {canContinuePayment ? (
                          <Button type="button" variant="outline" onClick={openCart}>
                            <UploadIcon className="size-4" />
                            Continue payment
                          </Button>
                        ) : null}
                        {firstItem?.costume_id ? (
                          <Link
                            href={`/costumes/${firstItem.costume_id}`}
                            className={buttonVariants({ variant: "ghost" })}
                          >
                            View costume
                          </Link>
                        ) : null}
                        {reservation.status === "CANCELLED" && reserveAgainHref ? (
                          <Link
                            href={reserveAgainHref}
                            className={buttonVariants({ variant: "outline" })}
                          >
                            Change dates and reserve again
                          </Link>
                        ) : null}
                      </div>

                      {reservationPayments.length > 0 ? (
                        <div className="mt-5 rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                            Payment history
                          </p>
                          <div className="mt-4 space-y-3">
                            {reservationPayments.map((payment) => {
                              const paymentStatus = resolvePaymentHistoryStatus(payment, reservation);
                              return (
                                <div
                                  key={payment.id}
                                  className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div className="flex flex-wrap items-center gap-3">
                                    <span
                                      className={cn(
                                        "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]",
                                        paymentStatus.className
                                      )}
                                    >
                                      {paymentStatus.label}
                                    </span>
                                    <span className="text-sm text-foreground">
                                      PHP {Number(payment.amount).toLocaleString()}
                                    </span>
                                  </div>

                                  <a
                                    href={resolveApiAsset(payment.proof_url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
                                  >
                                    View proof
                                    <ExternalLinkIcon className="size-3" />
                                  </a>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="surface-panel rounded-[var(--radius-xl)] p-10 text-center md:p-14">
              <div className="mx-auto flex max-w-lg flex-col items-center">
                <div className="rounded-full border border-border bg-background p-4 text-muted-foreground">
                  <CalendarIcon className="size-8" />
                </div>
                <h2 className="mt-6 font-display text-4xl text-foreground">No reservations yet.</h2>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Browse the catalog, choose your dates, and your bookings will appear here with
                  payment progress and status updates.
                </p>
                <Link href="/" className={cn(buttonVariants({ variant: "brand" }), "mt-8")}>
                  Browse costumes
                </Link>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="surface-shell rounded-[var(--radius-xl)] p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Next steps
            </p>
            <h2 className="mt-3 font-display text-3xl text-foreground">Payment and follow-up</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Keep this panel in view when you need to complete checkout or verify whether a vendor
              has reviewed your payment proof.
            </p>

            <div className="mt-6 space-y-3">
              <div className="rounded-[var(--radius-lg)] border border-border bg-background/75 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Awaiting payment
                </p>
                <p className="mt-2 font-display text-3xl text-foreground">
                  {isLoading ? "--" : pendingPaymentReservations.length}
                </p>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-border bg-background/75 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Under review
                </p>
                <p className="mt-2 font-display text-3xl text-foreground">
                  {isLoading ? "--" : underReviewCount}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
              {pendingPaymentReservations.length > 0 ? (
                <>
                  <p className="text-sm text-foreground">
                    You have {pendingPaymentReservations.length} reservation
                    {pendingPaymentReservations.length === 1 ? "" : "s"} waiting for payment.
                  </p>
                  <Button type="button" variant="brand" className="mt-4 w-full" onClick={openCart}>
                    <UploadIcon className="size-4" />
                    Complete payment in cart
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground">All caught up.</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You do not have any unpaid reservations right now.
                  </p>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
