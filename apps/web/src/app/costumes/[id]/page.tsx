"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ApiError } from "../../../lib/api";
import { resolveApiAsset } from "../../../lib/assets";
import {
  getAvailability,
  getCostume,
  listCostumeReviews,
  type CostumeDetailResponse,
  type Reservation,
  type Review,
} from "../../../lib/costumes";
import { useAuth } from "../../../lib/auth";
import { apiFetch } from "../../../lib/api";

type CreateOrUpdateReviewRequest = { costumeId: number; rating: number; comment?: string };

function fmtMoney(n: number) {
  return `$${Number(n).toFixed(0)}`;
}

function daysBetween(start: string, end: string) {
  const a = new Date(start);
  const b = new Date(end);
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default function CostumeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { token } = useAuth();

  const [data, setData] = useState<CostumeDetailResponse | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [availability, setAvailability] = useState<Reservation[] | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [cartStatus, setCartStatus] = useState<string | null>(null);

  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState("");
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);

  const images = data?.costume.CostumeImages || [];
  const heroImage = images.find((i) => i.is_primary)?.image_url || images[0]?.image_url || "";

  const nights = useMemo(() => (startDate && endDate ? daysBetween(startDate, endDate) : 0), [startDate, endDate]);
  const price = useMemo(() => (data ? nights * Number(data.costume.base_price_per_day) * quantity : 0), [data, nights, quantity]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([getCostume(id), listCostumeReviews(id)])
      .then(([detail, reviews]) => {
        if (cancelled) return;
        setData(detail);
        setReviews(reviews);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "Failed to load costume");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function checkAvailability() {
    setAvailability(null);
    setAvailabilityError(null);
    if (!startDate || !endDate) {
      setAvailabilityError("Choose dates to check availability.");
      return;
    }
    try {
      const res = await getAvailability(id, startDate, endDate);
      setAvailability(res);
    } catch (e: unknown) {
      setAvailabilityError(e instanceof ApiError ? e.message : "Availability check failed");
    }
  }

  async function addToCart() {
    setCartStatus(null);
    if (!token) {
      setCartStatus("Please log in to reserve.");
      return;
    }
    if (!startDate || !endDate) {
      setCartStatus("Please choose dates first.");
      return;
    }
    try {
      await apiFetch("/api/reservations/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        token,
        body: JSON.stringify({ costumeId: id, quantity, startDate, endDate }),
      });
      setCartStatus("Added to cart.");
    } catch (e: unknown) {
      setCartStatus(e instanceof ApiError ? e.message : "Failed to add to cart");
    }
  }

  async function submitReview() {
    setReviewStatus(null);
    if (!token) {
      setReviewStatus("Please log in to leave a review.");
      return;
    }
    try {
      const body: CreateOrUpdateReviewRequest = { costumeId: id, rating: myRating, comment: myComment.trim() || undefined };
      await apiFetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        token,
        body: JSON.stringify(body),
      });
      setReviewStatus("Saved.");
      const updated = await listCostumeReviews(id);
      setReviews(updated);
    } catch (e: unknown) {
      setReviewStatus(e instanceof ApiError ? e.message : "Failed to save review");
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="h-[420px] animate-pulse rounded-3xl border border-black/5 bg-white dark:border-white/10 dark:bg-zinc-950" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-700 dark:text-rose-200">
          {error ?? "Not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-black">
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{data.costume.name}</h1>
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {data.avgRating ? `${data.avgRating.toFixed(1)} ★` : "New"} · {data.ratingCount} reviews
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
                <div className="aspect-[16/10] w-full bg-zinc-100 dark:bg-white/5">
                  {heroImage ? (
                    <img
                      src={resolveApiAsset(heroImage)}
                      alt={data.costume.name}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="p-6">
                  <div className="text-sm text-zinc-700 dark:text-zinc-300">
                    {[data.costume.category, data.costume.theme, data.costume.size].filter(Boolean).join(" · ") || "Costume"}
                  </div>
                  {data.costume.description ? (
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                      {data.costume.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
                <h2 className="text-lg font-semibold tracking-tight">Reviews</h2>
                <div className="mt-4 space-y-4">
                  {reviews.length ? (
                    reviews.map((r) => (
                      <div key={r.id} className="rounded-2xl border border-black/5 p-4 dark:border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">{r.User?.name || "Guest"}</div>
                          <div className="text-sm">{r.rating} ★</div>
                        </div>
                        {r.comment ? (
                          <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{r.comment}</div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">No reviews yet.</div>
                  )}
                </div>

                <div className="mt-8 rounded-2xl border border-black/5 p-4 dark:border-white/10">
                  <div className="text-sm font-semibold">Leave a review</div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <label className="block">
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">Rating</div>
                      <select
                        value={myRating}
                        onChange={(e) => setMyRating(Number(e.target.value))}
                        className="mt-1 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none dark:border-white/15 dark:bg-black"
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block sm:col-span-2">
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">Comment (optional)</div>
                      <input
                        value={myComment}
                        onChange={(e) => setMyComment(e.target.value)}
                        className="mt-1 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none dark:border-white/15 dark:bg-black"
                        placeholder="What did you like?"
                      />
                    </label>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={submitReview}
                      className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                    >
                      Save review
                    </button>
                    {reviewStatus ? <div className="text-sm text-zinc-600 dark:text-zinc-400">{reviewStatus}</div> : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="sticky top-24 rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-semibold tracking-tight">{fmtMoney(Number(data.costume.base_price_per_day))}</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">per day</div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <label className="block">
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">Start</div>
                    <input
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      type="date"
                      className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none dark:border-white/15 dark:bg-black"
                    />
                  </label>
                  <label className="block">
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">End</div>
                    <input
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      type="date"
                      className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none dark:border-white/15 dark:bg-black"
                    />
                  </label>
                </div>

                <div className="mt-3">
                  <label className="block">
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">Quantity</div>
                    <input
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      type="number"
                      min={1}
                      className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none dark:border-white/15 dark:bg-black"
                    />
                  </label>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={checkAvailability}
                    className="flex-1 rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold hover:bg-zinc-50 dark:border-white/15 dark:hover:bg-white/5"
                  >
                    Check availability
                  </button>
                  <button
                    type="button"
                    onClick={addToCart}
                    className="flex-1 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-600"
                  >
                    Reserve
                  </button>
                </div>

                {availabilityError ? (
                  <div className="mt-3 text-sm text-rose-600 dark:text-rose-300">{availabilityError}</div>
                ) : null}
                {availability ? (
                  <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {availability.length === 0
                      ? "No overlapping reservations."
                      : "These dates overlap an existing reservation."}
                  </div>
                ) : null}

                {nights > 0 ? (
                  <div className="mt-5 rounded-2xl bg-zinc-50 p-4 text-sm dark:bg-white/5">
                    <div className="flex items-center justify-between">
                      <span>
                        {fmtMoney(Number(data.costume.base_price_per_day))} × {nights} days × {quantity}
                      </span>
                      <span className="font-semibold">{fmtMoney(price)}</span>
                    </div>
                  </div>
                ) : null}

                {cartStatus ? <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{cartStatus}</div> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
