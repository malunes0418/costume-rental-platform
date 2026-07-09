"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useCart } from "../lib/CartContext";
import { useAuth } from "../lib/auth";
import {
  checkoutReservation,
  isCartReservationDraft,
  listSavedLocations,
  myPayments,
  myReservations,
  removeReservation,
  type Payment,
  type ReservationWithItems,
} from "../lib/account";
import { apiFetch } from "../lib/api";
import {
  isCheckoutSelectable,
  sumReservationTotals,
  vendorIdForReservation,
  vendorNameForReservation,
} from "../lib/cart";
import { FULFILLMENT_METHOD_LABELS, formatLocationSummary, type SavedLocation } from "../lib/fulfillment";
import { getCostume, type CostumeDetailResponse } from "../lib/costumes";
import { getVendorPaymentMethods, type VendorPaymentMethod } from "../lib/vendor";
import { ReservationWizard } from "./ReservationWizard";
import { toast } from "sonner";
import { Cross2Icon, ImageIcon, UploadIcon } from "@radix-ui/react-icons";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CartCheckoutSteps } from "@/components/cart/CartCheckoutSteps";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { PaymentMethodCard } from "@/components/cart/PaymentMethodCard";
import { cn } from "../lib/utils";

const actionLabelClass = "text-[10px] font-semibold uppercase tracking-widest";

type CartGroup = {
  vendorId: number;
  vendorName: string;
  items: ReservationWithItems[];
  subtotal: number;
  reservationIds: number[];
  hasCartItems: boolean;
  selectableItems: ReservationWithItems[];
};

function hasActivePayment(reservationId: number, payments: Payment[]) {
  return payments.some(
    (payment) =>
      payment.status !== "REJECTED" &&
      Array.isArray(payment.reservation_ids) &&
      payment.reservation_ids.some((id) => Number(id) === reservationId)
  );
}

function reservationFulfillmentLine(reservation: ReservationWithItems) {
  if (!reservation.fulfillment) return null;

  return {
    summary: `${FULFILLMENT_METHOD_LABELS[reservation.fulfillment.outbound_method]} outbound / ${FULFILLMENT_METHOD_LABELS[reservation.fulfillment.return_method]} return`,
    location:
      reservation.fulfillment.outbound_method === "DELIVERY"
        ? formatLocationSummary(reservation.fulfillment.outbound_location_snapshot)
        : null,
  };
}

function groupHasIncompleteSelectedItems(group: CartGroup, selectedIds: Set<number>) {
  return group.items.some(
    (item) => selectedIds.has(item.id) && item.status === "CART" && isCartReservationDraft(item)
  );
}

function buildCartGroups(items: ReservationWithItems[]): CartGroup[] {
  const groups = new Map<number, CartGroup>();

  for (const item of items) {
    const vendorId = vendorIdForReservation(item);
    const existing = groups.get(vendorId);

    if (existing) {
      existing.items.push(item);
      existing.subtotal += Number(item.total_price);
      existing.reservationIds.push(item.id);
      existing.hasCartItems = existing.hasCartItems || item.status === "CART";
      if (isCheckoutSelectable(item)) {
        existing.selectableItems.push(item);
      }
      continue;
    }

    groups.set(vendorId, {
      vendorId,
      vendorName: vendorNameForReservation(item),
      items: [item],
      subtotal: Number(item.total_price),
      reservationIds: [item.id],
      hasCartItems: item.status === "CART",
      selectableItems: isCheckoutSelectable(item) ? [item] : [],
    });
  }

  return Array.from(groups.values());
}

function defaultSelectedIds(items: ReservationWithItems[]) {
  return new Set(items.filter(isCheckoutSelectable).map((item) => item.id));
}

export function CartDrawer() {
  const { isCartOpen, openCart, closeCart, refreshKey, triggerRefresh, cartOpenOptions, clearCartOpenOptions } =
    useCart();
  const { user } = useAuth();

  const [items, setItems] = useState<ReservationWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"CART" | "UPLOAD" | "SUCCESS">("CART");
  const [isProcessing, setIsProcessing] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [selectedReservationIds, setSelectedReservationIds] = useState<Set<number>>(new Set());
  const [file, setFile] = useState<File | null>(null);
  const [vendorPaymentMethods, setVendorPaymentMethods] = useState<VendorPaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [configuringReservationId, setConfiguringReservationId] = useState<number | null>(null);
  const [configuringCostumeId, setConfiguringCostumeId] = useState<number | null>(null);
  const [configuringData, setConfiguringData] = useState<CostumeDetailResponse | null>(null);
  const [configuringLocations, setConfiguringLocations] = useState<SavedLocation[]>([]);
  const [isLoadingWizard, setIsLoadingWizard] = useState(false);

  const loadDrawerData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [reservationData, paymentData] = await Promise.all([myReservations(), myPayments()]);
      const actionableReservations = reservationData.filter((reservation) => {
        if (reservation.status === "CART") return true;
        if (reservation.status !== "PENDING_PAYMENT") return false;
        return !hasActivePayment(reservation.id, paymentData);
      });

      setItems(actionableReservations);
      setSelectedReservationIds((current) => {
        const next = new Set<number>();
        for (const id of current) {
          if (actionableReservations.some((item) => item.id === id && isCheckoutSelectable(item))) {
            next.add(id);
          }
        }
        if (next.size === 0) {
          return defaultSelectedIds(actionableReservations);
        }
        return next;
      });
    } catch {
      // Keep drawer quiet on transient failures.
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isCartOpen || !user) return;
    let cancelled = false;

    setIsLoading(true);
    Promise.all([myReservations(), myPayments()])
      .then(([reservationData, paymentData]) => {
        if (cancelled) return;
        const actionableReservations = reservationData.filter((reservation) => {
          if (reservation.status === "CART") return true;
          if (reservation.status !== "PENDING_PAYMENT") return false;
          return !hasActivePayment(reservation.id, paymentData);
        });

        setItems(actionableReservations);

        const optionIds = cartOpenOptions?.reservationIds;
        if (optionIds?.length) {
          const allowed = new Set(
            optionIds.filter((id) =>
              actionableReservations.some((item) => item.id === id && isCheckoutSelectable(item))
            )
          );
          setSelectedReservationIds(allowed.size > 0 ? allowed : defaultSelectedIds(actionableReservations));
        } else {
          setSelectedReservationIds(defaultSelectedIds(actionableReservations));
        }

        if (cartOpenOptions?.vendorId) {
          setSelectedVendorId(cartOpenOptions.vendorId);
        }
        if (cartOpenOptions?.step) {
          setStep(cartOpenOptions.step);
        }
        clearCartOpenOptions();
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isCartOpen, user, refreshKey, cartOpenOptions, clearCartOpenOptions]);

  const cartGroups = useMemo(() => buildCartGroups(items), [items]);

  const selectedGroup = useMemo(() => {
    const group = cartGroups.find((entry) => entry.vendorId === selectedVendorId);
    if (!group) return null;

    const selectedItems = group.items.filter((item) => selectedReservationIds.has(item.id));
    if (selectedItems.length === 0) return null;

    return {
      ...group,
      items: selectedItems,
      subtotal: sumReservationTotals(selectedItems),
      reservationIds: selectedItems.map((item) => item.id),
    };
  }, [cartGroups, selectedReservationIds, selectedVendorId]);

  useEffect(() => {
    if (step !== "UPLOAD" || !selectedVendorId) {
      setVendorPaymentMethods([]);
      return;
    }

    let cancelled = false;
    setLoadingPaymentMethods(true);
    getVendorPaymentMethods(selectedVendorId)
      .then((methods) => {
        if (!cancelled) setVendorPaymentMethods(methods);
      })
      .catch(() => {
        if (!cancelled) setVendorPaymentMethods([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingPaymentMethods(false);
      });

    return () => {
      cancelled = true;
    };
  }, [step, selectedVendorId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeCart]);

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
      return;
    }

    document.body.style.overflow = "";
    setTimeout(() => {
      setStep("CART");
      setFile(null);
      setSelectedVendorId(null);
      setSelectedReservationIds(new Set());
      setVendorPaymentMethods([]);
    }, 300);
  }, [isCartOpen]);

  function toggleReservationSelection(reservationId: number) {
    setSelectedReservationIds((current) => {
      const next = new Set(current);
      if (next.has(reservationId)) {
        next.delete(reservationId);
      } else {
        next.add(reservationId);
      }
      return next;
    });
  }

  function toggleVendorSelection(vendorId: number) {
    const group = cartGroups.find((entry) => entry.vendorId === vendorId);
    if (!group) return;

    const selectableIds = group.selectableItems.map((item) => item.id);
    setSelectedReservationIds((current) => {
      const allSelected = selectableIds.every((id) => current.has(id));
      const next = new Set(current);
      if (allSelected) {
        selectableIds.forEach((id) => next.delete(id));
      } else {
        selectableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  async function handleRemove(reservationId: number) {
    setRemovingId(reservationId);
    try {
      await removeReservation(reservationId);
      setItems((current) => current.filter((item) => item.id !== reservationId));
      setSelectedReservationIds((current) => {
        const next = new Set(current);
        next.delete(reservationId);
        return next;
      });
      triggerRefresh();
      toast.success("Removed from your cart.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to remove this reservation.");
    } finally {
      setRemovingId(null);
    }
  }

  function handleProceedToPayment(vendorId: number) {
    const group = cartGroups.find((entry) => entry.vendorId === vendorId);
    if (!group) return;

    const selectedInGroup = group.items.filter((item) => selectedReservationIds.has(item.id));
    if (selectedInGroup.length === 0) {
      toast.error("Select at least one costume to pay.");
      return;
    }

    if (groupHasIncompleteSelectedItems(group, selectedReservationIds)) {
      toast.error("Complete booking details for every selected costume before checkout.");
      return;
    }

    setSelectedVendorId(vendorId);
    setStep("UPLOAD");
    setFile(null);
  }

  async function startCompleteBooking(item: ReservationWithItems) {
    const costumeId = item.items?.[0]?.costume_id;
    if (!costumeId) {
      toast.error("Costume details are missing for this cart item.");
      return;
    }

    setIsLoadingWizard(true);
    setConfiguringReservationId(item.id);
    setConfiguringCostumeId(costumeId);
    try {
      const [detail, locations] = await Promise.all([getCostume(costumeId), listSavedLocations()]);
      setConfiguringData(detail);
      setConfiguringLocations(locations);
      closeCart();
      setWizardOpen(true);
    } catch {
      toast.error("Failed to load booking details.");
      setConfiguringReservationId(null);
      setConfiguringCostumeId(null);
    } finally {
      setIsLoadingWizard(false);
    }
  }

  function closeConfigureWizard(open: boolean) {
    setWizardOpen(open);
    if (!open) {
      setConfiguringReservationId(null);
      setConfiguringCostumeId(null);
      setConfiguringData(null);
      setConfiguringLocations([]);
      void loadDrawerData();
      openCart();
    }
  }

  async function handleUploadAndPay() {
    if (!selectedGroup) {
      toast.error("Choose a vendor checkout group first.");
      setStep("CART");
      return;
    }

    if (!file) {
      toast.error("Please select a payment receipt.");
      return;
    }

    setIsProcessing(true);
    try {
      const cartItems = selectedGroup.items.filter((item) => item.status === "CART");
      await Promise.all(cartItems.map((item) => checkoutReservation(item.id)));

      const form = new FormData();
      form.set("reservationIds", JSON.stringify(selectedGroup.reservationIds));
      form.set("amount", String(selectedGroup.subtotal));
      form.set("proof", file);

      await apiFetch("/api/payments/proof", { method: "POST", body: form });

      setItems((current) => current.filter((item) => !selectedGroup.reservationIds.includes(item.id)));
      setSelectedReservationIds((current) => {
        const next = new Set(current);
        selectedGroup.reservationIds.forEach((id) => next.delete(id));
        return next;
      });
      triggerRefresh();
      setStep("SUCCESS");
      setSelectedVendorId(null);
      setFile(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
      await loadDrawerData();
    } finally {
      setIsProcessing(false);
    }
  }

  if (!user || user.role === "ADMIN") return null;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm transition-opacity duration-300",
          isCartOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={closeCart}
      />

      <div
        className={cn(
          "cart-drawer-shell fixed inset-y-0 right-0 z-[101] flex w-full max-w-md flex-col border-l border-border shadow-coral transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isCartOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="relative border-b border-border bg-brand-coral-soft/40 px-6 py-5">
          <div className="pointer-events-none absolute inset-0 cart-drawer-header-glow" aria-hidden="true" />
          <div className="relative space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-primary">Backstage checkout</p>
                <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                  {step === "CART" ? "Your curation" : step === "UPLOAD" ? "Vendor payment" : "Curtain call"}
                </h2>
                {step === "CART" ? (
                  <p className={cn(actionLabelClass, "text-muted-foreground")}>
                    Select looks, then pay each vendor separately
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Close cart"
                className="-mr-1 rounded-full p-2 text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
              >
                <Cross2Icon className="size-5" />
              </button>
            </div>
            <CartCheckoutSteps step={step} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex animate-pulse flex-col gap-6">
              {[1, 2].map((index) => (
                <div key={index} className="flex gap-4">
                  <div className="size-20 rounded-sm bg-muted" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : cartGroups.length === 0 && step === "CART" ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 px-4 text-center">
              <div className="rounded-full border border-border bg-brand-coral-soft/50 p-5 text-primary/35">
                <ImageIcon className="size-8" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Empty rack</p>
                <p className="font-display text-xl font-semibold text-foreground">Your curation is empty</p>
                <p className="text-sm text-muted-foreground">Add costumes from the marketplace, then pay each vendor here.</p>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className={cn(
                  "mt-2 inline-flex h-10 items-center rounded-xl bg-primary px-6 text-primary-foreground transition-colors hover:bg-primary/90 hover-snap",
                  actionLabelClass
                )}
              >
                Continue browsing
              </button>
            </div>
          ) : step === "CART" ? (
            <div className="flex flex-col gap-8">
              {cartGroups.map((group) => {
                const selectableIds = group.selectableItems.map((item) => item.id);
                const selectedInGroup = group.items.filter((item) => selectedReservationIds.has(item.id));
                const selectedSubtotal = sumReservationTotals(selectedInGroup);
                const allSelectableSelected =
                  selectableIds.length > 0 && selectableIds.every((id) => selectedReservationIds.has(id));

                return (
                  <section key={group.vendorId} className="panel-card overflow-hidden p-5 shadow-coral-hover">
                    <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className={cn(actionLabelClass, "text-primary")}>Vendor</p>
                        <p className="font-display text-xl font-semibold text-foreground">{group.vendorName}</p>
                        <p className={cn("mt-1", actionLabelClass, "text-muted-foreground")}>
                          {selectedInGroup.length} of {group.items.length} selected · PHP{" "}
                          {selectedSubtotal.toLocaleString()}
                        </p>
                        {selectableIds.length > 0 ? (
                          <div className="mt-2 flex items-center gap-2">
                            <Checkbox
                              id={`cart-vendor-${group.vendorId}`}
                              checked={
                                allSelectableSelected
                                  ? true
                                  : selectedInGroup.length > 0
                                    ? "indeterminate"
                                    : false
                              }
                              onCheckedChange={() => toggleVendorSelection(group.vendorId)}
                            />
                            <Label
                              htmlFor={`cart-vendor-${group.vendorId}`}
                              className="cursor-pointer text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                            >
                              {allSelectableSelected ? "Deselect all" : "Select all from this vendor"}
                            </Label>
                          </div>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleProceedToPayment(group.vendorId)}
                        disabled={
                          selectedInGroup.length === 0 ||
                          groupHasIncompleteSelectedItems(group, selectedReservationIds)
                        }
                        className={cn(
                          "inline-flex h-10 shrink-0 items-center rounded-xl bg-primary px-4 text-primary-foreground transition-colors hover:bg-primary/90 hover-snap disabled:cursor-not-allowed disabled:opacity-50",
                          actionLabelClass
                        )}
                      >
                        {group.hasCartItems ? "Proceed to payment" : "Continue payment"}
                      </button>
                    </div>

                    <div className="mt-4 flex flex-col gap-1">
                      {group.items.map((item) => {
                        const fulfillment = reservationFulfillmentLine(item);
                        const fulfillmentFee =
                          Number(item.fulfillment?.outbound_fee || 0) + Number(item.fulfillment?.return_fee || 0);

                        return (
                          <CartLineItem
                            key={item.id}
                            item={item}
                            isSelected={selectedReservationIds.has(item.id)}
                            isRemoving={removingId === item.id}
                            isProcessing={isProcessing}
                            isLoadingWizard={isLoadingWizard}
                            fulfillmentSummary={fulfillment?.summary ?? null}
                            fulfillmentLocation={fulfillment?.location ?? null}
                            fulfillmentFee={fulfillmentFee}
                            isLalamoveFulfillment={item.fulfillment?.delivery_provider === "LALAMOVE"}
                            returnFeeIsEstimate={item.fulfillment?.return_fee_is_estimate === true}
                            onToggle={() => toggleReservationSelection(item.id)}
                            onRemove={() => void handleRemove(item.id)}
                            onCompleteBooking={() => void startCompleteBooking(item)}
                          />
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : step === "UPLOAD" && selectedGroup ? (
            <div className="flex h-full flex-col gap-8">
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setStep("CART")}
                  className={cn(actionLabelClass, "text-muted-foreground transition-colors hover:text-foreground")}
                >
                  ← Back to curation
                </button>
                <div className="rounded-xl border border-border bg-brand-gold-soft/50 px-5 py-6 text-center">
                  <p className={cn(actionLabelClass, "text-accent-foreground")}>{selectedGroup.vendorName}</p>
                  <p className="mt-2 font-display text-4xl font-semibold tabular-nums text-foreground">
                    PHP {selectedGroup.subtotal.toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Pay using the details below, then upload one receipt for {selectedGroup.items.length} selected
                    costume{selectedGroup.items.length === 1 ? "" : "s"}.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className={cn(actionLabelClass, "text-muted-foreground")}>Vendor payment details</p>
                {loadingPaymentMethods ? (
                  <div className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                    Loading payment details...
                  </div>
                ) : vendorPaymentMethods.length > 0 ? (
                  vendorPaymentMethods.map((method) => <PaymentMethodCard key={method.id} method={method} />)
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
                    This vendor has not published payment details yet. Contact them if you need help completing payment.
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-xl border border-border bg-muted/25 px-4 py-4">
                <p className={cn(actionLabelClass, "text-muted-foreground")}>Selected looks</p>
                {selectedGroup.items.map((item) => {
                  const fulfillmentLine = reservationFulfillmentLine(item);
                  return (
                    <div key={item.id} className="space-y-1">
                      <p className="font-medium text-foreground">
                        {item.items?.[0]?.Costume?.name || `Reservation #${item.id}`}
                      </p>
                      {fulfillmentLine ? (
                        <p className={cn(actionLabelClass, "text-muted-foreground")}>{fulfillmentLine.summary}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="flex-1">
                <label
                  htmlFor="receipt-upload"
                  className={cn(
                    "relative flex h-48 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/20 transition-colors hover:bg-muted/40",
                    file && "border-primary bg-brand-coral-soft/30"
                  )}
                >
                  {file ? (
                    <div className="z-10 flex flex-col items-center gap-2 p-4 text-center">
                      <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <UploadIcon className="size-5" />
                      </div>
                      <p className="max-w-[220px] truncate text-sm font-semibold">{file.name}</p>
                      <p className="text-xs text-muted-foreground">Tap to change file</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <UploadIcon className="size-6" />
                      <div className="text-center text-sm">
                        <p className="font-medium text-foreground">Upload your receipt</p>
                        <p className="mt-1 text-xs">PNG, JPG or PDF up to 5MB</p>
                      </div>
                    </div>
                  )}
                  <input
                    id="receipt-upload"
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-6 px-4 text-center">
              <div className="flex size-20 items-center justify-center rounded-full border border-primary/25 bg-brand-coral-soft text-primary">
                <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Curtain call</p>
                <p className="font-display text-3xl font-semibold text-foreground">Payment received</p>
                <p className="mx-auto max-w-[280px] text-sm leading-relaxed text-muted-foreground">
                  Your receipt is with the vendor for verification. We&apos;ll notify you once it&apos;s confirmed.
                </p>
              </div>
              <a
                href="/reservations"
                className={cn(
                  "inline-flex h-11 items-center justify-center rounded-xl bg-primary px-8 text-primary-foreground transition-colors hover:bg-primary/90 hover-snap",
                  actionLabelClass
                )}
              >
                View reservations
              </a>
            </div>
          )}
        </div>

        {step === "UPLOAD" && selectedGroup && (
          <div className="border-t border-border bg-muted/20 p-6">
            <button
              type="button"
              onClick={() => void handleUploadAndPay()}
              disabled={isProcessing || !file}
              className={cn(
                "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground transition-all hover:bg-primary/90 hover-snap disabled:opacity-50",
                actionLabelClass
              )}
            >
              {isProcessing ? (
                <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              ) : (
                "Confirm & pay this vendor"
              )}
            </button>
          </div>
        )}
      </div>

      {configuringData && configuringCostumeId && configuringReservationId ? (
        <ReservationWizard
          costumeId={configuringCostumeId}
          data={configuringData}
          savedLocations={configuringLocations}
          open={wizardOpen}
          onOpenChange={closeConfigureWizard}
          intent="reserve"
          reservationId={configuringReservationId}
        />
      ) : null}
    </>
  );
}
