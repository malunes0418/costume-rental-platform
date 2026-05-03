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
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { toast } from "sonner";
import { Skeleton } from "../../../components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";
import { ExclamationTriangleIcon as AlertCircle, CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { cn } from "../../../lib/utils";
import { Calendar } from "../../../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";

type CreateOrUpdateReviewRequest = { costumeId: number; rating: number; comment?: string };

function fmtMoney(n: number) {
  return `$${Number(n).toFixed(0)}`;
}

function daysBetween(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
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

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [availability, setAvailability] = useState<Reservation[] | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState("");

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
    if (!startDate || !endDate) {
      toast.error("Choose dates to check availability.");
      return;
    }
    try {
      const res = await getAvailability(id, format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd"));
      setAvailability(res);
      if (res.length === 0) {
        toast.success("Available! No overlapping reservations.");
      } else {
        toast.error("These dates overlap an existing reservation.");
      }
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Availability check failed");
    }
  }

  async function addToCart() {
    if (!token) {
      toast.error("Please log in to reserve.");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please choose dates first.");
      return;
    }
    try {
      await apiFetch("/api/reservations/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        token,
        body: JSON.stringify({ 
          costumeId: id, 
          quantity, 
          startDate: format(startDate, "yyyy-MM-dd"), 
          endDate: format(endDate, "yyyy-MM-dd") 
        }),
      });
      toast.success("Added to cart successfully.");
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Failed to add to cart");
    }
  }

  async function submitReview() {
    if (!token) {
      toast.error("Please log in to leave a review.");
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
      toast.success("Review saved successfully.");
      const updated = await listCostumeReviews(id);
      setReviews(updated);
      setMyComment("");
    } catch (e: unknown) {
      toast.error(e instanceof ApiError ? e.message : "Failed to save review");
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
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
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="font-playfair text-4xl font-semibold tracking-tight text-foreground md:text-5xl">{data.costume.name}</h1>
            <div className="mt-3 text-sm font-medium text-muted-foreground">
              {data.avgRating ? `${data.avgRating.toFixed(1)} ★` : "New"} · {data.ratingCount} reviews
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3 flex flex-col gap-8">
              <Card className="overflow-hidden border-border bg-card shadow-none">
                <div className="aspect-[16/10] w-full bg-muted">
                  {heroImage ? (
                    <img
                      src={resolveApiAsset(heroImage)}
                      alt={data.costume.name}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <CardContent className="p-6">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {[data.costume.category, data.costume.theme, data.costume.size].filter(Boolean).join(" · ") || "Costume"}
                  </div>
                  {data.costume.description ? (
                    <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-foreground">
                      {data.costume.description}
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-none">
                <CardHeader>
                  <CardTitle className="font-playfair text-2xl">Reviews</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {reviews.length ? (
                    reviews.map((r) => (
                      <div key={r.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-foreground">{r.User?.name || "Guest"}</div>
                          <div className="text-sm font-medium text-foreground">{r.rating} ★</div>
                        </div>
                        {r.comment ? (
                          <div className="mt-2 text-sm text-muted-foreground">{r.comment}</div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No reviews yet.</div>
                  )}
                </CardContent>
                <CardFooter className="flex-col items-start border-t border-border bg-muted/30 pt-6">
                  <div className="text-sm font-semibold text-foreground">Leave a review</div>
                  <div className="mt-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Rating</Label>
                      <Select value={myRating.toString()} onValueChange={(v: string) => setMyRating(Number(v))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Rating" />
                        </SelectTrigger>
                        <SelectContent>
                          {[5, 4, 3, 2, 1].map((n) => (
                            <SelectItem key={n} value={n.toString()}>{n} Stars</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Comment (optional)</Label>
                      <Input
                        value={myComment}
                        onChange={(e) => setMyComment(e.target.value)}
                        placeholder="What did you like?"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button onClick={submitReview}>Save review</Button>
                  </div>
                </CardFooter>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="sticky top-24 border-border bg-card shadow-none">
                <CardHeader>
                  <div className="flex items-baseline justify-between">
                    <div className="font-playfair text-3xl font-semibold tracking-tight text-foreground">{fmtMoney(Number(data.costume.base_price_per_day))}</div>
                    <div className="text-sm font-medium text-muted-foreground">per day</div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal px-3",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "MMM d, yyyy") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal px-3",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "MMM d, yyyy") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      type="number"
                      min={1}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={checkAvailability}
                    >
                      Check availability
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={addToCart}
                    >
                      Reserve
                    </Button>
                  </div>

                  {nights > 0 ? (
                    <div className="mt-6 rounded-md bg-muted p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {fmtMoney(Number(data.costume.base_price_per_day))} × {nights} days × {quantity}
                        </span>
                        <span className="font-semibold text-foreground">{fmtMoney(price)}</span>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
