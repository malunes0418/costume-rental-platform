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
import { ExclamationTriangleIcon as AlertCircle, CalendarIcon as CalendarDays, IdCardIcon as CreditCard, UploadIcon as Upload, ExternalLinkIcon as ExternalLink } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

function primaryImage(res: ReservationWithItems) {
  const item = res.items?.[0];
  const imgs = item?.Costume?.CostumeImages || [];
  return imgs.find((i) => i.is_primary)?.image_url || imgs[0]?.image_url || "";
}

const statusColors: Record<string, string> = {
  CART:            "bg-muted text-muted-foreground border-border",
  PENDING_PAYMENT: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  CONFIRMED:       "bg-green-500/10 text-green-500 border-green-500/30",
  COMPLETED:       "bg-blue-500/10 text-blue-500 border-blue-500/30",
  CANCELLED:       "bg-red-500/10 text-red-500 border-red-500/30",
};

export default function TripsPage() {
  const { token } = useAuth();
  const [reservations, setReservations] = useState<ReservationWithItems[]>([]);
  const [payments, setPayments]         = useState<Payment[]>([]);
  const [isLoading, setIsLoading]       = useState(true);

  const [uploadReservationId, setUploadReservationId] = useState<number | null>(null);
  const [amount, setAmount]       = useState("");
  const [file, setFile]           = useState<File | null>(null);

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
    Promise.all([myReservations(token), myPayments(token)])
      .then(([r, p]) => { if (!cancelled) { setReservations(r); setPayments(p); } })
      .catch((e: unknown) => { if (!cancelled) toast.error(e instanceof ApiError ? e.message : "Failed to load trips"); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  async function doUploadProof() {
    if (!token) { toast.error("Please log in."); return; }
    if (!uploadReservationId) { toast.error("Choose a reservation."); return; }
    if (!amount.trim()) { toast.error("Enter an amount."); return; }
    if (!file) { toast.error("Choose a file."); return; }
    try {
      const form = new FormData();
      form.set("reservationId", String(uploadReservationId));
      form.set("amount", amount);
      form.set("proof", file);
      await apiFetch("/api/payments/proof", { method: "POST", token, body: form });
      toast.success("Uploaded successfully!");
      const p = await myPayments(token);
      setPayments(p);
      setUploadReservationId(null);
      setAmount("");
      setFile(null);
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Upload failed");
    }
  }

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-12">
        <Card className="border border-border bg-card shadow-sm rounded-3xl">
          <CardHeader>
            <CardTitle className="display text-foreground">Reservations</CardTitle>
            <CardDescription className="text-muted-foreground">Log in to view your reservations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-full text-primary-foreground border-0 bg-primary hover:bg-primary/90">
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
          <CalendarDays className="size-6 text-primary" />
          <h1 className="text-2xl font-black tracking-tight display text-foreground">
            Reservations
          </h1>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Reservations, checkout, and payment proof uploads.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Reservations list */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border border-border bg-card rounded-2xl">
                <div className="flex flex-col sm:flex-row">
                  <Skeleton className="h-36 sm:w-44 rounded-none bg-muted" />
                  <CardContent className="flex-1 p-5">
                    <Skeleton className="mb-2 h-5 w-1/2 bg-muted" />
                    <Skeleton className="h-4 w-3/4 bg-muted" />
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
                <Card key={r.id} className="overflow-hidden border border-border bg-card rounded-2xl">
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-44 shrink-0 overflow-hidden bg-muted">
                      {img ? (
                        <img src={resolveApiAsset(img)} alt={title} className="h-full w-full min-h-[120px] object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full min-h-[120px] items-center justify-center text-muted-foreground/30">
                          <CalendarDays className="size-12" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-semibold tracking-tight text-foreground display">
                            {title}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {r.start_date} → {r.end_date} · {r.currency} {Number(r.total_price).toFixed(0)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("shrink-0 rounded-full px-3 py-1 text-[0.65rem] font-semibold border", statusColors[r.status] || "border-border text-muted-foreground")}
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
                                toast.success("Checkout successful!");
                                setReservations(await myReservations(token));
                              } catch (e: unknown) {
                                toast.error(e instanceof ApiError ? e.message : "Checkout failed");
                              }
                            }}
                            className="rounded-full text-primary-foreground border-0 text-xs bg-primary hover:bg-primary/90"
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
                            onClick={() => { setUploadReservationId(r.id); }}
                            className="rounded-full border-border bg-transparent text-xs hover:bg-muted text-foreground"
                          >
                            <Upload className="mr-1.5 size-3.5" />
                            Upload proof
                          </Button>
                        )}
                        {first?.costume_id && (
                          <Button variant="ghost" size="sm" asChild className="rounded-full text-xs hover:bg-muted text-muted-foreground">
                            <Link href={`/costumes/${first.costume_id}`}>View costume</Link>
                          </Button>
                        )}
                      </div>

                      {pay.length > 0 && (
                        <div className="mt-4 rounded-xl p-4 text-sm bg-muted">
                          <p className="font-semibold mb-2 text-foreground">Payments</p>
                          <div className="flex flex-col gap-2">
                            {pay.map((p) => (
                              <div key={p.id} className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">
                                  {p.status} · ₱{Number(p.amount).toFixed(0)}
                                </span>
                                <a
                                  href={resolveApiAsset(p.proof_url)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 text-xs font-semibold hover:underline text-primary"
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
            <div className="rounded-3xl border border-border bg-card p-16 text-center">
              <div className="mb-4 flex justify-center text-muted-foreground/30">
                <CalendarDays className="size-16" />
              </div>
              <p className="text-[1.05rem] text-muted-foreground display">
                No reservations yet.
              </p>
              <Button asChild className="mt-6 rounded-full text-primary-foreground border-0 bg-primary hover:bg-primary/90">
                <Link href="/">Browse Costumes</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Upload sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 border border-border bg-card rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Upload className="size-4 text-primary" />
                <CardTitle className="text-base font-semibold text-foreground">
                  Payment proof upload
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                For reservations in{" "}
                <span className="font-semibold text-yellow-500">PENDING_PAYMENT</span>.
              </CardDescription>
            </CardHeader>
            <Separator className="bg-border" />
            <CardContent className="flex flex-col gap-4 pt-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Reservation
                </Label>
                <Select
                  value={uploadReservationId?.toString() ?? ""}
                  onValueChange={(val: string) => setUploadReservationId(val ? Number(val) : null)}
                >
                  <SelectTrigger className="rounded-xl border-border bg-muted text-foreground text-sm">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border border-border">
                    {reservations
                      .filter((r) => r.status === "PENDING_PAYMENT")
                      .map((r) => (
                        <SelectItem key={r.id} value={r.id.toString()} className="text-foreground">
                          #{r.id} · {r.start_date} → {r.end_date}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proof-amount" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Amount
                </Label>
                <Input
                  id="proof-amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder="e.g. 120"
                  className="rounded-xl border-border bg-muted text-foreground text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="proof-file" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Proof file
                </Label>
                <input
                  id="proof-file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="text-sm cursor-pointer file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-border file:px-3 file:py-1.5 file:text-xs file:font-medium text-muted-foreground"
                  accept="image/*,application/pdf"
                />
              </div>

              <Button
                type="button"
                onClick={doUploadProof}
                className="w-full rounded-xl text-primary-foreground border-0 font-semibold bg-primary hover:bg-primary/90"
              >
                <Upload className="mr-2 size-4" />
                Upload proof
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
