"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRightIcon,
  ExclamationTriangleIcon as AlertCircle
} from "@radix-ui/react-icons";
import { toast } from "sonner";

import { CostumeCard } from "@/components/CostumeCard";
import { CostumeDetailLoadingStage } from "@/components/costume-detail/CostumeDetailLoadingStage";
import { CostumeActSection } from "@/components/costume-detail/CostumeActSection";
import { CostumeMobileActionBar } from "@/components/costume-detail/CostumeMobileActionBar";
import {
  CostumeCallSheet,
  CostumePurchasePanel,
  costumeCallSheetIcons
} from "@/components/costume-detail/CostumePurchasePanel";
import { CostumeReviewsSection } from "@/components/costume-detail/CostumeReviewsSection";
import { CostumeStageGallery } from "@/components/costume-detail/CostumeStageGallery";
import {
  ReservationWizard,
  type ReservationWizardIntent
} from "@/components/ReservationWizard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { addCostumeToCart, getFulfillmentPreferences, listSavedLocations, myWishlist } from "../../../lib/account";
import { ApiError } from "../../../lib/api";
import { resolveApiAsset } from "../../../lib/assets";
import { useAuth } from "../../../lib/auth";
import { useCart } from "../../../lib/CartContext";
import type { FulfillmentPreferences, SavedLocation } from "../../../lib/fulfillment";
import {
  getCostume,
  listCostumeReviews,
  listCostumes,
  type Costume,
  type CostumeDetailResponse,
  type Review
} from "../../../lib/costumes";
import { getCostumePricingSummary } from "../../../lib/pricing";

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

export default function CostumeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { user, isLoading: isAuthLoading } = useAuth();
  const { openCart, triggerRefresh } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<CostumeDetailResponse | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedItems, setRelatedItems] = useState<Costume[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(() => new Set());
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [fulfillmentPreferences, setFulfillmentPreferences] = useState<FulfillmentPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardIntent, setWizardIntent] = useState<ReservationWizardIntent>("reserve");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
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
      setFulfillmentPreferences(null);
      return;
    }

    let cancelled = false;
    Promise.all([listSavedLocations(), getFulfillmentPreferences()])
      .then(([locations, prefs]) => {
        if (cancelled) return;
        setSavedLocations(locations);
        setFulfillmentPreferences(prefs);
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
    if (!user) {
      const next = `/costumes/${id}`;
      toast.message(intent === "reserve" ? "Reserve this look" : "Add to cart", {
        description: "Log in to reserve costumes and manage your cart.",
        action: {
          label: "Log in",
          onClick: () => window.location.assign(`/login?next=${encodeURIComponent(next)}`)
        }
      });
      return;
    }
    setWizardIntent(intent);
    setWizardOpen(true);
  }

  async function handleAddToCart() {
    if (isOwnCostume || isAddingToCart) return;
    if (!user) {
      const next = `/costumes/${id}`;
      toast.message("Add to cart", {
        description: "Log in to save costumes to your cart.",
        action: {
          label: "Log in",
          onClick: () => window.location.assign(`/login?next=${encodeURIComponent(next)}`)
        }
      });
      return;
    }

    setIsAddingToCart(true);
    try {
      const result = await addCostumeToCart(id);
      triggerRefresh();
      toast.success(result.alreadyInCart ? "Already in your cart." : "Added to cart.");
      openCart();
    } catch (nextError: unknown) {
      toast.error(nextError instanceof Error ? nextError.message : "Failed to add to cart");
    } finally {
      setIsAddingToCart(false);
    }
  }

  if (user?.role === "ADMIN") {
    return null;
  }

  if (isLoading) {
    return <CostumeDetailLoadingStage />;
  }

  if (error || !data) {
    return (
      <div className="costume-detail-shell marketplace-shell flex flex-1 flex-col">
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

  const callSheetDetails = [
    {
      label: "Category",
      value: data.costume.category || "Not specified",
      icon: costumeCallSheetIcons.category,
      tone: "coral" as const
    },
    {
      label: "Theme",
      value: data.costume.theme || "Not specified",
      icon: costumeCallSheetIcons.theme,
      tone: "gold" as const
    },
    {
      label: "Size",
      value: data.costume.size || "Not specified",
      icon: costumeCallSheetIcons.size,
      tone: "coral" as const
    },
    {
      label: "Audience",
      value: data.costume.gender || "Flexible fit",
      icon: costumeCallSheetIcons.audience,
      tone: "gold" as const
    }
  ];

  const metaLine = [data.costume.category, data.costume.size, data.costume.theme].filter(Boolean).join(" · ");
  const categoryHref = data.costume.category
    ? `/?category=${encodeURIComponent(data.costume.category)}`
    : "/";

  const pricingNote =
    data.costume.pricing_mode === "PACKAGE"
      ? `Includes ${data.costume.package_included_days} day${data.costume.package_included_days === 1 ? "" : "s"}. ${packagePricingNote}`
      : "Delivery and return pickup included. Choose dates and your address to see your full quote.";

  const pricingDescription =
    data.costume.pricing_mode === "PACKAGE"
      ? packagePricingNote ?? "Package pricing applies."
      : "Pricing is calculated by rental day.";

  return (
    <div className="costume-detail-shell marketplace-shell flex flex-1 flex-col">
      <div className="marketplace-content pb-28 xl:pb-16">
        <nav aria-label="Breadcrumb" className="animate-fade-up mb-6 md:mb-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <li>
              <Link href="/" className="transition-colors hover:text-primary">
                Marketplace
              </Link>
            </li>
            {data.costume.category ? (
              <>
                <li aria-hidden="true">
                  <ChevronRightIcon className="size-3" />
                </li>
                <li>
                  <Link href={categoryHref} className="transition-colors hover:text-primary">
                    {data.costume.category}
                  </Link>
                </li>
              </>
            ) : null}
            <li aria-hidden="true">
              <ChevronRightIcon className="size-3" />
            </li>
            <li className="text-foreground" aria-current="page">
              {data.costume.name}
            </li>
          </ol>
        </nav>

        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-10">
          <div className="space-y-10 xl:space-y-12">
            <CostumeStageGallery
              images={galleryImages}
              selectedIndex={selectedImageIndex}
              onSelect={setSelectedImageIndex}
              category={data.costume.category}
              costumeId={id}
              ownerId={data.costume.owner_id}
              isWishlisted={isWishlisted}
              isOwnCostume={isOwnCostume}
            />

            <CostumePurchasePanel
              className="xl:hidden"
              name={data.costume.name}
              detailPills={detailPills}
              metaLine={metaLine}
              avgRating={data.avgRating}
              ratingCount={data.ratingCount}
              priceAmount={pricingSummary?.amount ?? 0}
              priceLabel={pricingSummary?.label ?? ""}
              pricingNote={pricingNote}
              vendorDisplayName={vendorDisplayName}
              hasVendor={Boolean(data.costume.owner)}
              isOwnCostume={isOwnCostume}
              isAddingToCart={isAddingToCart}
              onReserve={() => openWizard("reserve")}
              onAddToCart={() => void handleAddToCart()}
              formatMoney={fmtMoney}
              showActions={false}
            />

            <CostumeActSection
              act="Act I · The story"
              title="About this costume"
              headingId="costume-description"
            >
              <div className="panel-card max-w-3xl p-6 sm:p-7">
                {data.costume.description ? (
                  <p className="whitespace-pre-line text-base leading-8 text-muted-foreground">{data.costume.description}</p>
                ) : (
                  <p className="text-base leading-8 text-muted-foreground">
                    No description has been added for this costume yet.
                  </p>
                )}
              </div>
            </CostumeActSection>

            <CostumeActSection
              act="Act II · Call sheet"
              title="Rental details"
              subtitle="Everything you need before stepping into character."
              headingId="costume-details"
            >
              <CostumeCallSheet
                details={callSheetDetails}
                pricingLabel={pricingSummary?.label ?? "Pricing"}
                pricingDescription={pricingDescription}
              />
            </CostumeActSection>

            <CostumeActSection
              act="Act III · Audience"
              title="Reviews"
              subtitle={`Based on ${data.ratingCount} review${data.ratingCount === 1 ? "" : "s"}`}
              headingId="costume-reviews"
            >
              <CostumeReviewsSection
                reviews={reviews}
                avgRating={data.avgRating}
                ratingCount={data.ratingCount}
                starDistribution={starDistribution}
                highRatingPercent={highRatingPercent}
                formatReviewDate={formatReviewDate}
                reviewerInitials={reviewerInitials}
              />
            </CostumeActSection>

            {relatedItems.length > 0 ? (
              <CostumeActSection
                act="Encore"
                title="You may also like"
                headingId="costume-related"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {data.costume.category ? (
                    <Link
                      href={categoryHref}
                      className="text-xs font-semibold uppercase tracking-wider text-primary transition-colors hover:text-primary/80"
                    >
                      More in {data.costume.category}
                    </Link>
                  ) : (
                    <span />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {relatedItems.map((costume) => (
                    <CostumeCard key={costume.id} costume={costume} savedIds={savedIds} compact />
                  ))}
                </div>
              </CostumeActSection>
            ) : null}
          </div>

          <CostumePurchasePanel
            className="hidden xl:block"
            name={data.costume.name}
            detailPills={detailPills}
            metaLine={metaLine}
            avgRating={data.avgRating}
            ratingCount={data.ratingCount}
            priceAmount={pricingSummary?.amount ?? 0}
            priceLabel={pricingSummary?.label ?? ""}
            pricingNote={pricingNote}
            vendorDisplayName={vendorDisplayName}
            hasVendor={Boolean(data.costume.owner)}
            isOwnCostume={isOwnCostume}
            isAddingToCart={isAddingToCart}
            onReserve={() => openWizard("reserve")}
            onAddToCart={() => void handleAddToCart()}
            formatMoney={fmtMoney}
          />
        </div>
      </div>

      {!isOwnCostume ? (
        <CostumeMobileActionBar
          priceAmount={fmtMoney(pricingSummary?.amount ?? 0)}
          priceLabel={pricingSummary?.label ?? ""}
          isAddingToCart={isAddingToCart}
          onReserve={() => openWizard("reserve")}
          onAddToCart={() => void handleAddToCart()}
        />
      ) : null}

      <ReservationWizard
        costumeId={id}
        data={data}
        savedLocations={savedLocations}
        fulfillmentPreferences={fulfillmentPreferences}
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        intent={wizardIntent}
        initialStartDate={initialStartDate}
        initialEndDate={initialEndDate}
      />
    </div>
  );
}
