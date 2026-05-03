"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CalendarDays, CreditCard, Upload, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

function primaryImage(res: ReservationWithItems) {
  const item = res.items?.[0];
  const imgs = item?.Costume?.CostumeImages || [];
  return imgs.find((i) => i.is_primary)?.image_url || imgs[0]?.image_url || "";
}

const statusColors: Record<string, string> = {
  CART:            "bg-[var(--clr-surface-2)] text-[var(--clr-text-muted)] border-white/10",
  PENDING_PAYMENT: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  CONFIRMED:       "bg-green-500/10 text-green-400 border-green-500/30",
  COMPLETED:       "bg-blue-500/10 text-blue-400 border-blue-500/30",
  CANCELLED:       "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function TripsPage() {
  const { token } = useAuth();
  const [reservations, setReservations] = useState<ReservationWithItems[]>([]);
  const [payments, setPayments]         = useState<Payment[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const [uploadReservationId, setUploadReservationId] = useState<number | null>(null);
  const [amount, setAmount]       = useState("");
  const [file, setFile]           = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const paymentsByReservation = useMemo(() => {
    const m = new Map<number, Payment[]>();
    for (const p of payments) {
      const arr = m.get(p.reservation_id) || [];
      arr.push(p);
      m.set(p.reservation_id, arr);
    }
    return m;
  }, [payments]);

  useEffect(() => {
    if (!token) { setReservations([]); setPayments([]); setIsLoading(false); return; }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    Promise.all([myReservations(token), myPayments(token)])
      .then(([r, p]) => { if (!cancelled) { setReservations(r); setPayments(p); } })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof ApiError ? e.message : "Failed to load trips"); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  async function doUploadProof() {
    setUploadStatus(null);
    if (!token) { setUploadStatus("Please log in."); return; }
    if (!uploadReservationId) { setUploadStatus("Choose a reservation."); return; }
    if (!amount.trim()) { setUploadStatus("Enter an amount."); return; }
    if (!file) { setUploadStatus("Choose a file."); return; }
    try {
      const form = new FormData();
      form.set("reservationId", String(uploadReservationId));
      form.set("amount", amount);
      form.set("proof", file);
      await apiFetch("/api/payments/proof", { method: "POST", token, body: form });
      setUploadStatus("Uploaded successfully!");
      const p = await myPayments(token);
      setPayments(p);
    } catch (e: unknown) {
      setUploadStatus(e instanceof ApiError ? e.message : "Upload failed");
    }
  }

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-12">
        <Card
          className="border shadow-sm"
          style={{ background: "var(--clr-surface)", borderColor: "var(--clr-border)", borderRadius: "var(--radius-xl)" }}
        >
          <CardHeader>
            <CardTitle style={{ fontFamily: "var(--font-display)", color: "var(--clr-text)" }}>Trips</CardTitle>
            <CardDescription style={{ color: "var(--clr-text-muted)" }}>Log in to view your reservations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-full text-white border-0" style={{ background: "var(--clr-crimson)" }}>
              <Link href="/login?next=/trips">Log in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5">
          <CalendarDays className="size-6" style={{ color: "var(--clr-crimson)" }} />
          <h1
            className="text-2xl font-black tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--clr-text)" }}
          >
            Trips
          </h1>
        </div>
        <p className="mt-1.5 text-sm" style={{ color: "var(--clr-text-muted)" }}>
          Reservations, checkout, and payment proof uploads.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 border-red-500/30 bg-red-500/10">
          <AlertCircle className="size-4" />
          <AlertDescription style={{ color: "#f87171" }}>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Reservations list */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card
                key={i}
                className="overflow-hidden border"
                style={{ background: "var(--clr-surface)", borderColor: "var(--clr-border)", borderRadius: "var(--radius-lg)" }}
              >
                <div className="flex flex-col sm:flex-row">
                  <Skeleton className="h-36 sm:w-44" style={{ borderRadius: 0, background: "var(--clr-surface-2)" }} />
                  <CardContent className="flex-1 p-5">
                    <Skeleton className="mb-2 h-5 w-1/2" style={{ background: "var(--clr-surface-2)" }} />
                    <Skeleton className="h-4 w-3/4" style={{ background: "var(--clr-surface-2)" }} />
                  </CardContent>
                </div>
              </Card>
            ))
          ) : reservations.length ? (
            reservations.map((r) => {
              const img   = primaryImage(r);
              const first = r.items?.[0];
              const title = first?.Costume?.name || `Reservation #${r.id}`;
              const pay   = paymentsByReservation.get(r.id) || [];

              return (
                <Card
                  key={r.id}
                  className="overflow-hidden border"
                  style={{ background: "var(--clr-surface)", borderColor: "var(--clr-border)", borderRadius: "var(--radius-lg)" }}
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-44 shrink-0 overflow-hidden" style={{ background: "var(--clr-surface-2)" }}>
                      {img ? (
                        <img src={resolveApiAsset(img)} alt={title} className="h-full w-full min-h-[120px] object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full min-h-[120px] items-center justify-center text-4xl">🎭</div>
                      )}
                    </div>

                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-semibold tracking-tight" style={{ color: "var(--clr-text)", fontFamily: "var(--font-display)" }}>
                            {title}
                          </p>
                          <p className="mt-1 text-sm" style={{ color: "var(--clr-text-muted)" }}>
                            {r.start_date} → {r.end_date} · {r.currency} {Number(r.total_price).toFixed(0)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-semibold border", statusColors[r.status] || "border-white/10 text-[var(--clr-text-muted)]")}
                        >
                          {r.status}
                        </Badge>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {r.status === "CART" && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={async () => {
                              try {
                                await checkoutReservation(token, r.id);
                                setReservations(await myReservations(token));
                              } catch { /* silent */ }
                            }}
                            className="rounded-full text-white border-0 text-xs"
                            style={{ background: "var(--clr-crimson)" }}
                          >
                            <CreditCard className="mr-1.5 size-3.5" />
                            Checkout
                          </Button>
                        )}
                        {r.status === "PENDING_PAYMENT" && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => { setUploadReservationId(r.id); setUploadStatus(null); }}
                            className="rounded-full border-white/10 bg-transparent text-xs hover:bg-white/5"
                            style={{ color: "var(--clr-text-muted)" }}
                          >
                            <Upload className="mr-1.5 size-3.5" />
                            Upload proof
                          </Button>
                        )}
                        {first?.costume_id && (
                          <Button variant="ghost" size="sm" asChild
                            className="rounded-full text-xs hover:bg-white/5"
                            style={{ color: "var(--clr-text-muted)" }}>
                            <Link href={`/costumes/${first.costume_id}`}>View costume</Link>
                          </Button>
                        )}
                      </div>

                      {pay.length > 0 && (
                        <div className="mt-4 rounded-xl p-4 text-sm" style={{ background: "var(--clr-surface-2)" }}>
                          <p className="font-semibold mb-2" style={{ color: "var(--clr-text)" }}>Payments</p>
                          <div className="flex flex-col gap-2">
                            {pay.map((p) => (
                              <div key={p.id} className="flex items-center justify-between gap-3">
                                <span style={{ color: "var(--clr-text-muted)" }}>
                                  {p.status} · ₱{Number(p.amount).toFixed(0)}
                                </span>
                                <a
                                  href={resolveApiAsset(p.proof_url)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 text-xs font-semibold hover:underline"
                                  style={{ color: "var(--clr-gold-light)" }}
                                >
                                  View proof <ExternalLink className="size-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <div
              className="rounded-2xl border p-16 text-center"
              style={{ background: "var(--clr-surface)", borderColor: "var(--clr-border)" }}
            >
              <div className="mb-4 text-5xl">🎭</div>
              <p className="text-[1.05rem]" style={{ color: "var(--clr-text-muted)", fontFamily: "var(--font-display)" }}>
                No reservations yet.
              </p>
              <Button asChild className="mt-6 rounded-full text-white border-0" style={{ background: "var(--clr-crimson)" }}>
                <Link href="/">Browse Costumes</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Upload sidebar */}
        <div className="lg:col-span-1">
          <Card
            className="sticky top-24 border"
            style={{ background: "var(--clr-surface)", borderColor: "var(--clr-border)", borderRadius: "var(--radius-lg)" }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Upload className="size-4" style={{ color: "var(--clr-gold)" }} />
                <CardTitle className="text-base font-semibold" style={{ color: "var(--clr-text)" }}>
                  Payment proof upload
                </CardTitle>
              </div>
              <CardDescription style={{ color: "var(--clr-text-muted)", fontSize: "0.8rem" }}>
                For reservations in{" "}
                <span className="font-semibold text-yellow-400">PENDING_PAYMENT</span>.
              </CardDescription>
            </CardHeader>
            <Separator style={{ background: "var(--clr-border)" }} />
            <CardContent className="flex flex-col gap-4 pt-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-wider" style={{ color: "var(--clr-text-muted)" }}>
                  Reservation
                </Label>
                <Select
                  value={uploadReservationId?.toString() ?? ""}
                  onValueChange={(val: string) => setUploadReservationId(val ? Number(val) : null)}
                >
                  <SelectTrigger
                    className="rounded-xl border-white/10 bg-[var(--clr-surface-2)] text-sm"
                    style={{ color: "var(--clr-text)" }}
                  >
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent style={{ background: "var(--clr-surface-2)", border: "1px solid var(--clr-border)" }}>
                    {reservations
                      .filter((r) => r.status === "PENDING_PAYMENT")
                      .map((r) => (
                        <SelectItem key={r.id} value={r.id.toString()} style={{ color: "var(--clr-text)" }}>
                          #{r.id} · {r.start_date} → {r.end_date}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proof-amount" className="text-xs uppercase tracking-wider" style={{ color: "var(--clr-text-muted)" }}>
                  Amount
                </Label>
                <Input
                  id="proof-amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder="e.g. 120"
                  className="rounded-xl border-white/10 bg-[var(--clr-surface-2)] text-sm"
                  style={{ color: "var(--clr-text)" }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proof-file" className="text-xs uppercase tracking-wider" style={{ color: "var(--clr-text-muted)" }}>
                  Proof file
                </Label>
                <input
                  id="proof-file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="text-sm cursor-pointer file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[var(--clr-surface-3)] file:px-3 file:py-1.5 file:text-xs file:font-medium"
                  style={{ color: "var(--clr-text-muted)" }}
                  accept="image/*,application/pdf"
                />
              </div>

              <Button
                type="button"
                onClick={doUploadProof}
                className="w-full rounded-xl text-white border-0 font-semibold"
                style={{ background: "var(--clr-crimson)" }}
              >
                <Upload className="mr-2 size-4" />
                Upload proof
              </Button>

              {uploadStatus && (
                <p
                  className={cn("text-sm text-center", uploadStatus.includes("success") ? "text-green-400" : "")}
                  style={uploadStatus.includes("success") ? {} : { color: "var(--clr-text-muted)" }}
                >
                  {uploadStatus}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
