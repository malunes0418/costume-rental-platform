"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarIcon as CalendarDays,
  ExternalLinkIcon as ExternalLink,
  IdCardIcon as CreditCard,
  ImageIcon,
  UploadIcon as Upload
} from "@radix-ui/react-icons";

import { SavedLocationFields } from "@/components/SavedLocationFields";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "../../lib/api";
import { resolveApiAsset } from "../../lib/assets";
import { useAuth } from "../../lib/auth";
import { useCart } from "../../lib/CartContext";
import {
  cancelReservation,
  confirmReservationReceived,
  createSavedLocation,
  deleteSavedLocation,
  initiateReservationReturn,
  listSavedLocations,
  myPayments,
  myReservations,
  uploadReservationAdjustmentPayment,
  updateSavedLocation,
  type Payment,
  type ReservationWithItems
} from "../../lib/account";
import {
  FULFILLMENT_METHOD_LABELS,
  formatLocationSummary,
  type ReservationAdjustment,
  type SavedLocation,
  type SavedLocationInput
} from "@/lib/fulfillment";
import { countRentalDaysInclusive } from "../../lib/pricing";
import {
  PAYMENT_PURPOSE_LABELS,
  getPaymentStatusMeta,
  getReservationStatusMeta,
  type ReservationStatus
} from "../../lib/reservationStatus";
import { cn } from "@/lib/utils";

const OPERATION_TIMELINE = [
  "CONFIRMED",
  "DELIVERY_SCHEDULED",
  "WITH_RENTER",
  "RETURN_PENDING",
  "RETURNED",
  "COMPLETED"
] as const;

type JourneyStep = ReservationStatus | "PAYMENT_REVIEW";

function primaryImage(reservation: ReservationWithItems) {
  const item = reservation.items?.[0];
  const images = item?.Costume?.CostumeImages || [];
  return images.find((image) => image.is_primary)?.image_url || images[0]?.image_url || "";
}

function formatDate(value: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function resolveReservationStatus(reservation: ReservationWithItems, payments: Payment[]) {
  const pendingReceipt = payments.some(
    (payment) => payment.status === "PENDING" && Boolean(payment.proof_url)
  );

  if (reservation.status === "PENDING_PAYMENT" && pendingReceipt) {
    return getPaymentStatusMeta("PENDING");
  }

  return getReservationStatusMeta(reservation.status);
}

function buildReserveAgainHref(reservation: ReservationWithItems) {
  const costumeId = reservation.items?.[0]?.costume_id;
  if (!costumeId) return null;

  const params = new URLSearchParams();
  params.set("startDate", reservation.start_date);
  params.set("endDate", reservation.end_date);

  return `/costumes/${costumeId}?${params.toString()}`;
}

function resolvePaymentHistoryStatus(payment: Payment, reservation: ReservationWithItems) {
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

function hasActivePaymentForReservation(payments: Payment[]) {
  return payments.some((payment) => payment.status !== "REJECTED");
}

function hasActivePaymentForAdjustment(adjustmentId: number, payments: Payment[]) {
  return payments.some(
    (payment) =>
      payment.reservation_adjustment_id === adjustmentId &&
      (payment.status === "PENDING" || payment.status === "APPROVED")
  );
}

function getPendingAdjustment(reservation: ReservationWithItems) {
  return reservation.adjustments?.find((adjustment) => adjustment.status === "PENDING") ?? null;
}

function getPaidAdjustmentTotal(reservation: ReservationWithItems) {
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

function currentJourneyStep(reservation: ReservationWithItems, payments: Payment[]): JourneyStep {
  if (reservation.status === "PENDING_PAYMENT" && hasPendingInitialPaymentProof(payments)) {
    return "PAYMENT_REVIEW";
  }

  return reservation.status;
}

function getJourneyStepMeta(step: JourneyStep, outboundMethod?: ReservationWithItems["fulfillment"]) {
  if (step === "PAYMENT_REVIEW") {
    return {
      label: "Payment Verification",
      className: "border-amber-400/40 text-amber-700 dark:text-amber-400"
    };
  }

  return getReservationStatusMeta(step, { outboundMethod: outboundMethod?.outbound_method });
}

function timelineForReservation(reservation: ReservationWithItems): JourneyStep[] {
  const includesSurcharge =
    reservation.status === "AWAITING_SURCHARGE_PAYMENT" || (reservation.adjustments?.length || 0) > 0;

  const preface: JourneyStep[] = includesSurcharge
    ? ["PENDING_PAYMENT", "PAYMENT_REVIEW", "PENDING_VENDOR_REVIEW", "AWAITING_SURCHARGE_PAYMENT"]
    : ["PENDING_PAYMENT", "PAYMENT_REVIEW", "PENDING_VENDOR_REVIEW"];

  return [...preface, ...OPERATION_TIMELINE];
}

function timelineStepState(currentStep: JourneyStep, timeline: JourneyStep[], step: JourneyStep) {
  const currentIndex = timeline.indexOf(currentStep);
  const stepIndex = timeline.indexOf(step);
  if (currentStep === step) return "current";
  if (currentIndex >= 0 && stepIndex >= 0 && stepIndex < currentIndex) return "complete";
  return "upcoming";
}

function emptyLocationDraft(): SavedLocationInput {
  return {
    label: "",
    contact_name: "",
    phone_number: "",
    address_line_1: "",
    address_line_2: "",
    barangay: "",
    city: "",
    province: "",
    postal_code: "",
    country: "Philippines",
    area: "",
    notes: "",
    is_default: false
  };
}

function reservationFulfillmentSummary(reservation: ReservationWithItems) {
  const fulfillment = reservation.fulfillment;
  if (!fulfillment) return null;

  return `${FULFILLMENT_METHOD_LABELS[fulfillment.outbound_method]} outbound / ${FULFILLMENT_METHOD_LABELS[fulfillment.return_method]} return`;
}

export default function ReservationsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { openCart, refreshKey } = useCart();
  const router = useRouter();

  const [reservations, setReservations] = useState<ReservationWithItems[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationDraft, setLocationDraft] = useState<SavedLocationInput>(() => emptyLocationDraft());
  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [deletingLocationId, setDeletingLocationId] = useState<number | null>(null);
  const [adjustmentFiles, setAdjustmentFiles] = useState<Record<number, File | null>>({});
  const [uploadingAdjustmentId, setUploadingAdjustmentId] = useState<number | null>(null);
  const [handoffFiles, setHandoffFiles] = useState<Record<number, File | null>>({});
  const [handoffActionId, setHandoffActionId] = useState<number | null>(null);

  const paymentsByReservation = useMemo(() => {
    const map = new Map<number, Payment[]>();

    for (const payment of payments) {
      for (const reservationId of payment.reservation_ids || []) {
        const existing = map.get(reservationId) || [];
        existing.push(payment);
        map.set(reservationId, existing);
      }
    }

    return map;
  }, [payments]);

  const pendingPaymentReservations = useMemo(
    () =>
      reservations.filter((reservation) => {
        if (reservation.status !== "PENDING_PAYMENT") return false;
        return !hasActivePaymentForReservation(paymentsByReservation.get(reservation.id) || []);
      }),
    [paymentsByReservation, reservations]
  );

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      setReservations([]);
      setPayments([]);
      setSavedLocations([]);
      setIsLoading(false);
      return;
    }
    if (user.role === "ADMIN") {
      router.replace("/admin");
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    Promise.all([myReservations(), myPayments(), listSavedLocations()])
      .then(([nextReservations, nextPayments, nextLocations]) => {
        if (cancelled) return;
        setReservations(nextReservations);
        setPayments(nextPayments);
        setSavedLocations(nextLocations);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof ApiError ? error.message : "Failed to load reservations");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, isAuthLoading, router, refreshKey]);

  async function handleSaveLocation() {
    if (
      !locationDraft.label.trim() ||
      !locationDraft.contact_name.trim() ||
      !locationDraft.phone_number.trim() ||
      !locationDraft.address_line_1.trim() ||
      !locationDraft.city.trim()
    ) {
      toast.error("Please complete the label, contact, phone, address, and city.");
      return;
    }

    setIsSavingLocation(true);
    try {
      const saved = editingLocationId
        ? await updateSavedLocation(editingLocationId, locationDraft)
        : await createSavedLocation(locationDraft);

      const nextLocations = editingLocationId
        ? savedLocations.map((location) => (location.id === editingLocationId ? saved : location))
        : [saved, ...savedLocations.filter((location) => location.id !== saved.id)];

      setSavedLocations(
        saved.is_default
          ? nextLocations.map((location) => ({ ...location, is_default: location.id === saved.id }))
          : nextLocations
      );
      setLocationDraft(emptyLocationDraft());
      setEditingLocationId(null);
      toast.success(editingLocationId ? "Location updated." : "Location saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save location.");
    } finally {
      setIsSavingLocation(false);
    }
  }

  function handleEditLocation(location: SavedLocation) {
    setEditingLocationId(location.id);
    setLocationDraft({
      label: location.label,
      contact_name: location.contact_name,
      phone_number: location.phone_number,
      address_line_1: location.address_line_1,
      address_line_2: location.address_line_2 || "",
      barangay: location.barangay || "",
      city: location.city,
      province: location.province || "",
      postal_code: location.postal_code || "",
      country: location.country || "Philippines",
      area: location.area || "",
      notes: location.notes || "",
      is_default: location.is_default
    });
  }

  async function handleDeleteLocation(locationId: number) {
    setDeletingLocationId(locationId);
    try {
      await deleteSavedLocation(locationId);
      setSavedLocations((current) => current.filter((location) => location.id !== locationId));

      if (editingLocationId === locationId) {
        setEditingLocationId(null);
        setLocationDraft(emptyLocationDraft());
      }

      toast.success("Location removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete location.");
    } finally {
      setDeletingLocationId(null);
    }
  }

  async function handleUploadAdjustmentPayment(reservation: ReservationWithItems, adjustment: ReservationAdjustment) {
    const file = adjustmentFiles[adjustment.id];
    if (!file) {
      toast.error("Choose a receipt file for this surcharge request.");
      return;
    }

    setUploadingAdjustmentId(adjustment.id);
    try {
      await uploadReservationAdjustmentPayment(adjustment.id, file);
      const [nextReservations, nextPayments] = await Promise.all([myReservations(), myPayments()]);
      setReservations(nextReservations);
      setPayments(nextPayments);
      setAdjustmentFiles((current) => ({ ...current, [adjustment.id]: null }));
      toast.success(`Supplemental payment submitted for reservation #${reservation.id}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload the supplemental payment.");
    } finally {
      setUploadingAdjustmentId(null);
    }
  }

  async function handleConfirmReceived(reservation: ReservationWithItems) {
    const file = handoffFiles[reservation.id];
    if (!file) {
      toast.error("Upload a photo showing you received the costume.");
      return;
    }

    setHandoffActionId(reservation.id);
    try {
      await confirmReservationReceived(reservation.id, file);
      const nextReservations = await myReservations();
      setReservations(nextReservations);
      setHandoffFiles((current) => ({ ...current, [reservation.id]: null }));
      toast.success("Receipt confirmed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to confirm receipt.");
    } finally {
      setHandoffActionId(null);
    }
  }

  async function handleInitiateReturn(reservation: ReservationWithItems) {
    const file = handoffFiles[reservation.id];
    if (!file) {
      toast.error("Upload a photo of the costume you are returning.");
      return;
    }

    setHandoffActionId(reservation.id);
    try {
      await initiateReservationReturn(reservation.id, file);
      const nextReservations = await myReservations();
      setReservations(nextReservations);
      setHandoffFiles((current) => ({ ...current, [reservation.id]: null }));
      toast.success("Return initiated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to initiate return.");
    } finally {
      setHandoffActionId(null);
    }
  }

  async function handleCancelReservation(reservation: ReservationWithItems) {
    setHandoffActionId(reservation.id);
    try {
      await cancelReservation(reservation.id);
      const nextReservations = await myReservations();
      setReservations(nextReservations);
      toast.success("Reservation cancelled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to cancel reservation.");
    } finally {
      setHandoffActionId(null);
    }
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 pb-32 pt-24 text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-8">
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
        <div className="mx-auto flex max-w-sm flex-col items-center gap-8">
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

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-32 pt-16">
      <div className="mb-16 max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground animate-fade-up">
          Your account
        </p>
        <h1 className="mt-4 font-playfair text-5xl font-semibold tracking-tight text-foreground animate-fade-up-delay-1 md:text-6xl">
          Reservations
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground animate-fade-up-delay-2">
          Review your bookings, follow the fulfillment lifecycle, and keep delivery-ready locations close at hand.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-0">
          {isLoading ? (
            <div className="flex flex-col divide-y divide-border border-t border-border">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex gap-6 py-8">
                  <Skeleton className="size-24 shrink-0 rounded-sm" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : reservations.length > 0 ? (
            <div className="divide-y divide-border border-y border-border">
              {reservations.map((reservation) => {
                const image = primaryImage(reservation);
                const firstItem = reservation.items?.[0];
                const title = firstItem?.Costume?.name || `Reservation #${reservation.id}`;
                const reservationPayments = paymentsByReservation.get(reservation.id) || [];
                const days = countRentalDaysInclusive(reservation.start_date, reservation.end_date);
                const status = resolveReservationStatus(reservation, reservationPayments);
                const reserveAgainHref = buildReserveAgainHref(reservation);
                const canContinuePayment =
                  reservation.status === "PENDING_PAYMENT" &&
                  !hasActivePaymentForReservation(reservationPayments);
                const fulfillmentLine = reservationFulfillmentSummary(reservation);
                const pendingAdjustment = getPendingAdjustment(reservation);
                const paidSurchargeTotal = getPaidAdjustmentTotal(reservation);
                const journey = timelineForReservation(reservation);
                const journeyCurrentStep = currentJourneyStep(reservation, reservationPayments);
                const journeyIndex = journey.indexOf(journeyCurrentStep);
                const showsJourney = journeyIndex >= 0;
                const nextJourneyStep = showsJourney ? journey[journeyIndex + 1] : undefined;
                const journeyCompletion = showsJourney ? ((journeyIndex + 1) / journey.length) * 100 : 0;

                return (
                  <article key={reservation.id} className="flex flex-col gap-6 py-10 sm:flex-row sm:gap-8">
                    <div className="size-24 shrink-0 overflow-hidden rounded-sm border border-border bg-muted sm:size-28">
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

                    <div className="flex min-w-0 flex-1 flex-col gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-playfair text-xl font-semibold text-foreground">{title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatDate(reservation.start_date)} to {formatDate(reservation.end_date)}
                            {days > 0 && ` · ${days} day${days !== 1 ? "s" : ""}`}
                          </p>
                          {fulfillmentLine ? (
                            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                              {fulfillmentLine}
                            </p>
                          ) : null}
                          <p className="mt-1 text-sm text-muted-foreground">
                            PHP {(Number(reservation.total_price) + paidSurchargeTotal).toLocaleString()}
                          </p>
                          {paidSurchargeTotal > 0 ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Includes PHP {paidSurchargeTotal.toLocaleString()} in settled surcharge payments
                            </p>
                          ) : null}
                        </div>

                        <span
                          className={cn(
                            "shrink-0 rounded-sm border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest",
                            status.className
                          )}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {reservation.status === "CART" ? (
                          <button
                            type="button"
                            onClick={openCart}
                            className="inline-flex h-9 items-center gap-2 rounded-sm border border-foreground bg-foreground px-5 text-[10px] font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
                          >
                            <CreditCard className="size-3.5" />
                            Continue in Cart
                          </button>
                        ) : null}

                        {canContinuePayment ? (
                          <button
                            type="button"
                            onClick={openCart}
                            className="inline-flex h-9 items-center gap-2 rounded-sm border border-border px-5 text-[10px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
                          >
                            <Upload className="size-3.5" />
                            Continue Payment
                          </button>
                        ) : null}

                        {reservation.status === "PENDING_PAYMENT" && !hasActivePaymentForReservation(reservationPayments) ? (
                          <button
                            type="button"
                            onClick={() => void handleCancelReservation(reservation)}
                            disabled={handoffActionId === reservation.id}
                            className="inline-flex h-9 items-center gap-2 rounded-sm border border-destructive/30 px-5 text-[10px] font-semibold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                          >
                            Cancel Reservation
                          </button>
                        ) : null}

                        {firstItem?.costume_id ? (
                          <Link
                            href={`/costumes/${firstItem.costume_id}`}
                            className="inline-flex h-9 items-center gap-2 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                          >
                            View costume
                          </Link>
                        ) : null}

                        {reservation.status === "CANCELLED" && reserveAgainHref ? (
                          <Link
                            href={reserveAgainHref}
                            className="inline-flex h-9 items-center gap-2 rounded-sm border border-border px-5 text-[10px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
                          >
                            Change dates & reserve again
                          </Link>
                        ) : null}
                      </div>

                      {showsJourney ? (
                        <section className="space-y-3 border-y border-border/70 py-4" aria-label="Fulfillment progress">
                          <div className="flex items-baseline justify-between gap-4">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                              Fulfillment progress
                            </p>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                              Stage {journeyIndex + 1} of {journey.length}
                            </p>
                          </div>

                          <div className="h-px w-full bg-border" aria-hidden="true">
                            <div
                              className="h-px bg-foreground"
                              style={{ width: `${journeyCompletion}%` }}
                            />
                          </div>

                          <p className="text-sm text-muted-foreground">
                            {nextJourneyStep ? (
                              <>
                                Next step:{" "}
                                <span className="font-medium text-foreground">
                                  {getJourneyStepMeta(nextJourneyStep, reservation.fulfillment || undefined).label}
                                </span>
                              </>
                            ) : (
                              "All fulfillment steps are complete."
                            )}
                          </p>

                          <Accordion type="single" collapsible>
                            <AccordionItem value={`journey-${reservation.id}`} className="border-b-0">
                              <AccordionTrigger className="py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                View full journey
                              </AccordionTrigger>
                              <AccordionContent>
                                <ol className="grid gap-x-6 gap-y-1 pt-3 sm:grid-cols-2">
                                  {journey.map((step) => {
                                    const meta = getJourneyStepMeta(step, reservation.fulfillment || undefined);
                                    const state = timelineStepState(journeyCurrentStep, journey, step);
                                    return (
                                      <li key={step} className="flex items-center gap-3 py-1.5 text-xs">
                                        <span
                                          aria-hidden="true"
                                          className={cn(
                                            "size-2 shrink-0 rounded-full border",
                                            state === "current" && "border-foreground bg-foreground",
                                            state === "complete" && "border-foreground bg-foreground/35",
                                            state === "upcoming" && "border-border bg-background"
                                          )}
                                        />
                                        <span
                                          className={cn(
                                            "uppercase tracking-widest",
                                            state === "current" && "font-semibold text-foreground",
                                            state !== "current" && "text-muted-foreground"
                                          )}
                                        >
                                          {meta.label}
                                        </span>
                                      </li>
                                    );
                                  })}
                                </ol>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </section>
                      ) : null}

                      {reservation.fulfillment &&
                      [
                        ["Dispatch", reservation.fulfillment.outbound_dispatch_proof_url],
                        ["Received", reservation.fulfillment.renter_received_proof_url],
                        ["Return started", reservation.fulfillment.return_initiated_proof_url],
                        ["Vendor return", reservation.fulfillment.vendor_return_proof_url]
                      ].some(([, proof]) => proof) ? (
                        <div className="flex flex-wrap gap-2">
                          {[
                            ["Dispatch", reservation.fulfillment.outbound_dispatch_proof_url],
                            ["Received", reservation.fulfillment.renter_received_proof_url],
                            ["Return started", reservation.fulfillment.return_initiated_proof_url],
                            ["Vendor return", reservation.fulfillment.vendor_return_proof_url]
                          ]
                            .filter(([, proof]) => proof)
                            .map(([label, proof]) => (
                              <a
                                key={label}
                                href={resolveApiAsset(proof!)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-8 items-center rounded-sm border border-border px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              >
                                {label} proof
                              </a>
                            ))}
                        </div>
                      ) : null}

                      {reservation.fulfillment?.outside_service_area ? (
                        <div className="rounded-sm border border-orange-400/30 bg-orange-50/50 p-4 text-sm text-orange-900 dark:bg-orange-900/10 dark:text-orange-200">
                          This booking was flagged as outside the vendor&apos;s service area. A surcharge may be requested during review.
                        </div>
                      ) : null}

                      {reservation.status === "DELIVERY_SCHEDULED" ? (
                        <div className="space-y-3 rounded-sm border border-border p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Confirm you received the costume
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Upload a photo showing the costume in your possession. This is required before the rental period begins.
                          </p>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(event) =>
                              setHandoffFiles((current) => ({
                                ...current,
                                [reservation.id]: event.target.files?.[0] || null
                              }))
                            }
                            className="block w-full text-xs text-muted-foreground file:mr-4 file:rounded-sm file:border file:border-border file:bg-background file:px-3 file:py-2 file:text-[10px] file:font-semibold file:uppercase file:tracking-widest"
                          />
                          <button
                            type="button"
                            onClick={() => void handleConfirmReceived(reservation)}
                            disabled={handoffActionId === reservation.id}
                            className="inline-flex h-10 items-center justify-center rounded-sm bg-foreground px-4 text-[10px] font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85 disabled:opacity-50"
                          >
                            {handoffActionId === reservation.id ? "Submitting..." : "Confirm I Received It"}
                          </button>
                        </div>
                      ) : null}

                      {reservation.status === "WITH_RENTER" ? (
                        <div className="space-y-3 rounded-sm border border-border p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Return the costume
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Upload a photo of the costume as you prepare to return it.
                          </p>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(event) =>
                              setHandoffFiles((current) => ({
                                ...current,
                                [reservation.id]: event.target.files?.[0] || null
                              }))
                            }
                            className="block w-full text-xs text-muted-foreground file:mr-4 file:rounded-sm file:border file:border-border file:bg-background file:px-3 file:py-2 file:text-[10px] file:font-semibold file:uppercase file:tracking-widest"
                          />
                          <button
                            type="button"
                            onClick={() => void handleInitiateReturn(reservation)}
                            disabled={handoffActionId === reservation.id}
                            className="inline-flex h-10 items-center justify-center rounded-sm bg-foreground px-4 text-[10px] font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85 disabled:opacity-50"
                          >
                            {handoffActionId === reservation.id ? "Submitting..." : "Return Costume"}
                          </button>
                        </div>
                      ) : null}

                      {pendingAdjustment ? (
                        <div className="space-y-4 rounded-sm border border-orange-400/30 bg-orange-50/50 p-4 dark:bg-orange-900/10">
                          <div className="space-y-1">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-orange-700 dark:text-orange-400">
                              Supplemental payment requested
                            </p>
                            <p className="text-sm text-foreground">
                              PHP {Number(pendingAdjustment.amount).toLocaleString()}
                            </p>
                            {pendingAdjustment.note ? (
                              <p className="text-sm leading-7 text-muted-foreground">{pendingAdjustment.note}</p>
                            ) : null}
                          </div>

                          {hasActivePaymentForAdjustment(pendingAdjustment.id, reservationPayments) ? (
                            <p className="text-xs text-muted-foreground">
                              A supplemental receipt has already been submitted for review.
                            </p>
                          ) : (
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(event) =>
                                  setAdjustmentFiles((current) => ({
                                    ...current,
                                    [pendingAdjustment.id]: event.target.files?.[0] || null
                                  }))
                                }
                                className="block w-full text-xs text-muted-foreground file:mr-4 file:rounded-sm file:border file:border-border file:bg-background file:px-3 file:py-2 file:text-[10px] file:font-semibold file:uppercase file:tracking-widest"
                              />
                              <button
                                type="button"
                                onClick={() => void handleUploadAdjustmentPayment(reservation, pendingAdjustment)}
                                disabled={uploadingAdjustmentId === pendingAdjustment.id}
                                className="inline-flex h-10 shrink-0 items-center justify-center rounded-sm bg-foreground px-4 text-[10px] font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85 disabled:opacity-50"
                              >
                                {uploadingAdjustmentId === pendingAdjustment.id ? "Uploading..." : "Upload Supplemental Proof"}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : null}

                      {reservationPayments.length > 0 ? (
                        <div className="space-y-2 rounded-sm border border-border p-4">
                          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Payment history
                          </p>
                          {reservationPayments.map((payment) => {
                            const paymentStatus = resolvePaymentHistoryStatus(payment, reservation);
                            return (
                              <div key={payment.id} className="space-y-2">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={cn(
                                        "rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
                                        paymentStatus.className
                                      )}
                                    >
                                      {paymentStatus.label}
                                    </span>
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                      {PAYMENT_PURPOSE_LABELS[payment.payment_purpose]}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      PHP {Number(payment.amount).toLocaleString()}
                                    </span>
                                  </div>
                                  {payment.proof_url ? (
                                    <a
                                      href={resolveApiAsset(payment.proof_url)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                      View proof <ExternalLink className="size-3" />
                                    </a>
                                  ) : null}
                                </div>
                                {payment.reservationAdjustment?.note ? (
                                  <p className="pt-1 text-xs leading-6 text-muted-foreground">
                                    {payment.reservationAdjustment.note}
                                  </p>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8 rounded-sm border border-border px-12 py-24 text-center">
              <div className="text-muted-foreground/20">
                <CalendarDays className="size-12" />
              </div>
              <div className="space-y-2">
                <p className="font-playfair text-3xl font-semibold text-foreground">No reservations yet.</p>
                <p className="text-muted-foreground">Start browsing and find a costume to book.</p>
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

        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-24 flex flex-col gap-10 rounded-sm border border-border p-8">
            <section className="border-b border-border pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Payment</p>
              <h2 className="mt-3 font-playfair text-2xl font-semibold text-foreground">Upload Proof</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Upload your payment receipt for any reservation still waiting on base payment. Supplemental surcharge receipts are handled directly inside the reservation timeline.
              </p>

              <div className="mt-6 flex flex-col gap-5">
                {pendingPaymentReservations.length > 0 ? (
                  <>
                    <p className="text-sm text-foreground">
                      You have <strong>{pendingPaymentReservations.length}</strong> reservation
                      {pendingPaymentReservations.length > 1 ? "s" : ""} awaiting payment. You can submit one proof of
                      payment for your entire cart.
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
                  <div className="rounded-sm border-2 border-dashed border-border py-8 text-center">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">All set</p>
                    <p className="text-sm text-muted-foreground">You don&apos;t have any pending payments right now.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Delivery book
                </p>
                <h2 className="font-playfair text-2xl font-semibold text-foreground">Saved locations</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Keep your preferred handoff addresses ready so delivery reservations stay quick, clear, and consistent.
                </p>
              </div>

              {savedLocations.length > 0 ? (
                <div className="divide-y divide-border border-y border-border">
                  {savedLocations.map((location) => (
                    <article key={location.id} className="space-y-3 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-playfair text-xl font-semibold text-foreground">{location.label}</p>
                            {location.is_default ? (
                              <span className="rounded-sm border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                Default
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm leading-7 text-muted-foreground">
                            {formatLocationSummary(location)}
                          </p>
                          <p className="text-xs leading-6 text-muted-foreground">
                            {location.contact_name} · {location.phone_number}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleEditLocation(location)}
                            className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteLocation(location.id)}
                            disabled={deletingLocationId === location.id}
                            className="text-[10px] font-semibold uppercase tracking-widest text-destructive transition-colors hover:opacity-80 disabled:opacity-40"
                          >
                            {deletingLocationId === location.id ? "Removing" : "Delete"}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-sm border border-dashed border-border px-5 py-6 text-sm leading-7 text-muted-foreground">
                  No saved locations yet. Add one here or create one during a reservation when delivery is selected.
                </div>
              )}

              <div className="space-y-5 border-t border-border pt-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {editingLocationId ? "Editing location" : "Add a new location"}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      Delivery reservations require a valid location. You can also mark one as the default for faster
                      selection.
                    </p>
                  </div>

                  {editingLocationId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLocationId(null);
                        setLocationDraft(emptyLocationDraft());
                      }}
                      className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>

                <SavedLocationFields value={locationDraft} onChange={setLocationDraft} />

                <button
                  type="button"
                  onClick={() => void handleSaveLocation()}
                  disabled={isSavingLocation}
                  className="flex h-11 w-full items-center justify-center rounded-sm bg-foreground text-[10px] font-semibold uppercase tracking-[0.24em] text-background transition-colors hover:bg-foreground/85 disabled:opacity-50"
                >
                  {isSavingLocation ? "Saving..." : editingLocationId ? "Save location changes" : "Save location"}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
