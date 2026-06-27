"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRightIcon,
  ExclamationTriangleIcon as AlertCircle,
  ImageIcon,
  LayersIcon,
  MagicWandIcon,
  PersonIcon,
  RulerSquareIcon,
  StarFilledIcon
} from "@radix-ui/react-icons";

import { CostumeCard } from "@/components/CostumeCard";
import {
  ReservationWizard,
  type ReservationWizardIntent
} from "@/components/ReservationWizard";
import { WishlistButton } from "@/components/WishlistButton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listSavedLocations, myWishlist } from "../../../lib/account";
import { ApiError } from "../../../lib/api";
import { resolveApiAsset } from "../../../lib/assets";
import { useAuth } from "../../../lib/auth";
import type { SavedLocation } from "../../../lib/fulfillment";
import {
  getCostume,
  listCostumeReviews,
  listCostumes,
  type Costume,
  type CostumeDetailResponse,
  type Review
} from "../../../lib/costumes";
import { getCostumePricingSummary } from "../../../lib/pricing";
import { cn } from "../../../lib/utils";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  maximumFractionDigits: 0
});

function fmtMoney(value: number) {
  return `₱${currencyFormatter.format(Number(value) || 0)}`;
}

function formatReviewDate(value?: string) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parsed);
}

function reviewerInitials(name?: string | null) {
  if (!name?.trim()) return "G";

  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function computeStarDistribution(reviewList: Review[]) {
  const counts = [0, 0, 0, 0, 0];

  for (const review of reviewList) {
    const star = Math.round(review.rating);
    if (star >= 1 && star <= 5) {
      counts[star - 1] += 1;
    }
  }

  return counts;
}

function StarRating({ rating, className }: { rating: number; className?: string }) {
  const rounded = Math.round(rating);

  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarFilledIcon
          key={star}
          className={cn("size-4", star <= rounded ? "text-primary" : "text-muted-foreground/25")}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default function CostumeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<CostumeDetailResponse | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedItems, setRelatedItems] = useState<Costume[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(() => new Set());
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardIntent, setWizardIntent] = useState<ReservationWizardIntent>("reserve");
  const [initialStartDate, setInitialStartDate] = useState<Date | undefined>();
  const [initialEndDate, setInitialEndDate] = useState<Date | undefined>();

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
      .then(([detail, nextReviews]) => {
        if (cancelled) return;
        setData(detail);
        setReviews(nextReviews);
      })
      .catch((nextError: unknown) => {
        if (cancelled) return;
        setError(nextError instanceof ApiError ? nextError.message : "Failed to load costume");
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
    if (!user || user.role === "ADMIN") {
      setSavedLocations([]);
      return;
    }

    let cancelled = false;
    listSavedLocations()
      .then((locations) => {
        if (cancelled) return;
        setSavedLocations(locations);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || user.role === "ADMIN") {
      setIsWishlisted(false);
      setSavedIds(new Set());
      return;
    }

    let cancelled = false;
    myWishlist()
      .then((items) => {
        if (cancelled) return;
        const ids = new Set(items.map((item) => item.costume_id));
        setSavedIds(ids);
        setIsWishlisted(ids.has(id));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user, id]);

  useEffect(() => {
    if (!data?.costume.category) {
      setRelatedItems([]);
      return;
    }

    let cancelled = false;
    listCostumes({ category: data.costume.category, pageSize: 8 })
      .then((response) => {
        if (cancelled) return;
        setRelatedItems(response.data.filter((costume) => costume.id !== id).slice(0, 4));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [data, id]);

  useEffect(() => {
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (startDateParam) {
      const parsed = new Date(startDateParam);
      if (!Number.isNaN(parsed.getTime())) {
        setInitialStartDate(parsed);
      }
    }

    if (endDateParam) {
      const parsed = new Date(endDateParam);
      if (!Number.isNaN(parsed.getTime())) {
        setInitialEndDate(parsed);
      }
    }
  }, [searchParams]);

  const images = data?.costume.CostumeImages ?? [];
  const galleryImages = images.map((image) => ({
    src: resolveApiAsset(image.image_url),
    alt: data?.costume.name || "Costume image"
  }));
  const selectedImage = galleryImages[selectedImageIndex] ?? null;
  const isOwnCostume = Boolean(user && data?.costume.owner_id === user.id);

  useEffect(() => {
    setSelectedImageIndex((currentIndex) => (currentIndex >= galleryImages.length ? 0 : currentIndex));
  }, [galleryImages.length]);

  const pricingSummary = useMemo(
    () => (data ? getCostumePricingSummary(data.costume) : null),
    [data]
  );

  const starDistribution = useMemo(() => computeStarDistribution(reviews), [reviews]);
  const highRatingPercent = useMemo(() => {
    if (reviews.length === 0) return null;
    const highCount = reviews.filter((review) => review.rating >= 4).length;
    return Math.round((highCount / reviews.length) * 100);
  }, [reviews]);

  const vendorDisplayName = useMemo(() => {
    if (!data?.costume.owner) return "Vendor";
    return (
      data.costume.owner.VendorProfile?.business_name?.trim() ||
      data.costume.owner.name?.trim() ||
      "Vendor"
    );
  }, [data]);

  function openWizard(intent: ReservationWizardIntent) {
    if (isOwnCostume) return;
    setWizardIntent(intent);
    setWizardOpen(true);
  }

  if (user?.role === "ADMIN") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="marketplace-shell flex flex-1 flex-col">
        <div className="marketplace-content space-y-8">
          <Skeleton className="h-4 w-64" />
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-6">
              <Skeleton className="aspect-[3/4] w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
            <Skeleton className="h-[420px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="marketplace-shell flex flex-1 flex-col">
        <div className="marketplace-content">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="transition-colors hover:text-primary">
                  Home
                </Link>
              </li>
            </ol>
          </nav>
          <Alert variant="destructive" className="rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error ?? "Not found"}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const packagePricingNote =
    data.costume.pricing_mode === "PACKAGE"
      ? `${fmtMoney(Number(data.costume.package_unused_day_discount))} off per unused day and ${fmtMoney(Number(data.costume.package_extra_day_charge))} per extra day`
      : null;

  const detailPills = [
    data.costume.category,
    data.costume.theme,
    data.costume.size ? `Size ${data.costume.size}` : null
  ].filter(Boolean) as string[];

  const rentalDetails = [
    {
      label: "Category",
      value: data.costume.category || "Not specified",
      icon: LayersIcon,
      iconVariant: "coral" as const
    },
    {
      label: "Theme",
      value: data.costume.theme || "Not specified",
      icon: MagicWandIcon,
      iconVariant: "gold" as const
    },
    {
      label: "Size",
      value: data.costume.size || "Not specified",
      icon: RulerSquareIcon,
      iconVariant: "coral" as const
    },
    {
      label: "Audience",
      value: data.costume.gender || "Flexible fit",
      icon: PersonIcon,
      iconVariant: "gold" as const
    }
  ];

  const metaLine = [data.costume.category, data.costume.size, data.costume.theme].filter(Boolean).join(" · ");
  const categoryHref = data.costume.category
    ? `/?category=${encodeURIComponent(data.costume.category)}`
    : "/";

  return (
    <div className="marketplace-shell flex flex-1 flex-col">
      <div className="marketplace-content pb-28">
        <nav aria-label="Breadcrumb" className="animate-fade-up mb-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="transition-colors hover:text-primary">
                Home
              </Link>
            </li>
            {data.costume.category ? (
              <>
                <li aria-hidden="true">
                  <ChevronRightIcon className="size-3.5" />
                </li>
                <li>
                  <Link href={categoryHref} className="transition-colors hover:text-primary">
                    {data.costume.category}
                  </Link>
                </li>
              </>
            ) : null}
            <li aria-hidden="true">
              <ChevronRightIcon className="size-3.5" />
            </li>
            <li className="font-medium text-foreground" aria-current="page">
              {data.costume.name}
            </li>
          </ol>
        </nav>

        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-10">
          <section className="animate-fade-up space-y-6">
            <div className="panel-card p-3">
              <div className="grid gap-4 lg:grid-cols-[84px_minmax(0,1fr)] lg:items-start">
                <div className="order-2 flex gap-3 overflow-x-auto px-1 pb-1 pt-1 lg:order-1 lg:max-h-[min(70vh,560px)] lg:shrink-0 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:px-1.5 lg:py-1">
                  {galleryImages.length > 0 ? (
                    galleryImages.map((image, index) => (
                      <button
                        key={`${image.src}-${index}`}
                        type="button"
                        onClick={() => setSelectedImageIndex(index)}
                        className={cn(
                          "group relative shrink-0 overflow-hidden rounded-lg border bg-muted transition-all duration-300",
                          "aspect-[3/4] w-20 lg:w-full",
                          index === selectedImageIndex
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border opacity-70 hover:opacity-100 hover:border-primary/40"
                        )}
                        aria-label={`View image ${index + 1}`}
                        aria-pressed={index === selectedImageIndex}
                      >
                        <img
                          src={image.src}
                          alt={`${image.alt} thumbnail ${index + 1}`}
                          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </button>
                    ))
                  ) : (
                    <div className="flex aspect-[3/4] w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground lg:w-full">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>

                <div className="order-1 min-w-0 lg:order-2">
                  <div className="relative mx-auto w-full max-w-[560px] overflow-hidden rounded-xl bg-muted">
                    <div className="flex min-h-[240px] max-h-[min(70vh,560px)] items-center justify-center">
                      {selectedImage ? (
                        <img
                          src={selectedImage.src}
                          alt={selectedImage.alt}
                          className="max-h-[min(70vh,560px)] w-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-60 w-full items-center justify-center text-muted-foreground/30">
                          <ImageIcon className="h-14 w-14" />
                        </div>
                      )}
                    </div>

                    {data.costume.category ? (
                      <Badge
                        variant="coralSoft"
                        className="pointer-events-none absolute left-3 top-3 rounded-md border-0 text-[10px] font-medium backdrop-blur-sm"
                      >
                        {data.costume.category}
                      </Badge>
                    ) : null}

                    {!isOwnCostume ? (
                      <div className="absolute right-3 top-3">
                        <WishlistButton
                          costumeId={id}
                          ownerId={data.costume.owner_id}
                          initialSaved={isWishlisted}
                          size="md"
                        />
                      </div>
                    ) : null}

                    {galleryImages.length > 1 ? (
                      <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg border border-border bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
                        {selectedImageIndex + 1} / {galleryImages.length}
                      </div>
                    ) : null}
                  </div>

                  {galleryImages.length > 0 ? (
                    <p className="mt-2 text-center text-xs text-muted-foreground lg:mx-auto lg:max-w-[560px]">
                      {galleryImages.length} photo{galleryImages.length === 1 ? "" : "s"}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="panel-card p-6">
              <p className="section-eyebrow">About this costume</p>
              <h2 className="section-heading mt-1">Description</h2>
              {data.costume.description ? (
                <p className="mt-4 whitespace-pre-line leading-7 text-muted-foreground">{data.costume.description}</p>
              ) : (
                <p className="mt-4 leading-7 text-muted-foreground">
                  No description has been added for this costume yet.
                </p>
              )}
            </div>

            <div className="panel-card p-6">
              <p className="section-eyebrow">What you get</p>
              <h2 className="section-heading mt-1">Rental details</h2>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                {rentalDetails.map((detail) => {
                  const Icon = detail.icon;
                  return (
                    <div key={detail.label} className="detail-chip bg-card">
                      <div
                        className={cn(
                          "detail-chip-icon",
                          detail.iconVariant === "coral" ? "detail-chip-icon--coral" : "detail-chip-icon--gold"
                        )}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs font-medium text-muted-foreground">
                          {detail.label}
                        </dt>
                        <dd className="mt-1 font-medium text-foreground">{detail.value}</dd>
                      </div>
                    </div>
                  );
                })}
              </dl>
              <div className="mt-6 rounded-lg border border-border/60 border-l-4 border-l-primary bg-gradient-to-br from-brand-coral-soft to-brand-gold-soft px-4 py-4 text-sm leading-7 text-muted-foreground">
                <p className="font-medium text-foreground">{pricingSummary?.label}</p>
                <p className="mt-1">
                  {data.costume.pricing_mode === "PACKAGE"
                    ? packagePricingNote
                    : "Pricing is calculated by rental day."}
                </p>
              </div>
            </div>

            <section className="space-y-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="section-eyebrow">Community</p>
                  <h2 className="section-heading mt-1 text-2xl md:text-3xl">Reviews</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Based on {data.ratingCount} review{data.ratingCount === 1 ? "" : "s"}
                  </p>
                </div>
                {data.avgRating ? (
                  <div className="rounded-xl bg-gradient-to-br from-brand-coral-soft to-brand-gold-soft px-5 py-4 text-right">
                    <p className="font-display text-4xl font-semibold text-foreground">{data.avgRating.toFixed(1)}</p>
                    <StarRating rating={data.avgRating} className="mt-1 justify-end" />
                  </div>
                ) : null}
              </div>

              {reviews.length > 0 ? (
                <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="panel-card space-y-4 p-6">
                    <p className="text-sm font-medium text-foreground">Rating breakdown</p>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = starDistribution[star - 1];
                        const percent = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;

                        return (
                          <div key={star} className="flex items-center gap-3 text-sm">
                            <span className="w-8 shrink-0 text-muted-foreground">{star}★</span>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                              <div className="rating-bar-fill" style={{ width: `${percent}%` }} />
                            </div>
                            <span className="w-8 shrink-0 text-right text-muted-foreground">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                    {highRatingPercent !== null ? (
                      <p className="text-sm text-muted-foreground">
                        {highRatingPercent}% of reviewers rated this 4 stars or higher.
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {reviews.map((review) => {
                      const reviewDate = formatReviewDate(review.created_at);

                      return (
                        <article key={review.id} className="panel-card p-5">
                          <div className="flex items-start gap-3">
                            {review.User?.avatar_url ? (
                              <img
                                src={resolveApiAsset(review.User.avatar_url)}
                                alt=""
                                className="size-10 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-foreground">
                                {reviewerInitials(review.User?.name)}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="font-medium text-foreground">{review.User?.name || "Guest"}</p>
                                <StarRating rating={review.rating} />
                              </div>
                              {reviewDate ? (
                                <p className="mt-1 text-xs text-muted-foreground">{reviewDate}</p>
                              ) : null}
                              {review.comment ? (
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="panel-card border-dashed px-6 py-12 text-center">
                  <StarFilledIcon
                    className="mx-auto mb-3 size-8 text-accent animate-sparkle"
                    aria-hidden="true"
                  />
                  <p className="font-display text-lg font-semibold text-foreground">No reviews yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Be the first renter to share feedback after your reservation.
                  </p>
                </div>
              )}
            </section>

            {relatedItems.length > 0 ? (
              <section className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <h2 className="font-display text-xl font-semibold text-foreground">You may also like</h2>
                  {data.costume.category ? (
                    <Link
                      href={categoryHref}
                      className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      View more in {data.costume.category}
                    </Link>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {relatedItems.map((costume) => (
                    <CostumeCard key={costume.id} costume={costume} savedIds={savedIds} compact />
                  ))}
                </div>
              </section>
            ) : null}
          </section>

          <aside className="animate-fade-up-delay-1 xl:sticky xl:top-[calc(var(--navbar-height)+1.5rem)] xl:self-start">
            <div className="panel-card p-6">
              <div className="space-y-4 border-b border-border pb-6">
                <div className="flex flex-wrap items-center gap-2">
                  {detailPills.map((pill, index) => (
                    <Badge
                      key={pill}
                      variant={index % 2 === 0 ? "coralSoft" : "goldSoft"}
                      className="rounded-md text-[10px] font-medium"
                    >
                      {pill}
                    </Badge>
                  ))}
                  {isOwnCostume ? (
                    <Badge variant="goldSoft" className="rounded-md text-[10px] font-medium">
                      Your listing
                    </Badge>
                  ) : null}
                </div>

                <h1 className="font-display text-2xl tracking-tight text-foreground md:text-3xl">
                  {data.costume.name}
                </h1>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                  {metaLine ? <span>{metaLine}</span> : null}
                  {metaLine ? <span aria-hidden="true">·</span> : null}
                  <span className="inline-flex items-center gap-2">
                    {data.avgRating ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-coral-soft px-2.5 py-0.5">
                        <StarRating rating={data.avgRating} />
                        <span className="font-medium text-primary">{data.avgRating.toFixed(1)}</span>
                      </span>
                    ) : (
                      <Badge variant="goldSoft" className="rounded-md text-[10px] font-medium">
                        <StarFilledIcon className="animate-sparkle" aria-hidden="true" />
                        New listing
                      </Badge>
                    )}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {data.ratingCount} review{data.ratingCount === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="rounded-lg bg-brand-coral-soft px-4 py-4">
                  <div className="flex items-end justify-between gap-4">
                    <p className="font-display text-3xl tracking-tight text-primary">
                      {fmtMoney(pricingSummary?.amount ?? 0)}
                    </p>
                    <p className="max-w-[9rem] text-right text-xs font-medium text-muted-foreground">
                      {pricingSummary?.label}
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {data.costume.pricing_mode === "PACKAGE"
                    ? `Includes ${data.costume.package_included_days} day${data.costume.package_included_days === 1 ? "" : "s"}. ${packagePricingNote}`
                    : "Reserve to choose dates, fulfillment, and see your full quote."}
                </p>
              </div>

              <div className="space-y-4 pt-6">
                {isOwnCostume ? (
                  <Alert className="rounded-xl border-border bg-muted/30">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Your listing</AlertTitle>
                    <AlertDescription>You cannot add your own costume to your cart.</AlertDescription>
                  </Alert>
                ) : null}

                {data.costume.owner ? (
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    <span className="text-xs font-medium text-muted-foreground">Listed by</span>
                    <span className="font-medium text-foreground">{vendorDisplayName}</span>
                    <Badge variant="goldSoft" className="rounded-md text-[10px] font-medium">
                      Verified vendor
                    </Badge>
                  </p>
                ) : null}

                <div className="grid gap-3">
                  <Button
                    className="h-11 font-semibold"
                    onClick={() => openWizard("reserve")}
                    disabled={isOwnCostume}
                  >
                    Reserve now
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 font-semibold"
                    onClick={() => openWizard("cart")}
                    disabled={isOwnCostume}
                  >
                    Add to cart
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ReservationWizard
        costumeId={id}
        data={data}
        savedLocations={savedLocations}
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        intent={wizardIntent}
        initialStartDate={initialStartDate}
        initialEndDate={initialEndDate}
      />
    </div>
  );
}
