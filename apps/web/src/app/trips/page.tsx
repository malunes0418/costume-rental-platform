"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError, apiFetch } from "../../lib/api";
import { resolveApiAsset } from "../../lib/assets";
import { useAuth } from "../../lib/auth";
import {
  checkoutReservation,
  myPayments,
  myReservations,
  type Payment,
  type ReservationWithItems,
} from "../../lib/account";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  CONFIRMED:       "Confirmed",
  COMPLETED:       "Completed",
  CANCELLED:       "Cancelled",
};

const STATUS_CLASS: Record<string, string> = {
  CART:            "text-muted-foreground border-border",
  PENDING_PAYMENT: "text-amber-600 border-amber-400/40 dark:text-amber-400",
  CONFIRMED:       "text-emerald-700 border-emerald-400/40 dark:text-emerald-400",
  COMPLETED:       "text-blue-700 border-blue-400/40 dark:text-blue-400",
  CANCELLED:       "text-destructive border-destructive/30",
};

// ── component ─────────────────────────────────────────────────────────────────

export default function ReservationsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<ReservationWithItems[]>([]);
  const [payments, setPayments]         = useState<Payment[]>([]);
  const [isLoading, setIsLoading]       = useState(true);

  const [uploadReservationId, setUploadReservationId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [file, setFile]     = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const paymentsByReservation = useMemo(() => {
    const m = new Map<number, Payment[]>();
    for (const p of payments) {
      const arr = m.get(p.reservation_id) || [];
      arr.push(p);
      m.set(p.reservation_id, arr);
    }
    return m;
  }, [payments]);

  const pendingPaymentReservations = useMemo(
    () => reservations.filter((r) => r.status === "PENDING_PAYMENT"),
    [reservations]
  );

  useEffect(() => {
    if (!user) { setReservations([]); setPayments([]); setIsLoading(false); return; }
    let cancelled = false;
    setIsLoading(true);
    Promise.all([myReservations(), myPayments()])
      .then(([r, p]) => { if (!cancelled) { setReservations(r); setPayments(p); } })
      .catch((e: unknown) => {
        if (!cancelled) toast.error(e instanceof ApiError ? e.message : "Failed to load reservations");
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  async function doCheckout(reservationId: number) {
    if (!user) return;
    try {
      await checkoutReservation(reservationId);
      toast.success("Reservation checked out.");
      setReservations(await myReservations());
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Checkout failed");
    }
  }

  async function doUploadProof() {
    if (!user) { toast.error("Please log in."); return; }
    if (!uploadReservationId) { toast.error("Select a reservation."); return; }
    if (!amount.trim()) { toast.error("Enter an amount."); return; }
    if (!file) { toast.error("Choose a file."); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.set("reservationId", String(uploadReservationId));
      form.set("amount", amount);
      form.set("proof", file);
      await apiFetch("/api/payments/proof", { method: "POST", body: form });
      toast.success("Proof uploaded successfully.");
      const p = await myPayments();
      setPayments(p);
      setUploadReservationId(null);
      setAmount("");
      setFile(null);
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

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
            href="/login?next=/trips"
            className="inline-flex h-12 items-center rounded-md bg-foreground px-8 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
          >
            Log in to continue
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
                const statusLabel = STATUS_LABEL[r.status] || r.status;
                const statusClass = STATUS_CLASS[r.status] || "text-muted-foreground border-border";

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
                            statusClass
                          )}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-3">
                        {r.status === "CART" && (
                          <button
                            type="button"
                            onClick={() => doCheckout(r.id)}
                            className="inline-flex h-9 items-center gap-2 rounded-sm border border-foreground bg-foreground px-5 text-[10px] font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85"
                          >
                            <CreditCard className="size-3.5" />
                            Checkout
                          </button>
                        )}
                        {r.status === "PENDING_PAYMENT" && (
                          <button
                            type="button"
                            onClick={() => setUploadReservationId(r.id)}
                            className="inline-flex h-9 items-center gap-2 rounded-sm border border-border px-5 text-[10px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
                          >
                            <Upload className="size-3.5" />
                            Upload proof
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
                                  p.status === "APPROVED"
                                    ? "text-emerald-700 border-emerald-400/40 dark:text-emerald-400"
                                    : p.status === "REJECTED"
                                    ? "text-destructive border-destructive/30"
                                    : "text-muted-foreground border-border"
                                )}>
                                  {p.status}
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
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Reservation
                </Label>
                <Select
                  value={uploadReservationId?.toString() ?? ""}
                  onValueChange={(val: string) => setUploadReservationId(val ? Number(val) : null)}
                >
                  <SelectTrigger className="h-11 rounded-sm border-border bg-transparent text-sm">
                    <SelectValue placeholder="Select a reservation…" />
                  </SelectTrigger>
                  <SelectContent className="rounded-sm border-border bg-background shadow-none">
                    {pendingPaymentReservations.length ? (
                      pendingPaymentReservations.map((r) => (
                        <SelectItem key={r.id} value={r.id.toString()} className="text-sm text-foreground">
                          #{r.id} · {formatDate(r.start_date)} → {formatDate(r.end_date)}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                        No pending reservations
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proof-amount" className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Amount (₱)
                </Label>
                <Input
                  id="proof-amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder="e.g. 1200"
                  className="h-11 rounded-sm border-border bg-transparent text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proof-file" className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Proof file
                </Label>
                <div className="flex h-11 items-center rounded-sm border border-border px-3">
                  <input
                    id="proof-file"
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full cursor-pointer text-xs text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-sm file:border file:border-border file:bg-transparent file:px-3 file:py-1 file:text-[10px] file:font-semibold file:uppercase file:tracking-widest file:text-foreground"
                    accept="image/*,application/pdf"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={doUploadProof}
                disabled={uploading}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2.5 rounded-sm bg-foreground text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="size-3.5" />
                {uploading ? "Uploading…" : "Upload proof"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
