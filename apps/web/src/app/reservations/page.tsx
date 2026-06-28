"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarIcon as CalendarDays,
  IdCardIcon as CreditCard,
  UploadIcon as Upload
} from "@radix-ui/react-icons";

import { ActiveReservationCard } from "@/components/reservations/ActiveReservationCard";
import { CartWorkflowActs } from "@/components/reservations/CartWorkflowActs";
import { CollectionToolbar } from "@/components/reservations/CollectionToolbar";
import { ReservationsHero } from "@/components/reservations/ReservationsHero";
import { ReservationsSidebar } from "@/components/reservations/ReservationsSidebar";
import { SavedCartItem } from "@/components/reservations/SavedCartItem";
import type { ViewMode } from "@/components/marketplace/ResultsToolbar";
import { VendorCartSetupModal } from "@/components/VendorCartSetupModal";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "../../lib/api";
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
import type { ReservationAdjustment, SavedLocation } from "@/lib/fulfillment";
import { countRentalDaysInclusive } from "../../lib/pricing";
import { paginateSlice, resolvePageSize } from "../../lib/paginate";
import {
  formatReservationDate,
  hasActivePaymentForReservation,
  primaryImage
} from "../../lib/reservationDisplay";
import { cn } from "@/lib/utils";

const actionLabelClass = "text-[10px] font-semibold uppercase tracking-widest";

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
      <div className="min-h-screen reservations-shell">
        <div className="mx-auto w-full max-w-[1200px] px-6 pb-24 pt-20 text-center">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-6 animate-fade-up">
            <div className="rounded-full border border-border bg-card p-5 text-muted-foreground/30">
              <CalendarDays className="mx-auto size-10" />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Backstage pass required</p>
              <h1 className="font-display text-3xl font-semibold text-foreground">Your Reservations</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Sign in to view and manage your costume reservations.
              </p>
            </div>
            <Link
              href="/login?next=/reservations"
              className={cn(buttonVariants({ size: "lg" }), "h-10 px-6 hover-snap", actionLabelClass)}
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
      <div className="min-h-screen reservations-shell">
        <div className="mx-auto w-full max-w-[1200px] px-6 pb-24 pt-20 text-center">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-6 animate-fade-up">
            <div className="rounded-full border border-border bg-card p-5 text-muted-foreground/30">
              <CalendarDays className="mx-auto size-10" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-semibold text-foreground">Unavailable</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Administrators cannot make or view personal reservations.
              </p>
            </div>
            <Link href="/" className={cn(buttonVariants({ size: "lg" }), "h-10 px-6 hover-snap", actionLabelClass)}>
              Return home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen reservations-shell">
      <div className="mx-auto w-full max-w-[1200px] px-6 pb-24 pt-10">
        <ReservationsHero
          savedCount={totalCartItems}
          activeCount={activeReservations.length}
          pendingPaymentCount={pendingPaymentReservations.length}
          readyToPayCount={readyToPayCartCount}
        />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col gap-12 lg:col-span-7 xl:col-span-8">
          {!isLoading && cartVendorGroups.length > 0 ? (
            <section className="space-y-6 animate-fade-up">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Saved cart</p>
                  <h2 className="section-heading">Finish your bookings</h2>
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    Costumes saved from the marketplace live here until payment. Choose dates for each look, set delivery
                    once per vendor, then pay in your cart.
                  </p>
                </div>

                <div className="workflow-bar">
                  <CartWorkflowActs currentStep={cartWorkflowStep} />
                </div>
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
                    <div key={vendorId} className="panel-card shadow-coral-hover overflow-hidden p-5 sm:p-6">
                      <div className="mb-5 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                            Vendor · {group.vendorName}
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
                              ? `${formatReservationDate(reservation.start_date)} to ${formatReservationDate(reservation.end_date)}`
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
            <div className="flex flex-col gap-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="panel-card flex gap-6 p-6">
                  <Skeleton className="aspect-[4/5] w-36 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/4" />
                    <Skeleton className="mt-4 h-2 w-full rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : activeReservations.length > 0 || cartVendorGroups.length > 0 ? (
            activeReservations.length > 0 ? (
            <section className="space-y-6 animate-fade-up-delay-1">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
                  {cartVendorGroups.length > 0 ? "Confirmed bookings" : "Your bookings"}
                </p>
                <h2 className="section-heading">Active reservations</h2>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Track payment, vendor review, delivery, and returns — each booking reads like a call sheet.
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

              <div className="flex flex-col gap-5">
                {paginatedActiveReservations.items.map((reservation) => {
                  const pendingAdjustment = reservation.adjustments?.find((a) => a.status === "PENDING");
                  return (
                    <ActiveReservationCard
                      key={reservation.id}
                      reservation={reservation}
                      reservationPayments={paymentsByReservation.get(reservation.id) || []}
                      handoffActionId={handoffActionId}
                      uploadingAdjustmentId={uploadingAdjustmentId}
                      onOpenCart={() => openCart()}
                      onCancel={() => void handleCancelReservation(reservation)}
                      onConfirmReceived={() => void handleConfirmReceived(reservation)}
                      onInitiateReturn={() => void handleInitiateReturn(reservation)}
                      onUploadAdjustment={(adjustment) => void handleUploadAdjustmentPayment(reservation, adjustment)}
                      onHandoffFileChange={(file) =>
                        setHandoffFiles((current) => ({ ...current, [reservation.id]: file }))
                      }
                      onAdjustmentFileChange={(file) => {
                        if (!pendingAdjustment) return;
                        setAdjustmentFiles((current) => ({ ...current, [pendingAdjustment.id]: file }));
                      }}
                    />
                  );
                })}
              </div>
            </section>
            ) : null
          ) : (
            <div className="panel-card flex flex-col items-center gap-6 px-8 py-20 text-center sm:px-12 animate-fade-up">
              <div className="rounded-full border border-border bg-muted/40 p-5 text-muted-foreground/25">
                <CalendarDays className="size-10" />
              </div>
              <div className="max-w-sm space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Empty stage</p>
                <p className="font-display text-2xl font-semibold text-foreground">No reservations yet</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Save costumes from the marketplace, then finish your booking here.
                </p>
              </div>
              <Link
                href="/"
                className={cn(buttonVariants({ size: "lg" }), "h-10 px-6 hover-snap", actionLabelClass)}
              >
                Browse costumes
              </Link>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 xl:col-span-4 animate-fade-up-delay-2">
          <ReservationsSidebar
            pendingPaymentCount={pendingPaymentReservations.length}
            readyToPayCount={readyToPayCartCount}
            incompleteDraftCount={incompleteDraftCount}
            onOpenCart={() => openCart()}
          />
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
