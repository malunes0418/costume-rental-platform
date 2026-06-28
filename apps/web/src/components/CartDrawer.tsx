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
import { resolveApiAsset } from "../lib/assets";
import {
  isCheckoutSelectable,
  sumReservationTotals,
  vendorIdForReservation,
  vendorNameForReservation,
} from "../lib/cart";
import { FULFILLMENT_METHOD_LABELS, formatLocationSummary, type SavedLocation } from "../lib/fulfillment";
import { countRentalDaysInclusive } from "../lib/pricing";
import { getCostume, type CostumeDetailResponse } from "../lib/costumes";
import { getVendorPaymentMethods, type VendorPaymentMethod } from "../lib/vendor";
import { ReservationWizard } from "./ReservationWizard";
import { toast } from "sonner";
import { CopyIcon, Cross2Icon, ImageIcon, UploadIcon } from "@radix-ui/react-icons";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "../lib/utils";

function formatDate(date: string) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

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

async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard.");
  } catch {
    toast.error("Unable to copy.");
  }
}

function PaymentMethodCard({ method }: { method: VendorPaymentMethod }) {
  return (
    <div className="space-y-3 rounded-sm border border-border bg-background px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{method.label}</p>
          {method.bank_name ? (
            <p className="mt-1 text-xs text-muted-foreground">Bank: {method.bank_name}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Account name</p>
            <p className="truncate text-sm text-foreground">{method.account_name}</p>
          </div>
          <button
            type="button"
            onClick={() => void copyToClipboard(method.account_name)}
            className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-primary"
          >
            <CopyIcon className="size-3" />
            Copy
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Account number</p>
            <p className="truncate text-sm text-foreground">{method.account_number}</p>
          </div>
          <button
            type="button"
            onClick={() => void copyToClipboard(method.account_number)}
            className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-primary"
          >
            <CopyIcon className="size-3" />
            Copy
          </button>
        </div>
      </div>

      {method.instructions ? (
        <p className="text-xs leading-6 text-muted-foreground">{method.instructions}</p>
      ) : null}

      {method.qr_image_url ? (
        <div className="inline-block overflow-hidden rounded-sm border border-border bg-muted/20 p-2">
          <img
            src={resolveApiAsset(method.qr_image_url)}
            alt={`${method.label} QR code`}
            className="h-36 w-36 object-contain"
          />
        </div>
      ) : null}
    </div>
  );
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
          "fixed inset-y-0 right-0 z-[101] flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isCartOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-6">
          <div className="space-y-1">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {step === "CART" ? "Your Curation" : step === "UPLOAD" ? "Vendor Payment" : "Confirmed"}
            </h2>
            {step === "CART" && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Select costumes, then pay each vendor separately
              </p>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-2 -mr-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Cross2Icon className="h-5 w-5" />
          </button>
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
            <div className="flex h-full flex-col items-center justify-center space-y-4 text-center text-muted-foreground">
              <div className="flex size-16 items-center justify-center rounded-full border border-border bg-muted/30">
                <ImageIcon className="h-6 w-6 opacity-50" />
              </div>
              <p className="font-display text-xl text-foreground">Your curation is empty.</p>
              <p className="text-sm">Add costumes to your cart and pay each vendor separately.</p>
              <button
                onClick={closeCart}
                className="mt-4 border-b border-primary pb-1 text-xs font-semibold uppercase tracking-widest text-primary transition-opacity hover:opacity-70"
              >
                Continue Browsing
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
                  <section key={group.vendorId} className="space-y-5 rounded-sm border border-border p-5">
                    <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                      <div className="min-w-0">
                        <p className="font-display text-xl font-semibold text-foreground">{group.vendorName}</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
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
                        className="inline-flex h-9 shrink-0 items-center rounded-md border border-primary bg-primary px-4 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {group.hasCartItems ? "Proceed to Payment" : "Continue Payment"}
                      </button>
                    </div>

                    <div className="flex flex-col gap-5">
                      {group.items.map((item) => {
                        const image = item.items?.[0]?.Costume?.CostumeImages?.[0]?.image_url;
                        const name = item.items?.[0]?.Costume?.name || "Costume";
                        const days =
                          item.start_date && item.end_date
                            ? countRentalDaysInclusive(item.start_date, item.end_date)
                            : 0;
                        const isPendingPayment = item.status === "PENDING_PAYMENT";
                        const isDraft = item.status === "CART" && isCartReservationDraft(item);
                        const selectable = isCheckoutSelectable(item);
                        const isSelected = selectedReservationIds.has(item.id);
                        const fulfillmentLine = reservationFulfillmentLine(item);
                        const fulfillmentFee =
                          Number(item.fulfillment?.outbound_fee || 0) + Number(item.fulfillment?.return_fee || 0);

                        return (
                          <div key={item.id} className="group flex gap-4">
                            {selectable ? (
                              <div className="mt-1 shrink-0">
                                <Checkbox
                                  id={`cart-drawer-item-${item.id}`}
                                  checked={isSelected}
                                  onCheckedChange={() => toggleReservationSelection(item.id)}
                                  aria-label={isSelected ? `Deselect ${name}` : `Select ${name}`}
                                />
                              </div>
                            ) : (
                              <div className="mt-1 size-4 shrink-0" />
                            )}

                            <div className="size-20 shrink-0 overflow-hidden rounded-sm border border-border bg-muted">
                              {image ? (
                                <img
                                  src={resolveApiAsset(image)}
                                  alt={name}
                                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <ImageIcon className="h-6 w-6 opacity-20" />
                                </div>
                              )}
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate font-display text-lg font-semibold text-foreground">{name}</p>
                                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                    {isPendingPayment ? "Ready for receipt" : isDraft ? "Needs setup" : "In Cart"}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemove(item.id)}
                                  disabled={removingId === item.id || isProcessing}
                                  className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                                >
                                  {removingId === item.id ? "Removing" : "Remove"}
                                </button>
                              </div>
                              {isDraft ? (
                                <div className="mt-2 space-y-2">
                                  <p className="text-xs text-muted-foreground">
                                    Choose dates and delivery before checkout.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => void startCompleteBooking(item)}
                                    disabled={isLoadingWizard}
                                    className="text-[10px] font-semibold uppercase tracking-widest text-primary transition-opacity hover:opacity-70 disabled:opacity-40"
                                  >
                                    Complete booking
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {formatDate(item.start_date || "")} - {formatDate(item.end_date || "")} ({days} day
                                    {days !== 1 ? "s" : ""})
                                  </p>
                                  {fulfillmentLine ? (
                                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                      {fulfillmentLine.summary}
                                    </p>
                                  ) : null}
                                  {fulfillmentLine?.location ? (
                                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                                      {fulfillmentLine.location}
                                    </p>
                                  ) : null}
                                  {fulfillmentFee > 0 ? (
                                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                                      Includes PHP {Number(fulfillmentFee).toLocaleString()} in fulfillment fees
                                    </p>
                                  ) : null}
                                  <p className="mt-2 text-sm font-medium">
                                    PHP {Number(item.total_price).toLocaleString()}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : step === "UPLOAD" && selectedGroup ? (
            <div className="flex h-full flex-col gap-8">
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setStep("CART")}
                  className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                >
                  Back to Cart
                </button>
                <div className="space-y-2 text-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {selectedGroup.vendorName}
                  </p>
                  <p className="font-display text-5xl font-semibold">PHP {selectedGroup.subtotal.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">
                    Pay using the details below, then upload one receipt for {selectedGroup.items.length} selected
                    costume{selectedGroup.items.length === 1 ? "" : "s"}.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Vendor payment details
                </p>
                {loadingPaymentMethods ? (
                  <div className="rounded-sm border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                    Loading payment details...
                  </div>
                ) : vendorPaymentMethods.length > 0 ? (
                  vendorPaymentMethods.map((method) => <PaymentMethodCard key={method.id} method={method} />)
                ) : (
                  <div className="rounded-sm border border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
                    This vendor has not published payment details yet. Contact them if you need help completing payment.
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-sm border border-border bg-muted/20 px-4 py-4">
                {selectedGroup.items.map((item) => {
                  const fulfillmentLine = reservationFulfillmentLine(item);
                  return (
                    <div key={item.id} className="space-y-1 text-left">
                      <p className="font-medium text-foreground">
                        {item.items?.[0]?.Costume?.name || `Reservation #${item.id}`}
                      </p>
                      {fulfillmentLine ? (
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {fulfillmentLine.summary}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="flex-1">
                <label
                  htmlFor="receipt-upload"
                  className={cn(
                    "relative flex h-48 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-sm border-2 border-dashed border-border bg-muted/20 transition-colors hover:bg-muted/50",
                    file && "border-solid border-primary bg-muted/10"
                  )}
                >
                  {file ? (
                    <div className="z-10 flex flex-col items-center gap-2 p-4 text-center">
                      <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <UploadIcon className="h-5 w-5" />
                      </div>
                      <p className="max-w-[220px] truncate text-sm font-semibold">{file.name}</p>
                      <p className="text-xs text-muted-foreground">Click to change file</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <UploadIcon className="h-6 w-6" />
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
            <div className="flex h-full flex-col items-center justify-center space-y-6 text-center">
              <div className="flex size-20 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="font-display text-3xl font-semibold">Payment Received</p>
                <p className="mx-auto max-w-[280px] text-sm leading-relaxed text-muted-foreground">
                  Your receipt has been sent to the vendor for verification. We&apos;ll notify you once it is complete.
                </p>
              </div>
              <a
                href="/reservations"
                className="mt-4 inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-all hover:bg-primary/90"
              >
                View Reservations
              </a>
            </div>
          )}
        </div>

        {step === "UPLOAD" && selectedGroup && (
          <div className="border-t border-border bg-background p-6">
            <button
              onClick={handleUploadAndPay}
              disabled={isProcessing || !file}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background/30 border-t-background" />
              ) : (
                "Confirm & Pay This Vendor"
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
