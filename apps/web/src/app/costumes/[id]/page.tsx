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

import { toast } from "sonner";
import { Skeleton } from "../../../components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";
import { ExclamationTriangleIcon as AlertCircle, CalendarIcon, ImageIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { cn } from "../../../lib/utils";
import { Calendar } from "../../../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import { ImageGallery } from "../../../components/shadix-ui/image-gallery";



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


  const images = data?.costume.CostumeImages || [];

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
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8 pb-24 pt-12">
        <div className="flex flex-col gap-12">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground animate-fade-up">
              {[data.costume.category, data.costume.theme, data.costume.size].filter(Boolean).join(" · ") || "Costume"}
            </div>
            <h1 className="font-playfair text-5xl font-semibold tracking-tight text-foreground md:text-7xl animate-fade-up-delay-1">
              {data.costume.name}
            </h1>
            <div className="text-sm font-medium text-muted-foreground animate-fade-up-delay-2 flex items-center justify-center gap-2">
              <span>{data.avgRating ? `${data.avgRating.toFixed(1)} ★` : "New"}</span>
              <span>·</span>
              <span className="underline decoration-border underline-offset-4">{data.ratingCount} reviews</span>
            </div>
          </div>

          {/* Shadix UI Photo Grid */}
          <div className="w-full animate-fade-up-delay-3">
            {images.length === 0 ? (
              <div className="flex h-[600px] w-full items-center justify-center rounded-md bg-muted text-muted-foreground border border-border">
                <ImageIcon className="h-12 w-12 opacity-20" />
              </div>
            ) : (
              <ImageGallery 
                images={images.map(img => ({
                  src: resolveApiAsset(img.image_url),
                  alt: data.costume.name
                }))} 
                lazyLoading={true}
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 mt-8 animate-fade-up-delay-3">
            {/* Left Col: Description & Reviews */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-16">
              <section className="space-y-6">
                <h2 className="font-playfair text-3xl font-semibold text-foreground">About this piece</h2>
                {data.costume.description ? (
                  <div className="prose prose-neutral text-muted-foreground leading-relaxed text-lg max-w-none">
                    <p className="whitespace-pre-line">{data.costume.description}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No description provided.</p>
                )}
              </section>

              <hr className="border-border" />

              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="font-playfair text-3xl font-semibold text-foreground">Reviews</h2>
                  <div className="text-xl font-medium text-foreground">{data.avgRating ? `${data.avgRating.toFixed(1)} ★` : ""}</div>
                </div>
                
                <div className="space-y-8">
                  {reviews.length ? (
                    reviews.map((r) => (
                      <div key={r.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-foreground">{r.User?.name || "Guest"}</div>
                          <div className="text-sm font-medium text-muted-foreground">{r.rating} ★</div>
                        </div>
                        {r.comment ? (
                          <p className="text-base text-muted-foreground leading-relaxed">{r.comment}</p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground italic">This costume doesn't have any reviews yet.</p>
                  )}
                </div>
              </section>
            </div>

            {/* Right Col: Reservation */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="sticky top-24 border border-border bg-card shadow-none rounded-md p-8 flex flex-col gap-8">
                <div className="flex items-baseline justify-between border-b border-border pb-6">
                  <div className="font-playfair text-4xl font-semibold tracking-tight text-foreground">
                    {fmtMoney(Number(data.costume.base_price_per_day))}
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">per day</div>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Start Date</Label>
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
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">End Date</Label>
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
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Quantity</Label>
                    <Input
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      type="number"
                      min={1}
                    />
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="w-full h-12 text-sm uppercase tracking-wider font-semibold"
                      onClick={checkAvailability}
                    >
                      Check Availability
                    </Button>
                    <Button
                      className="w-full h-12 text-sm uppercase tracking-wider font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={addToCart}
                    >
                      Reserve Now
                    </Button>
                  </div>

                  {nights > 0 ? (
                    <div className="mt-6 rounded-md bg-muted/50 border border-border p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {fmtMoney(Number(data.costume.base_price_per_day))} × {nights} days × {quantity}
                        </span>
                        <span className="font-semibold text-foreground">{fmtMoney(price)}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
