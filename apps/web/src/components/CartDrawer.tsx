"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useCart } from "../lib/CartContext";
import { useAuth } from "../lib/auth";
import { myReservations, checkoutReservation, type ReservationWithItems } from "../lib/account";
import { apiFetch } from "../lib/api";
import { resolveApiAsset } from "../lib/assets";
import { toast } from "sonner";
import { Cross2Icon, ImageIcon, UploadIcon } from "@radix-ui/react-icons";
import { cn } from "../lib/utils";

function daysBetween(start: string, end: string) {
  if (!start || !end) return 0;
  return Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)));
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function CartDrawer() {
  const { isCartOpen, closeCart, refreshKey } = useCart();
  const { user } = useAuth();
  
  const [items, setItems] = useState<ReservationWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"CART" | "UPLOAD" | "SUCCESS">("CART");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Upload State
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isCartOpen || !user) return;
    let cancelled = false;
    setIsLoading(true);
    myReservations()
      .then(res => {
        if (!cancelled) {
          setItems(res.filter(r => r.status === "CART" || r.status === "PENDING_PAYMENT"));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [isCartOpen, user, refreshKey]);

  const grandTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.total_price), 0);
  }, [items]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeCart]);

  // Lock body scroll when open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      // Reset state on close
      setTimeout(() => {
        setStep("CART");
        setFile(null);
      }, 300);
    }
  }, [isCartOpen]);

  async function handleCheckout() {
    setStep("UPLOAD");
  }

  async function handleUploadAndPay() {
    if (!file) {
      toast.error("Please select a payment receipt.");
      return;
    }
    
    setIsProcessing(true);
    try {
      // 1. Checkout all items to PENDING_PAYMENT
      const cartItems = items.filter(item => item.status === "CART");
      await Promise.all(cartItems.map(item => checkoutReservation(item.id)));
      
      // 2. Upload one proof for all reservation IDs
      const form = new FormData();
      const ids = items.map(i => i.id);
      form.set("reservationIds", JSON.stringify(ids));
      form.set("amount", String(grandTotal));
      form.set("proof", file);

      await apiFetch("/api/payments/proof", { method: "POST", body: form });
      
      setStep("SUCCESS");
    } catch (e: any) {
      toast.error(e.message || "Something went wrong.");
      // Even if proof fails, they might be in PENDING_PAYMENT now.
    } finally {
      setIsProcessing(false);
    }
  }

  if (!user || user.role === "ADMIN") return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm transition-opacity duration-300",
          isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={closeCart}
      />
      
      {/* Drawer */}
      <div 
        className={cn(
          "fixed inset-y-0 right-0 z-[101] w-full max-w-md border-l border-border bg-background shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col",
          isCartOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 py-6 border-b border-border">
          <h2 className="font-playfair text-2xl font-semibold tracking-tight">
            {step === "CART" ? "Your Curation" : step === "UPLOAD" ? "Payment" : "Confirmed"}
          </h2>
          <button 
            onClick={closeCart}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Cross2Icon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col gap-6 animate-pulse">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-4">
                  <div className="size-20 bg-muted rounded-sm" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-3 w-1/2 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 && step === "CART" ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-muted-foreground">
              <div className="size-16 rounded-full border border-border flex items-center justify-center bg-muted/30">
                <ImageIcon className="h-6 w-6 opacity-50" />
              </div>
              <p className="font-playfair text-xl text-foreground">Your curation is empty.</p>
              <p className="text-sm">Discover pieces for your next event.</p>
              <button 
                onClick={closeCart}
                className="mt-4 border-b border-foreground text-xs uppercase tracking-widest font-semibold pb-1 hover:opacity-70 transition-opacity"
              >
                Continue Browsing
              </button>
            </div>
          ) : step === "CART" ? (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-6">
                {items.map(item => {
                  const img = item.items?.[0]?.Costume?.CostumeImages?.[0]?.image_url;
                  const name = item.items?.[0]?.Costume?.name || "Costume";
                  const days = daysBetween(item.start_date, item.end_date);
                  return (
                    <div key={item.id} className="flex gap-5 group">
                      <div className="size-24 shrink-0 rounded-sm border border-border bg-muted overflow-hidden">
                        {img ? (
                          <img src={resolveApiAsset(img)} alt={name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center"><ImageIcon className="h-6 w-6 opacity-20"/></div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center flex-1 min-w-0 py-1">
                        <p className="font-playfair text-lg font-semibold truncate text-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(item.start_date)} – {formatDate(item.end_date)} ({days} day{days !== 1 && 's'})
                        </p>
                        <p className="text-sm font-medium mt-2">₱{Number(item.total_price).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : step === "UPLOAD" ? (
            <div className="flex flex-col gap-8 h-full">
              <div className="space-y-2 text-center mt-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Grand Total</p>
                <p className="font-playfair text-5xl font-semibold">₱{grandTotal.toLocaleString()}</p>
              </div>

              <div className="flex-1 mt-8">
                <label 
                  htmlFor="receipt-upload" 
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-sm bg-muted/20 hover:bg-muted/50 transition-colors cursor-pointer relative overflow-hidden",
                    file && "border-solid border-foreground bg-muted/10"
                  )}
                >
                  {file ? (
                    <div className="flex flex-col items-center gap-2 p-4 text-center z-10">
                      <div className="size-10 rounded-full bg-foreground text-background flex items-center justify-center mb-2">
                        <UploadIcon className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold truncate max-w-[200px]">{file.name}</p>
                      <p className="text-xs text-muted-foreground">Click to change file</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <UploadIcon className="h-6 w-6" />
                      <div className="text-sm text-center">
                        <p className="font-medium text-foreground">Upload your receipt</p>
                        <p className="text-xs mt-1">PNG, JPG or PDF up to 5MB</p>
                      </div>
                    </div>
                  )}
                  <input 
                    id="receipt-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*,application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="size-20 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="font-playfair text-3xl font-semibold">Payment Received</p>
                <p className="text-muted-foreground text-sm max-w-[280px] mx-auto leading-relaxed">
                  Your receipt has been submitted. Our team will verify it shortly.
                </p>
              </div>
              <a 
                href="/reservations"
                className="inline-flex h-12 items-center justify-center rounded-sm bg-foreground px-8 text-xs font-semibold uppercase tracking-widest text-background transition-all hover:bg-foreground/90 mt-4"
              >
                View Reservations
              </a>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {(step === "CART" || step === "UPLOAD") && items.length > 0 && (
          <div className="p-6 border-t border-border bg-background">
            {step === "CART" ? (
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Total</p>
                  <p className="font-playfair text-2xl font-semibold">₱{grandTotal.toLocaleString()}</p>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full h-12 bg-foreground text-background text-xs font-semibold uppercase tracking-widest rounded-sm hover:bg-foreground/90 transition-all"
                >
                  Proceed to Payment
                </button>
              </div>
            ) : (
              <button
                onClick={handleUploadAndPay}
                disabled={isProcessing || !file}
                className="w-full h-12 bg-foreground text-background text-xs font-semibold uppercase tracking-widest rounded-sm hover:bg-foreground/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <div className="h-4 w-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                ) : (
                  "Confirm & Pay"
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
