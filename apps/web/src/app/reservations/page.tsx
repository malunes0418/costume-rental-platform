"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "../../lib/api";
import { resolveApiAsset } from "../../lib/assets";
import { useAuth } from "../../lib/auth";
import {
  myPayments,
  myReservations,
  type Payment,
  type ReservationWithItems,
} from "../../lib/account";
import { useCart } from "../../lib/CartContext";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarIcon as CalendarDays,
  IdCardIcon as CreditCard,
  UploadIcon as Upload,
  ExternalLinkIcon as ExternalLink,
  ImageIcon,
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

// ── helpers ──────────────────────────────────────────────────────────────────

function primaryImage(res: ReservationWithItems) {
  const item = res.items?.[0];
  const imgs = item?.Costume?.CostumeImages || [];
  return imgs.find((i) => i.is_primary)?.image_url || imgs[0]?.image_url || "";
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysBetween(start: string, end: string) {
  if (!start || !end) return 0;
  return Math.max(
    1,
    Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
    )
  );
}

// ── status display ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  CART:            "In Cart",
  PENDING_PAYMENT: "Pending Payment",
  PAID:            "Approved",
  CANCELLED:       "Cancelled",
};

const STATUS_CLASS: Record<string, string> = {
  CART:            "text-muted-foreground border-border",
  PENDING_PAYMENT: "text-amber-600 border-amber-400/40 dark:text-amber-400",
  PAID:            "text-emerald-700 border-emerald-400/40 dark:text-emerald-400",
  CANCELLED:       "text-destructive border-destructive/30",
};

function resolveReservationStatus(reservation: ReservationWithItems, payments: Payment[]) {
  const hasReceipt = payments.some((payment) => Boolean(payment.proof_url));

  if (reservation.status === "PENDING_PAYMENT" && reservation.vendor_status === "PENDING_VENDOR" && hasReceipt) {
    return {
      label: "Under Review",
      className: "text-amber-600 border-amber-400/40 dark:text-amber-400",
    };
  }

  return {
    label: STATUS_LABEL[reservation.status] || reservation.status,
    className: STATUS_CLASS[reservation.status] || "text-muted-foreground border-border",
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
      label: "APPROVED",
      className: "text-emerald-700 border-emerald-400/40 dark:text-emerald-400",
    };
  }

  if (reservation.status === "CANCELLED" || reservation.vendor_status === "REJECTED_BY_VENDOR") {
    return {
      label: "REJECTED",
      className: "text-destructive border-destructive/30",
    };
  }

  if (payment.status === "APPROVED") {
    return {
      label: "APPROVED",
      className: "text-emerald-700 border-emerald-400/40 dark:text-emerald-400",
    };
  }

  if (payment.status === "REJECTED") {
    return {
      label: "REJECTED",
      className: "text-destructive border-destructive/30",
    };
  }

  if (reservation.vendor_status === "PENDING_VENDOR" && payment.proof_url) {
    return {
      label: "UNDER REVIEW",
      className: "text-amber-700 border-amber-400/40 dark:text-amber-400",
    };
  }

  return {
    label: "PENDING",
    className: "text-muted-foreground border-border",
  };
}

function hasActivePaymentForReservation(payments: Payment[]) {
  return payments.some((payment) => payment.status !== "REJECTED");
}

// ── component ─────────────────────────────────────────────────────────────────

export default function ReservationsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { openCart, refreshKey } = useCart();
  const router = useRouter();
  const [reservations, setReservations] = useState<ReservationWithItems[]>([]);
  const [payments, setPayments]         = useState<Payment[]>([]);
  const [isLoading, setIsLoading]       = useState(true);

  // Build a map from reservationId → payments[] using the new reservation_ids array
  const paymentsByReservation = useMemo(() => {
    const m = new Map<number, Payment[]>();
    for (const p of payments) {
      const ids: number[] = p.reservation_ids || [];
      for (const rid of ids) {
        const arr = m.get(rid) || [];
        arr.push(p);
        m.set(rid, arr);
      }
    }
    return m;
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

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) { setReservations([]); setPayments([]); setIsLoading(false); return; }
    if (user.role === "ADMIN") {
      router.replace("/admin");
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    Promise.all([myReservations(), myPayments()])
      .then(([r, p]) => { if (!cancelled) { setReservations(r); setPayments(p); } })
      .catch((e: unknown) => {
        if (!cancelled) toast.error(e instanceof ApiError ? e.message : "Failed to load reservations");
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [user, isAuthLoading, router, refreshKey]);

  // ── unauthenticated state ──────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 pb-32 pt-24 text-center">
        <div className="mx-auto max-w-sm flex flex-col items-center gap-8">
          <div className="text-muted-foreground/20">
            <CalendarDays className="mx-auto size-16" />
          </div>
          <div className="space-y-3">
            <h1 className="font-playfair text-4xl font-semibold text-foreground">Your Reservations</h1>
            <p className="text-muted-foreground">Sign in to view and manage your costume reservations.</p>
          </div>
          <Link
            href="/login?next=/reservations"
            className="inline-flex h-12 items-center rounded-md bg-foreground px-8 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
          >
            Log in to continue
          </Link>
        </div>
      </div>
    );
  }

  if (user.role === "ADMIN") {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 pb-32 pt-24 text-center">
        <div className="mx-auto max-w-sm flex flex-col items-center gap-8">
          <div className="text-muted-foreground/20">
            <CalendarDays className="mx-auto size-16" />
          </div>
          <div className="space-y-3">
            <h1 className="font-playfair text-4xl font-semibold text-foreground">Unavailable</h1>
            <p className="text-muted-foreground">Administrators cannot make or view personal reservations.</p>
          </div>
          <Link
            href="/"
            className="inline-flex h-12 items-center rounded-md bg-foreground px-8 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // ── main render ────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-32 pt-16">

      {/* ── Page header ── */}
      <div className="mb-16 max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground animate-fade-up">
          Your account
        </p>
        <h1 className="mt-4 font-playfair text-5xl font-semibold tracking-tight text-foreground animate-fade-up-delay-1 md:text-6xl">
          Reservations
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground animate-fade-up-delay-2">
          Review your bookings, complete checkout, and upload payment proof.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">

        {/* ── Reservations list ── */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-0">
          {isLoading ? (
            <div className="flex flex-col divide-y divide-border border-t border-border">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-6 py-8">
                  <Skeleton className="size-24 shrink-0 rounded-sm" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : reservations.length ? (
            <div className="divide-y divide-border border-t border-b border-border">
              {reservations.map((r) => {
                const img   = primaryImage(r);
                const first = r.items?.[0];
                const title = first?.Costume?.name || `Reservation #${r.id}`;
                const pay   = paymentsByReservation.get(r.id) || [];
                const days  = daysBetween(r.start_date, r.end_date);
                const status = resolveReservationStatus(r, pay);
                const reserveAgainHref = buildReserveAgainHref(r);
                const canContinuePayment = r.status === "PENDING_PAYMENT" && !hasActivePaymentForReservation(pay);

                return (
                  <article key={r.id} className="flex flex-col gap-6 py-10 sm:flex-row sm:gap-8">

                    {/* Thumbnail */}
                    <div className="size-24 shrink-0 overflow-hidden rounded-sm border border-border bg-muted sm:size-28">
                      {img ? (
                        <img
                          src={resolveApiAsset(img)}
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

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-playfair text-xl font-semibold text-foreground truncate">
                            {title}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatDate(r.start_date)} → {formatDate(r.end_date)}
                            {days > 0 && ` · ${days} day${days !== 1 ? "s" : ""}`}
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            ₱{Number(r.total_price).toLocaleString()}
                          </p>
                        </div>

                        {/* Status pill */}
                        <span
                          className={cn(
                            "shrink-0 rounded-sm border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest",
                            status.className
                          )}
                        >
                          {status.label}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-3">
                        {r.status === "CART" && (
                          <button
                            type="button"
                            onClick={openCart}
                            className="inline-flex h-9 items-center gap-2 rounded-sm border border-foreground bg-foreground px-5 text-[10px] font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
                          >
                            <CreditCard className="size-3.5" />
                            Continue in Cart
                          </button>
                        )}
                        {canContinuePayment && (
                          <button
                            type="button"
                            onClick={openCart}
                            className="inline-flex h-9 items-center gap-2 rounded-sm border border-border px-5 text-[10px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
                          >
                            <Upload className="size-3.5" />
                            Continue Payment
                          </button>
                        )}
                        {first?.costume_id && (
                          <Link
                            href={`/costumes/${first.costume_id}`}
                            className="inline-flex h-9 items-center gap-2 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                          >
                            View costume
                          </Link>
                        )}
                        {r.status === "CANCELLED" && reserveAgainHref && (
                          <Link
                            href={reserveAgainHref}
                            className="inline-flex h-9 items-center gap-2 rounded-sm border border-border px-5 text-[10px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
                          >
                            Change dates & reserve again
                          </Link>
                        )}
                      </div>

                      {/* Payment history */}
                      {pay.length > 0 && (
                        <div className="border border-border rounded-sm p-4 space-y-2">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                            Payment history
                          </p>
                          {pay.map((p) => (
                            <div key={p.id} className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <span className={cn(
                                  "text-[10px] font-semibold uppercase tracking-widest border rounded-sm px-2 py-0.5",
                                  resolvePaymentHistoryStatus(p, r).className
                                )}>
                                  {resolvePaymentHistoryStatus(p, r).label}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  ₱{Number(p.amount).toLocaleString()}
                                </span>
                              </div>
                              <a
                                href={resolveApiAsset(p.proof_url)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                              >
                                View proof <ExternalLink className="size-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8 border border-border rounded-sm py-24 px-12 text-center">
              <div className="text-muted-foreground/20">
                <CalendarDays className="size-12" />
              </div>
              <div className="space-y-2">
                <p className="font-playfair text-3xl font-semibold text-foreground">
                  No reservations yet.
                </p>
                <p className="text-muted-foreground">
                  Start browsing and find a costume to book.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex h-12 items-center rounded-sm bg-foreground px-8 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
              >
                Browse costumes
              </Link>
            </div>
          )}
        </div>

        {/* ── Upload sidebar ── */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-24 flex flex-col gap-8 border border-border rounded-sm p-8">
            <div className="border-b border-border pb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Payment
              </p>
              <h2 className="mt-3 font-playfair text-2xl font-semibold text-foreground">
                Upload Proof
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Upload your payment receipt for any reservation in{" "}
                <span className="font-semibold text-foreground">Pending Payment</span> status.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              {pendingPaymentReservations.length > 0 ? (
                <>
                  <p className="text-sm text-foreground mb-2">
                    You have <strong>{pendingPaymentReservations.length}</strong> reservation{pendingPaymentReservations.length > 1 ? "s" : ""} awaiting payment. You can submit one proof of payment for your entire cart.
                  </p>
                  <button
                    type="button"
                    onClick={openCart}
                    className="mt-2 flex h-12 w-full items-center justify-center gap-2.5 rounded-sm bg-foreground text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
                  >
                    <Upload className="size-3.5" />
                    Complete Payment in Cart
                  </button>
                </>
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-border rounded-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">All set</p>
                  <p className="text-sm text-muted-foreground">You don&apos;t have any pending payments right now.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
