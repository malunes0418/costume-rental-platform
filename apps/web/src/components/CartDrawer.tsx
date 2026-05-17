"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Cross2Icon, ImageIcon, UploadIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import {
  checkoutReservation,
  myPayments,
  myReservations,
  removeReservation,
  type Payment,
  type ReservationWithItems,
} from "../lib/account";
import { apiFetch } from "../lib/api";
import { resolveApiAsset } from "../lib/assets";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/CartContext";
import { cn } from "../lib/utils";

function daysBetween(start: string, end: string) {
  if (!start || !end) return 0;
  return Math.max(
    1,
    Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24))
  );
}

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
};

function hasActivePayment(reservationId: number, payments: Payment[]) {
  return payments.some(
    (payment) =>
      payment.status !== "REJECTED" &&
      Array.isArray(payment.reservation_ids) &&
      payment.reservation_ids.some((id) => Number(id) === reservationId)
  );
}

function vendorIdForReservation(reservation: ReservationWithItems) {
  return Number(
    reservation.items?.[0]?.Costume?.owner?.id || reservation.items?.[0]?.Costume?.owner_id || 0
  );
}

function vendorNameForReservation(reservation: ReservationWithItems) {
  const owner = reservation.items?.[0]?.Costume?.owner;
  const storeName = owner?.VendorProfile?.business_name?.trim();
  if (storeName) return storeName;
  if (owner?.name) return owner.name;
  const vendorId = vendorIdForReservation(reservation);
  return vendorId ? `Vendor ${vendorId}` : "Vendor";
}

export function CartDrawer() {
  const { isCartOpen, closeCart, refreshKey, triggerRefresh } = useCart();
  const { user } = useAuth();

  const [items, setItems] = useState<ReservationWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"CART" | "UPLOAD" | "SUCCESS">("CART");
  const [isProcessing, setIsProcessing] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);

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
    } catch {
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
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isCartOpen, refreshKey, user]);

  const cartGroups = useMemo(() => {
    const groups = new Map<number, CartGroup>();

    for (const item of items) {
      const vendorId = vendorIdForReservation(item);
      const existing = groups.get(vendorId);

      if (existing) {
        existing.items.push(item);
        existing.subtotal += Number(item.total_price);
        existing.reservationIds.push(item.id);
        existing.hasCartItems = existing.hasCartItems || item.status === "CART";
        continue;
      }

      groups.set(vendorId, {
        vendorId,
        vendorName: vendorNameForReservation(item),
        items: [item],
        subtotal: Number(item.total_price),
        reservationIds: [item.id],
        hasCartItems: item.status === "CART",
      });
    }

    return Array.from(groups.values());
  }, [items]);

  const selectedGroup = useMemo(
    () => cartGroups.find((group) => group.vendorId === selectedVendorId) || null,
    [cartGroups, selectedVendorId]
  );

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
    }, 300);
  }, [isCartOpen]);

  async function handleRemove(reservationId: number) {
    setRemovingId(reservationId);
    try {
      await removeReservation(reservationId);
      setItems((current) => current.filter((item) => item.id !== reservationId));
      triggerRefresh();
      toast.success("Removed from your cart.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to remove this reservation.");
    } finally {
      setRemovingId(null);
    }
  }

  function handleProceedToPayment(vendorId: number) {
    setSelectedVendorId(vendorId);
    setStep("UPLOAD");
    setFile(null);
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

      setItems((current) =>
        current.filter((item) => !selectedGroup.reservationIds.includes(item.id))
      );
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
          "fixed inset-0 z-[100] bg-[color:color-mix(in_oklab,var(--color-foreground)_16%,transparent)] backdrop-blur-[3px] transition-opacity duration-300",
          isCartOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={closeCart}
      />

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-[101] flex w-full max-w-[28rem] flex-col border-l border-border bg-popover shadow-[var(--shadow-overlay)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isCartOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">
              {step === "CART"
                ? "Your Curation"
                : step === "UPLOAD"
                  ? "Vendor Payment"
                  : "Confirmed"}
            </h2>
            {step === "CART" ? (
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Each vendor is checked out separately
              </p>
            ) : null}
          </div>
          <button
            onClick={closeCart}
            className="inline-flex size-10 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-accent hover:text-foreground"
          >
            <Cross2Icon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex animate-pulse flex-col gap-6">
              {[1, 2].map((index) => (
                <div key={index} className="flex gap-4">
                  <div className="size-20 rounded-[var(--radius-sm)] bg-muted" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-3/4 rounded-full bg-muted" />
                    <div className="h-3 w-1/2 rounded-full bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : cartGroups.length === 0 && step === "CART" ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 text-center text-muted-foreground">
              <div className="flex size-16 items-center justify-center rounded-full border border-border bg-card">
                <ImageIcon className="h-6 w-6 opacity-50" />
              </div>
              <p className="text-lg font-semibold text-foreground">Your curation is empty.</p>
              <p className="text-sm">Add costumes to your cart and pay each vendor separately.</p>
              <button
                onClick={closeCart}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2")}
              >
                Continue Browsing
              </button>
            </div>
          ) : step === "CART" ? (
            <div className="flex flex-col gap-8">
              {cartGroups.map((group) => (
                <section
                  key={group.vendorId}
                  className="space-y-5 rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{group.vendorName}</p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {group.items.length} item{group.items.length === 1 ? "" : "s"} • PHP{" "}
                        {group.subtotal.toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleProceedToPayment(group.vendorId)}
                      className={cn(buttonVariants({ variant: "brand", size: "sm" }), "shrink-0")}
                    >
                      {group.hasCartItems ? "Proceed to Payment" : "Continue Payment"}
                    </button>
                  </div>

                  <div className="flex flex-col gap-5">
                    {group.items.map((item) => {
                      const image = item.items?.[0]?.Costume?.CostumeImages?.[0]?.image_url;
                      const name = item.items?.[0]?.Costume?.name || "Costume";
                      const days = daysBetween(item.start_date, item.end_date);
                      const isPendingPayment = item.status === "PENDING_PAYMENT";

                      return (
                        <div key={item.id} className="group flex gap-4">
                          <div className="size-20 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-border bg-muted">
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
                                <p className="truncate text-base font-semibold text-foreground">{name}</p>
                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                  {isPendingPayment ? "Ready for receipt" : "In Cart"}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemove(item.id)}
                                disabled={removingId === item.id || isProcessing}
                                className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                              >
                                {removingId === item.id ? "Removing" : "Remove"}
                              </button>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDate(item.start_date)} - {formatDate(item.end_date)} ({days} day
                              {days !== 1 ? "s" : ""})
                            </p>
                            <p className="mt-2 text-sm font-semibold text-foreground">
                              PHP {Number(item.total_price).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : step === "UPLOAD" && selectedGroup ? (
            <div className="flex h-full flex-col gap-8">
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setStep("CART")}
                  className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Back to Cart
                </button>
                <div className="space-y-2 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {selectedGroup.vendorName}
                  </p>
                  <p className="text-4xl font-semibold tracking-[-0.04em] text-foreground">
                    PHP {selectedGroup.subtotal.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Upload one receipt for {selectedGroup.items.length} costume
                    {selectedGroup.items.length === 1 ? "" : "s"} from this vendor.
                  </p>
                </div>
              </div>

              <div className="flex-1">
                <label
                  htmlFor="receipt-upload"
                  className={cn(
                    "relative flex h-48 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border-2 border-dashed border-border bg-card transition-colors hover:bg-accent/40",
                    file && "border-solid border-foreground bg-muted/10"
                  )}
                >
                  {file ? (
                    <div className="z-10 flex flex-col items-center gap-2 p-4 text-center">
                      <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-foreground text-background">
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
                  Payment Received
                </p>
                <p className="mx-auto max-w-[280px] text-sm leading-relaxed text-muted-foreground">
                  Your receipt has been submitted for vendor review. We&apos;ll notify you once they
                  approve or reject it.
                </p>
              </div>
              <a
                href="/reservations"
                className={cn(buttonVariants({ variant: "brand", size: "lg" }), "mt-2")}
              >
                View Reservations
              </a>
            </div>
          )}
        </div>

        {step === "UPLOAD" && selectedGroup ? (
          <div className="border-t border-border bg-popover p-6">
            <button
              onClick={handleUploadAndPay}
              disabled={isProcessing || !file}
              className={cn(
                buttonVariants({ variant: "brand", size: "lg" }),
                "w-full justify-center disabled:opacity-50"
              )}
            >
              {isProcessing ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background/30 border-t-background" />
              ) : (
                "Confirm & Pay This Vendor"
              )}
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
