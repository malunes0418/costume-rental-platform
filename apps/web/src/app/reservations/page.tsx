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

import { CollectionToolbar } from "@/components/reservations/CollectionToolbar";
import { SavedCartItem } from "@/components/reservations/SavedCartItem";
import type { ViewMode } from "@/components/marketplace/ResultsToolbar";
import { VendorCartSetupModal } from "@/components/VendorCartSetupModal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "../../lib/api";
import { resolveApiAsset } from "../../lib/assets";
import { useAuth } from "../../lib/auth";
import { useCart } from "../../lib/CartContext";
import {
  cancelReservation,
  confirmReservationReceived,
  initiateReservationReturn,
  isCartReservationDraft,
  listSavedLocations,
  myPayments,
  myReservations,
  removeReservation,
  uploadReservationAdjustmentPayment,
  type Payment,
  type ReservationWithItems
} from "../../lib/account";
import { groupCartReservationsByVendor, getCartDraftStatusMeta, getCartWorkflowStep, isCartReservationReadyToPay, isCartReservationSelectable } from "../../lib/cart";
import {
  FULFILLMENT_METHOD_LABELS,
  type ReservationAdjustment,
  type SavedLocation
} from "@/lib/fulfillment";
import { countRentalDaysInclusive } from "../../lib/pricing";
import { paginateSlice, resolvePageSize } from "../../lib/paginate";
import {
  PAYMENT_PURPOSE_LABELS,
  getPaymentStatusMeta,
  getReservationStatusMeta,
  type ReservationStatus
} from "../../lib/reservationStatus";
import { cn } from "@/lib/utils";

const actionLabelClass = "text-[10px] font-semibold uppercase tracking-widest";

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
  if (!costumeId || !reservation.start_date || !reservation.end_date) return null;

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

function reservationFulfillmentSummary(reservation: ReservationWithItems) {
  const fulfillment = reservation.fulfillment;
  if (!fulfillment) return null;

  return `${FULFILLMENT_METHOD_LABELS[fulfillment.outbound_method]} outbound / ${FULFILLMENT_METHOD_LABELS[fulfillment.return_method]} return`;
}

export default function ReservationsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { openCart, refreshKey, triggerRefresh } = useCart();
  const router = useRouter();

  const [reservations, setReservations] = useState<ReservationWithItems[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adjustmentFiles, setAdjustmentFiles] = useState<Record<number, File | null>>({});
  const [uploadingAdjustmentId, setUploadingAdjustmentId] = useState<number | null>(null);
  const [handoffFiles, setHandoffFiles] = useState<Record<number, File | null>>({});
  const [handoffActionId, setHandoffActionId] = useState<number | null>(null);
  const [vendorSetup, setVendorSetup] = useState<{
    vendorName: string;
    reservations: ReservationWithItems[];
  } | null>(null);
  const [selectedCartIds, setSelectedCartIds] = useState<Set<number>>(new Set());
  const [cartView, setCartView] = useState<ViewMode>("list");
  const [cartPageSize, setCartPageSize] = useState("8");
  const [cartVendorPages, setCartVendorPages] = useState<Record<number, number>>({});
  const [activePage, setActivePage] = useState(0);
  const [activePageSize, setActivePageSize] = useState("8");
  const [removingCartId, setRemovingCartId] = useState<number | null>(null);

  const cartGroupsByVendor = useMemo(() => groupCartReservationsByVendor(reservations), [reservations]);

  const cartVendorGroups = useMemo(() => Array.from(cartGroupsByVendor.entries()), [cartGroupsByVendor]);

  const activeReservations = useMemo(
    () => reservations.filter((reservation) => reservation.status !== "CART"),
    [reservations]
  );

  const totalCartItems = useMemo(
    () => reservations.filter((reservation) => reservation.status === "CART").length,
    [reservations]
  );

  const resolvedCartPageSize = useMemo(() => resolvePageSize(cartPageSize), [cartPageSize]);
  const resolvedActivePageSize = useMemo(() => resolvePageSize(activePageSize), [activePageSize]);

  const paginatedActiveReservations = useMemo(
    () => paginateSlice(activeReservations, activePage, resolvedActivePageSize),
    [activeReservations, activePage, resolvedActivePageSize]
  );

  const readyToPayCartCount = useMemo(
    () => reservations.filter((reservation) => isCartReservationReadyToPay(reservation)).length,
    [reservations]
  );

  const cartWorkflowStep = useMemo(() => getCartWorkflowStep(reservations), [reservations]);

  const cartWorkflowSteps = [
    { step: 1, label: "Dates per costume" },
    { step: 2, label: "Delivery per vendor" },
    { step: 3, label: "Pay in cart" }
  ] as const;

  useEffect(() => {
    const selectableIds = reservations
      .filter((reservation) => reservation.status === "CART" && isCartReservationSelectable(reservation))
      .map((reservation) => reservation.id);
    setSelectedCartIds(new Set(selectableIds));
  }, [reservations]);

  useEffect(() => {
    setActivePage((current) => Math.min(current, Math.max(paginatedActiveReservations.totalPages - 1, 0)));
  }, [paginatedActiveReservations.totalPages]);

  function handleCartPageSizeChange(value: string) {
    setCartPageSize(value);
    setCartVendorPages({});
  }

  function setVendorCartPage(vendorId: number, page: number) {
    setCartVendorPages((current) => ({ ...current, [vendorId]: page }));
  }

  async function handleRemoveCartItem(reservationId: number) {
    setRemovingCartId(reservationId);
    try {
      await removeReservation(reservationId);
      setReservations((current) => current.filter((reservation) => reservation.id !== reservationId));
      setSelectedCartIds((current) => {
        const next = new Set(current);
        next.delete(reservationId);
        return next;
      });
      triggerRefresh();
      toast.success("Removed from saved cart.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove this costume.");
    } finally {
      setRemovingCartId(null);
    }
  }

  function toggleCartSelection(reservationId: number) {
    setSelectedCartIds((current) => {
      const next = new Set(current);
      if (next.has(reservationId)) next.delete(reservationId);
      else next.add(reservationId);
      return next;
    });
  }

  function toggleVendorCartSelection(reservationsInGroup: ReservationWithItems[]) {
    const selectableIds = reservationsInGroup
      .filter((reservation) => isCartReservationSelectable(reservation))
      .map((reservation) => reservation.id);
    const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedCartIds.has(id));

    setSelectedCartIds((current) => {
      const next = new Set(current);
      if (allSelected) {
        selectableIds.forEach((id) => next.delete(id));
      } else {
        selectableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function openCartForVendorGroup(
    vendorId: number,
    group: { vendorName: string; items: ReservationWithItems[] },
    readyOnly: boolean
  ) {
    const selectedInGroup = group.items.filter((reservation) => selectedCartIds.has(reservation.id));
    const reservationIds = (readyOnly ? selectedInGroup : group.items)
      .filter((reservation) => isCartReservationSelectable(reservation))
      .map((reservation) => reservation.id);

    if (readyOnly && reservationIds.length === 0) {
      toast.error("Select at least one ready costume to pay for.");
      return;
    }

    openCart({
      vendorId,
      reservationIds: readyOnly ? reservationIds : undefined,
      step: readyOnly && reservationIds.length > 0 ? "UPLOAD" : "CART"
    });
  }

  const incompleteDraftCount = useMemo(
    () => reservations.filter((reservation) => reservation.status === "CART" && isCartReservationDraft(reservation)).length,
    [reservations]
  );

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

  async function reloadReservations() {
    const [nextReservations, nextPayments] = await Promise.all([myReservations(), myPayments()]);
    setReservations(nextReservations);
    setPayments(nextPayments);
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
      <div className="min-h-screen bg-muted/40">
        <div className="mx-auto w-full max-w-[1200px] px-6 pb-24 pt-20 text-center">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-6">
            <div className="text-muted-foreground/20">
              <CalendarDays className="mx-auto size-12" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-semibold text-foreground">Your Reservations</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Sign in to view and manage your costume reservations.
              </p>
            </div>
            <Link
              href="/login?next=/reservations"
              className={cn(buttonVariants({ size: "lg" }), "h-10 px-6", actionLabelClass)}
            >
              Log in to continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === "ADMIN") {
    return (
      <div className="min-h-screen bg-muted/40">
        <div className="mx-auto w-full max-w-[1200px] px-6 pb-24 pt-20 text-center">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-6">
            <div className="text-muted-foreground/20">
              <CalendarDays className="mx-auto size-12" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-semibold text-foreground">Unavailable</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Administrators cannot make or view personal reservations.
              </p>
            </div>
            <Link href="/" className={cn(buttonVariants({ size: "lg" }), "h-10 px-6", actionLabelClass)}>
              Return home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto w-full max-w-[1200px] px-6 pb-24 pt-12">
        <header className="mb-8 max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Your account</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Reservations
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Finish any saved costumes, then track confirmed bookings through delivery and return.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col gap-10 lg:col-span-7 xl:col-span-8">
          {!isLoading && cartVendorGroups.length > 0 ? (
            <section className="space-y-5">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Saved cart
                </p>
                <h2 className="font-display text-xl font-semibold text-foreground">Finish your bookings</h2>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Costumes you saved from the marketplace live here until payment is submitted. Choose rental dates
                  for each look, set delivery once per vendor, then pay in your cart.
                </p>
                <ol className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-[10px] font-semibold uppercase tracking-widest">
                  {cartWorkflowSteps.map(({ step, label }) => {
                    const isCurrent = cartWorkflowStep === step;
                    const isComplete = cartWorkflowStep > step;

                    return (
                      <li
                        key={step}
                        className={cn(
                          "flex items-center gap-2",
                          isCurrent && "text-foreground",
                          !isCurrent && isComplete && "text-muted-foreground",
                          !isCurrent && !isComplete && "text-muted-foreground/60"
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-5 items-center justify-center rounded-full border text-[9px]",
                            isCurrent && "border-primary bg-primary text-primary-foreground",
                            !isCurrent && isComplete && "border-primary/40 bg-primary/10 text-primary",
                            !isCurrent && !isComplete && "border-border text-muted-foreground"
                          )}
                        >
                          {step}
                        </span>
                        {label}
                        {isCurrent ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] text-primary">
                            Current
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              </div>

              <CollectionToolbar
                noun="saved costume"
                total={totalCartItems}
                pageSize={cartPageSize}
                view={cartView}
                showViewToggle
                onPageSizeChange={handleCartPageSizeChange}
                onViewChange={setCartView}
              />

              <div className="flex flex-col gap-5">
                {cartVendorGroups.map(([vendorId, group]) => {
                  const vendorPage = cartVendorPages[vendorId] ?? 0;
                  const paginatedGroup = paginateSlice(group.items, vendorPage, resolvedCartPageSize);
                  const groupReadyToPay = group.items.every((reservation) => isCartReservationReadyToPay(reservation));
                  const groupHasDrafts = group.items.some((reservation) => isCartReservationDraft(reservation));
                  const groupReadyCount = group.items.filter((reservation) => isCartReservationReadyToPay(reservation)).length;
                  const selectableIds = group.items
                    .filter((reservation) => isCartReservationSelectable(reservation))
                    .map((reservation) => reservation.id);
                  const selectedInGroup = group.items.filter((reservation) => selectedCartIds.has(reservation.id));
                  const allSelectableSelected =
                    selectableIds.length > 0 && selectableIds.every((id) => selectedCartIds.has(id));
                  const someSelectableSelected = selectableIds.some((id) => selectedCartIds.has(id));
                  const selectAllState: boolean | "indeterminate" = allSelectableSelected
                    ? true
                    : someSelectableSelected
                      ? "indeterminate"
                      : false;

                  return (
                    <div key={vendorId} className="panel-card p-5 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            From {group.vendorName}
                          </p>
                          <p className="font-display text-xl font-semibold text-foreground">
                            {group.items.length} costume{group.items.length !== 1 ? "s" : ""} saved
                            {selectedInGroup.length > 0 && selectedInGroup.length < group.items.length
                              ? ` · ${selectedInGroup.length} selected for checkout`
                              : ""}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {groupReadyToPay
                              ? "Every costume is configured. Select which ones to pay for, then open the cart."
                              : groupReadyCount > 0
                                ? `${groupReadyCount} ready for checkout · finish the rest before paying together.`
                                : "Add rental dates and delivery before checkout unlocks."}
                          </p>
                          {selectableIds.length > 0 ? (
                            <div className="mt-3 flex items-center gap-2">
                              <Checkbox
                                id={`select-all-${vendorId}`}
                                checked={selectAllState}
                                onCheckedChange={() => toggleVendorCartSelection(group.items)}
                              />
                              <Label
                                htmlFor={`select-all-${vendorId}`}
                                className="cursor-pointer text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                              >
                                Select all ready for checkout
                              </Label>
                            </div>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                          {groupHasDrafts ? (
                            <Button
                              type="button"
                              size="lg"
                              className={cn("h-10 px-5", actionLabelClass)}
                              onClick={() => setVendorSetup({ vendorName: group.vendorName, reservations: group.items })}
                            >
                              <CalendarDays data-icon="inline-start" />
                              Complete booking details
                            </Button>
                          ) : null}
                          {groupReadyCount > 0 ? (
                            <Button
                              type="button"
                              variant={groupHasDrafts ? "outline" : "default"}
                              size="lg"
                              className={cn("h-10 px-5", actionLabelClass)}
                              onClick={() => openCartForVendorGroup(vendorId, group, true)}
                              disabled={selectedInGroup.length === 0}
                            >
                              <CreditCard data-icon="inline-start" />
                              {selectedInGroup.length > 0 && selectedInGroup.length < groupReadyCount
                                ? `Pay selected (${selectedInGroup.length})`
                                : "Pay in cart"}
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      <div
                        className={cn(
                          "mt-6",
                          cartView === "grid"
                            ? "grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-3"
                            : "divide-y divide-border border-y border-border"
                        )}
                      >
                        {paginatedGroup.items.map((reservation) => {
                          const image = primaryImage(reservation);
                          const firstItem = reservation.items?.[0];
                          const title = firstItem?.Costume?.name || `Costume #${reservation.id}`;
                          const draftStatus = getCartDraftStatusMeta(reservation);
                          const selectable = isCartReservationSelectable(reservation);
                          const isSelected = selectedCartIds.has(reservation.id);
                          const days =
                            reservation.start_date && reservation.end_date
                              ? countRentalDaysInclusive(reservation.start_date, reservation.end_date)
                              : 0;
                          const dateLabel =
                            reservation.start_date && reservation.end_date
                              ? `${formatDate(reservation.start_date)} to ${formatDate(reservation.end_date)}`
                              : "Rental dates not chosen";
                          const missingSummary =
                            draftStatus.missing.length > 0
                              ? `Still needed: ${draftStatus.missing
                                  .map((step) => (step === "dates" ? "rental dates" : "delivery details"))
                                  .join(" and ")}`
                              : null;

                          return (
                            <SavedCartItem
                              key={reservation.id}
                              reservation={reservation}
                              view={cartView}
                              title={title}
                              image={image}
                              days={days}
                              dateLabel={dateLabel}
                              missingSummary={missingSummary}
                              statusLabel={draftStatus.label}
                              statusClassName={draftStatus.className}
                              selectable={selectable}
                              isSelected={isSelected}
                              isRemoving={removingCartId === reservation.id}
                              onToggle={() => toggleCartSelection(reservation.id)}
                              onRemove={() => void handleRemoveCartItem(reservation.id)}
                              costumeHref={firstItem?.costume_id ? `/costumes/${firstItem.costume_id}` : null}
                            />
                          );
                        })}
                      </div>

                      {paginatedGroup.totalPages > 1 ? (
                        <CollectionToolbar
                          className="mt-4 border-dashed bg-muted/20"
                          noun="costume in this vendor"
                          total={group.items.length}
                          start={paginatedGroup.start}
                          end={paginatedGroup.end}
                          page={paginatedGroup.page}
                          totalPages={paginatedGroup.totalPages}
                          pageSize={cartPageSize}
                          showPageSize={false}
                          onPageSizeChange={handleCartPageSizeChange}
                          onPageChange={(page) => setVendorCartPage(vendorId, page)}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {isLoading ? (
            <div className="flex flex-col divide-y divide-border border-t border-border">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex gap-6 py-8">
                  <Skeleton className="size-24 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : activeReservations.length > 0 || cartVendorGroups.length > 0 ? (
            activeReservations.length > 0 ? (
            <section className="space-y-5">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {cartVendorGroups.length > 0 ? "Confirmed bookings" : "Your bookings"}
                </p>
                <h2 className="font-display text-xl font-semibold text-foreground">Active reservations</h2>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Track payment, vendor review, delivery, and returns for costumes you&apos;ve already submitted.
                </p>
              </div>

              <CollectionToolbar
                noun="reservation"
                total={activeReservations.length}
                start={paginatedActiveReservations.start}
                end={paginatedActiveReservations.end}
                page={paginatedActiveReservations.page}
                totalPages={paginatedActiveReservations.totalPages}
                pageSize={activePageSize}
                onPageSizeChange={(value) => {
                  setActivePageSize(value);
                  setActivePage(0);
                }}
                onPageChange={setActivePage}
              />

            <div className="panel-card divide-y divide-border">
              {paginatedActiveReservations.items.map((reservation) => {
                const image = primaryImage(reservation);
                const firstItem = reservation.items?.[0];
                const title = firstItem?.Costume?.name || `Reservation #${reservation.id}`;
                const reservationPayments = paymentsByReservation.get(reservation.id) || [];
                const days =
                  reservation.start_date && reservation.end_date
                    ? countRentalDaysInclusive(reservation.start_date, reservation.end_date)
                    : 0;
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
                  <article key={reservation.id} className="flex flex-col gap-6 px-5 py-8 sm:flex-row sm:gap-8 sm:px-6">
                    <div className="size-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:size-28">
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
                          <p className="truncate font-display text-xl font-semibold text-foreground">{title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {reservation.start_date && reservation.end_date
                              ? `${formatDate(reservation.start_date)} to ${formatDate(reservation.end_date)}`
                              : "Dates pending"}
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

                        <Badge variant="outline" className={cn("shrink-0 rounded-md", status.className)}>
                          {status.label}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {canContinuePayment ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={actionLabelClass}
                            onClick={() => openCart()}
                          >
                            <Upload data-icon="inline-start" />
                            Continue payment
                          </Button>
                        ) : null}

                        {reservation.status === "PENDING_PAYMENT" && !hasActivePaymentForReservation(reservationPayments) ? (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className={actionLabelClass}
                            onClick={() => void handleCancelReservation(reservation)}
                            disabled={handoffActionId === reservation.id}
                          >
                            Cancel reservation
                          </Button>
                        ) : null}

                        {firstItem?.costume_id ? (
                          <Link
                            href={`/costumes/${firstItem.costume_id}`}
                            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), actionLabelClass)}
                          >
                            View costume
                          </Link>
                        ) : null}

                        {reservation.status === "CANCELLED" && reserveAgainHref ? (
                          <Link
                            href={reserveAgainHref}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), actionLabelClass)}
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
                              className="h-px bg-primary"
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
                                            state === "current" && "border-primary bg-primary",
                                            state === "complete" && "border-primary bg-primary/35",
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
                                className={cn(buttonVariants({ variant: "outline", size: "sm" }), actionLabelClass)}
                              >
                                {label} proof
                              </a>
                            ))}
                        </div>
                      ) : null}

                      {reservation.fulfillment?.outside_service_area ? (
                        <div className="rounded-xl border border-orange-400/30 bg-orange-50/50 p-4 text-sm text-orange-900 dark:bg-orange-900/10 dark:text-orange-200">
                          This booking was flagged as outside the vendor&apos;s service area. A surcharge may be requested during review.
                        </div>
                      ) : null}

                      {reservation.status === "DELIVERY_SCHEDULED" ? (
                        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
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
                            className="block w-full text-xs text-muted-foreground file:mr-4 file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-2 file:text-[10px] file:font-semibold file:uppercase file:tracking-widest"
                          />
                          <Button
                            type="button"
                            className={actionLabelClass}
                            onClick={() => void handleConfirmReceived(reservation)}
                            disabled={handoffActionId === reservation.id}
                          >
                            {handoffActionId === reservation.id ? "Submitting..." : "Confirm I received it"}
                          </Button>
                        </div>
                      ) : null}

                      {reservation.status === "WITH_RENTER" ? (
                        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
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
                            className="block w-full text-xs text-muted-foreground file:mr-4 file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-2 file:text-[10px] file:font-semibold file:uppercase file:tracking-widest"
                          />
                          <Button
                            type="button"
                            className={actionLabelClass}
                            onClick={() => void handleInitiateReturn(reservation)}
                            disabled={handoffActionId === reservation.id}
                          >
                            {handoffActionId === reservation.id ? "Submitting..." : "Return costume"}
                          </Button>
                        </div>
                      ) : null}

                      {pendingAdjustment ? (
                        <div className="space-y-4 rounded-xl border border-orange-400/30 bg-orange-50/50 p-4 dark:bg-orange-900/10">
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
                                className="block w-full text-xs text-muted-foreground file:mr-4 file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-2 file:text-[10px] file:font-semibold file:uppercase file:tracking-widest"
                              />
                              <Button
                                type="button"
                                className={cn("shrink-0", actionLabelClass)}
                                onClick={() => void handleUploadAdjustmentPayment(reservation, pendingAdjustment)}
                                disabled={uploadingAdjustmentId === pendingAdjustment.id}
                              >
                                {uploadingAdjustmentId === pendingAdjustment.id
                                  ? "Uploading..."
                                  : "Upload supplemental proof"}
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : null}

                      {reservationPayments.length > 0 ? (
                        <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
                          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Payment history
                          </p>
                          {reservationPayments.map((payment) => {
                            const paymentStatus = resolvePaymentHistoryStatus(payment, reservation);
                            return (
                              <div key={payment.id} className="space-y-2">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className={cn("rounded-md", paymentStatus.className)}>
                                      {paymentStatus.label}
                                    </Badge>
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
            </section>
            ) : null
          ) : (
            <div className="panel-card flex flex-col items-center gap-6 px-8 py-16 text-center sm:px-12">
              <div className="text-muted-foreground/20">
                <CalendarDays className="size-12" />
              </div>
              <div className="space-y-2">
                <p className="font-display text-2xl font-semibold text-foreground">No reservations yet</p>
                <p className="text-sm text-muted-foreground">
                  Save costumes from the marketplace, then finish your booking here.
                </p>
              </div>
              <Link href="/" className={cn(buttonVariants({ size: "lg" }), "h-10 px-6", actionLabelClass)}>
                Browse costumes
              </Link>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 xl:col-span-4">
          <div className="panel-card sticky top-24 flex flex-col gap-8 p-6 sm:p-8">
            <section className="border-b border-border pb-8">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Payment</p>
              <h2 className="mt-3 font-display text-xl font-semibold text-foreground">
                {pendingPaymentReservations.length > 0
                  ? "Upload proof"
                  : readyToPayCartCount > 0
                    ? "Ready for checkout"
                    : incompleteDraftCount > 0
                      ? "After setup"
                      : "All caught up"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {pendingPaymentReservations.length > 0
                  ? "Upload your payment receipt for reservations awaiting base payment. Supplemental surcharge receipts are handled inside each reservation."
                  : readyToPayCartCount > 0
                    ? "Your saved costumes are configured. Open the cart to submit payment and confirm your reservations."
                    : incompleteDraftCount > 0
                      ? "Checkout unlocks after you choose rental dates and delivery for each vendor group above."
                      : "No reservations are waiting on payment right now."}
              </p>

              <div className="mt-6 flex flex-col gap-5">
                {pendingPaymentReservations.length > 0 ? (
                  <>
                    <p className="text-sm text-foreground">
                      <strong>{pendingPaymentReservations.length}</strong> reservation
                      {pendingPaymentReservations.length > 1 ? "s" : ""} awaiting payment. You can submit one proof
                      for your entire cart.
                    </p>
                    <Button
                      type="button"
                      size="lg"
                      className={cn("mt-2 h-12 w-full", actionLabelClass)}
                      onClick={() => openCart()}
                    >
                      <Upload data-icon="inline-start" />
                      Upload payment in cart
                    </Button>
                  </>
                ) : readyToPayCartCount > 0 ? (
                  <>
                    <p className="text-sm text-foreground">
                      <strong>{readyToPayCartCount}</strong> costume{readyToPayCartCount > 1 ? "s are" : " is"} ready
                      for checkout.
                    </p>
                    <Button
                      type="button"
                      size="lg"
                      className={cn("mt-2 h-12 w-full", actionLabelClass)}
                      onClick={() => openCart()}
                    >
                      <CreditCard data-icon="inline-start" />
                      Open cart to pay
                    </Button>
                  </>
                ) : incompleteDraftCount > 0 ? (
                  <div className="rounded-xl border border-dashed border-amber-400/40 bg-amber-50/40 px-5 py-6 text-center dark:bg-amber-950/20">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-800 dark:text-amber-300">
                      Setup first
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {incompleteDraftCount} costume{incompleteDraftCount > 1 ? "s still need" : " still needs"} dates
                      or delivery before you can pay.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border py-8 text-center">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">All set</p>
                    <p className="text-sm text-muted-foreground">You don&apos;t have any pending payments right now.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Delivery book
                </p>
                <h2 className="font-display text-xl font-semibold text-foreground">Delivery settings</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Manage your saved addresses and default delivery windows in account settings.
                </p>
              </div>

              <Link
                href="/account/settings?next=/reservations"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 px-5", actionLabelClass)}
              >
                Manage delivery settings
              </Link>
            </section>
          </div>
        </div>
      </div>

      {vendorSetup ? (
        <VendorCartSetupModal
          vendorName={vendorSetup.vendorName}
          reservations={vendorSetup.reservations}
          savedLocations={savedLocations}
          open={Boolean(vendorSetup)}
          onOpenChange={(open) => {
            if (!open) setVendorSetup(null);
          }}
          onSaved={() => void reloadReservations()}
        />
      ) : null}
      </div>
    </div>
  );
}
