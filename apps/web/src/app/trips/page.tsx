"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiError, apiFetch } from "../../lib/api";
import { resolveApiAsset } from "../../lib/assets";
import { useAuth } from "../../lib/auth";
import { checkoutReservation, myPayments, myReservations, type Payment, type ReservationWithItems } from "../../lib/account";

function primaryImage(res: ReservationWithItems) {
  const item = res.items?.[0];
  const c = item?.Costume;
  const imgs = c?.CostumeImages || [];
  return imgs.find((i) => i.is_primary)?.image_url || imgs[0]?.image_url || "";
}

export default function TripsPage() {
  const { token } = useAuth();
  const [reservations, setReservations] = useState<ReservationWithItems[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uploadReservationId, setUploadReservationId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
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
    if (!token) {
      setReservations([]);
      setPayments([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    Promise.all([myReservations(token), myPayments(token)])
      .then(([r, p]) => {
        if (cancelled) return;
        setReservations(r);
        setPayments(p);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "Failed to load trips");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function doUploadProof() {
    setUploadStatus(null);
    if (!token) {
      setUploadStatus("Please log in.");
      return;
    }
    if (!uploadReservationId) {
      setUploadStatus("Choose a reservation.");
      return;
    }
    if (!amount.trim()) {
      setUploadStatus("Enter an amount.");
      return;
    }
    if (!file) {
      setUploadStatus("Choose a file.");
      return;
    }

    try {
      const form = new FormData();
      form.set("reservationId", String(uploadReservationId));
      form.set("amount", amount);
      form.set("proof", file);

      await apiFetch("/api/payments/proof", {
        method: "POST",
        token,
        body: form,
      });
      setUploadStatus("Uploaded.");
      const p = await myPayments(token);
      setPayments(p);
    } catch (e: unknown) {
      setUploadStatus(e instanceof ApiError ? e.message : "Upload failed");
    }
  }

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <h1 className="text-2xl font-semibold tracking-tight">Trips</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Log in to view your reservations.</p>
          <Link
            href="/login?next=/trips"
            className="mt-6 inline-flex rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-600"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Trips</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Reservations, checkout, and payment proof uploads.</p>

      {error ? (
        <div className="mt-6 rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-700 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-3xl border border-black/5 bg-white dark:border-white/10 dark:bg-zinc-950"
              />
            ))
          ) : reservations.length ? (
            reservations.map((r) => {
              const img = primaryImage(r);
              const first = r.items?.[0];
              const title = first?.Costume?.name || `Reservation #${r.id}`;
              const status = r.status;
              const pay = paymentsByReservation.get(r.id) || [];

              return (
                <div
                  key={r.id}
                  className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950"
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-44 aspect-[4/3] bg-zinc-100 dark:bg-white/5">
                      {img ? (
                        <img src={resolveApiAsset(img)} alt={title} className="h-full w-full object-cover" loading="lazy" />
                      ) : null}
                    </div>
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="truncate font-semibold tracking-tight">{title}</div>
                          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            {r.start_date} → {r.end_date} · {r.currency} {Number(r.total_price).toFixed(0)}
                          </div>
                        </div>
                        <div className="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold dark:border-white/15">
                          {status}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {status === "CART" ? (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await checkoutReservation(token, r.id);
                                const updated = await myReservations(token);
                                setReservations(updated);
                              } catch {}
                            }}
                            className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600"
                          >
                            Checkout
                          </button>
                        ) : null}

                        {status === "PENDING_PAYMENT" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setUploadReservationId(r.id);
                              setUploadStatus(null);
                            }}
                            className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold hover:bg-zinc-50 dark:border-white/15 dark:hover:bg-white/5"
                          >
                            Upload payment proof
                          </button>
                        ) : null}

                        {first?.costume_id ? (
                          <Link
                            href={`/costumes/${first.costume_id}`}
                            className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold hover:bg-zinc-50 dark:border-white/15 dark:hover:bg-white/5"
                          >
                            View costume
                          </Link>
                        ) : null}
                      </div>

                      {pay.length ? (
                        <div className="mt-4 rounded-2xl bg-zinc-50 p-4 text-sm dark:bg-white/5">
                          <div className="font-semibold">Payments</div>
                          <div className="mt-2 space-y-2">
                            {pay.map((p) => (
                              <div key={p.id} className="flex items-center justify-between gap-3">
                                <div className="text-zinc-700 dark:text-zinc-300">
                                  {p.status} · ${Number(p.amount).toFixed(0)}
                                </div>
                                <a
                                  href={resolveApiAsset(p.proof_url)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-semibold text-zinc-900 hover:underline dark:text-white"
                                >
                                  View proof
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl border border-black/5 bg-white p-8 text-center text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
              No reservations yet. Start browsing costumes on the home page.
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
            <div className="text-lg font-semibold tracking-tight">Payment proof upload</div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              For reservations in <span className="font-semibold">PENDING_PAYMENT</span>.
            </p>

            <label className="mt-5 block">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Reservation</div>
              <select
                value={uploadReservationId ?? ""}
                onChange={(e) => setUploadReservationId(e.target.value ? Number(e.target.value) : null)}
                className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none dark:border-white/15 dark:bg-black"
              >
                <option value="">Select…</option>
                {reservations
                  .filter((r) => r.status === "PENDING_PAYMENT")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      #{r.id} · {r.start_date} → {r.end_date}
                    </option>
                  ))}
              </select>
            </label>

            <label className="mt-4 block">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Amount</div>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none dark:border-white/15 dark:bg-black"
                placeholder="e.g. 120"
              />
            </label>

            <label className="mt-4 block">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Proof file</div>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-2 w-full text-sm"
                accept="image/*,application/pdf"
              />
            </label>

            <button
              type="button"
              onClick={doUploadProof}
              className="mt-5 w-full rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-600"
            >
              Upload proof
            </button>

            {uploadStatus ? (
              <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{uploadStatus}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

