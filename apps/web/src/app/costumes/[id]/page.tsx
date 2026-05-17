"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ExclamationTriangleIcon as AlertCircle,
  ImageIcon,
  StarFilledIcon,
} from "@radix-ui/react-icons";
import { toast } from "sonner";

import { ImageGallery } from "../../../components/shadix-ui/image-gallery";
import { WishlistButton } from "../../../components/WishlistButton";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";
import { Button } from "../../../components/ui/button";
import { Calendar } from "../../../components/ui/calendar";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import { Skeleton } from "../../../components/ui/skeleton";
import { useCart } from "../../../lib/CartContext";
import { apiFetch, ApiError } from "../../../lib/api";
import { resolveApiAsset } from "../../../lib/assets";
import { useAuth } from "../../../lib/auth";
import {
  getAvailability,
  getCostume,
  listCostumeReviews,
  type CostumeDetailResponse,
  type Reservation,
  type Review,
} from "../../../lib/costumes";
import { cn } from "../../../lib/utils";

function fmtMoney(value: number) {
  return `PHP ${Number(value).toFixed(0)}`;
}

function daysBetween(start: Date, end: Date) {
  const milliseconds = end.getTime() - start.getTime();
  return Math.max(0, Math.ceil(milliseconds / (1000 * 60 * 60 * 24)));
}

const BOOKING_NOTES = [
  "Availability is checked against existing reservations.",
  "Reserve now adds the item and opens your cart immediately.",
  "Payment proof is uploaded after cart checkout.",
];

export default function CostumeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { user, isLoading: isAuthLoading } = useAuth();
  const { openCart, triggerRefresh } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<CostumeDetailResponse | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [availability, setAvailability] = useState<Reservation[] | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isAuthLoading) return;
    if (user?.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([getCostume(id), listCostumeReviews(id)])
      .then(([detail, fetchedReviews]) => {
        if (cancelled) return;
        setData(detail);
        setReviews(fetchedReviews);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load costume");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const quantityParam = searchParams.get("quantity");

    if (startDateParam) {
      const parsedStart = new Date(startDateParam);
      if (!Number.isNaN(parsedStart.getTime())) {
        setStartDate(parsedStart);
      }
    }

    if (endDateParam) {
      const parsedEnd = new Date(endDateParam);
      if (!Number.isNaN(parsedEnd.getTime())) {
        setEndDate(parsedEnd);
      }
    }

    if (quantityParam) {
      const parsedQuantity = Number(quantityParam);
      if (Number.isFinite(parsedQuantity) && parsedQuantity > 0) {
        setQuantity(parsedQuantity);
      }
    }
  }, [searchParams]);

  const costume = data?.costume;
  const images = costume?.CostumeImages || [];
  const isOwnCostume = !!user && costume?.owner_id === user.id;
  const invalidDateRange = Boolean(startDate && endDate && endDate <= startDate);
  const nights = useMemo(
    () => (startDate && endDate && !invalidDateRange ? daysBetween(startDate, endDate) : 0),
    [endDate, invalidDateRange, startDate]
  );
  const price = useMemo(
    () => (costume ? nights * Number(costume.base_price_per_day) * quantity : 0),
    [costume, nights, quantity]
  );
  const detailBadges = [costume?.category, costume?.theme, costume?.size, costume?.gender].filter(
    Boolean
  );
  const vendorName =
    costume?.owner?.VendorProfile?.business_name || costume?.owner?.name || "SnapCos vendor";

  async function checkAvailability() {
    setAvailability(null);
    if (!startDate || !endDate) {
      toast.error("Choose dates to check availability.");
      return;
    }
    if (invalidDateRange) {
      toast.error("End date must be later than the start date.");
      return;
    }

    try {
      const result = await getAvailability(
        id,
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd")
      );
      setAvailability(result);
      if (result.length === 0) {
        toast.success("These dates are available.");
      } else {
        toast.error("These dates overlap an existing reservation.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof ApiError ? err.message : "Availability check failed");
    }
  }

  async function addToCart(openDrawer = false) {
    if (!user) {
      toast.error("Please log in to reserve.");
      return;
    }
    if (isOwnCostume) {
      toast.error("You cannot add your own costume to your cart.");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please choose dates first.");
      return;
    }
    if (invalidDateRange) {
      toast.error("End date must be later than the start date.");
      return;
    }

    try {
      await apiFetch("/api/reservations/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          costumeId: id,
          quantity,
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
        }),
      });
      triggerRefresh();
      toast.success(openDrawer ? "Added to cart." : "Costume added to cart.");
      if (openDrawer) openCart();
    } catch (err: unknown) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add to cart");
    }
  }

  if (user?.role === "ADMIN") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 py-10">
        <Skeleton className="h-[560px] w-full rounded-[var(--radius-xl)]" />
      </div>
    );
  }

  if (error || !data || !costume) {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error ?? "Not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background">
      <div className="mx-auto w-full max-w-[1280px] px-6 pb-24 pt-8 md:pt-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeftIcon className="size-4" />
          Back to discovery
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,420px)] lg:items-start">
          <div className="space-y-8">
            <section className="surface-shell rounded-[var(--radius-xl)] p-7 md:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="max-w-3xl">
                  <div className="brand-eyebrow inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em]">
                    <span className="inline-block size-1.5 rounded-full bg-gold" />
                    Costume detail
                  </div>

                  <h1 className="mt-5 font-display text-4xl text-foreground md:text-5xl">
                    {costume.name}
                  </h1>

                  <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                    Review the look, confirm your dates, and book with a clearer pricing and
                    reservation flow.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {detailBadges.length > 0 ? (
                      detailBadges.map((badge) => (
                        <span
                          key={badge}
                          className="rounded-full border border-border bg-background/75 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"
                        >
                          {badge}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-border bg-background/75 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Curated rental piece
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 md:items-end">
                  <div className="rounded-[var(--radius-lg)] border border-border bg-background/75 px-4 py-3 text-sm">
                    <div className="flex items-center gap-2 text-foreground">
                      <StarFilledIcon className="size-4 text-[color:var(--color-gold)]" />
                      <span className="font-semibold">
                        {data.avgRating ? data.avgRating.toFixed(1) : "New"}
                      </span>
                      <span className="text-muted-foreground">
                        {data.avgRating ? `${data.ratingCount} reviews` : "No reviews yet"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {!isOwnCostume ? (
                      <WishlistButton
                        costumeId={costume.id}
                        ownerId={costume.owner_id}
                        size="md"
                        className="size-10 rounded-full"
                      />
                    ) : null}
                    {isOwnCostume ? (
                      <span className="rounded-full border border-foreground/15 bg-foreground px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-background">
                        Your listing
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Daily rate
                  </p>
                  <p className="mt-2 font-display text-3xl text-foreground">
                    {fmtMoney(Number(costume.base_price_per_day))}
                  </p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Vendor
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{vendorName}</p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Booking path
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">Dates to cart to pay</p>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-background/70">
              {images.length === 0 ? (
                <div className="flex h-[520px] w-full items-center justify-center bg-muted text-muted-foreground">
                  <ImageIcon className="h-12 w-12 opacity-20" />
                </div>
              ) : (
                <ImageGallery
                  images={images.map((img) => ({
                    src: resolveApiAsset(img.image_url),
                    alt: costume.name,
                  }))}
                  lazyLoading
                />
              )}
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="surface-panel rounded-[var(--radius-xl)] p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  About the costume
                </p>
                <h2 className="mt-3 font-display text-3xl text-foreground">
                  Summary and styling notes
                </h2>
                <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
                  {costume.description ? (
                    <p className="whitespace-pre-line">{costume.description}</p>
                  ) : (
                    <p>No description provided yet.</p>
                  )}
                </div>
              </div>

              <div className="surface-panel rounded-[var(--radius-xl)] p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Quick details
                </p>
                <dl className="mt-5 space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                    <dt className="text-muted-foreground">Category</dt>
                    <dd className="font-medium text-foreground">{costume.category || "Not listed"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                    <dt className="text-muted-foreground">Theme</dt>
                    <dd className="font-medium text-foreground">{costume.theme || "Not listed"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                    <dt className="text-muted-foreground">Size</dt>
                    <dd className="font-medium text-foreground">{costume.size || "Not listed"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Gender fit</dt>
                    <dd className="font-medium text-foreground">{costume.gender || "Flexible"}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className="surface-panel rounded-[var(--radius-xl)] p-7">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Reviews and trust
                  </p>
                  <h2 className="mt-3 font-display text-3xl text-foreground">What renters said</h2>
                </div>
                {data.avgRating ? (
                  <p className="text-sm text-muted-foreground">
                    Average rating <span className="font-semibold text-foreground">{data.avgRating.toFixed(1)}</span>
                  </p>
                ) : null}
              </div>

              <div className="mt-6 space-y-4">
                {reviews.length ? (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-[var(--radius-lg)] border border-border bg-background/75 p-5"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-foreground">
                            {review.User?.name || "Guest renter"}
                          </p>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Rating {review.rating}/5
                          </p>
                        </div>
                        {review.created_at ? (
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {review.comment || "No written review was provided."}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-background/60 p-6">
                    <p className="font-medium text-foreground">No reviews yet</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      This listing is ready to book, but it does not have customer feedback yet.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="surface-shell rounded-[var(--radius-xl)] p-6 md:p-7">
              <div className="border-b border-border pb-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Booking
                </p>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-display text-4xl text-foreground">
                      {fmtMoney(Number(costume.base_price_per_day))}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">per day, before checkout</p>
                  </div>
                  <span className="rounded-full border border-border bg-background px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Secure reservation flow
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                {isOwnCostume ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Your listing</AlertTitle>
                    <AlertDescription>
                      You cannot add your own costume to your cart.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {invalidDateRange ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Check your dates</AlertTitle>
                    <AlertDescription>
                      Your end date needs to come after the start date.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {availability ? (
                  <div
                    className={cn(
                      "rounded-[var(--radius-lg)] border px-4 py-3 text-sm",
                      availability.length === 0
                        ? "border-[color:color-mix(in_oklab,var(--color-gold)_24%,var(--color-border))] bg-[color:color-mix(in_oklab,var(--color-gold)_8%,var(--color-background))] text-foreground"
                        : "border-border bg-background/70 text-muted-foreground"
                    )}
                  >
                    {availability.length === 0
                      ? "These dates are currently available."
                      : "Selected dates overlap an existing reservation."}
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Start date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-12 w-full justify-start px-3 text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "MMM d, yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      End date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-12 w-full justify-start px-3 text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "MMM d, yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Quantity
                  </Label>
                  <Input
                    value={quantity}
                    onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                    type="number"
                    min={1}
                    className="h-12"
                  />
                </div>

                <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Rental days</span>
                    <span className="font-semibold text-foreground">{nights || "--"}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estimated total</span>
                    <span className="font-semibold text-foreground">
                      {nights > 0 ? fmtMoney(price) : "--"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    variant="brandOutline"
                    className="h-12 w-full text-xs font-semibold uppercase tracking-[0.24em]"
                    onClick={checkAvailability}
                    disabled={isOwnCostume}
                  >
                    Check availability
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 w-full text-xs font-semibold uppercase tracking-[0.24em]"
                    onClick={() => addToCart(false)}
                    disabled={isOwnCostume}
                  >
                    Add to cart
                  </Button>
                  <Button
                    variant="brand"
                    className="h-12 w-full text-xs font-semibold uppercase tracking-[0.24em]"
                    onClick={() => addToCart(true)}
                    disabled={isOwnCostume}
                  >
                    Reserve now
                  </Button>
                </div>

                <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Booking notes
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {BOOKING_NOTES.map((note) => (
                      <li key={note} className="flex gap-2">
                        <span className="mt-2 inline-block size-1.5 rounded-full bg-[color:var(--color-brand)]" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
